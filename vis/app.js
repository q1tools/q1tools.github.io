// VisPatch Tool - Compute visibility data for Quake BSP maps
// Combines BSP->PRT portal extraction + fast vis computation + vispatch output

'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const BSP_VERSION = 29;
const VISPATCH_IDLEN = 32;
const EPSILON = 0.01;
const WINDING_SIZE = 65536;

const CONTENTS_EMPTY = -1;
const CONTENTS_SOLID = -2;
const CONTENTS_WATER = -3;
const CONTENTS_SLIME = -4;
const CONTENTS_LAVA  = -5;
const CONTENTS_SKY   = -6;

// BSP lump indices
const LUMP_ENTITIES  = 0;
const LUMP_PLANES    = 1;
const LUMP_MIPTEX    = 2;
const LUMP_VERTICES  = 3;
const LUMP_VISILIST  = 4;
const LUMP_NODES     = 5;
const LUMP_TEXINFO   = 6;
const LUMP_FACES     = 7;
const LUMP_LIGHTMAPS = 8;
const LUMP_CLIPNODES = 9;
const LUMP_LEAVES    = 10;
const LUMP_LFACE     = 11;
const LUMP_EDGES     = 12;
const LUMP_LEDGES    = 13;
const LUMP_MODELS    = 14;
const NUM_LUMPS      = 15;

// ============================================================
// VEC3 MATH
// ============================================================

function v3dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function v3cross(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
}
function v3add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function v3sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function v3scale(v, s) { return [v[0]*s, v[1]*s, v[2]*s]; }
function v3len(v) { return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); }
function v3normalize(v) {
    const l = v3len(v);
    return l > 0 ? [v[0]/l, v[1]/l, v[2]/l] : [0,0,0];
}
function v3lerp(a, b, t) {
    return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];
}

// ============================================================
// WINDING (POLYGON) OPERATIONS
// ============================================================

function baseWindingForPlane(normal, dist) {
    // Find the major axis
    let best = 0;
    let bestVal = Math.abs(normal[0]);
    if (Math.abs(normal[1]) > bestVal) { best = 1; bestVal = Math.abs(normal[1]); }
    if (Math.abs(normal[2]) > bestVal) { best = 2; }

    const up = [0, 0, 0];
    if (best === 2) up[0] = 1;
    else up[2] = 1;

    // Remove component along normal
    const d = v3dot(up, normal);
    const vup = v3normalize(v3sub(up, v3scale(normal, d)));
    const vright = v3cross(vup, normal);

    const org = v3scale(normal, dist);
    const s = WINDING_SIZE;
    return [
        v3add(v3add(org, v3scale(vup, -s)), v3scale(vright, -s)),
        v3add(v3add(org, v3scale(vup, -s)), v3scale(vright,  s)),
        v3add(v3add(org, v3scale(vup,  s)), v3scale(vright,  s)),
        v3add(v3add(org, v3scale(vup,  s)), v3scale(vright, -s)),
    ];
}

// Clip winding by plane. Returns { front: points|null, back: points|null }
function clipWinding(winding, normal, dist, epsilon) {
    if (!winding || winding.length < 3) return { front: null, back: null };
    epsilon = epsilon || EPSILON;

    const n = winding.length;
    const sides = new Array(n);
    const dists = new Array(n);
    let frontCount = 0, backCount = 0;

    for (let i = 0; i < n; i++) {
        dists[i] = v3dot(winding[i], normal) - dist;
        if (dists[i] > epsilon) { sides[i] = 1; frontCount++; }
        else if (dists[i] < -epsilon) { sides[i] = -1; backCount++; }
        else sides[i] = 0;
    }

    if (frontCount === 0) return { front: null, back: winding };
    if (backCount === 0)  return { front: winding, back: null };

    const front = [];
    const back = [];

    for (let i = 0; i < n; i++) {
        const p = winding[i];
        const j = (i + 1) % n;

        if (sides[i] >= 0) front.push(p);
        if (sides[i] <= 0) back.push(p);

        if ((sides[i] === 1 && sides[j] === -1) ||
            (sides[i] === -1 && sides[j] === 1)) {
            // Edge crosses the plane - compute intersection
            const p2 = winding[j];
            const t = dists[i] / (dists[i] - dists[j]);
            const mid = v3lerp(p, p2, t);
            front.push(mid);
            back.push(mid);
        }
    }

    return {
        front: front.length >= 3 ? front : null,
        back: back.length >= 3 ? back : null
    };
}

function windingArea(w) {
    if (!w || w.length < 3) return 0;
    let area = 0;
    for (let i = 2; i < w.length; i++) {
        const e1 = v3sub(w[i-1], w[0]);
        const e2 = v3sub(w[i], w[0]);
        area += v3len(v3cross(e1, e2));
    }
    return area * 0.5;
}

