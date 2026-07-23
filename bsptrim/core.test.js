'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const trimmer = require('./core.js');

const { LUMP, VERSION_BSP29, VERSION_BSP2 } = trimmer.constants;
const NUM_LUMPS = 15;
const HEADER_BYTES = 124;

function align4(value) {
  return (value + 3) & ~3;
}

function fixedName(bytes, offset, length) {
  let end = offset;
  while (end < offset + length && bytes[end]) end++;
  return String.fromCharCode(...bytes.subarray(offset, end));
}

function makeMiptex(width = 128, height = 128, name = 'stone') {
  const levels = [];
  let size = 40;
  for (let level = 0; level < 4; level++) {
    const levelSize = (width >> level) * (height >> level);
    levels.push({ offset: size, width: width >> level, height: height >> level });
    size += levelSize;
  }
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < Math.min(15, name.length); i++) bytes[i] = name.charCodeAt(i);
  view.setUint32(16, width, true);
  view.setUint32(20, height, true);
  for (let level = 0; level < 4; level++) {
    view.setInt32(24 + level * 4, levels[level].offset, true);
    const info = levels[level];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        bytes[info.offset + y * info.width + x] = (level * 53 + x * 3 + y * 5) & 255;
      }
    }
  }
  return { bytes, levels };
}

function makeTextureLump(...textures) {
  const headerSize = 4 + textures.length * 4;
  const offsets = [];
  let size = headerSize;
  for (const texture of textures) {
    size = align4(size);
    offsets.push(size);
    size += texture.bytes.length;
  }
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  view.setInt32(0, textures.length, true);
  for (let i = 0; i < textures.length; i++) {
    view.setInt32(4 + i * 4, offsets[i], true);
    bytes.set(textures[i].bytes, offsets[i]);
  }
  return bytes;
}

function makeVertices() {
  const points = [[0, 0, 0], [16, 0, 0], [16, 16, 0], [0, 16, 0]];
  const bytes = new Uint8Array(points.length * 12);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < 3; j++) view.setFloat32(i * 12 + j * 4, points[i][j], true);
  }
  return bytes;
}

function makeEdges(wide) {
  const edges = [[0, 0], [0, 1], [1, 2], [2, 3], [3, 0]];
  const stride = wide ? 8 : 4;
  const bytes = new Uint8Array(edges.length * stride);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < edges.length; i++) {
    if (wide) {
      view.setUint32(i * stride, edges[i][0], true);
      view.setUint32(i * stride + 4, edges[i][1], true);
    } else {
      view.setUint16(i * stride, edges[i][0], true);
      view.setUint16(i * stride + 2, edges[i][1], true);
    }
  }
  return bytes;
}

function makeSurfedges() {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < 4; i++) view.setInt32(i * 4, i + 1, true);
  return bytes;
}

function makeTexinfo(offsetS, offsetT, flags = 0) {
  const bytes = new Uint8Array(40);
  const view = new DataView(bytes.buffer);
  const values = [1, 0, 0, offsetS, 0, 1, 0, offsetT];
  for (let i = 0; i < values.length; i++) view.setFloat32(i * 4, values[i], true);
  view.setInt32(32, 0, true);
  view.setInt32(36, flags, true);
  return bytes;
}

function makeFace(wide) {
  const bytes = new Uint8Array(wide ? 28 : 20);
  const view = new DataView(bytes.buffer);
  if (wide) {
    view.setInt32(8, 0, true);
    view.setInt32(12, 4, true);
    view.setInt32(16, 0, true);
    view.setInt32(24, -1, true);
  } else {
    view.setInt32(4, 0, true);
    view.setInt16(8, 4, true);
    view.setInt16(10, 0, true);
    view.setInt32(16, -1, true);
  }
  return bytes;
}

