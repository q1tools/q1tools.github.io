import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { parseBsp, decompileBsp, MAX_FILE_BYTES, __test } from "../src/bsp-decompiler.js";

const encoder = new TextEncoder();

function align4(value) {
  return (value + 3) & ~3;
}

function makeSyntheticBsp29({ bspx = false, signature = 29 } = {}) {
  const headerSize = 124;
  const entities = encoder.encode('{\n"classname" "worldspawn"\n"message" "synthetic cube"\n}\n\0');
  const q64TextureLength = signature === " 46Q" ? 52 : 0;
  const leavesLength = 28;
  const modelsLength = 64;
  const brushListLength = bspx ? 16 + 28 : 0;

  let cursor = headerSize;
  const entityOffset = cursor;
  cursor = align4(cursor + entities.length);
  const textureOffset = cursor;
  cursor = align4(cursor + q64TextureLength);
  const leafOffset = cursor;
  cursor = align4(cursor + leavesLength);
  const modelOffset = cursor;
  cursor = align4(cursor + modelsLength);
  const bspxHeaderOffset = cursor;
  if (bspx) cursor += 40;
  const brushListOffset = cursor;
  cursor += brushListLength;

  const buffer = new ArrayBuffer(cursor);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  if (typeof signature === "number") view.setInt32(0, signature, true);
  else bytes.set(encoder.encode(signature), 0);

  const setLump = (index, offset, length) => {
    view.setInt32(4 + index * 8, offset, true);
    view.setInt32(8 + index * 8, length, true);
  };
  setLump(0, entityOffset, entities.length);
  setLump(2, textureOffset, q64TextureLength);
  setLump(10, leafOffset, leavesLength);
  setLump(14, modelOffset, modelsLength);
  bytes.set(entities, entityOffset);
  if (q64TextureLength) {
    view.setInt32(textureOffset, 1, true);
    view.setInt32(textureOffset + 4, 8, true);
    bytes.set(encoder.encode("q64_test"), textureOffset + 8);
    view.setUint32(textureOffset + 24, 32, true);
    view.setUint32(textureOffset + 28, 32, true);
    view.setInt32(textureOffset + 32, 2, true);
  }

  // One solid leaf.
  view.setInt32(leafOffset, -2, true);
  view.setInt32(leafOffset + 4, -1, true);
  for (let axis = 0; axis < 3; axis++) {
    view.setInt16(leafOffset + 8 + axis * 2, -64, true);
    view.setInt16(leafOffset + 14 + axis * 2, 64, true);
  }

  // One Q1 model whose render headnode points directly at leaf 0.
  for (let axis = 0; axis < 3; axis++) {
    view.setFloat32(modelOffset + axis * 4, -64, true);
    view.setFloat32(modelOffset + 12 + axis * 4, 64, true);
    view.setFloat32(modelOffset + 24 + axis * 4, 0, true);
  }
  for (let hull = 0; hull < 4; hull++) view.setInt32(modelOffset + 36 + hull * 4, -1, true);
  view.setInt32(modelOffset + 52, 0, true);
  view.setInt32(modelOffset + 56, 0, true);
  view.setInt32(modelOffset + 60, 0, true);

  if (bspx) {
    bytes.set(encoder.encode("BSPX"), bspxHeaderOffset);
    view.setUint32(bspxHeaderOffset + 4, 1, true);
    bytes.set(encoder.encode("BRUSHLIST"), bspxHeaderOffset + 8);
    view.setUint32(bspxHeaderOffset + 32, brushListOffset, true);
    view.setUint32(bspxHeaderOffset + 36, brushListLength, true);

    view.setUint32(brushListOffset, 1, true);
    view.setUint32(brushListOffset + 4, 0, true);
    view.setUint32(brushListOffset + 8, 1, true);
    view.setUint32(brushListOffset + 12, 0, true);
    const brush = brushListOffset + 16;
    for (let axis = 0; axis < 3; axis++) {
      view.setFloat32(brush + axis * 4, -32, true);
      view.setFloat32(brush + 12 + axis * 4, 32, true);
    }
    view.setInt16(brush + 24, -2, true);
    view.setUint16(brush + 26, 0, true);
  }
  return buffer;
}