function windingCenter(w) {
    const c = [0, 0, 0];
    for (const p of w) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
    const n = w.length;
    return [c[0]/n, c[1]/n, c[2]/n];
}

function windingPlane(w) {
    const e1 = v3sub(w[1], w[0]);
    const e2 = v3sub(w[2], w[0]);
    const normal = v3normalize(v3cross(e1, e2));
    const dist = v3dot(normal, w[0]);
    return { normal, dist };
}

// ============================================================
// BSP PARSER
// ============================================================

function parseBSP(buffer) {
    const view = new DataView(buffer);
    const version = view.getInt32(0, true);

    if (version !== BSP_VERSION) {
        throw new Error(`Unsupported BSP version: ${version} (expected ${BSP_VERSION})`);
    }

    // Read lump directory (15 lumps, each 8 bytes: offset + size)
    const lumps = [];
    for (let i = 0; i < NUM_LUMPS; i++) {
        lumps.push({
            offset: view.getInt32(4 + i * 8, true),
            size:   view.getInt32(4 + i * 8 + 4, true)
        });
    }

    // Parse planes (20 bytes each: float[3] normal, float dist, int type)
    const planes = [];
    const pl = lumps[LUMP_PLANES];
    for (let i = 0; i < pl.size; i += 20) {
        const off = pl.offset + i;
        planes.push({
            normal: [
                view.getFloat32(off, true),
                view.getFloat32(off + 4, true),
                view.getFloat32(off + 8, true)
            ],
            dist: view.getFloat32(off + 12, true),
            type: view.getInt32(off + 16, true)
        });
    }

    // Parse nodes (24 bytes each)
    const nodes = [];
    const nl = lumps[LUMP_NODES];
    for (let i = 0; i < nl.size; i += 24) {
        const off = nl.offset + i;
        nodes.push({
            planeId:   view.getInt32(off, true),
            children:  [view.getInt16(off + 4, true), view.getInt16(off + 6, true)],
            mins:      [view.getInt16(off + 8, true), view.getInt16(off + 10, true), view.getInt16(off + 12, true)],
            maxs:      [view.getInt16(off + 14, true), view.getInt16(off + 16, true), view.getInt16(off + 18, true)],
            firstFace: view.getUint16(off + 20, true),
            numFaces:  view.getUint16(off + 22, true)
        });
    }

    // Parse leaves (28 bytes each)
    const leaves = [];
    const ll = lumps[LUMP_LEAVES];
    for (let i = 0; i < ll.size; i += 28) {
        const off = ll.offset + i;
        leaves.push({
            contents:         view.getInt32(off, true),
            visofs:           view.getInt32(off + 4, true),
            mins:             [view.getInt16(off + 8, true), view.getInt16(off + 10, true), view.getInt16(off + 12, true)],
            maxs:             [view.getInt16(off + 14, true), view.getInt16(off + 16, true), view.getInt16(off + 18, true)],
            firstMarkSurface: view.getUint16(off + 20, true),
            numMarkSurfaces:  view.getUint16(off + 22, true),
            ambientLevel:     [
                view.getUint8(off + 24), view.getUint8(off + 25),
                view.getUint8(off + 26), view.getUint8(off + 27)
            ]
        });
    }

    // Parse models (64 bytes each)
    const models = [];
    const ml = lumps[LUMP_MODELS];
    for (let i = 0; i < ml.size; i += 64) {
        const off = ml.offset + i;
        models.push({
            mins:      [view.getFloat32(off, true), view.getFloat32(off+4, true), view.getFloat32(off+8, true)],
            maxs:      [view.getFloat32(off+12, true), view.getFloat32(off+16, true), view.getFloat32(off+20, true)],
            origin:    [view.getFloat32(off+24, true), view.getFloat32(off+28, true), view.getFloat32(off+32, true)],
            headnodes: [
                view.getInt32(off+36, true), view.getInt32(off+40, true),
                view.getInt32(off+44, true), view.getInt32(off+48, true)
            ],
            visleafs:  view.getInt32(off+52, true),
            firstFace: view.getInt32(off+56, true),
            numFaces:  view.getInt32(off+60, true)
        });
    }

    return { version, lumps, planes, nodes, leaves, models, buffer };
}

// ============================================================
// PRT PARSER (optional)
// ============================================================