function makeBSP({
  version = VERSION_BSP29,
  offsetS = 40,
  offsetT = 56,
  flags = 0,
  extraUnused = false
} = {}) {
  const wide = version !== VERSION_BSP29;
  const miptex = makeMiptex();
  const unusedMiptex = makeMiptex(64, 64, 'unused');
  const lumps = Array.from({ length: NUM_LUMPS }, () => new Uint8Array());
  lumps[0] = new TextEncoder().encode('{"classname" "worldspawn"}\0');
  lumps[LUMP.TEXTURES] = extraUnused
    ? makeTextureLump(miptex, unusedMiptex)
    : makeTextureLump(miptex);
  lumps[LUMP.VERTICES] = makeVertices();
  lumps[LUMP.TEXINFO] = makeTexinfo(offsetS, offsetT, flags);
  lumps[LUMP.FACES] = makeFace(wide);
  lumps[LUMP.EDGES] = makeEdges(wide);
  lumps[LUMP.SURFEDGES] = makeSurfedges();

  let cursor = HEADER_BYTES;
  const directory = [];
  for (const lump of lumps) {
    cursor = align4(cursor);
    directory.push({ offset: cursor, length: lump.length });
    cursor += lump.length;
  }
  cursor = align4(cursor);
  const bspxOffset = cursor;
  cursor += 40;
  cursor = align4(cursor);
  const extensionOffset = cursor;
  const extension = Uint8Array.from([9, 8, 7, 6, 5]);
  cursor += extension.length;
  cursor = align4(cursor);

  const bytes = new Uint8Array(cursor);
  const view = new DataView(bytes.buffer);
  view.setInt32(0, version, true);
  for (let i = 0; i < NUM_LUMPS; i++) {
    view.setInt32(4 + i * 8, directory[i].offset, true);
    view.setInt32(8 + i * 8, directory[i].length, true);
    bytes.set(lumps[i], directory[i].offset);
  }
  bytes.set([66, 83, 80, 88], bspxOffset);
  view.setUint32(bspxOffset + 4, 1, true);
  const name = 'TEST_LUMP';
  for (let i = 0; i < name.length; i++) bytes[bspxOffset + 8 + i] = name.charCodeAt(i);
  view.setUint32(bspxOffset + 32, extensionOffset, true);
  view.setUint32(bspxOffset + 36, extension.length, true);
  bytes.set(extension, extensionOffset);

  return { buffer: bytes.buffer, miptex, lumps, extension };
}

function parseOutput(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const lumps = [];
  for (let i = 0; i < NUM_LUMPS; i++) {
    const offset = view.getInt32(4 + i * 8, true);
    const length = view.getInt32(8 + i * 8, true);
    lumps.push(bytes.subarray(offset, offset + length));
  }
  return { bytes, view, lumps };
}

function assertMipPixel(textureBytes, mipOffset, width, x, y, expected) {
  assert.equal(textureBytes[mipOffset + y * width + x], expected);
}

for (const [label, version] of [['BSP29', VERSION_BSP29], ['BSP2', VERSION_BSP2]]) {
  test(`crops all four mip levels and preserves BSPX in ${label}`, () => {
    const source = makeBSP({ version });
    const result = trimmer.trimBSP(source.buffer, { padding: 8, renameTextures: false });
    const parsed = parseOutput(result.buffer);

    assert.ok(result.buffer.byteLength < source.buffer.byteLength);
    assert.equal(result.report.format, label);
    assert.equal(result.report.croppedCount, 1);
    assert.equal(result.report.bspxCount, 1);
    assert.equal(parsed.view.getInt32(0, true), version);

    const textureLump = parsed.lumps[LUMP.TEXTURES];
    const textureView = new DataView(
      textureLump.buffer, textureLump.byteOffset, textureLump.byteLength
    );
    const recordOffset = textureView.getInt32(4, true);
    const record = textureLump.subarray(recordOffset);
    const recordView = new DataView(record.buffer, record.byteOffset, record.byteLength);
    assert.equal(fixedName(record, 0, 16), 'stone');
    assert.equal(recordView.getUint32(16, true), 32);
    assert.equal(recordView.getUint32(20, true), 32);

    for (let level = 0; level < 4; level++) {
      const outputOffset = recordView.getInt32(24 + level * 4, true);
      const outputWidth = 32 >> level;
      const sourceInfo = source.miptex.levels[level];
      const sourceX = 32 >> level;
      const sourceY = 48 >> level;
      const expected = source.miptex.bytes[
        sourceInfo.offset + sourceY * sourceInfo.width + sourceX
      ];
      assertMipPixel(record, outputOffset, outputWidth, 0, 0, expected);
    }

    const texinfo = parsed.lumps[LUMP.TEXINFO];
    const texinfoView = new DataView(texinfo.buffer, texinfo.byteOffset, texinfo.byteLength);
    assert.equal(texinfoView.getFloat32(12, true), 8);
    assert.equal(texinfoView.getFloat32(28, true), 8);

    for (let i = 0; i < NUM_LUMPS; i++) {
      if (i === LUMP.TEXTURES || i === LUMP.TEXINFO) continue;
      assert.deepEqual(parsed.lumps[i], source.lumps[i], `lump ${i}`);
    }

    let standardEnd = HEADER_BYTES;
    for (let i = 0; i < NUM_LUMPS; i++) {
      standardEnd = Math.max(
        standardEnd,
        parsed.view.getInt32(4 + i * 8, true) + parsed.view.getInt32(8 + i * 8, true)
      );
    }
    const bspxOffset = align4(standardEnd);
    assert.equal(String.fromCharCode(...parsed.bytes.subarray(bspxOffset, bspxOffset + 4)), 'BSPX');
    const extensionOffset = parsed.view.getUint32(bspxOffset + 32, true);
    const extensionLength = parsed.view.getUint32(bspxOffset + 36, true);
    assert.deepEqual(
      parsed.bytes.subarray(extensionOffset, extensionOffset + extensionLength),
      source.extension
    );

    const secondPass = trimmer.trimBSP(result.buffer, { padding: 8, renameTextures: false });
    assert.equal(secondPass.report.savedBytes, 0);
    assert.deepEqual(new Uint8Array(secondPass.buffer), new Uint8Array(result.buffer));
  });
}