function makeSyntheticQ2Bsp({
  contents = 1,
  texinfoIndex = 0,
  invalidBrushPlane = false,
  openBrush = false,
  nodeCycle = false
} = {}) {
  const headerSize = 160;
  const entities = encoder.encode('{\n"classname" "worldspawn"\n}\n\0');
  const sizes = {
    planes: 6 * 20,
    nodes: nodeCycle ? 28 : 0,
    texinfo: 76,
    leaves: 28,
    leafbrushes: 2,
    models: 48,
    brushes: 12,
    brushsides: 6 * 4
  };
  let cursor = headerSize;
  const locations = {};
  for (const [name, length] of [["entities", entities.length], ...Object.entries(sizes)]) {
    locations[name] = { offset: cursor, length };
    cursor = align4(cursor + length);
  }
  const buffer = new ArrayBuffer(cursor);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  bytes.set(encoder.encode("IBSP"), 0);
  view.setInt32(4, 38, true);
  const lumpNames = [
    "entities", "planes", "vertices", "visibility", "nodes", "texinfo",
    "faces", "lighting", "leaves", "leaffaces", "leafbrushes", "edges",
    "surfedges", "models", "brushes", "brushsides", "pop", "areas", "areaportals"
  ];
  for (let i = 0; i < lumpNames.length; i++) {
    const location = locations[lumpNames[i]] || { offset: 0, length: 0 };
    view.setInt32(8 + i * 8, location.offset, true);
    view.setInt32(12 + i * 8, location.length, true);
  }
  bytes.set(entities, locations.entities.offset);

  const declaredPlanes = [
    [[1, 0, 0], 32], [[-1, 0, 0], 32],
    [[0, 1, 0], 32], [[0, -1, 0], 32],
    [[0, 0, 1], 32], [[0, 0, -1], 32]
  ];
  for (let i = 0; i < declaredPlanes.length; i++) {
    const offset = locations.planes.offset + i * 20;
    for (let axis = 0; axis < 3; axis++) view.setFloat32(offset + axis * 4, declaredPlanes[i][0][axis], true);
    view.setFloat32(offset + 12, declaredPlanes[i][1], true);
    view.setInt32(offset + 16, i >> 1, true);
  }

  const ti = locations.texinfo.offset;
  view.setFloat32(ti, 1, true);
  view.setFloat32(ti + 20, 1, true);
  bytes.set(encoder.encode("e1u1/test"), ti + 40);
  view.setInt32(ti + 72, -1, true);

  const leaf = locations.leaves.offset;
  view.setInt32(leaf, 1, true);
  view.setInt16(leaf + 4, -1, true);
  for (let axis = 0; axis < 3; axis++) {
    view.setInt16(leaf + 8 + axis * 2, -32, true);
    view.setInt16(leaf + 14 + axis * 2, 32, true);
  }
  view.setUint16(leaf + 24, 0, true);
  view.setUint16(leaf + 26, 1, true);
  view.setUint16(locations.leafbrushes.offset, 0, true);

  const model = locations.models.offset;
  for (let axis = 0; axis < 3; axis++) {
    view.setFloat32(model + axis * 4, -32, true);
    view.setFloat32(model + 12 + axis * 4, 32, true);
  }
  view.setInt32(model + 36, nodeCycle ? 0 : -1, true);

  if (nodeCycle) {
    const node = locations.nodes.offset;
    view.setInt32(node, 0, true);
    view.setInt32(node + 4, 0, true);
    view.setInt32(node + 8, -1, true);
  }

  const brush = locations.brushes.offset;
  view.setInt32(brush, 0, true);
  view.setInt32(brush + 4, 6, true);
  view.setInt32(brush + 8, contents, true);
  for (let i = 0; i < 6; i++) {
    const side = locations.brushsides.offset + i * 4;
    const planeIndex = openBrush && i === 5 ? 4 : i;
    view.setUint16(side, invalidBrushPlane && i === 0 ? 999 : planeIndex, true);
    view.setInt16(side + 2, texinfoIndex, true);
  }
  return buffer;
}

test("entity lexer preserves ordered key/value pairs and escaped quotes", () => {
  const warnings = [];
  const entities = __test.parseEntityLump('{\n"classname" "worldspawn"\n"message" "say \\"hi\\""\n}\n', warnings);
  assert.equal(entities.length, 1);
  assert.deepEqual(entities[0].pairs, [
    ["classname", "worldspawn"],
    ["message", 'say "hi"']
  ]);
  assert.deepEqual(warnings, []);
});

test("MAP strings and download names cannot inject control syntax", () => {
  assert.equal(__test.escapeMapString('line\n"quote"\t\0end'), 'line\\n\\"quote\\"\\tend');
  assert.equal(__test.basenameWithoutExtension("../bad\nname?.bsp"), "bad_name_");
  assert.equal(__test.basenameWithoutExtension("CON.bsp"), "_CON");
  assert.equal(__test.safeTextureName("bad texture\u0001(name)"), "bad_texture__name_");
});