function parsePRT(text) {
    const lines = text.trim().split('\n');
    let idx = 0;
    const magic = lines[idx++].trim();
    if (magic !== 'PRT1' && magic !== 'PRT1-AM' && magic !== 'PRT2') {
        throw new Error(`Unsupported PRT format: ${magic}`);
    }

    const numLeafs = parseInt(lines[idx++]);
    const numPortals = parseInt(lines[idx++]);
    let numLeafsReal = numLeafs;
    if (magic === 'PRT1-AM') {
        numLeafsReal = parseInt(lines[idx++]);
    }

    const portals = [];
    for (let i = 0; i < numPortals; i++) {
        const parts = lines[idx++].trim().split(/\s+/);
        const numPoints = parseInt(parts[0]);
        const leaf0 = parseInt(parts[1]);
        const leaf1 = parseInt(parts[2]);

        const winding = [];
        let pi = 3;
        for (let j = 0; j < numPoints; j++) {
            // Points are in format (x y z)
            let x, y, z;
            if (parts[pi].startsWith('(')) {
                x = parseFloat(parts[pi].substring(1));
                y = parseFloat(parts[pi + 1]);
                z = parseFloat(parts[pi + 2].replace(')', ''));
                pi += 3;
            } else {
                x = parseFloat(parts[pi++]);
                y = parseFloat(parts[pi++]);
                z = parseFloat(parts[pi++]);
            }
            winding.push([x, y, z]);
        }

        portals.push({
            winding,
            leaves: [leaf0 + 1, leaf1 + 1] // PRT uses 0-based vis leaf numbering, BSP leaves are 1-based (leaf 0 = outside)
        });
    }

    return { numLeafs, numPortals, portals };
}

// ============================================================
// PORTAL EXTRACTION FROM BSP TREE
// ============================================================

// Each portal: { winding, nodes: [frontChild, backChild] }
// Child encoding: >= 0 means node index, < 0 means leaf index as -(child+1)