test('copies a crop that wraps across the original texture seam', () => {
  const source = makeBSP({ offsetS: 120, offsetT: 120 });
  const result = trimmer.trimBSP(source.buffer, { padding: 8, renameTextures: false });
  const parsed = parseOutput(result.buffer);
  const texture = parsed.lumps[LUMP.TEXTURES];
  const textureView = new DataView(texture.buffer, texture.byteOffset, texture.byteLength);
  const recordOffset = textureView.getInt32(4, true);
  const record = texture.subarray(recordOffset);
  const recordView = new DataView(record.buffer, record.byteOffset, record.byteLength);
  assert.equal(recordView.getUint32(16, true), 32);
  assert.equal(recordView.getUint32(20, true), 32);

  const mip0 = recordView.getInt32(24, true);
  const old = source.miptex;
  assertMipPixel(record, mip0, 32, 0, 0, old.bytes[old.levels[0].offset + 112 * 128 + 112]);
  assertMipPixel(record, mip0, 32, 20, 20, old.bytes[old.levels[0].offset + 4 * 128 + 4]);
});

test('renames cropped textures by default to avoid external replacement mismatches', () => {
  const source = makeBSP();
  const result = trimmer.trimBSP(source.buffer);
  const parsed = parseOutput(result.buffer);
  const texture = parsed.lumps[LUMP.TEXTURES];
  const textureView = new DataView(texture.buffer, texture.byteOffset, texture.byteLength);
  const outputName = fixedName(texture, textureView.getInt32(4, true), 16);
  assert.notEqual(outputName, 'stone');
  assert.match(outputName, /_q1t/);
  assert.ok(outputName.length <= 15);
  assert.equal(result.report.changes[0].outputName, outputName);
});

test('removes unreferenced static miptex data without renumbering texture slots', () => {
  const source = makeBSP({ extraUnused: true });
  const result = trimmer.trimBSP(source.buffer, { padding: 8, renameTextures: false });
  const parsed = parseOutput(result.buffer);
  const texture = parsed.lumps[LUMP.TEXTURES];
  const textureView = new DataView(texture.buffer, texture.byteOffset, texture.byteLength);
  assert.equal(textureView.getInt32(0, true), 2);
  assert.ok(textureView.getInt32(4, true) >= 0);
  assert.equal(textureView.getInt32(8, true), -1);
  assert.equal(result.report.removedCount, 1);
  assert.equal(result.report.changes.find(change => change.action === 'removed').name, 'unused');
});

test('skips TEX_SPECIAL surfaces without rewriting the BSP', () => {
  const source = makeBSP({ flags: 1 });
  const result = trimmer.trimBSP(source.buffer);
  assert.equal(result.report.croppedCount, 0);
  assert.equal(result.report.savedBytes, 0);
  assert.deepEqual(new Uint8Array(result.buffer), new Uint8Array(source.buffer));
  assert.equal(result.report.skipped[0].reason, 'TEX_SPECIAL surface');
});

test('rejects an unsupported BSP version', () => {
  const source = makeBSP();
  new DataView(source.buffer).setInt32(0, 30, true);
  assert.throws(() => trimmer.trimBSP(source.buffer), /Unsupported BSP version/);
});