test("plane winding survives clipping into a six-sided cube", () => {
  const planes = [
    { normal: [1, 0, 0], dist: 16 },
    { normal: [-1, 0, 0], dist: 16 },
    { normal: [0, 1, 0], dist: 16 },
    { normal: [0, -1, 0], dist: 16 },
    { normal: [0, 0, 1], dist: 16 },
    { normal: [0, 0, -1], dist: 16 }
  ];
  for (const plane of planes) {
    const winding = __test.windingForSide(plane, planes);
    assert.ok(winding);
    assert.equal(winding.length, 4);
    assert.ok(Math.abs(__test.polygonArea(winding) - 1024) < 0.01);
  }
});

test("parses and decompiles a minimal BSP29 solid model", () => {
  const buffer = makeSyntheticBsp29();
  const bsp = parseBsp(buffer);
  assert.equal(bsp.format.id, "bsp29");
  assert.equal(bsp.entities.length, 1);
  assert.equal(bsp.models.length, 1);
  assert.equal(bsp.leaves[0].contents, -2);

  const result = decompileBsp(buffer, { fileName: "synthetic.bsp", writeComments: false });
  assert.equal(result.diagnostics.outputBrushes, 1);
  assert.equal(result.diagnostics.outputSides, 6);
  assert.equal(result.diagnostics.geometryPath, "BSP leaf reconstruction");
  assert.match(result.mapText, /"classname" "worldspawn"/);
  assert.equal((result.mapText.match(/\) skip \[/g) || []).length, 6);
  assert.match(result.mapText, /^\/\/ Game: Quake\n\/\/ Format: Valve\n/);
});

test("source filenames cannot inject MAP lines or unsafe download names", () => {
  const result = decompileBsp(makeSyntheticBsp29(), {
    fileName: 'unsafe\n{\n"classname" "hijack"\n}.bsp',
    writeComments: false
  });
  assert.equal(result.fileName, "unsafe_{__classname_ _hijack__}.decompile.map");
  assert.match(result.mapText, /^\/\/ Source: unsafe \{ "classname" "hijack" \}\.bsp$/m);
  assert.doesNotMatch(result.mapText, /^"classname" "hijack"$/m);
});

test("recognizes FTE/QSS-M Quake prerelease and Quake 64 containers", () => {
  const prerelease = parseBsp(makeSyntheticBsp29({ signature: 28 }));
  assert.equal(prerelease.format.id, "bsp28");

  const q64 = parseBsp(makeSyntheticBsp29({ signature: " 46Q" }));
  assert.equal(q64.format.id, "q64");
  assert.equal(q64.textures[0].name, "q64_test");
  assert.equal(q64.textures[0].scaleShift, 2);
  const result = decompileBsp(makeSyntheticBsp29({ signature: " 46Q" }), {
    fileName: "q64.bsp",
    writeComments: false
  });
  assert.equal(result.diagnostics.outputBrushes, 1);
  assert.match(result.mapText, /^\/\/ Game: Quake\n\/\/ Format: Valve\n/);
});

test("repairs Blue Shift BSP30 headers with swapped entity and plane lumps", () => {
  const buffer = makeSyntheticBsp29({ signature: 30 });
  const view = new DataView(buffer);
  const entityOffset = view.getInt32(4, true);
  const entityLength = view.getInt32(8, true);
  view.setInt32(4, 0, true);
  view.setInt32(8, 0, true);
  view.setInt32(12, entityOffset, true);
  view.setInt32(16, entityLength, true);

  const bsp = parseBsp(buffer);
  assert.equal(bsp.format.id, "hl30");
  assert.equal(bsp.entities[0].pairs[0][1], "worldspawn");
  assert.ok(bsp.warnings.some((warning) => warning.includes("Blue Shift")));
});

test("repairs invalid or collinear compiled texture projections", () => {
  const repaired = __test.valveFromTexinfo({
    vecs: [[1, 0, 0, 8], [2, 0, 0, 16]]
  }, [0, 0, 1]);
  assert.equal(repaired.repaired, true);
  assert.equal(__test.validTextureProjection(repaired.axes, [0, 0, 1]), true);
  assert.deepEqual(repaired.shifts, [0, 0]);
  assert.deepEqual(repaired.scales, [1, 1]);
});