function extractPortals(bsp, logFn) {
    const headnode = bsp.models[0].headnodes[0];

    // Portal storage per node/leaf
    // Each entry: { portal, side } where side = 0 or 1 (which side of portal.nodes[] we are)
    const nodePortals = new Map();
    const leafPortals = new Map();

    function getNodeList(idx) {
        if (!nodePortals.has(idx)) nodePortals.set(idx, []);
        return nodePortals.get(idx);
    }
    function getLeafList(idx) {
        if (!leafPortals.has(idx)) leafPortals.set(idx, []);
        return leafPortals.get(idx);
    }

    const OUTSIDE = -99999; // Pseudo-leaf for outside bounding box

    function addPortalToChild(portal, child, side) {
        if (child === OUTSIDE) return;
        if (child >= 0) {
            getNodeList(child).push({ portal, side });
        } else {
            const leafIdx = -(child + 1);
            getLeafList(leafIdx).push({ portal, side });
        }
    }

    function removePortalFromChild(portal, child) {
        if (child === OUTSIDE) return;
        let list;
        if (child >= 0) {
            list = nodePortals.get(child);
        } else {
            const leafIdx = -(child + 1);
            list = leafPortals.get(leafIdx);
        }
        if (!list) return;
        const idx = list.findIndex(e => e.portal === portal);
        if (idx >= 0) list.splice(idx, 1);
    }

    // Create bounding box portals
    const pad = 128;
    const model = bsp.models[0];
    const mins = [model.mins[0] - pad, model.mins[1] - pad, model.mins[2] - pad];
    const maxs = [model.maxs[0] + pad, model.maxs[1] + pad, model.maxs[2] + pad];

    // 6 bounding planes, normals pointing inward
    const boxPlanes = [
        { normal: [ 1, 0, 0], dist:  mins[0] }, // -X face, normal inward (+X)... no
        { normal: [-1, 0, 0], dist: -maxs[0] }, // +X face, normal inward (-X)... hmm
    ];
    // Actually let me just create the 6 faces properly
    // Each face normal points OUTWARD. Portal normal points from nodes[0] to nodes[1].
    // nodes[0] = OUTSIDE (front), nodes[1] = headnode (back, inside)
    const boxFaces = [
        { normal: [ 1, 0, 0], dist:  maxs[0] }, // +X face
        { normal: [-1, 0, 0], dist: -mins[0] }, // -X face
        { normal: [ 0, 1, 0], dist:  maxs[1] }, // +Y face
        { normal: [ 0,-1, 0], dist: -mins[1] }, // -Y face
        { normal: [ 0, 0, 1], dist:  maxs[2] }, // +Z face
        { normal: [ 0, 0,-1], dist: -mins[2] }, // -Z face
    ];

    for (const plane of boxFaces) {
        const winding = baseWindingForPlane(plane.normal, plane.dist);
        // Clip this huge winding to the box
        let w = winding;
        for (const other of boxFaces) {
            if (other === plane) continue;
            // Keep the back side (inside the box)
            const clip = clipWinding(w, other.normal, other.dist);
            w = clip.back;
            if (!w) break;
        }
        if (!w || w.length < 3) continue;

        const portal = { winding: w, plane, nodes: [OUTSIDE, headnode] };
        addPortalToChild(portal, OUTSIDE, 0);
        addPortalToChild(portal, headnode, 1);
    }

    // Recursive portal generation
    function processNode(nodeIdx) {
        if (nodeIdx < 0) return; // Leaf - nothing to do

        const node = bsp.nodes[nodeIdx];
        const plane = bsp.planes[node.planeId];

        // Step 1: Create new portal on this node's splitting plane
        let w = baseWindingForPlane(plane.normal, plane.dist);

        // Clip the new portal to fit within this node's convex region
        const myPortals = nodePortals.get(nodeIdx) || [];
        for (const { portal: p, side } of myPortals) {
            if (!w) break;
            // Get the plane of this portal
            const pp = p.plane;
            // We need to clip w to stay on OUR side of this portal.
            // Portal convention: nodes[0] = front (positive) side, nodes[1] = back (negative) side.
            if (side === 0) {
                // We're on the front (positive) side. Keep front.
                const clip = clipWinding(w, pp.normal, pp.dist);
                w = clip.front;
            } else {
                // We're on the back (negative) side. Keep back.
                const clip = clipWinding(w, pp.normal, pp.dist);
                w = clip.back;
            }
        }

        if (w && w.length >= 3 && windingArea(w) > EPSILON) {
            const newPortal = {
                winding: w,
                plane: { normal: [...plane.normal], dist: plane.dist },
                nodes: [node.children[0], node.children[1]]
            };
            addPortalToChild(newPortal, node.children[0], 0);
            addPortalToChild(newPortal, node.children[1], 1);
        }

        // Step 2: Split existing portals by this node's plane, distribute to children
        const existingPortals = [...(nodePortals.get(nodeIdx) || [])];
        nodePortals.delete(nodeIdx); // Clear this node's list

        for (const { portal, side } of existingPortals) {
            const otherChild = portal.nodes[1 - side]; // The other side stays the same
            const { front, back } = clipWinding(portal.winding, plane.normal, plane.dist);

            // Remove portal from the other child's list too
            removePortalFromChild(portal, otherChild);

            // Front half -> front child (node.children[0])
            if (front && front.length >= 3 && windingArea(front) > EPSILON) {
                const fp = {
                    winding: front,
                    plane: { normal: [...portal.plane.normal], dist: portal.plane.dist },
                    nodes: [...portal.nodes]
                };
                // Replace our node with the front child
                fp.nodes[side] = node.children[0];
                addPortalToChild(fp, node.children[0], side);
                addPortalToChild(fp, otherChild, 1 - side);
            }

            // Back half -> back child (node.children[1])
            if (back && back.length >= 3 && windingArea(back) > EPSILON) {
                const bp = {
                    winding: back,
                    plane: { normal: [...portal.plane.normal], dist: portal.plane.dist },
                    nodes: [...portal.nodes]
                };
                bp.nodes[side] = node.children[1];
                addPortalToChild(bp, node.children[1], side);
                addPortalToChild(bp, otherChild, 1 - side);
            }
        }

        // Recurse into children
        processNode(node.children[0]);
        processNode(node.children[1]);
    }

    processNode(headnode);

    // Collect leaf-to-leaf portals
    const result = [];
    const seen = new Set();

    for (const [leafIdx, portalList] of leafPortals) {
        for (const { portal, side } of portalList) {
            if (seen.has(portal)) continue;
            seen.add(portal);

            const otherChild = portal.nodes[1 - side];
            if (otherChild >= 0) continue; // Other side is still a node (shouldn't happen)
            if (otherChild === OUTSIDE) continue; // Skip outside portals

            const otherLeaf = -(otherChild + 1);

            // Skip portals between solid leaves
            const c1 = bsp.leaves[leafIdx] ? bsp.leaves[leafIdx].contents : CONTENTS_SOLID;
            const c2 = bsp.leaves[otherLeaf] ? bsp.leaves[otherLeaf].contents : CONTENTS_SOLID;
            if (c1 === CONTENTS_SOLID && c2 === CONTENTS_SOLID) continue;

            result.push({
                winding: portal.winding,
                leaves: [leafIdx, otherLeaf]
            });
        }
    }

    logFn(`Extracted ${result.length} portals between ${leafPortals.size} leaves`);
    return result;
}

// ============================================================
// FAST VIS COMPUTATION
// ============================================================

