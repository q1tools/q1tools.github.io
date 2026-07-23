(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.QuakePrintExport = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const THREE_MF_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
  const THREE_MF_RELATIONSHIP =
    "http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel";
  const MAX_SOURCE_VERTICES = 32767;
  const MAX_SOURCE_TRIANGLES = 65536;
  const MIN_TARGET_HEIGHT_MM = 1;
  const MAX_TARGET_HEIGHT_MM = 1000;
  const MIN_VOXEL_RESOLUTION = 48;
  const MAX_VOXEL_RESOLUTION = 128;
  const MAX_VOXEL_CELLS = 3000000;
  const MAX_VOXEL_DISTANCE_TESTS = 50000000;
  const MAX_OUTPUT_VERTICES = 250000;
  const MAX_OUTPUT_TRIANGLES = 500000;
  const MAX_NON_MANIFOLD_PRUNE_REMOVALS = 128;
  const textEncoder = new TextEncoder();
  let crcTable = null;

  function prepareMesh(sourcePositions, sourceTriangles, options = {}) {
    validateSourceMesh(sourcePositions, sourceTriangles);

    const sourceBounds = computeBounds(sourcePositions);
    if (!sourceBounds.dimensions.every(Number.isFinite)) {
      throw new Error("Print export bounds exceed the supported numeric range.");
    }
    const sourceHeight = sourceBounds.max[2] - sourceBounds.min[2];
    const fallbackExtent = Math.max(...sourceBounds.dimensions);
    const referenceHeight = sourceHeight > 1e-8 ? sourceHeight : fallbackExtent;
    const targetHeightMm = Number(options.targetHeightMm);
    if (
      !Number.isFinite(targetHeightMm) ||
      targetHeightMm < MIN_TARGET_HEIGHT_MM ||
      targetHeightMm > MAX_TARGET_HEIGHT_MM
    ) {
      throw new Error(
        `Upright print height must be ${MIN_TARGET_HEIGHT_MM}–${MAX_TARGET_HEIGHT_MM} mm.`
      );
    }
    if (!(referenceHeight > 1e-8)) {
      throw new Error("The selected pose has no measurable size.");
    }

    const repair = options.repair === true;
    const scale = targetHeightMm / referenceHeight;
    const orientation = normalizeOrientation(options.orientation);
    const transformed = new Float64Array(sourcePositions.length);
    for (let offset = 0; offset < sourcePositions.length; offset += 3) {
      const rotated = rotatePoint(
        sourcePositions[offset + 0] * scale,
        sourcePositions[offset + 1] * scale,
        sourcePositions[offset + 2] * scale,
        orientation
      );
      transformed[offset + 0] = rotated[0];
      transformed[offset + 1] = rotated[1];
      transformed[offset + 2] = rotated[2];
    }

    let bounds = computeBounds(transformed);
    const translateX = options.centerXY === false ? 0 : -(bounds.min[0] + bounds.max[0]) * 0.5;
    const translateY = options.centerXY === false ? 0 : -(bounds.min[1] + bounds.max[1]) * 0.5;
    const translateZ = options.groundZ === false ? 0 : -bounds.min[2];
    for (let offset = 0; offset < transformed.length; offset += 3) {
      transformed[offset + 0] += translateX;
      transformed[offset + 1] += translateY;
      transformed[offset + 2] += translateZ;
    }
    bounds = computeBounds(transformed);

    const weld = repair
      ? weldCoincidentVertices(transformed, sourceTriangles)
      : { triangles: sourceTriangles, verticesWelded: 0 };
    const cleanup = cleanTriangles(transformed, weld.triangles, bounds);
    if (!cleanup.triangles.length) {
      throw new Error("No non-degenerate triangles remain after print cleanup.");
    }

    const pruning = repair
      ? pruneNonManifoldFaces(cleanup.triangles)
      : { triangles: cleanup.triangles, facesRemoved: 0, incomplete: false };
    let orientationResult = orientTriangleComponents(
      transformed,
      pruning.triangles,
      { orientOpenOutward: !repair }
    );
    const filling = repair
      ? fillBoundaryLoops(transformed, orientationResult.triangles)
      : {
        positions: transformed,
        triangles: orientationResult.triangles,
        holesFilled: 0,
        collapsedHolesInflated: 0,
        facesAdded: 0,
        verticesAdded: 0,
        unfilledBoundaryLoops: 0,
      };
    if (repair) {
      const reoriented = orientTriangleComponents(filling.positions, filling.triangles);
      orientationResult = {
        triangles: reoriented.triangles,
        windingFlips: orientationResult.windingFlips + reoriented.windingFlips,
        conflicts: orientationResult.conflicts + reoriented.conflicts,
      };
    } else {
      orientationResult.triangles = filling.triangles;
    }
    let compacted = compactVertices(filling.positions, orientationResult.triangles);
    let analysis = analyzeTopology(compacted.positions, compacted.triangles);
    let voxelRepair = {
      applied: false,
      resolution: 0,
      cellSizeMm: 0,
      occupiedCells: 0,
    };
    if (
      repair &&
      options.voxelFallback !== false &&
      (
        !analysis.watertight ||
        options.forceVoxelRepair === true ||
        options.addBase === true
      )
    ) {
      const voxel = voxelRemesh(
        compacted.positions,
        compacted.triangles,
        options.repairResolution,
        {
          addBase: options.addBase === true,
          baseThicknessMm: options.baseThicknessMm,
          baseMarginMm: options.baseMarginMm,
        }
      );
      const voxelOrientation = orientTriangleComponents(voxel.positions, voxel.triangles);
      orientationResult.windingFlips += voxelOrientation.windingFlips;
      orientationResult.conflicts += voxelOrientation.conflicts;
      compacted = compactVertices(voxel.positions, voxelOrientation.triangles);
      placePreparedMesh(
        compacted.positions,
        options.centerXY !== false,
        options.groundZ !== false
      );
      analysis = analyzeTopology(compacted.positions, compacted.triangles);
      voxelRepair = {
        applied: true,
        resolution: voxel.resolution,
        cellSizeMm: voxel.cellSizeMm,
        occupiedCells: voxel.occupiedCells,
        baseAdded: voxel.baseAdded,
      };
    }

    return {
      positions: compacted.positions,
      triangles: compacted.triangles,
      bounds: computeBounds(compacted.positions),
      options: {
        targetHeightMm,
        orientation,
        centerXY: options.centerXY !== false,
        groundZ: options.groundZ !== false,
        repair,
        forceVoxelRepair: options.forceVoxelRepair === true,
        repairResolution: voxelRepair.resolution || 0,
        addBase: options.addBase === true,
      },
      stats: {
        inputVertices: sourcePositions.length / 3,
        outputVertices: compacted.positions.length / 3,
        inputTriangles: sourceTriangles.length,
        outputTriangles: compacted.triangles.length,
        invalidTrianglesRemoved: cleanup.invalid,
        degenerateTrianglesRemoved: cleanup.degenerate,
        duplicateTrianglesRemoved: cleanup.duplicate,
        verticesWelded: weld.verticesWelded,
        nonManifoldFacesRemoved: pruning.facesRemoved,
        nonManifoldPruneIncomplete: pruning.incomplete,
        holesFilled: filling.holesFilled,
        collapsedHolesInflated: filling.collapsedHolesInflated,
        holeFillTrianglesAdded: filling.facesAdded,
        repairVerticesAdded: filling.verticesAdded,
        unfilledBoundaryLoops: filling.unfilledBoundaryLoops,
        voxelRepairApplied: voxelRepair.applied,
        voxelResolution: voxelRepair.resolution,
        voxelSizeMm: voxelRepair.cellSizeMm,
        voxelOccupiedCells: voxelRepair.occupiedCells,
        printBaseAdded: voxelRepair.baseAdded || false,
        windingFlips: orientationResult.windingFlips,
        orientationConflicts: orientationResult.conflicts,
        sourceHeight,
        scale,
        ...analysis,
      },
    };
  }

  function validateSourceMesh(sourcePositions, sourceTriangles) {
    if (
      !sourcePositions ||
      !Number.isSafeInteger(sourcePositions.length) ||
      sourcePositions.length < 3 ||
      sourcePositions.length % 3 !== 0
    ) {
      throw new Error("Print export requires a non-empty XYZ vertex array.");
    }
    const vertexCount = sourcePositions.length / 3;
    if (vertexCount > MAX_SOURCE_VERTICES) {
      throw new Error(
        `Print export supports at most ${MAX_SOURCE_VERTICES} source vertices.`
      );
    }
    for (let offset = 0; offset < sourcePositions.length; offset++) {
      if (!Number.isFinite(Number(sourcePositions[offset]))) {
        throw new Error(`Print export vertex ${Math.floor(offset / 3)} is not finite.`);
      }
    }
    if (
      !sourceTriangles ||
      !Number.isSafeInteger(sourceTriangles.length) ||
      !sourceTriangles.length ||
      typeof sourceTriangles[Symbol.iterator] !== "function"
    ) {
      throw new Error("Print export requires at least one triangle.");
    }
    if (sourceTriangles.length > MAX_SOURCE_TRIANGLES) {
      throw new Error(
        `Print export supports at most ${MAX_SOURCE_TRIANGLES} source triangles.`
      );
    }
  }

  function readBoundedOption(value, fallback, minimum, maximum, label) {
    if (value === undefined || value === null) {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
      throw new Error(`${label} must be ${minimum}–${maximum} mm.`);
    }
    return parsed;
  }

  function weldCoincidentVertices(positions, sourceTriangles) {
    const vertexCount = positions.length / 3;
    const parent = new Int32Array(vertexCount);
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      parent[vertex] = vertex;
    }

    const candidateEdges = new Map();
    for (const sourceTriangle of sourceTriangles) {
      const indices = Array.isArray(sourceTriangle)
        ? sourceTriangle
        : sourceTriangle?.vertIndex;
      if (!indices || indices.length !== 3) {
        continue;
      }
      for (let corner = 0; corner < 3; corner++) {
        const first = Number(indices[corner]);
        const second = Number(indices[(corner + 1) % 3]);
        if (
          Number.isInteger(first) &&
          Number.isInteger(second) &&
          first >= 0 &&
          second >= 0 &&
          first < vertexCount &&
          second < vertexCount &&
          verticesCoincide(positions, first, second)
        ) {
          candidateEdges.set(edgeKey(first, second), [first, second]);
        }
      }
    }
    for (const [first, second] of candidateEdges.values()) {
      union(first, second);
    }

    const representativeByVertex = new Int32Array(vertexCount);
    let verticesWelded = 0;
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      representativeByVertex[vertex] = find(vertex);
      if (representativeByVertex[vertex] !== vertex) {
        verticesWelded += 1;
      }
    }

    return {
      triangles: sourceTriangles.map((sourceTriangle) => {
        const indices = Array.isArray(sourceTriangle)
          ? sourceTriangle
          : sourceTriangle?.vertIndex;
        return indices?.length === 3
          ? indices.map((index) => (
            Number.isInteger(index) && index >= 0 && index < representativeByVertex.length
              ? representativeByVertex[index]
              : index
          ))
          : sourceTriangle;
      }),
      verticesWelded,
    };

    function find(vertex) {
      let root = vertex;
      while (parent[root] !== root) {
        root = parent[root];
      }
      while (parent[vertex] !== vertex) {
        const next = parent[vertex];
        parent[vertex] = root;
        vertex = next;
      }
      return root;
    }

    function union(first, second) {
      const firstRoot = find(first);
      const secondRoot = find(second);
      if (firstRoot === secondRoot) {
        return;
      }
      if (firstRoot < secondRoot) {
        parent[secondRoot] = firstRoot;
      } else {
        parent[firstRoot] = secondRoot;
      }
    }

  }

  function verticesCoincide(positions, first, second) {
    const firstOffset = first * 3;
    const secondOffset = second * 3;
    return (
      positions[firstOffset + 0] === positions[secondOffset + 0] &&
      positions[firstOffset + 1] === positions[secondOffset + 1] &&
      positions[firstOffset + 2] === positions[secondOffset + 2]
    );
  }

  function pruneNonManifoldFaces(sourceTriangles) {
    const triangles = sourceTriangles.map((triangle) => triangle.slice());
    let facesRemoved = 0;

    while (triangles.length && facesRemoved < MAX_NON_MANIFOLD_PRUNE_REMOVALS) {
      const edgeMap = buildEdgeMap(triangles);
      let bestTriangle = -1;
      let bestImprovement = 0;

      for (let triangleIndex = 0; triangleIndex < triangles.length; triangleIndex++) {
        const triangle = triangles[triangleIndex];
        const edgeCounts = [
          edgeMap.get(edgeKey(triangle[0], triangle[1])).length,
          edgeMap.get(edgeKey(triangle[1], triangle[2])).length,
          edgeMap.get(edgeKey(triangle[2], triangle[0])).length,
        ];
        if (!edgeCounts.some((count) => count > 2)) {
          continue;
        }
        let improvement = 0;
        for (const count of edgeCounts) {
          const before = count === 2 ? 0 : 1;
          const afterCount = count - 1;
          const after = afterCount === 0 || afterCount === 2 ? 0 : 1;
          improvement += before - after;
        }
        if (improvement > bestImprovement) {
          bestImprovement = improvement;
          bestTriangle = triangleIndex;
        }
      }

      if (bestTriangle < 0) {
        break;
      }
      triangles.splice(bestTriangle, 1);
      facesRemoved += 1;
    }

    const edgeMap = buildEdgeMap(triangles);
    const incomplete = Array.from(edgeMap.values())
      .some((occurrences) => occurrences.length > 2);

    return { triangles, facesRemoved, incomplete };
  }

  function fillBoundaryLoops(positions, sourceTriangles) {
    let outputPositions = positions;
    const triangles = sourceTriangles.map((triangle) => triangle.slice());
    const edgeMap = buildEdgeMap(triangles);
    const outgoing = new Map();
    const incomingCount = new Map();
    const boundaryEdges = [];

    for (const [key, occurrences] of edgeMap) {
      if (occurrences.length !== 1) {
        continue;
      }
      const [low, high] = key.split(":").map(Number);
      const occurrence = occurrences[0];
      const from = occurrence.direction === 1 ? low : high;
      const to = occurrence.direction === 1 ? high : low;
      boundaryEdges.push({ from, to, key, triangle: occurrence.triangle });
      const next = outgoing.get(from) || [];
      next.push({ from, to, key, triangle: occurrence.triangle });
      outgoing.set(from, next);
      incomingCount.set(to, (incomingCount.get(to) || 0) + 1);
    }

    const visited = new Set();
    let holesFilled = 0;
    let collapsedHolesInflated = 0;
    let facesAdded = 0;
    let verticesAdded = 0;
    let unfilledBoundaryLoops = 0;

    for (const seed of boundaryEdges) {
      if (visited.has(seed.key)) {
        continue;
      }
      const loop = [];
      const incidentTriangles = [];
      let edge = seed;
      let closed = false;
      while (edge && !visited.has(edge.key)) {
        visited.add(edge.key);
        loop.push(edge.from);
        incidentTriangles.push(edge.triangle);
        if (edge.to === seed.from) {
          closed = true;
          break;
        }
        const candidates = outgoing.get(edge.to) || [];
        edge = candidates.length === 1 && (incomingCount.get(edge.to) || 0) === 1
          ? candidates[0]
          : null;
      }

      if (!closed || loop.length < 3) {
        unfilledBoundaryLoops += 1;
        continue;
      }

      let cap = triangulateBoundaryLoop(outputPositions, loop.slice().reverse());
      if (!cap.length && boundaryLoopIsCollinear(outputPositions, loop)) {
        const inflated = inflateCollapsedBoundaryLoop(
          outputPositions,
          triangles,
          loop.slice().reverse(),
          incidentTriangles
        );
        outputPositions = inflated.positions;
        cap = inflated.triangles;
        if (cap.length) {
          collapsedHolesInflated += 1;
          verticesAdded += 1;
        }
      }
      if (!cap.length) {
        unfilledBoundaryLoops += 1;
        continue;
      }
      triangles.push(...cap);
      holesFilled += 1;
      facesAdded += cap.length;
    }

    return {
      positions: outputPositions,
      triangles,
      holesFilled,
      collapsedHolesInflated,
      facesAdded,
      verticesAdded,
      unfilledBoundaryLoops,
    };
  }

  function boundaryLoopIsCollinear(positions, loop) {
    let longestFirst = -1;
    let longestSecond = -1;
    let longestLengthSquared = 0;
    for (let first = 0; first < loop.length; first++) {
      for (let second = first + 1; second < loop.length; second++) {
        const lengthSquared = vertexDistanceSquared(positions, loop[first], loop[second]);
        if (lengthSquared > longestLengthSquared) {
          longestLengthSquared = lengthSquared;
          longestFirst = loop[first];
          longestSecond = loop[second];
        }
      }
    }
    if (!(longestLengthSquared > 0)) {
      return false;
    }
    const extent = Math.sqrt(longestLengthSquared);
    const areaThresholdSquared = Math.pow(extent * extent * 1e-10, 2);
    return loop.every((vertex) =>
      triangleNormalLengthSquared(
        positions,
        longestFirst,
        longestSecond,
        vertex
      ) <= areaThresholdSquared
    );
  }

  function inflateCollapsedBoundaryLoop(positions, triangles, polygon, incidentTriangles) {
    const outputPositions = Array.from(positions);
    const center = [0, 0, 0];
    for (const vertex of polygon) {
      center[0] += positions[vertex * 3 + 0];
      center[1] += positions[vertex * 3 + 1];
      center[2] += positions[vertex * 3 + 2];
    }
    center[0] /= polygon.length;
    center[1] /= polygon.length;
    center[2] /= polygon.length;

    const offsetDirection = [0, 0, 0];
    for (const triangleIndex of incidentTriangles) {
      const normal = computeUnitNormal(positions, triangles[triangleIndex]);
      offsetDirection[0] += normal[0];
      offsetDirection[1] += normal[1];
      offsetDirection[2] += normal[2];
    }

    let directionLength = Math.hypot(...offsetDirection);
    if (directionLength <= 1e-8) {
      let first = polygon[0];
      let second = polygon[1];
      for (const candidate of polygon) {
        if (vertexDistanceSquared(positions, first, candidate) >
            vertexDistanceSquared(positions, first, second)) {
          second = candidate;
        }
      }
      const line = [
        positions[second * 3 + 0] - positions[first * 3 + 0],
        positions[second * 3 + 1] - positions[first * 3 + 1],
        positions[second * 3 + 2] - positions[first * 3 + 2],
      ];
      const helper = Math.abs(line[0]) <= Math.abs(line[1]) && Math.abs(line[0]) <= Math.abs(line[2])
        ? [1, 0, 0]
        : (Math.abs(line[1]) <= Math.abs(line[2]) ? [0, 1, 0] : [0, 0, 1]);
      offsetDirection[0] = line[1] * helper[2] - line[2] * helper[1];
      offsetDirection[1] = line[2] * helper[0] - line[0] * helper[2];
      offsetDirection[2] = line[0] * helper[1] - line[1] * helper[0];
      directionLength = Math.hypot(...offsetDirection);
    }
    if (!(directionLength > 0)) {
      return { positions, triangles: [] };
    }

    const bounds = computeBounds(positions);
    const inflation = Math.max(...bounds.dimensions) * 1e-4;
    const apex = outputPositions.length / 3;
    outputPositions.push(
      center[0] + offsetDirection[0] / directionLength * inflation,
      center[1] + offsetDirection[1] / directionLength * inflation,
      center[2] + offsetDirection[2] / directionLength * inflation
    );
    const cap = [];
    for (let index = 0; index < polygon.length; index++) {
      cap.push([polygon[index], polygon[(index + 1) % polygon.length], apex]);
    }
    return { positions: new Float64Array(outputPositions), triangles: cap };
  }

  function vertexDistanceSquared(positions, first, second) {
    const dx = positions[first * 3 + 0] - positions[second * 3 + 0];
    const dy = positions[first * 3 + 1] - positions[second * 3 + 1];
    const dz = positions[first * 3 + 2] - positions[second * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  }

  function triangulateBoundaryLoop(positions, polygon) {
    if (polygon.length === 3) {
      return triangleNormalLengthSquared(
        positions,
        polygon[0],
        polygon[1],
        polygon[2]
      ) > 0 ? [polygon.slice()] : [];
    }

    const normal = [0, 0, 0];
    for (let index = 0; index < polygon.length; index++) {
      const currentOffset = polygon[index] * 3;
      const nextOffset = polygon[(index + 1) % polygon.length] * 3;
      const x = positions[currentOffset + 0];
      const y = positions[currentOffset + 1];
      const z = positions[currentOffset + 2];
      const nextX = positions[nextOffset + 0];
      const nextY = positions[nextOffset + 1];
      const nextZ = positions[nextOffset + 2];
      normal[0] += (y - nextY) * (z + nextZ);
      normal[1] += (z - nextZ) * (x + nextX);
      normal[2] += (x - nextX) * (y + nextY);
    }
    const dropAxis = Math.abs(normal[0]) >= Math.abs(normal[1]) && Math.abs(normal[0]) >= Math.abs(normal[2])
      ? 0
      : (Math.abs(normal[1]) >= Math.abs(normal[2]) ? 1 : 2);
    if (Math.abs(normal[dropAxis]) <= 1e-20) {
      return [];
    }
    const axes = dropAxis === 0 ? [1, 2] : (dropAxis === 1 ? [0, 2] : [0, 1]);
    const points = polygon.map((vertex) => ({
      x: positions[vertex * 3 + axes[0]],
      y: positions[vertex * 3 + axes[1]],
    }));
    let signedArea = 0;
    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      const next = points[(index + 1) % points.length];
      signedArea += point.x * next.y - next.x * point.y;
    }
    const winding = Math.sign(signedArea);
    if (!winding) {
      return [];
    }
    const available = polygon.map((_, index) => index);
    const result = [];
    let attemptsRemaining = available.length * available.length;
    while (available.length > 3 && attemptsRemaining-- > 0) {
      let clipped = false;
      for (let cursor = 0; cursor < available.length; cursor++) {
        const previous = available[(cursor + available.length - 1) % available.length];
        const current = available[cursor];
        const next = available[(cursor + 1) % available.length];
        const cross = cross2d(points[previous], points[current], points[next]);
        if (cross * winding <= 1e-14) {
          continue;
        }
        let containsPoint = false;
        for (const candidate of available) {
          if (candidate === previous || candidate === current || candidate === next) {
            continue;
          }
          if (pointInTriangle2d(
            points[candidate],
            points[previous],
            points[current],
            points[next],
            winding
          )) {
            containsPoint = true;
            break;
          }
        }
        if (containsPoint) {
          continue;
        }
        result.push([polygon[previous], polygon[current], polygon[next]]);
        available.splice(cursor, 1);
        clipped = true;
        break;
      }
      if (!clipped) {
        return [];
      }
    }
    if (available.length === 3) {
      const [a, b, c] = available;
      if (Math.abs(cross2d(points[a], points[b], points[c])) <= 1e-14) {
        return [];
      }
      result.push([polygon[a], polygon[b], polygon[c]]);
    }
    return result;
  }

  function cross2d(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function pointInTriangle2d(point, a, b, c, winding) {
    const epsilon = 1e-12;
    return (
      cross2d(a, b, point) * winding >= -epsilon &&
      cross2d(b, c, point) * winding >= -epsilon &&
      cross2d(c, a, point) * winding >= -epsilon
    );
  }

  function normalizeOrientation(value) {
    return ["z-up", "x-up", "neg-x-up", "y-up", "neg-y-up", "neg-z-up"].includes(value)
      ? value
      : "z-up";
  }

  function rotatePoint(x, y, z, orientation) {
    switch (orientation) {
      case "x-up":
        return [-z, y, x];
      case "neg-x-up":
        return [z, y, -x];
      case "y-up":
        return [x, -z, y];
      case "neg-y-up":
        return [x, z, -y];
      case "neg-z-up":
        return [x, -y, -z];
      default:
        return [x, y, z];
    }
  }

  function cleanTriangles(positions, sourceTriangles, bounds) {
    const extent = Math.max(...bounds.dimensions, 1);
    const areaEpsilonSquared = Math.pow(extent * extent * 1e-12, 2);
    const vertexCount = positions.length / 3;
    const seen = new Set();
    const triangles = [];
    let invalid = 0;
    let degenerate = 0;
    let duplicate = 0;

    for (const sourceTriangle of sourceTriangles) {
      const indices = Array.isArray(sourceTriangle)
        ? sourceTriangle
        : sourceTriangle?.vertIndex;
      if (!indices || indices.length !== 3) {
        invalid += 1;
        continue;
      }

      const a = Number(indices[0]);
      const b = Number(indices[1]);
      const c = Number(indices[2]);
      if (
        !Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(c) ||
        a < 0 || b < 0 || c < 0 ||
        a >= vertexCount || b >= vertexCount || c >= vertexCount
      ) {
        invalid += 1;
        continue;
      }
      if (a === b || b === c || c === a || triangleNormalLengthSquared(positions, a, b, c) <= areaEpsilonSquared) {
        degenerate += 1;
        continue;
      }

      const key = [a, b, c].sort((left, right) => left - right).join(":");
      if (seen.has(key)) {
        duplicate += 1;
        continue;
      }
      seen.add(key);
      triangles.push([a, b, c]);
    }

    return { triangles, invalid, degenerate, duplicate };
  }

  function orientTriangleComponents(positions, sourceTriangles, options = {}) {
    const triangles = sourceTriangles.map((triangle) => triangle.slice());
    const edgeMap = buildEdgeMap(triangles);
    const adjacency = Array.from({ length: triangles.length }, () => []);

    for (const [key, occurrences] of edgeMap) {
      if (occurrences.length !== 2) {
        continue;
      }
      const first = occurrences[0];
      const second = occurrences[1];
      adjacency[first.triangle].push({
        triangle: second.triangle,
        edge: key,
        needsOppositeFlip: first.direction === second.direction,
      });
      adjacency[second.triangle].push({
        triangle: first.triangle,
        edge: key,
        needsOppositeFlip: first.direction === second.direction,
      });
    }

    const flipState = new Array(triangles.length).fill(null);
    const components = [];
    const conflictEdges = new Set();

    for (let seed = 0; seed < triangles.length; seed++) {
      if (flipState[seed] !== null) {
        continue;
      }
      const component = [];
      const queue = [seed];
      flipState[seed] = false;

      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        component.push(current);
        for (const relation of adjacency[current]) {
          const expected = relation.needsOppositeFlip
            ? !flipState[current]
            : flipState[current];
          if (flipState[relation.triangle] === null) {
            flipState[relation.triangle] = expected;
            queue.push(relation.triangle);
          } else if (flipState[relation.triangle] !== expected) {
            conflictEdges.add(relation.edge);
          }
        }
      }
      components.push(component);
    }

    let windingFlips = 0;
    for (let index = 0; index < triangles.length; index++) {
      if (flipState[index]) {
        swapTriangleWinding(triangles[index]);
        windingFlips += 1;
      }
    }

    const componentByTriangle = new Int32Array(triangles.length);
    components.forEach((component, componentIndex) => {
      component.forEach((triangleIndex) => {
        componentByTriangle[triangleIndex] = componentIndex;
      });
    });
    const componentClosed = components.map(() => true);
    const orientedEdgeMap = buildEdgeMap(triangles);
    for (const occurrences of orientedEdgeMap.values()) {
      if (occurrences.length !== 2) {
        occurrences.forEach((entry) => {
          componentClosed[componentByTriangle[entry.triangle]] = false;
        });
        continue;
      }
      const firstComponent = componentByTriangle[occurrences[0].triangle];
      const secondComponent = componentByTriangle[occurrences[1].triangle];
      if (firstComponent !== secondComponent) {
        componentClosed[firstComponent] = false;
        componentClosed[secondComponent] = false;
      }
    }
    components.forEach((component, componentIndex) => {
      const shouldFlip = componentClosed[componentIndex]
        ? signedVolume(positions, triangles, component) < 0
        : (
          options.orientOpenOutward !== false &&
          openComponentFacesInward(positions, triangles, component)
        );
      if (shouldFlip) {
        for (const triangleIndex of component) {
          swapTriangleWinding(triangles[triangleIndex]);
          windingFlips += 1;
        }
      }
    });

    return {
      triangles,
      windingFlips,
      conflicts: conflictEdges.size,
    };
  }

  function openComponentFacesInward(positions, triangles, component) {
    const vertices = new Set();
    for (const triangleIndex of component) {
      for (const vertexIndex of triangles[triangleIndex]) {
        vertices.add(vertexIndex);
      }
    }
    if (!vertices.size) {
      return false;
    }

    const center = [0, 0, 0];
    for (const vertexIndex of vertices) {
      center[0] += positions[vertexIndex * 3 + 0];
      center[1] += positions[vertexIndex * 3 + 1];
      center[2] += positions[vertexIndex * 3 + 2];
    }
    center[0] /= vertices.size;
    center[1] /= vertices.size;
    center[2] /= vertices.size;

    let outwardVotes = 0;
    let inwardVotes = 0;
    let signedScore = 0;
    for (const triangleIndex of component) {
      const triangle = triangles[triangleIndex];
      const ia = triangle[0] * 3;
      const ib = triangle[1] * 3;
      const ic = triangle[2] * 3;
      const abx = positions[ib + 0] - positions[ia + 0];
      const aby = positions[ib + 1] - positions[ia + 1];
      const abz = positions[ib + 2] - positions[ia + 2];
      const acx = positions[ic + 0] - positions[ia + 0];
      const acy = positions[ic + 1] - positions[ia + 1];
      const acz = positions[ic + 2] - positions[ia + 2];
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      const normalLength = Math.hypot(nx, ny, nz);
      if (!(normalLength > 0)) {
        continue;
      }
      const faceX =
        (positions[ia + 0] + positions[ib + 0] + positions[ic + 0]) / 3;
      const faceY =
        (positions[ia + 1] + positions[ib + 1] + positions[ic + 1]) / 3;
      const faceZ =
        (positions[ia + 2] + positions[ib + 2] + positions[ic + 2]) / 3;
      const projection = (
        nx * (faceX - center[0]) +
        ny * (faceY - center[1]) +
        nz * (faceZ - center[2])
      ) / normalLength;
      const tolerance = Math.max(
        Math.abs(faceX - center[0]),
        Math.abs(faceY - center[1]),
        Math.abs(faceZ - center[2]),
        1
      ) * 1e-10;
      if (projection > tolerance) {
        outwardVotes += 1;
      } else if (projection < -tolerance) {
        inwardVotes += 1;
      }
      signedScore += projection;
    }

    if (inwardVotes !== outwardVotes) {
      return inwardVotes > outwardVotes;
    }
    return inwardVotes > 0 && signedScore < 0;
  }

  function buildEdgeMap(triangles) {
    const edgeMap = new Map();
    triangles.forEach((triangle, triangleIndex) => {
      addEdge(triangle[0], triangle[1], triangleIndex);
      addEdge(triangle[1], triangle[2], triangleIndex);
      addEdge(triangle[2], triangle[0], triangleIndex);
    });
    return edgeMap;

    function addEdge(from, to, triangle) {
      const low = Math.min(from, to);
      const high = Math.max(from, to);
      const key = edgeKey(low, high);
      const occurrences = edgeMap.get(key) || [];
      occurrences.push({
        triangle,
        direction: from === low ? 1 : -1,
      });
      edgeMap.set(key, occurrences);
    }
  }

  function swapTriangleWinding(triangle) {
    const temp = triangle[1];
    triangle[1] = triangle[2];
    triangle[2] = temp;
  }

  function compactVertices(sourcePositions, triangles) {
    const used = new Set();
    triangles.forEach((triangle) => {
      used.add(triangle[0]);
      used.add(triangle[1]);
      used.add(triangle[2]);
    });
    const sourceIndices = Array.from(used).sort((a, b) => a - b);
    const remap = new Map();
    const positions = new Float64Array(sourceIndices.length * 3);
    sourceIndices.forEach((sourceIndex, compactIndex) => {
      remap.set(sourceIndex, compactIndex);
      positions[compactIndex * 3 + 0] = sourcePositions[sourceIndex * 3 + 0];
      positions[compactIndex * 3 + 1] = sourcePositions[sourceIndex * 3 + 1];
      positions[compactIndex * 3 + 2] = sourcePositions[sourceIndex * 3 + 2];
    });
    return {
      positions,
      triangles: triangles.map((triangle) => triangle.map((index) => remap.get(index))),
    };
  }

  function voxelRemesh(positions, triangles, requestedResolution, options = {}) {
    const sourceBounds = computeBounds(positions);
    const addBase = options.addBase === true;
    const baseThicknessMm = readBoundedOption(
      options.baseThicknessMm,
      2,
      0.5,
      20,
      "Print base thickness"
    );
    const baseMarginMm = readBoundedOption(
      options.baseMarginMm,
      2,
      0,
      20,
      "Print base margin"
    );
    const bounds = {
      min: sourceBounds.min.slice(),
      max: sourceBounds.max.slice(),
      dimensions: sourceBounds.dimensions.slice(),
    };
    if (addBase) {
      bounds.min[0] -= baseMarginMm;
      bounds.max[0] += baseMarginMm;
      bounds.min[1] -= baseMarginMm;
      bounds.max[1] += baseMarginMm;
      bounds.min[2] -= baseThicknessMm;
      bounds.dimensions = bounds.max.map((value, axis) => value - bounds.min[axis]);
    }
    const maxExtent = Math.max(...bounds.dimensions);
    if (!(maxExtent > 0)) {
      throw new Error("Voxel repair requires a mesh with measurable size.");
    }
    const parsedResolution = Math.round(Number(requestedResolution));
    const resolution = Number.isFinite(parsedResolution)
      ? Math.min(MAX_VOXEL_RESOLUTION, Math.max(MIN_VOXEL_RESOLUTION, parsedResolution))
      : 64;
    const cellSizeMm = maxExtent / resolution;
    const padding = 2;
    const gridMin = bounds.min.map((value) => value - padding * cellSizeMm);
    const dimensions = bounds.dimensions.map((dimension) =>
      Math.ceil(dimension / cellSizeMm) + padding * 2 + 1
    );
    const [sizeX, sizeY, sizeZ] = dimensions;
    const sliceSize = sizeX * sizeY;
    const cellCount = sliceSize * sizeZ;
    if (!Number.isSafeInteger(cellCount) || cellCount > MAX_VOXEL_CELLS) {
      throw new Error("Voxel repair grid is too large; lower Voxel Detail.");
    }

    const voxels = new Uint8Array(cellCount);
    const halfDiagonal = cellSizeMm * Math.sqrt(3) * 0.5;
    const maximumDistanceSquared = halfDiagonal * halfDiagonal * (1 + 1e-12);

    let distanceTests = 0;
    for (const triangle of triangles) {
      const ia = triangle[0] * 3;
      const ib = triangle[1] * 3;
      const ic = triangle[2] * 3;
      const ax = positions[ia + 0];
      const ay = positions[ia + 1];
      const az = positions[ia + 2];
      const bx = positions[ib + 0];
      const by = positions[ib + 1];
      const bz = positions[ib + 2];
      const cx = positions[ic + 0];
      const cy = positions[ic + 1];
      const cz = positions[ic + 2];
      const minX = gridIndexLower(Math.min(ax, bx, cx) - halfDiagonal, 0, sizeX);
      const minY = gridIndexLower(Math.min(ay, by, cy) - halfDiagonal, 1, sizeY);
      const minZ = gridIndexLower(Math.min(az, bz, cz) - halfDiagonal, 2, sizeZ);
      const maxX = gridIndexUpper(Math.max(ax, bx, cx) + halfDiagonal, 0, sizeX);
      const maxY = gridIndexUpper(Math.max(ay, by, cy) + halfDiagonal, 1, sizeY);
      const maxZ = gridIndexUpper(Math.max(az, bz, cz) + halfDiagonal, 2, sizeZ);
      const spanX = Math.max(0, maxX - minX + 1);
      const spanY = Math.max(0, maxY - minY + 1);
      const spanZ = Math.max(0, maxZ - minZ + 1);
      distanceTests +=
        spanX *
        spanY *
        spanZ;
      if (distanceTests > MAX_VOXEL_DISTANCE_TESTS) {
        throw new Error("Voxel repair workload is too large; lower Voxel Detail.");
      }
      if (!spanX || !spanY || !spanZ) {
        continue;
      }

      for (let z = minZ; z <= maxZ; z++) {
        const pz = gridMin[2] + (z + 0.5) * cellSizeMm;
        for (let y = minY; y <= maxY; y++) {
          const py = gridMin[1] + (y + 0.5) * cellSizeMm;
          let index = z * sliceSize + y * sizeX + minX;
          for (let x = minX; x <= maxX; x++, index++) {
            const px = gridMin[0] + (x + 0.5) * cellSizeMm;
            if (pointTriangleDistanceSquared(
              px, py, pz,
              ax, ay, az,
              bx, by, bz,
              cx, cy, cz
            ) <= maximumDistanceSquared) {
              voxels[index] = 1;
            }
          }
        }
      }
    }

    if (addBase) {
      const centerX = (sourceBounds.min[0] + sourceBounds.max[0]) * 0.5;
      const centerY = (sourceBounds.min[1] + sourceBounds.max[1]) * 0.5;
      const radiusX = sourceBounds.dimensions[0] * 0.5 + baseMarginMm;
      const radiusY = sourceBounds.dimensions[1] * 0.5 + baseMarginMm;
      const top = sourceBounds.min[2] + cellSizeMm * 0.5;
      const bottom = sourceBounds.min[2] - baseThicknessMm - cellSizeMm * 0.5;
      for (let z = 0; z < sizeZ; z++) {
        const pz = gridMin[2] + (z + 0.5) * cellSizeMm;
        if (pz < bottom || pz > top) {
          continue;
        }
        for (let y = 0; y < sizeY; y++) {
          const py = gridMin[1] + (y + 0.5) * cellSizeMm;
          const normalizedY = (py - centerY) / Math.max(radiusY, cellSizeMm * 0.5);
          for (let x = 0; x < sizeX; x++) {
            const px = gridMin[0] + (x + 0.5) * cellSizeMm;
            const normalizedX = (px - centerX) / Math.max(radiusX, cellSizeMm * 0.5);
            if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
              voxels[z * sliceSize + y * sizeX + x] = 1;
            }
          }
        }
      }
    }

    const queue = new Int32Array(cellCount);
    let queueHead = 0;
    let queueTail = 0;
    for (let z = 0; z < sizeZ; z++) {
      for (let y = 0; y < sizeY; y++) {
        enqueueOutside(z * sliceSize + y * sizeX);
        enqueueOutside(z * sliceSize + y * sizeX + sizeX - 1);
      }
    }
    for (let z = 0; z < sizeZ; z++) {
      for (let x = 0; x < sizeX; x++) {
        enqueueOutside(z * sliceSize + x);
        enqueueOutside(z * sliceSize + (sizeY - 1) * sizeX + x);
      }
    }
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        enqueueOutside(y * sizeX + x);
        enqueueOutside((sizeZ - 1) * sliceSize + y * sizeX + x);
      }
    }

    while (queueHead < queueTail) {
      const index = queue[queueHead++];
      const x = index % sizeX;
      const yz = (index - x) / sizeX;
      const y = yz % sizeY;
      const z = (yz - y) / sizeY;
      if (x > 0) enqueueOutside(index - 1);
      if (x + 1 < sizeX) enqueueOutside(index + 1);
      if (y > 0) enqueueOutside(index - sizeX);
      if (y + 1 < sizeY) enqueueOutside(index + sizeX);
      if (z > 0) enqueueOutside(index - sliceSize);
      if (z + 1 < sizeZ) enqueueOutside(index + sliceSize);
    }

    let occupiedCells = 0;
    for (let index = 0; index < voxels.length; index++) {
      if (voxels[index] === 2) {
        voxels[index] = 0;
      } else {
        voxels[index] = 1;
        occupiedCells += 1;
      }
    }
    if (!occupiedCells) {
      throw new Error("Voxel repair could not capture the mesh surface.");
    }

    const outputPositions = [];
    const outputTriangles = [];
    const vertexByGridEdge = new Map();
    const tetrahedra = [
      [0, 5, 1, 6],
      [0, 1, 2, 6],
      [0, 2, 3, 6],
      [0, 3, 7, 6],
      [0, 7, 4, 6],
      [0, 4, 5, 6],
    ];
    for (let z = 0; z + 1 < sizeZ; z++) {
      for (let y = 0; y + 1 < sizeY; y++) {
        for (let x = 0; x + 1 < sizeX; x++) {
          const base = z * sliceSize + y * sizeX + x;
          const cube = [
            base,
            base + 1,
            base + sizeX + 1,
            base + sizeX,
            base + sliceSize,
            base + sliceSize + 1,
            base + sliceSize + sizeX + 1,
            base + sliceSize + sizeX,
          ];
          let cubeMask = 0;
          for (let corner = 0; corner < 8; corner++) {
            cubeMask |= voxels[cube[corner]] << corner;
          }
          if (cubeMask === 0 || cubeMask === 255) {
            continue;
          }

          for (const tetrahedron of tetrahedra) {
            const inside = [];
            const outside = [];
            for (const corner of tetrahedron) {
              (voxels[cube[corner]] ? inside : outside).push(cube[corner]);
            }
            if (!inside.length || !outside.length) {
              continue;
            }
            if (inside.length === 1 || outside.length === 1) {
              const single = inside.length === 1 ? inside[0] : outside[0];
              const others = inside.length === 1 ? outside : inside;
              const face = others.map((other) => midpointVertex(single, other));
              if (inside.length === 1) {
                outputTriangles.push(face);
              } else {
                outputTriangles.push([face[0], face[2], face[1]]);
              }
            } else {
              const p00 = midpointVertex(inside[0], outside[0]);
              const p01 = midpointVertex(inside[0], outside[1]);
              const p10 = midpointVertex(inside[1], outside[0]);
              const p11 = midpointVertex(inside[1], outside[1]);
              outputTriangles.push([p00, p01, p11], [p00, p11, p10]);
            }
            if (outputTriangles.length > MAX_OUTPUT_TRIANGLES) {
              throw new Error("Voxel repair output is too detailed; lower Voxel Detail.");
            }
          }
        }
      }
    }
    if (!outputTriangles.length) {
      throw new Error("Voxel repair produced no surface.");
    }

    return {
      positions: new Float64Array(outputPositions),
      triangles: outputTriangles,
      resolution,
      cellSizeMm,
      occupiedCells,
      baseAdded: addBase,
    };

    function gridIndexLower(value, axis, size) {
      return Math.max(
        0,
        Math.min(size - 1, Math.ceil((value - gridMin[axis]) / cellSizeMm - 0.5))
      );
    }

    function gridIndexUpper(value, axis, size) {
      return Math.max(
        0,
        Math.min(size - 1, Math.floor((value - gridMin[axis]) / cellSizeMm - 0.5))
      );
    }

    function enqueueOutside(index) {
      if (voxels[index] === 0) {
        voxels[index] = 2;
        queue[queueTail++] = index;
      }
    }

    function midpointVertex(first, second) {
      const low = Math.min(first, second);
      const high = Math.max(first, second);
      const key = `${low}:${high}`;
      const existing = vertexByGridEdge.get(key);
      if (existing !== undefined) {
        return existing;
      }
      const firstPoint = gridPoint(first);
      const secondPoint = gridPoint(second);
      const vertex = outputPositions.length / 3;
      if (vertex >= MAX_OUTPUT_VERTICES) {
        throw new Error("Voxel repair output is too detailed; lower Voxel Detail.");
      }
      outputPositions.push(
        (firstPoint[0] + secondPoint[0]) * 0.5,
        (firstPoint[1] + secondPoint[1]) * 0.5,
        (firstPoint[2] + secondPoint[2]) * 0.5
      );
      vertexByGridEdge.set(key, vertex);
      return vertex;
    }

    function gridPoint(index) {
      const x = index % sizeX;
      const yz = (index - x) / sizeX;
      const y = yz % sizeY;
      const z = (yz - y) / sizeY;
      return [
        gridMin[0] + (x + 0.5) * cellSizeMm,
        gridMin[1] + (y + 0.5) * cellSizeMm,
        gridMin[2] + (z + 0.5) * cellSizeMm,
      ];
    }
  }

  function pointTriangleDistanceSquared(
    px, py, pz,
    ax, ay, az,
    bx, by, bz,
    cx, cy, cz
  ) {
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const apx = px - ax;
    const apy = py - ay;
    const apz = pz - az;
    const d1 = abx * apx + aby * apy + abz * apz;
    const d2 = acx * apx + acy * apy + acz * apz;
    if (d1 <= 0 && d2 <= 0) {
      return apx * apx + apy * apy + apz * apz;
    }

    const bpx = px - bx;
    const bpy = py - by;
    const bpz = pz - bz;
    const d3 = abx * bpx + aby * bpy + abz * bpz;
    const d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) {
      return bpx * bpx + bpy * bpy + bpz * bpz;
    }

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const fraction = d1 / (d1 - d3);
      return squaredDistanceToPoint(
        px, py, pz,
        ax + fraction * abx,
        ay + fraction * aby,
        az + fraction * abz
      );
    }

    const cpx = px - cx;
    const cpy = py - cy;
    const cpz = pz - cz;
    const d5 = abx * cpx + aby * cpy + abz * cpz;
    const d6 = acx * cpx + acy * cpy + acz * cpz;
    if (d6 >= 0 && d5 <= d6) {
      return cpx * cpx + cpy * cpy + cpz * cpz;
    }

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const fraction = d2 / (d2 - d6);
      return squaredDistanceToPoint(
        px, py, pz,
        ax + fraction * acx,
        ay + fraction * acy,
        az + fraction * acz
      );
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const fraction = (d4 - d3) / ((d4 - d3) + (d5 - d6));
      return squaredDistanceToPoint(
        px, py, pz,
        bx + fraction * (cx - bx),
        by + fraction * (cy - by),
        bz + fraction * (cz - bz)
      );
    }

    const barycentricDenominator = va + vb + vc;
    if (
      !Number.isFinite(barycentricDenominator) ||
      Math.abs(barycentricDenominator) <= Number.EPSILON
    ) {
      return Math.min(
        squaredDistanceToSegment(px, py, pz, ax, ay, az, bx, by, bz),
        squaredDistanceToSegment(px, py, pz, bx, by, bz, cx, cy, cz),
        squaredDistanceToSegment(px, py, pz, cx, cy, cz, ax, ay, az)
      );
    }
    const denominator = 1 / barycentricDenominator;
    const v = vb * denominator;
    const w = vc * denominator;
    return squaredDistanceToPoint(
      px, py, pz,
      ax + abx * v + acx * w,
      ay + aby * v + acy * w,
      az + abz * v + acz * w
    );
  }

  function squaredDistanceToPoint(px, py, pz, qx, qy, qz) {
    const dx = px - qx;
    const dy = py - qy;
    const dz = pz - qz;
    return dx * dx + dy * dy + dz * dz;
  }

  function squaredDistanceToSegment(
    px, py, pz,
    ax, ay, az,
    bx, by, bz
  ) {
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const lengthSquared = abx * abx + aby * aby + abz * abz;
    if (!(lengthSquared > 0)) {
      return squaredDistanceToPoint(px, py, pz, ax, ay, az);
    }
    const fraction = Math.max(
      0,
      Math.min(
        1,
        ((px - ax) * abx + (py - ay) * aby + (pz - az) * abz) / lengthSquared
      )
    );
    return squaredDistanceToPoint(
      px, py, pz,
      ax + fraction * abx,
      ay + fraction * aby,
      az + fraction * abz
    );
  }

  function placePreparedMesh(positions, centerXY, groundZ) {
    const bounds = computeBounds(positions);
    const translateX = centerXY ? -(bounds.min[0] + bounds.max[0]) * 0.5 : 0;
    const translateY = centerXY ? -(bounds.min[1] + bounds.max[1]) * 0.5 : 0;
    const translateZ = groundZ ? -bounds.min[2] : 0;
    for (let offset = 0; offset < positions.length; offset += 3) {
      positions[offset + 0] += translateX;
      positions[offset + 1] += translateY;
      positions[offset + 2] += translateZ;
    }
  }

  function analyzeTopology(positions, triangles) {
    const edgeMap = buildEdgeMap(triangles);
    let boundaryEdges = 0;
    let nonManifoldEdges = 0;
    for (const occurrences of edgeMap.values()) {
      if (occurrences.length === 1) {
        boundaryEdges += 1;
      } else if (occurrences.length > 2) {
        nonManifoldEdges += 1;
      }
    }

    const triangleAdjacency = Array.from({ length: triangles.length }, () => []);
    for (const occurrences of edgeMap.values()) {
      if (occurrences.length < 2) {
        continue;
      }
      const firstTriangle = occurrences[0].triangle;
      for (let index = 1; index < occurrences.length; index++) {
        const otherTriangle = occurrences[index].triangle;
        triangleAdjacency[firstTriangle].push(otherTriangle);
        triangleAdjacency[otherTriangle].push(firstTriangle);
      }
    }

    const vertexTriangles = Array.from({ length: positions.length / 3 }, () => []);
    triangles.forEach((triangle, triangleIndex) => {
      triangle.forEach((vertexIndex) => vertexTriangles[vertexIndex].push(triangleIndex));
    });
    const visited = new Uint8Array(triangles.length);
    let shells = 0;
    for (let seed = 0; seed < triangles.length; seed++) {
      if (visited[seed]) {
        continue;
      }
      shells += 1;
      const queue = [seed];
      visited[seed] = 1;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        for (const neighbor of triangleAdjacency[queue[cursor]]) {
          if (!visited[neighbor]) {
            visited[neighbor] = 1;
            queue.push(neighbor);
          }
        }
      }
    }

    let nonManifoldVertices = 0;
    vertexTriangles.forEach((incidentTriangles, vertexIndex) => {
      if (incidentTriangles.length <= 1) {
        return;
      }
      const incidentSet = new Set(incidentTriangles);
      const fanVisited = new Set([incidentTriangles[0]]);
      const queue = [incidentTriangles[0]];
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const triangleIndex = queue[cursor];
        const triangle = triangles[triangleIndex];
        for (const otherVertex of triangle) {
          if (otherVertex === vertexIndex) {
            continue;
          }
          const occurrences = edgeMap.get(edgeKey(vertexIndex, otherVertex)) || [];
          for (const occurrence of occurrences) {
            if (incidentSet.has(occurrence.triangle) && !fanVisited.has(occurrence.triangle)) {
              fanVisited.add(occurrence.triangle);
              queue.push(occurrence.triangle);
            }
          }
        }
      }
      if (fanVisited.size !== incidentTriangles.length) {
        nonManifoldVertices += 1;
      }
    });

    let surfaceAreaMm2 = 0;
    triangles.forEach((triangle) => {
      surfaceAreaMm2 += Math.sqrt(triangleNormalLengthSquared(
        positions,
        triangle[0],
        triangle[1],
        triangle[2]
      )) * 0.5;
    });
    const closedTopology =
      boundaryEdges === 0 &&
      nonManifoldEdges === 0 &&
      nonManifoldVertices === 0;
    const candidateVolumeMm3 = closedTopology
      ? Math.abs(signedVolume(positions, triangles, triangles.map((_, index) => index)))
      : null;
    const bounds = computeBounds(positions);
    const volumeEpsilon = Math.pow(Math.max(...bounds.dimensions, 1), 3) * 1e-12;
    const zeroVolume =
      closedTopology &&
      !(candidateVolumeMm3 > volumeEpsilon);
    const watertight = closedTopology && !zeroVolume;
    const volumeMm3 = watertight ? candidateVolumeMm3 : null;

    return {
      boundaryEdges,
      nonManifoldEdges,
      nonManifoldVertices,
      zeroVolume,
      shells,
      watertight,
      surfaceAreaMm2,
      volumeMm3,
    };
  }

  function edgeKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  function triangleNormalLengthSquared(positions, ia, ib, ic) {
    const ax = positions[ib * 3 + 0] - positions[ia * 3 + 0];
    const ay = positions[ib * 3 + 1] - positions[ia * 3 + 1];
    const az = positions[ib * 3 + 2] - positions[ia * 3 + 2];
    const bx = positions[ic * 3 + 0] - positions[ia * 3 + 0];
    const by = positions[ic * 3 + 1] - positions[ia * 3 + 1];
    const bz = positions[ic * 3 + 2] - positions[ia * 3 + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    return nx * nx + ny * ny + nz * nz;
  }

  function signedVolume(positions, triangles, triangleIndices) {
    let volumeTimesSix = 0;
    for (const triangleIndex of triangleIndices) {
      const triangle = triangles[triangleIndex];
      const ax = positions[triangle[0] * 3 + 0];
      const ay = positions[triangle[0] * 3 + 1];
      const az = positions[triangle[0] * 3 + 2];
      const bx = positions[triangle[1] * 3 + 0];
      const by = positions[triangle[1] * 3 + 1];
      const bz = positions[triangle[1] * 3 + 2];
      const cx = positions[triangle[2] * 3 + 0];
      const cy = positions[triangle[2] * 3 + 1];
      const cz = positions[triangle[2] * 3 + 2];
      volumeTimesSix +=
        ax * (by * cz - bz * cy) +
        ay * (bz * cx - bx * cz) +
        az * (bx * cy - by * cx);
    }
    return volumeTimesSix / 6;
  }

  function computeBounds(positions) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let offset = 0; offset < positions.length; offset += 3) {
      min[0] = Math.min(min[0], positions[offset + 0]);
      min[1] = Math.min(min[1], positions[offset + 1]);
      min[2] = Math.min(min[2], positions[offset + 2]);
      max[0] = Math.max(max[0], positions[offset + 0]);
      max[1] = Math.max(max[1], positions[offset + 1]);
      max[2] = Math.max(max[2], positions[offset + 2]);
    }
    return {
      min,
      max,
      dimensions: [
        max[0] - min[0],
        max[1] - min[1],
        max[2] - min[2],
      ],
    };
  }

  function serializeBinaryStl(mesh, label = "Quake MDL print export") {
    validatePreparedMesh(mesh);
    const triangleCount = mesh.triangles.length;
    const bytes = new Uint8Array(84 + triangleCount * 50);
    const view = new DataView(bytes.buffer);
    const headerLabel = String(label).slice(0, 256);
    const header = encodeUtf8Prefix(`${headerLabel} | millimetres`, 80);
    bytes.set(header, 0);
    view.setUint32(80, triangleCount, true);

    let offset = 84;
    for (const triangle of mesh.triangles) {
      const normal = computeUnitNormal(mesh.positions, triangle);
      view.setFloat32(offset + 0, normal[0], true);
      view.setFloat32(offset + 4, normal[1], true);
      view.setFloat32(offset + 8, normal[2], true);
      offset += 12;
      for (const vertexIndex of triangle) {
        view.setFloat32(offset + 0, mesh.positions[vertexIndex * 3 + 0], true);
        view.setFloat32(offset + 4, mesh.positions[vertexIndex * 3 + 1], true);
        view.setFloat32(offset + 8, mesh.positions[vertexIndex * 3 + 2], true);
        offset += 12;
      }
      view.setUint16(offset, 0, true);
      offset += 2;
    }
    return bytes;
  }

  function serialize3mf(mesh, metadata = {}) {
    validatePreparedMesh(mesh);
    const title = escapeXml(readMetadataText(
      metadata.title,
      "Quake MDL print export",
      256
    ));
    const source = escapeXml(readMetadataText(metadata.source, "", 1024));
    const pose = escapeXml(readMetadataText(metadata.pose, "", 256));
    const vertices = [];
    for (let offset = 0; offset < mesh.positions.length; offset += 3) {
      vertices.push(
        `<vertex x="${formatCoordinate(mesh.positions[offset + 0])}" ` +
        `y="${formatCoordinate(mesh.positions[offset + 1])}" ` +
        `z="${formatCoordinate(mesh.positions[offset + 2])}"/>`
      );
    }
    const triangles = mesh.triangles.map((triangle) =>
      `<triangle v1="${triangle[0]}" v2="${triangle[1]}" v3="${triangle[2]}"/>`
    );
    const metadataLines = [
      `<metadata name="Title">${title}</metadata>`,
      `<metadata name="Application">Quake MDL Tool</metadata>`,
    ];
    if (source) {
      metadataLines.push(`<metadata name="Description">Source: ${source}${pose ? `; pose: ${pose}` : ""}</metadata>`);
    }
    const modelXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<model unit="millimeter" xml:lang="en-US" xmlns="${THREE_MF_NAMESPACE}">`,
      ...metadataLines,
      "<resources>",
      `<object id="1" type="model" name="${title}">`,
      "<mesh><vertices>",
      ...vertices,
      "</vertices><triangles>",
      ...triangles,
      "</triangles></mesh>",
      "</object>",
      "</resources>",
      '<build><item objectid="1"/></build>',
      "</model>",
    ].join("");
    const contentTypes = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>',
      "</Types>",
    ].join("");
    const relationships = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      `<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="${THREE_MF_RELATIONSHIP}"/>`,
      "</Relationships>",
    ].join("");

    return createStoredZip([
      { name: "[Content_Types].xml", data: textEncoder.encode(contentTypes) },
      { name: "_rels/.rels", data: textEncoder.encode(relationships) },
      { name: "3D/3dmodel.model", data: textEncoder.encode(modelXml) },
    ]);
  }

  function validatePreparedMesh(mesh) {
    if (!mesh?.positions?.length || !mesh?.triangles?.length) {
      throw new Error("A prepared print mesh is required.");
    }
    if (
      !Number.isSafeInteger(mesh.positions.length) ||
      mesh.positions.length % 3 !== 0
    ) {
      throw new Error("Prepared print mesh positions must contain XYZ triples.");
    }
    const vertexCount = mesh.positions.length / 3;
    if (vertexCount > MAX_OUTPUT_VERTICES) {
      throw new Error(
        `Prepared print mesh exceeds the ${MAX_OUTPUT_VERTICES}-vertex export limit.`
      );
    }
    if (mesh.triangles.length > MAX_OUTPUT_TRIANGLES) {
      throw new Error(
        `Prepared print mesh exceeds the ${MAX_OUTPUT_TRIANGLES}-triangle export limit.`
      );
    }
    for (let offset = 0; offset < mesh.positions.length; offset++) {
      if (!Number.isFinite(Number(mesh.positions[offset]))) {
        throw new Error(`Prepared print mesh vertex ${Math.floor(offset / 3)} is not finite.`);
      }
    }
    for (let triangleIndex = 0; triangleIndex < mesh.triangles.length; triangleIndex++) {
      const triangle = mesh.triangles[triangleIndex];
      if (
        !triangle ||
        triangle.length !== 3 ||
        ![0, 1, 2].every((corner) => {
          const index = triangle[corner];
          return (
            Number.isInteger(index) &&
            index >= 0 &&
            index < vertexCount
          );
        })
      ) {
        throw new Error(`Prepared print mesh triangle ${triangleIndex} is invalid.`);
      }
    }
  }

  function computeUnitNormal(positions, triangle) {
    const ia = triangle[0] * 3;
    const ib = triangle[1] * 3;
    const ic = triangle[2] * 3;
    const ax = positions[ib + 0] - positions[ia + 0];
    const ay = positions[ib + 1] - positions[ia + 1];
    const az = positions[ib + 2] - positions[ia + 2];
    const bx = positions[ic + 0] - positions[ia + 0];
    const by = positions[ic + 1] - positions[ia + 1];
    const bz = positions[ic + 2] - positions[ia + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const length = Math.hypot(nx, ny, nz) || 1;
    return [nx / length, ny / length, nz / length];
  }

  function createStoredZip(entries) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;

    for (const entry of entries) {
      const name = textEncoder.encode(entry.name);
      const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
      const checksum = crc32(data);
      const local = new Uint8Array(30 + name.length + data.length);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0x0021, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      localView.setUint16(28, 0, true);
      local.set(name, 30);
      local.set(data, 30 + name.length);
      localParts.push(local);

      const central = new Uint8Array(46 + name.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0x0021, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, localOffset, true);
      central.set(name, 46);
      centralParts.push(central);
      localOffset += local.length;
    }

    const centralOffset = localOffset;
    const centralLength = centralParts.reduce((total, part) => total + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralLength, true);
    endView.setUint32(16, centralOffset, true);
    endView.setUint16(20, 0, true);
    return concatenateBytes([...localParts, ...centralParts, end]);
  }

  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let index = 0; index < 256; index++) {
        let value = index;
        for (let bit = 0; bit < 8; bit++) {
          value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
        }
        crcTable[index] = value >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function concatenateBytes(parts) {
    const length = parts.reduce((total, part) => total + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }

  function formatCoordinate(value) {
    const normalized = Math.abs(value) < 5e-8 ? 0 : value;
    return normalized.toFixed(6).replace(/\.?0+$/, "");
  }

  function escapeXml(value) {
    return Array.from(String(value), (character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      )
        ? character
        : "\ufffd";
    }).join("")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function readMetadataText(value, fallback, maximumLength) {
    const text = value === undefined || value === null || value === ""
      ? fallback
      : String(value);
    return text.slice(0, maximumLength);
  }

  function encodeUtf8Prefix(value, maximumBytes) {
    const output = new Uint8Array(maximumBytes);
    let length = 0;
    for (const character of String(value)) {
      const encoded = textEncoder.encode(character);
      if (length + encoded.length > maximumBytes) {
        break;
      }
      output.set(encoded, length);
      length += encoded.length;
    }
    return output.subarray(0, length);
  }

  function suggestedFilename(modelPath, poseName, extension) {
    const normalized = String(modelPath || "model.mdl").replace(/\\/g, "/");
    const base = (normalized.split("/").pop() || "model.mdl").replace(/\.[^.]+$/, "");
    const safeBase = sanitizeFilenamePart(base) || "model";
    const safePose = sanitizeFilenamePart(poseName || "");
    return `${safeBase}${safePose ? `_${safePose}` : ""}_print.${extension}`;
  }

  function sanitizeFilenamePart(value) {
    return String(value)
      .trim()
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  return {
    prepareMesh,
    serializeBinaryStl,
    serialize3mf,
    suggestedFilename,
  };
});