test("prefers exact BSPX BRUSHLIST geometry in automatic mode", () => {
  const buffer = makeSyntheticBsp29({ bspx: true });
  const bsp = parseBsp(buffer);
  assert.deepEqual(Object.keys(bsp.bspx.entries), ["BRUSHLIST"]);
  assert.equal(bsp.bspx.brushList.get(0).brushes.length, 1);

  const result = decompileBsp(buffer, { fileName: "bspx-cube.bsp", writeComments: false });
  assert.equal(result.diagnostics.bspxBrushes, 1);
  assert.equal(result.diagnostics.exactBrushes, 1);
  assert.equal(result.diagnostics.geometryPath, "BSPX BRUSHLIST");
  assert.match(result.mapText, /\( 32 -32 32 \)/);
});

test("rejects unknown BSP signatures with an actionable error", () => {
  const buffer = new ArrayBuffer(8);
  new Uint8Array(buffer).set(encoder.encode("NOPE"));
  assert.throws(() => parseBsp(buffer), /Unsupported BSP signature/);
});

test("exports the same preflight file limit enforced by the parser", () => {
  assert.equal(MAX_FILE_BYTES, 1024 * 1024 * 1024);
});

test("recovers exact Quake II brush and brushside lumps", () => {
  const buffer = makeSyntheticQ2Bsp();
  const bsp = parseBsp(buffer);
  assert.equal(bsp.format.id, "q2bsp38");
  assert.equal(bsp.brushes.length, 1);
  assert.equal(bsp.brushsides.length, 6);

  const result = decompileBsp(buffer, { fileName: "q2-cube.bsp", writeComments: false });
  assert.equal(result.diagnostics.geometryPath, "Quake II brush lump");
  assert.equal(result.diagnostics.exactBrushes, 1);
  assert.equal(result.diagnostics.outputSides, 6);
  assert.match(result.mapText, /e1u1\/test/);
  assert.match(result.mapText, / 1 0 0\n/);
  assert.match(result.mapText, /^\/\/ Game: Quake 2\n\/\/ Format: Quake2 \(Valve\)\n/);
});

test("preserves Quake II hint and hidden-content surface semantics", () => {
  const hint = decompileBsp(makeSyntheticQ2Bsp({ contents: 0, texinfoIndex: -1 }), {
    fileName: "hint.bsp",
    writeComments: false
  });
  assert.equal((hint.mapText.match(/e1u1\/hint/g) || []).length, 6);
  assert.match(hint.mapText, / 0 256 0\n/);

  const clip = decompileBsp(makeSyntheticQ2Bsp({ contents: 0x00010000, texinfoIndex: -1 }), {
    fileName: "clip.bsp",
    writeComments: false
  });
  assert.equal((clip.mapText.match(/e1u1\/clip_player/g) || []).length, 6);
  assert.match(clip.mapText, / 65536 128 0\n/);
});

test("skips a Quake II brush whose exact plane data is unrecoverable", () => {
  const result = decompileBsp(makeSyntheticQ2Bsp({ invalidBrushPlane: true }), {
    fileName: "broken-q2.bsp",
    writeComments: false
  });
  assert.equal(result.diagnostics.outputBrushes, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("brush was skipped")));
});

test("rejects cyclic BSP graphs before they can amplify traversal work", () => {
  assert.throws(
    () => decompileBsp(makeSyntheticQ2Bsp({ nodeCycle: true }), { fileName: "cycle.bsp" }),
    /revisited node 0/
  );
});

test("skips open Quake II brushes instead of serializing base-winding coordinates", () => {
  const result = decompileBsp(makeSyntheticQ2Bsp({ openBrush: true }), {
    fileName: "open-q2.bsp",
    writeComments: false
  });
  assert.equal(result.diagnostics.outputBrushes, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("open or implausibly large brush")));
  assert.doesNotMatch(result.mapText, /16777216/);
});

test("local ericw BSP fixture parses when available", async (t) => {
  const fixture = "/tmp/ericw-tools-lit-audit/testmaps/compiled/q1_cube.bsp";
  try {
    await access(fixture);
  } catch {
    t.skip("local ericw-tools fixture is not installed");
    return;
  }
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(fixture);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const result = decompileBsp(buffer, { fileName: "q1_cube.bsp" });
  assert.equal(result.diagnostics.formatId, "bsp29");
  assert.ok(result.diagnostics.outputBrushes > 0);
  assert.ok(result.diagnostics.outputSides >= result.diagnostics.outputBrushes * 4);
  assert.match(result.mapText, /"classname" "worldspawn"/);
});