function computeFastVis(bsp, portals, logFn) {
    const numLeaves = bsp.leaves.length;
    const numVisLeaves = bsp.models[0].visleafs;
    const rowBytes = Math.floor((numLeaves + 7) / 8);

    logFn(`Computing fast vis for ${numVisLeaves} vis leaves (${numLeaves} total leaves)`);

    // Build leaf adjacency from portals
    // For each portal, store the plane oriented so the normal points FROM this leaf TOWARD otherLeaf
    const leafAdj = new Map(); // leafIdx -> [{otherLeaf, plane, portalCenter}]
    for (const p of portals) {
        const [l0, l1] = p.leaves;
        const pl = windingPlane(p.winding);
        const center = windingCenter(p.winding);

        if (!leafAdj.has(l0)) leafAdj.set(l0, []);
        if (!leafAdj.has(l1)) leafAdj.set(l1, []);

        // Determine plane orientation: the plane should point from l0 toward l1
        // Check which side l0's center is on
        const l0center = [
            (bsp.leaves[l0].mins[0] + bsp.leaves[l0].maxs[0]) / 2,
            (bsp.leaves[l0].mins[1] + bsp.leaves[l0].maxs[1]) / 2,
            (bsp.leaves[l0].mins[2] + bsp.leaves[l0].maxs[2]) / 2
        ];
        const d0 = v3dot(l0center, pl.normal) - pl.dist;

        // Plane from l0 toward l1: l0 should be on negative side
        const fwd = d0 <= 0 ? pl : { normal: v3scale(pl.normal, -1), dist: -pl.dist };
        const rev = d0 <= 0
            ? { normal: v3scale(pl.normal, -1), dist: -pl.dist }
            : pl;

        leafAdj.get(l0).push({ otherLeaf: l1, plane: fwd, portalCenter: center });
        leafAdj.get(l1).push({ otherLeaf: l0, plane: rev, portalCenter: center });
    }

    // Compute leaf centers
    const leafCenters = [];
    for (let i = 0; i < numLeaves; i++) {
        const l = bsp.leaves[i];
        leafCenters.push([
            (l.mins[0] + l.maxs[0]) / 2,
            (l.mins[1] + l.maxs[1]) / 2,
            (l.mins[2] + l.maxs[2]) / 2
        ]);
    }

    // Build PVS using base portal vis + flood fill
    const pvs = [];
    for (let i = 0; i < numLeaves; i++) {
        pvs.push(new Uint8Array(rowBytes));
    }

    // Mark each non-solid leaf as visible to itself
    for (let i = 0; i < numLeaves; i++) {
        if (bsp.leaves[i].contents !== CONTENTS_SOLID) {
            pvs[i][i >> 3] |= (1 << (i & 7));
        }
    }

    // Base portal vis: for each portal P connecting L_a to L_b,
    // determine which other portals might be visible through P.
    // Then flood fill through "might see" chains to build leaf PVS.
    //
    // A portal Q (connecting L_c to L_d, where L_c is the "near" leaf from P's perspective)
    // is visible through P if:
    //   1. L_d center is in front of P's plane (can be seen through P)
    //   2. L_a center is in front of Q's plane (source leaf can "reach" Q)
    //
    // For fast vis, we use a BFS flood fill with these checks.

    let processedCount = 0;
    for (let srcLeaf = 1; srcLeaf < numLeaves; srcLeaf++) {
        if (bsp.leaves[srcLeaf].contents === CONTENTS_SOLID) continue;

        const srcCenter = leafCenters[srcLeaf];
        const visible = pvs[srcLeaf];

        // BFS: each queue entry is { leaf, entryPlane }
        // entryPlane is the plane of the portal we entered through (from srcLeaf's perspective)
        const visited = new Set();
        visited.add(srcLeaf);

        // Start: expand from srcLeaf through its immediate portals
        const srcNeighbors = leafAdj.get(srcLeaf) || [];
        const queue = [];

        for (const { otherLeaf, plane } of srcNeighbors) {
            if (otherLeaf < 1 || otherLeaf >= numLeaves) continue;
            if (bsp.leaves[otherLeaf].contents === CONTENTS_SOLID) continue;
            visited.add(otherLeaf);
            visible[otherLeaf >> 3] |= (1 << (otherLeaf & 7));
            queue.push({ leaf: otherLeaf, entryPlane: plane });
        }

        // Continue BFS
        while (queue.length > 0) {
            const { leaf: curLeaf, entryPlane } = queue.shift();
            const neighbors = leafAdj.get(curLeaf) || [];

            for (const { otherLeaf, plane: exitPlane } of neighbors) {
                if (visited.has(otherLeaf)) continue;
                if (otherLeaf < 1 || otherLeaf >= numLeaves) continue;
                if (bsp.leaves[otherLeaf].contents === CONTENTS_SOLID) continue;

                // Check 1: Is the destination leaf's center in front of the entry portal plane?
                // (Can we see the destination through the portal we entered from?)
                const destCenter = leafCenters[otherLeaf];
                const d1 = v3dot(destCenter, entryPlane.normal) - entryPlane.dist;
                if (d1 < -EPSILON) continue; // Behind the entry portal

                // Check 2: Is the source leaf's center in front of the exit portal plane?
                // (Can the source leaf "reach" this exit portal?)
                const d2 = v3dot(srcCenter, exitPlane.normal) - exitPlane.dist;
                if (d2 > EPSILON) continue; // Source is in front of exit (wrong side - exit plane points from curLeaf toward otherLeaf, source should be behind)

                visited.add(otherLeaf);
                visible[otherLeaf >> 3] |= (1 << (otherLeaf & 7));
                queue.push({ leaf: otherLeaf, entryPlane: entryPlane });
            }
        }

        // Make visibility symmetric
        for (let j = 1; j < numLeaves; j++) {
            if (visible[j >> 3] & (1 << (j & 7))) {
                pvs[j][srcLeaf >> 3] |= (1 << (srcLeaf & 7));
            }
        }

        processedCount++;
        if (processedCount % 200 === 0) {
            logFn(`  Processed ${processedCount}/${numVisLeaves} leaves...`);
        }
    }

    logFn(`Fast vis complete`);
    return pvs;
}

// ============================================================
// VIS DATA COMPRESSION (Quake RLE format)
// ============================================================

function compressVis(pvs, numLeaves) {
    // Each leaf's PVS starts at leaf 1 (leaf 0 is outside/solid)
    // The vis data is for leaves 1..numLeaves-1
    const numVisLeaves = numLeaves - 1;
    const rowBytes = Math.floor((numVisLeaves + 7) / 8);

    const compressed = [];
    const offsets = []; // visofs for each leaf

    for (let leafIdx = 0; leafIdx < numLeaves; leafIdx++) {
        if (leafIdx === 0) {
            offsets.push(-1); // Leaf 0 has no vis data
            continue;
        }

        const contents = null; // Will be checked by caller
        offsets.push(compressed.length);

        // Build the row: bit i = can leaf (i+1) be seen from leafIdx?
        const row = new Uint8Array(rowBytes);
        for (let j = 1; j < numLeaves; j++) {
            const bit = j - 1; // 0-based index in the vis row
            if (pvs[leafIdx][j >> 3] & (1 << (j & 7))) {
                row[bit >> 3] |= (1 << (bit & 7));
            }
        }

        // RLE compress: zeros are encoded as 0x00, count
        for (let i = 0; i < rowBytes; ) {
            if (row[i]) {
                compressed.push(row[i]);
                i++;
            } else {
                // Count consecutive zero bytes
                compressed.push(0);
                let count = 0;
                while (i < rowBytes && row[i] === 0 && count < 255) {
                    count++;
                    i++;
                }
                compressed.push(count);
            }
        }
    }

    return {
        data: new Uint8Array(compressed),
        offsets
    };
}

// ============================================================
// BUILD NEW LEAF LUMP
// ============================================================

function buildLeafLump(bsp, visOffsets) {
    const numLeaves = bsp.leaves.length;
    const leafSize = 28; // bytes per leaf
    const buf = new ArrayBuffer(numLeaves * leafSize);
    const view = new DataView(buf);

    for (let i = 0; i < numLeaves; i++) {
        const leaf = bsp.leaves[i];
        const off = i * leafSize;

        view.setInt32(off, leaf.contents, true);
        view.setInt32(off + 4, visOffsets[i], true);
        view.setInt16(off + 8, leaf.mins[0], true);
        view.setInt16(off + 10, leaf.mins[1], true);
        view.setInt16(off + 12, leaf.mins[2], true);
        view.setInt16(off + 14, leaf.maxs[0], true);
        view.setInt16(off + 16, leaf.maxs[1], true);
        view.setInt16(off + 18, leaf.maxs[2], true);
        view.setUint16(off + 20, leaf.firstMarkSurface, true);
        view.setUint16(off + 22, leaf.numMarkSurfaces, true);
        view.setUint8(off + 24, leaf.ambientLevel[0]);
        view.setUint8(off + 25, leaf.ambientLevel[1]);
        view.setUint8(off + 26, leaf.ambientLevel[2]);
        view.setUint8(off + 27, leaf.ambientLevel[3]);
    }

    return new Uint8Array(buf);
}

// ============================================================
// BSP PATCHING (same lump order as vispatch / iD Software)
// ============================================================

function patchBSP(bsp, visData, leafData) {
    const original = new Uint8Array(bsp.buffer);
    const lumps = bsp.lumps;

    // Calculate total size: header + all lumps with 4-byte alignment
    // Header = 4 (version) + 15*8 (lump entries) = 124 bytes
    const headerSize = 4 + NUM_LUMPS * 8;

    // Lump write order (same as vispatch BSPFix / iD Software bspfile.c)
    const lumpOrder = [
        LUMP_PLANES, LUMP_LEAVES, LUMP_VERTICES, LUMP_NODES,
        LUMP_TEXINFO, LUMP_FACES, LUMP_CLIPNODES, LUMP_LFACE,
        LUMP_LEDGES, LUMP_EDGES, LUMP_MODELS, LUMP_LIGHTMAPS,
        LUMP_VISILIST, LUMP_ENTITIES, LUMP_MIPTEX
    ];

    // Prepare lump data
    const lumpData = {};
    for (let i = 0; i < NUM_LUMPS; i++) {
        if (i === LUMP_VISILIST) {
            lumpData[i] = visData;
        } else if (i === LUMP_LEAVES) {
            lumpData[i] = leafData;
        } else {
            lumpData[i] = original.slice(lumps[i].offset, lumps[i].offset + lumps[i].size);
        }
    }

    // Calculate total size
    let totalSize = headerSize;
    for (const lumpIdx of lumpOrder) {
        totalSize += lumpData[lumpIdx].length;
        totalSize = (totalSize + 3) & ~3; // 4-byte alignment
    }

    const output = new Uint8Array(totalSize);
    const outView = new DataView(output.buffer);

    // Write header placeholder
    outView.setInt32(0, BSP_VERSION, true);

    // Write lumps in order, track new offsets
    const newLumps = [];
    for (let i = 0; i < NUM_LUMPS; i++) {
        newLumps.push({ offset: 0, size: 0 });
    }

    let pos = headerSize;
    for (const lumpIdx of lumpOrder) {
        const data = lumpData[lumpIdx];
        newLumps[lumpIdx].offset = pos;
        newLumps[lumpIdx].size = data.length;
        output.set(data, pos);
        pos += data.length;
        // 4-byte alignment padding (zeros already there)
        pos = (pos + 3) & ~3;
    }

    // Write lump directory in header
    for (let i = 0; i < NUM_LUMPS; i++) {
        outView.setInt32(4 + i * 8, newLumps[i].offset, true);
        outView.setInt32(4 + i * 8 + 4, newLumps[i].size, true);
    }

    return output;
}

// ============================================================
// VIS FILE EXPORT (vispatch format)
// ============================================================

function createVisFile(mapName, visData, leafData) {
    // Format:
    //   32 bytes: map name (null padded)
    //   4 bytes: total length (int32 LE) = vislen + leaflen + 8
    //   4 bytes: vislen (int32 LE)
    //   vislen bytes: vis data
    //   4 bytes: leaflen (int32 LE)
    //   leaflen bytes: leaf data

    const totalLen = visData.length + leafData.length + 8;
    const fileSize = VISPATCH_IDLEN + 4 + 4 + visData.length + 4 + leafData.length;
    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);

    // Write map name (32 bytes, null padded)
    const nameBytes = new TextEncoder().encode(mapName);
    for (let i = 0; i < VISPATCH_IDLEN; i++) {
        bytes[i] = i < nameBytes.length ? nameBytes[i] : 0;
    }

    let pos = VISPATCH_IDLEN;
    view.setInt32(pos, totalLen, true); pos += 4;
    view.setInt32(pos, visData.length, true); pos += 4;
    bytes.set(visData, pos); pos += visData.length;
    view.setInt32(pos, leafData.length, true); pos += 4;
    bytes.set(leafData, pos);

    return bytes;
}

// ============================================================
// EXTRACT MAP NAME FROM FILENAME
// ============================================================

function extractMapName(filename) {
    // Strip extension, keep "maps/name" format if present
    let name = filename.replace(/\\/g, '/');
    // Remove extension
    const dotIdx = name.lastIndexOf('.');
    if (dotIdx >= 0) name = name.substring(0, dotIdx);
    // If no path prefix, add "maps/"
    if (!name.includes('/')) name = 'maps/' + name;
    return name;
}

// ============================================================
// UI
// ============================================================

let loadedBSP = null;
let loadedBSPBuffer = null;
let loadedBSPName = '';
let loadedPRT = null;

const bspDropZone = document.getElementById('bspDropZone');
const prtDropZone = document.getElementById('prtDropZone');
const bspInput = document.getElementById('bspInput');
const prtInput = document.getElementById('prtInput');
const fileInfo = document.getElementById('fileInfo');
const controls = document.getElementById('controls');
const progressArea = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const logEl = document.getElementById('log');
const runBtn = document.getElementById('runBtn');

function setupDropZone(zone, input, handler) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handler(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', e => {
        if (e.target.files.length > 0) handler(e.target.files[0]);
    });
}

function log(msg) {
    logEl.classList.remove('hidden');
    logEl.textContent += msg + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function setProgress(pct, text) {
    progressArea.classList.remove('hidden');
    progressFill.style.width = pct + '%';
    progressText.textContent = text;
}

function showFileInfo(bsp, name) {
    const numVisLeaves = bsp.models[0].visleafs;
    const hasVis = bsp.lumps[LUMP_VISILIST].size > 0;
    const visStatus = hasVis
        ? `Yes (${bsp.lumps[LUMP_VISILIST].size} bytes)`
        : 'No (unvised map)';

    fileInfo.innerHTML = [
        `<b>File:</b> ${name}`,
        `<b>BSP Version:</b> ${bsp.version}`,
        `<b>Nodes:</b> ${bsp.nodes.length} | <b>Leaves:</b> ${bsp.leaves.length} | <b>Vis leaves:</b> ${numVisLeaves}`,
        `<b>Planes:</b> ${bsp.planes.length} | <b>Models:</b> ${bsp.models.length}`,
        `<b>Existing vis data:</b> ${visStatus}`,
    ].join('<br>');
    fileInfo.classList.remove('hidden');
}

function handleBSPFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            loadedBSPBuffer = reader.result;
            loadedBSP = parseBSP(loadedBSPBuffer);
            loadedBSPName = file.name;
            showFileInfo(loadedBSP, file.name);
            controls.classList.remove('hidden');
            bspDropZone.classList.add('loaded');
            bspDropZone.querySelector('.file-msg').textContent = file.name;
            logEl.textContent = '';
            logEl.classList.add('hidden');
            progressArea.classList.add('hidden');
        } catch (e) {
            alert('Error parsing BSP: ' + e.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function handlePRTFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            loadedPRT = parsePRT(reader.result);
            prtDropZone.classList.add('loaded');
            prtDropZone.querySelector('.file-msg').textContent = `${file.name} (${loadedPRT.numPortals} portals)`;
        } catch (e) {
            alert('Error parsing PRT: ' + e.message);
        }
    };
    reader.readAsText(file);
}

setupDropZone(bspDropZone, bspInput, handleBSPFile);
setupDropZone(prtDropZone, prtInput, handlePRTFile);

runBtn.addEventListener('click', async () => {
    if (!loadedBSP) return;
    runBtn.disabled = true;
    logEl.textContent = '';
    logEl.classList.remove('hidden');

    // Yield to let UI update before heavy computation
    await new Promise(r => setTimeout(r, 50));
    await runVisComputation();
});

async function runVisComputation() {
    try {
        const bsp = loadedBSP;
        const outputMode = document.querySelector('input[name="outputMode"]:checked').value;

        setProgress(5, 'Extracting portals...');
        log('=== VisPatch Tool ===');
        log(`Map: ${loadedBSPName}`);
        log(`Leaves: ${bsp.leaves.length}, Nodes: ${bsp.nodes.length}, Planes: ${bsp.planes.length}`);

        let portals;
        if (loadedPRT) {
            log(`Using PRT file (${loadedPRT.numPortals} portals, ${loadedPRT.numLeafs} vis leaves)`);
            portals = loadedPRT.portals;
        } else {
            log('Extracting portals from BSP tree...');
            portals = extractPortals(bsp, log);
        }

        setProgress(30, 'Computing visibility...');
        log('Computing fast vis...');
        const pvs = computeFastVis(bsp, portals, log);

        setProgress(70, 'Compressing vis data...');
        log('Compressing vis data...');
        const { data: visData, offsets: visOffsets } = compressVis(pvs, bsp.leaves.length);
        log(`Compressed vis data: ${visData.length} bytes`);

        setProgress(80, 'Building leaf data...');
        // Update leaf visofs with new offsets, skip solid leaves
        for (let i = 0; i < bsp.leaves.length; i++) {
            if (bsp.leaves[i].contents === CONTENTS_SOLID) {
                visOffsets[i] = -1;
            }
        }
        const leafData = buildLeafLump(bsp, visOffsets);
        log(`Leaf data: ${leafData.length} bytes`);

        setProgress(90, 'Building output...');

        if (outputMode === 'bsp') {
            log('Patching BSP...');
            const patched = patchBSP(bsp, visData, leafData);
            log(`Patched BSP: ${patched.length} bytes`);

            const blob = new Blob([patched], { type: 'application/octet-stream' });
            downloadBlob(blob, loadedBSPName);
            log(`Done! Download: ${loadedBSPName}`);
        } else {
            log('Creating .vis file...');
            const mapName = extractMapName(loadedBSPName);
            const visFile = createVisFile(mapName, visData, leafData);
            log(`VIS file: ${visFile.length} bytes (map name: "${mapName}")`);

            const visFileName = loadedBSPName.replace(/\.bsp$/i, '.vis');
            const blob = new Blob([visFile], { type: 'application/octet-stream' });
            downloadBlob(blob, visFileName);
            log(`Done! Download: ${visFileName}`);
        }

        setProgress(100, 'Complete!');
    } catch (e) {
        log(`ERROR: ${e.message}`);
        console.error(e);
        setProgress(0, 'Error!');
    } finally {
        runBtn.disabled = false;
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
