/*
 * BSP Texture Trimmer
 *
 * Cropping concept inspired by Matthew Earl's unusedtex:
 * https://github.com/matthewearl/unusedtex
 *
 * BSP structure and BSPX handling follow ericw-tools:
 * https://github.com/ericwa/ericw-tools
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BSPTextureTrimmer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION_BSP29 = 29;
  const VERSION_BSP2 = 0x32505342;
  const VERSION_BSP2_RMQ = 0x42535032;
  const NUM_LUMPS = 15;
  const HEADER_BYTES = 4 + NUM_LUMPS * 8;
  const LUMP = {
    TEXTURES: 2,
    VERTICES: 3,
    TEXINFO: 6,
    FACES: 7,
    EDGES: 12,
    SURFEDGES: 13
  };
  const TEX_SPECIAL = 1;
  const TEXINFO_BYTES = 40;
  const VERTEX_BYTES = 12;
  const MIPTEX_HEADER_BYTES = 40;
  const MAX_ITEMS = 16 * 1024 * 1024;
  const EPSILON = 1e-4;

  function fail(message) {
    throw new Error(message);
  }

  function align4(value) {
    return Math.ceil(value / 4) * 4;
  }

  function align16(value) {
    return Math.ceil(value / 16) * 16;
  }

  function asBytes(input) {
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    fail('Input must be an ArrayBuffer or typed array');
  }

  function rangeOK(offset, length, total) {
    return Number.isSafeInteger(offset) && Number.isSafeInteger(length) &&
      offset >= 0 && length >= 0 && offset <= total && length <= total - offset;
  }

  function checkedCount(length, stride, label) {
    if (length % stride !== 0) fail(`${label} lump has an invalid byte length`);
    const count = length / stride;
    if (count > MAX_ITEMS) fail(`${label} lump has an unreasonable item count`);
    return count;
  }

  function fixedString(bytes, offset, length) {
    let end = offset;
    const limit = offset + length;
    while (end < limit && bytes[end] !== 0) end++;
    let value = '';
    for (let i = offset; i < end; i++) {
      const c = bytes[i];
      value += c >= 32 && c <= 126 ? String.fromCharCode(c) : '?';
    }
    return value;
  }

  function writeFixedString(bytes, offset, length, value) {
    bytes.fill(0, offset, offset + length);
    const limit = Math.min(length, value.length);
    for (let i = 0; i < limit; i++) bytes[offset + i] = value.charCodeAt(i) & 0x7f;
  }

  function parseHeader(bytes) {
    if (bytes.byteLength < HEADER_BYTES) fail('File is too short to contain a Quake BSP header');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const version = view.getInt32(0, true);
    let format;
    let wide;
    if (version === VERSION_BSP29) {
      format = 'BSP29';
      wide = false;
    } else if (version === VERSION_BSP2) {
      format = 'BSP2';
      wide = true;
    } else if (version === VERSION_BSP2_RMQ) {
      format = 'BSP2-RMQ';
      wide = true;
    } else {
      fail(`Unsupported BSP version 0x${(version >>> 0).toString(16)} (expected BSP29 or BSP2)`);
    }

    const lumps = [];
    const occupied = [];
    for (let i = 0; i < NUM_LUMPS; i++) {
      const offset = view.getInt32(4 + i * 8, true);
      const length = view.getInt32(8 + i * 8, true);
      if (!rangeOK(offset, length, bytes.byteLength)) fail(`BSP lump ${i} points outside the file`);
      if (length > 0 && offset < HEADER_BYTES) fail(`BSP lump ${i} overlaps the header`);
      lumps.push({ offset, length });
      if (length > 0) occupied.push({ start: offset, end: offset + length, index: i });
    }

    occupied.sort((a, b) => a.start - b.start);
    for (let i = 1; i < occupied.length; i++) {
      if (occupied[i].start < occupied[i - 1].end) {
        fail(`BSP lumps ${occupied[i - 1].index} and ${occupied[i].index} overlap`);
      }
    }
    return { view, version, format, wide, lumps };
  }

  function lumpBytes(bytes, bsp, index) {
    const lump = bsp.lumps[index];
    return bytes.subarray(lump.offset, lump.offset + lump.length);
  }

  function parseBSPX(bytes, bsp) {
    let standardEnd = HEADER_BYTES;
    for (const lump of bsp.lumps) standardEnd = Math.max(standardEnd, lump.offset + lump.length);
    const headerOffset = align4(standardEnd);
    if (headerOffset >= bytes.byteLength) return [];

    const tail = bytes.subarray(headerOffset);
    const hasBSPX = tail.length >= 4 &&
      tail[0] === 66 && tail[1] === 83 && tail[2] === 80 && tail[3] === 88;
    if (!hasBSPX) {
      for (const value of tail) {
        if (value !== 0) fail('BSP has unrecognized trailing data; refusing to discard it');
      }
      return [];
    }
    if (tail.length < 8) fail('BSPX header is truncated');

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(headerOffset + 4, true);
    if (count > 65535) fail('BSPX directory has an unreasonable lump count');
    const directoryBytes = 8 + count * 32;
    if (!rangeOK(headerOffset, directoryBytes, bytes.byteLength)) fail('BSPX directory is truncated');
    const dataStart = headerOffset + directoryBytes;
    const entries = [];
    const ranges = [];

    for (let i = 0; i < count; i++) {
      const entryOffset = headerOffset + 8 + i * 32;
      const name = fixedString(bytes, entryOffset, 24);
      const offset = view.getUint32(entryOffset + 24, true);
      const length = view.getUint32(entryOffset + 28, true);
      if (!rangeOK(offset, length, bytes.byteLength) || (length > 0 && offset < dataStart)) {
        fail(`BSPX lump "${name || i}" points outside its data area`);
      }
      if (length > 0) ranges.push({ start: offset, end: offset + length, name });
      entries.push({ name, data: bytes.subarray(offset, offset + length) });
    }

    ranges.sort((a, b) => a.start - b.start);
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].start < ranges[i - 1].end) {
        fail(`BSPX lumps "${ranges[i - 1].name}" and "${ranges[i].name}" overlap`);
      }
    }
    let coveredEnd = dataStart;
    for (const range of ranges) {
      for (let offset = coveredEnd; offset < range.start; offset++) {
        if (bytes[offset] !== 0) fail('BSPX contains unrecognized data between extension lumps');
      }
      coveredEnd = range.end;
    }
    for (let offset = coveredEnd; offset < bytes.byteLength; offset++) {
      if (bytes[offset] !== 0) fail('BSPX contains unrecognized trailing data');
    }
    return entries;
  }

  function parseTexinfo(bytes, bsp) {
    const raw = lumpBytes(bytes, bsp, LUMP.TEXINFO);
    const count = checkedCount(raw.length, TEXINFO_BYTES, 'Texinfo');
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const texinfo = [];
    for (let i = 0; i < count; i++) {
      const base = i * TEXINFO_BYTES;
      const vecs = [[], []];
      for (let axis = 0; axis < 2; axis++) {
        for (let component = 0; component < 4; component++) {
          const value = view.getFloat32(base + (axis * 4 + component) * 4, true);
          if (!Number.isFinite(value)) fail(`Texinfo ${i} contains a non-finite mapping vector`);
          vecs[axis].push(value);
        }
      }
      texinfo.push({
        index: i,
        vecs,
        miptex: view.getInt32(base + 32, true),
        flags: view.getInt32(base + 36, true)
      });
    }
    return { raw, texinfo };
  }

  function parseGeometry(bytes, bsp, texinfo) {
    const vertexRaw = lumpBytes(bytes, bsp, LUMP.VERTICES);
    const vertexCount = checkedCount(vertexRaw.length, VERTEX_BYTES, 'Vertex');
    const vertexView = new DataView(vertexRaw.buffer, vertexRaw.byteOffset, vertexRaw.byteLength);
    const vertices = new Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      const base = i * VERTEX_BYTES;
      const vertex = [
        vertexView.getFloat32(base, true),
        vertexView.getFloat32(base + 4, true),
        vertexView.getFloat32(base + 8, true)
      ];
      if (!vertex.every(Number.isFinite)) fail(`Vertex ${i} contains a non-finite coordinate`);
      vertices[i] = vertex;
    }

    const edgeRaw = lumpBytes(bytes, bsp, LUMP.EDGES);
    const edgeBytes = bsp.wide ? 8 : 4;
    const edgeCount = checkedCount(edgeRaw.length, edgeBytes, 'Edge');
    const edgeView = new DataView(edgeRaw.buffer, edgeRaw.byteOffset, edgeRaw.byteLength);
    const edges = new Array(edgeCount);
    for (let i = 0; i < edgeCount; i++) {
      const base = i * edgeBytes;
      const a = bsp.wide ? edgeView.getUint32(base, true) : edgeView.getUint16(base, true);
      const b = bsp.wide ? edgeView.getUint32(base + 4, true) : edgeView.getUint16(base + 2, true);
      if (a >= vertexCount || b >= vertexCount) fail(`Edge ${i} references an invalid vertex`);
      edges[i] = [a, b];
    }

    const surfedgeRaw = lumpBytes(bytes, bsp, LUMP.SURFEDGES);
    const surfedgeCount = checkedCount(surfedgeRaw.length, 4, 'Surfedge');
    const surfedgeView = new DataView(
      surfedgeRaw.buffer, surfedgeRaw.byteOffset, surfedgeRaw.byteLength
    );

    const faceRaw = lumpBytes(bytes, bsp, LUMP.FACES);
    const faceBytes = bsp.wide ? 28 : 20;
    const faceCount = checkedCount(faceRaw.length, faceBytes, 'Face');
    const faceView = new DataView(faceRaw.buffer, faceRaw.byteOffset, faceRaw.byteLength);
    const groups = new Map();
    const textureErrors = new Map();

    function markTextureError(texIndex, message) {
      if (texIndex >= 0 && !textureErrors.has(texIndex)) textureErrors.set(texIndex, message);
    }

    for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
      const base = faceIndex * faceBytes;
      const firstedge = faceView.getInt32(base + (bsp.wide ? 8 : 4), true);
      const numedges = bsp.wide
        ? faceView.getInt32(base + 12, true)
        : faceView.getInt16(base + 8, true);
      const texinfoIndex = bsp.wide
        ? faceView.getInt32(base + 16, true)
        : faceView.getInt16(base + 10, true);
      if (texinfoIndex < 0 || texinfoIndex >= texinfo.length) {
        fail(`Face ${faceIndex} references invalid texinfo ${texinfoIndex}`);
      }
      const ti = texinfo[texinfoIndex];
      if (numedges < 3 || firstedge < 0 || numedges > surfedgeCount - firstedge) {
        markTextureError(ti.miptex, `face ${faceIndex} has an invalid surfedge range`);
        continue;
      }

      let group = groups.get(texinfoIndex);
      if (!group) {
        group = {
          texinfoIndex,
          miptex: ti.miptex,
          minS: Infinity,
          maxS: -Infinity,
          minT: Infinity,
          maxT: -Infinity,
          faceCount: 0
        };
        groups.set(texinfoIndex, group);
      }

      let valid = true;
      for (let j = 0; j < numedges; j++) {
        const surfedge = surfedgeView.getInt32((firstedge + j) * 4, true);
        if (surfedge === -2147483648 || Math.abs(surfedge) >= edgeCount) {
          markTextureError(ti.miptex, `face ${faceIndex} references an invalid edge`);
          valid = false;
          break;
        }
        const edge = edges[Math.abs(surfedge)];
        const vertex = vertices[surfedge >= 0 ? edge[0] : edge[1]];
        const s = vertex[0] * ti.vecs[0][0] + vertex[1] * ti.vecs[0][1] +
          vertex[2] * ti.vecs[0][2] + ti.vecs[0][3];
        const t = vertex[0] * ti.vecs[1][0] + vertex[1] * ti.vecs[1][1] +
          vertex[2] * ti.vecs[1][2] + ti.vecs[1][3];
        if (!Number.isFinite(s) || !Number.isFinite(t)) {
          markTextureError(ti.miptex, `face ${faceIndex} has invalid texture coordinates`);
          valid = false;
          break;
        }
        group.minS = Math.min(group.minS, s);
        group.maxS = Math.max(group.maxS, s);
        group.minT = Math.min(group.minT, t);
        group.maxT = Math.max(group.maxT, t);
      }
      if (valid) group.faceCount++;
    }

    return { groups, textureErrors, faceCount };
  }

  function parseTextures(bytes, bsp) {
    const raw = lumpBytes(bytes, bsp, LUMP.TEXTURES);
    if (raw.length < 4) fail('Texture lump is truncated');
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const count = view.getInt32(0, true);
    if (count < 0 || count > MAX_ITEMS || 4 + count * 4 > raw.length) {
      fail('Texture lump has an invalid texture count');
    }
    const offsets = [];
    for (let i = 0; i < count; i++) offsets.push(view.getInt32(4 + i * 4, true));
    const headerBytes = 4 + count * 4;
    let previous = -1;
    for (const offset of offsets) {
      if (offset < 0) continue;
      if (offset < headerBytes || offset >= raw.length) fail('Texture lump has an invalid miptex offset');
      if (offset <= previous) fail('Texture lump miptex records are not in ascending order');
      previous = offset;
    }

    const textures = [];
    for (let i = 0; i < count; i++) {
      const offset = offsets[i];
      if (offset < 0) {
        textures.push({ index: i, nullTexture: true, name: '(missing)' });
        continue;
      }
      let end = raw.length;
      for (let j = i + 1; j < count; j++) {
        if (offsets[j] >= 0) {
          end = offsets[j];
          break;
        }
      }
      if (end - offset < MIPTEX_HEADER_BYTES) fail(`Texture ${i} has a truncated miptex header`);
      const name = fixedString(raw, offset, 16);
      const width = view.getUint32(offset + 16, true);
      const height = view.getUint32(offset + 20, true);
      const mipOffsets = [];
      for (let level = 0; level < 4; level++) {
        mipOffsets.push(view.getInt32(offset + 24 + level * 4, true));
      }
      textures.push({
        index: i,
        nullTexture: false,
        name,
        width,
        height,
        mipOffsets,
        raw: raw.subarray(offset, end)
      });
    }
    return { count, textures };
  }

  function standardTextureProblem(texture) {
    if (!texture.name) return 'unnamed texture';
    if (texture.width < 16 || texture.height < 16 ||
        texture.width > 32768 || texture.height > 32768 ||
        texture.width % 16 !== 0 || texture.height % 16 !== 0) {
      return 'nonstandard texture dimensions';
    }
    let expected = MIPTEX_HEADER_BYTES;
    for (let level = 0; level < 4; level++) {
      if (texture.mipOffsets[level] !== expected) return 'nonstandard mip layout';
      const width = texture.width >> level;
      const height = texture.height >> level;
      const size = width * height;
      if (!Number.isSafeInteger(size) || size <= 0) return 'invalid mip dimensions';
      expected += size;
    }
    if (expected !== texture.raw.length) return 'nonstandard or extended miptex record';
    return null;
  }

  function nameSkipReason(name) {
    const lower = name.toLowerCase();
    if (lower.startsWith('sky')) return 'sky texture';
    const first = name[0];
    if (first === '*' || first === '!') return 'liquid/warp texture';
    if (first === '+' || first === '-') return 'animated texture';
    if (first === '{') return 'fence/alpha texture';
    return null;
  }

  function findAxisCrop(size, bounds, padding) {
    let widest = 0;
    for (const bound of bounds) {
      if (!Number.isFinite(bound.min) || !Number.isFinite(bound.max) || bound.max < bound.min) return null;
      const span = bound.max - bound.min;
      if (span >= size - EPSILON) return null;
      widest = Math.max(widest, span);
    }
    const firstSize = Math.max(16, align16(Math.ceil(widest + padding * 2 - EPSILON)));
    for (let newSize = firstSize; newSize < size; newSize += 16) {
      for (let origin = 0; origin < size; origin += 16) {
        const shifts = new Map();
        let fits = true;
        for (const bound of bounds) {
          const lower = (origin + padding - bound.min - EPSILON) / size;
          const upper = (origin + newSize - padding - bound.max + EPSILON) / size;
          const minShift = Math.ceil(lower);
          const maxShift = Math.floor(upper);
          if (minShift > maxShift) {
            fits = false;
            break;
          }
          shifts.set(bound.texinfoIndex, minShift);
        }
        if (fits) return { origin, size: newSize, shifts };
      }
    }
    return { origin: 0, size, shifts: new Map() };
  }

  function makeTrimmedName(original, index, used) {
    for (let serial = 0; serial < 46656; serial++) {
      const token = (index + serial).toString(36);
      const suffix = `_q1t${token}`;
      const candidate = (original.slice(0, Math.max(0, 15 - suffix.length)) + suffix).slice(0, 15);
      const key = candidate.toLowerCase();
      if (!used.has(key)) {
        used.add(key);
        return candidate;
      }
    }
    fail('Could not allocate a unique trimmed texture name');
  }

  function cropTexture(texture, cropX, cropY, newName) {
    const outputSize = MIPTEX_HEADER_BYTES + (
      newName.width * newName.height +
      (newName.width >> 1) * (newName.height >> 1) +
      (newName.width >> 2) * (newName.height >> 2) +
      (newName.width >> 3) * (newName.height >> 3)
    );
    const output = new Uint8Array(outputSize);
    const view = new DataView(output.buffer);
    writeFixedString(output, 0, 16, newName.name);
    view.setUint32(16, newName.width, true);
    view.setUint32(20, newName.height, true);

    let writeOffset = MIPTEX_HEADER_BYTES;
    for (let level = 0; level < 4; level++) {
      view.setInt32(24 + level * 4, writeOffset, true);
      const oldWidth = texture.width >> level;
      const oldHeight = texture.height >> level;
      const width = newName.width >> level;
      const height = newName.height >> level;
      const startX = (cropX >> level) % oldWidth;
      const startY = (cropY >> level) % oldHeight;
      const sourceOffset = texture.mipOffsets[level];
      for (let y = 0; y < height; y++) {
        const sourceY = (startY + y) % oldHeight;
        for (let x = 0; x < width; x++) {
          const sourceX = (startX + x) % oldWidth;
          output[writeOffset++] = texture.raw[sourceOffset + sourceY * oldWidth + sourceX];
        }
      }
    }
    return output;
  }

  function buildTextureLump(textures) {
    const headerSize = 4 + textures.length * 4;
    let size = headerSize;
    const offsets = [];
    for (const texture of textures) {
      if (texture.nullTexture) {
        offsets.push(-1);
      } else {
        size = align4(size);
        offsets.push(size);
        size += texture.outputRaw.length;
      }
    }
    const output = new Uint8Array(size);
    const view = new DataView(output.buffer);
    view.setInt32(0, textures.length, true);
    for (let i = 0; i < offsets.length; i++) view.setInt32(4 + i * 4, offsets[i], true);
    for (let i = 0; i < textures.length; i++) {
      if (offsets[i] >= 0) output.set(textures[i].outputRaw, offsets[i]);
    }
    return output;
  }

  function writeBSP(bytes, bsp, replacements, bspx) {
    const lumps = [];
    for (let i = 0; i < NUM_LUMPS; i++) {
      lumps.push(replacements.has(i) ? replacements.get(i) : lumpBytes(bytes, bsp, i));
    }

    let cursor = HEADER_BYTES;
    const directory = [];
    for (const lump of lumps) {
      cursor = align4(cursor);
      directory.push({ offset: cursor, length: lump.length });
      cursor += lump.length;
    }

    let bspxHeader = -1;
    const bspxDirectory = [];
    if (bspx.length > 0) {
      cursor = align4(cursor);
      bspxHeader = cursor;
      cursor += 8 + bspx.length * 32;
      for (const entry of bspx) {
        cursor = align4(cursor);
        bspxDirectory.push({ offset: cursor, length: entry.data.length });
        cursor += entry.data.length;
      }
      cursor = align4(cursor);
    }

    if (cursor > 0x7fffffff) fail('Output BSP would exceed the signed 2 GiB file-offset limit');
    const output = new Uint8Array(cursor);
    const view = new DataView(output.buffer);
    view.setInt32(0, bsp.version, true);
    for (let i = 0; i < directory.length; i++) {
      view.setInt32(4 + i * 8, directory[i].offset, true);
      view.setInt32(8 + i * 8, directory[i].length, true);
      output.set(lumps[i], directory[i].offset);
    }

    if (bspxHeader >= 0) {
      output.set([66, 83, 80, 88], bspxHeader);
      view.setUint32(bspxHeader + 4, bspx.length, true);
      for (let i = 0; i < bspx.length; i++) {
        const directoryOffset = bspxHeader + 8 + i * 32;
        writeFixedString(output, directoryOffset, 24, bspx[i].name);
        view.setUint32(directoryOffset + 24, bspxDirectory[i].offset, true);
        view.setUint32(directoryOffset + 28, bspxDirectory[i].length, true);
        output.set(bspx[i].data, bspxDirectory[i].offset);
      }
    }
    return output.buffer;
  }

  function trimBSP(input, options) {
    const settings = Object.assign({ padding: 8, renameTextures: true }, options || {});
    if (!Number.isInteger(settings.padding) || settings.padding < 0 || settings.padding > 64) {
      fail('Padding must be an integer from 0 to 64');
    }
    const bytes = asBytes(input);
    const bsp = parseHeader(bytes);
    const bspx = parseBSPX(bytes, bsp);
    const parsedTexinfo = parseTexinfo(bytes, bsp);
    const geometry = parseGeometry(bytes, bsp, parsedTexinfo.texinfo);
    const textureLump = parseTextures(bytes, bsp);

    const texinfoRefs = new Map();
    for (const ti of parsedTexinfo.texinfo) {
      if (!texinfoRefs.has(ti.miptex)) texinfoRefs.set(ti.miptex, []);
      texinfoRefs.get(ti.miptex).push(ti.index);
    }
    const faceGroupsByTexture = new Map();
    for (const group of geometry.groups.values()) {
      if (!faceGroupsByTexture.has(group.miptex)) faceGroupsByTexture.set(group.miptex, []);
      faceGroupsByTexture.get(group.miptex).push(group);
    }

    const usedNames = new Set(
      textureLump.textures.filter(texture => !texture.nullTexture).map(texture => texture.name.toLowerCase())
    );
    const outputTextures = [];
    const changes = [];
    const skipped = [];
    const texinfoAdjustments = new Map();
    let removedCount = 0;

    for (const texture of textureLump.textures) {
      if (texture.nullTexture) {
        outputTextures.push({ nullTexture: true });
        continue;
      }
      const refs = texinfoRefs.get(texture.index) || [];
      const groups = faceGroupsByTexture.get(texture.index) || [];
      const specialNameReason = nameSkipReason(texture.name);

      if (refs.length === 0 && !specialNameReason) {
        outputTextures.push({ nullTexture: true });
        removedCount++;
        changes.push({
          index: texture.index,
          name: texture.name,
          action: 'removed',
          oldWidth: texture.width,
          oldHeight: texture.height,
          oldBytes: texture.raw.length,
          newBytes: 0,
          savedBytes: texture.raw.length
        });
        continue;
      }

      let reason = specialNameReason || standardTextureProblem(texture);
      if (!reason && geometry.textureErrors.has(texture.index)) {
        reason = geometry.textureErrors.get(texture.index);
      }
      if (!reason && refs.some(index => parsedTexinfo.texinfo[index].flags & TEX_SPECIAL)) {
        reason = 'TEX_SPECIAL surface';
      }
      if (!reason && groups.length === 0) reason = 'referenced only by unused texinfo';

      if (reason) {
        outputTextures.push({ nullTexture: false, outputRaw: texture.raw });
        skipped.push({ index: texture.index, name: texture.name, reason });
        continue;
      }

      const sBounds = groups.map(group => ({
        texinfoIndex: group.texinfoIndex,
        min: group.minS,
        max: group.maxS
      }));
      const tBounds = groups.map(group => ({
        texinfoIndex: group.texinfoIndex,
        min: group.minT,
        max: group.maxT
      }));
      const cropS = findAxisCrop(texture.width, sBounds, settings.padding);
      const cropT = findAxisCrop(texture.height, tBounds, settings.padding);
      if (!cropS || !cropT || (cropS.size === texture.width && cropT.size === texture.height)) {
        outputTextures.push({ nullTexture: false, outputRaw: texture.raw });
        skipped.push({
          index: texture.index,
          name: texture.name,
          reason: !cropS || !cropT ? 'usage spans a complete texture repeat' : 'already uses the full texture'
        });
        continue;
      }

      const outputName = settings.renameTextures
        ? makeTrimmedName(texture.name, texture.index, usedNames)
        : texture.name;
      const outputRaw = cropTexture(texture, cropS.origin, cropT.origin, {
        name: outputName,
        width: cropS.size,
        height: cropT.size
      });
      outputTextures.push({ nullTexture: false, outputRaw });

      for (const group of groups) {
        const shiftS = cropS.shifts.get(group.texinfoIndex) || 0;
        const shiftT = cropT.shifts.get(group.texinfoIndex) || 0;
        texinfoAdjustments.set(group.texinfoIndex, {
          s: shiftS * texture.width - cropS.origin,
          t: shiftT * texture.height - cropT.origin
        });
      }
      changes.push({
        index: texture.index,
        name: texture.name,
        outputName,
        action: 'cropped',
        oldWidth: texture.width,
        oldHeight: texture.height,
        newWidth: cropS.size,
        newHeight: cropT.size,
        cropX: cropS.origin,
        cropY: cropT.origin,
        oldBytes: texture.raw.length,
        newBytes: outputRaw.length,
        savedBytes: texture.raw.length - outputRaw.length,
        texinfoCount: groups.length
      });
    }

    if (changes.length === 0) {
      const unchanged = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? bytes.buffer
        : bytes.slice().buffer;
      return {
        buffer: unchanged,
        report: {
          format: bsp.format,
          inputBytes: bytes.byteLength,
          outputBytes: bytes.byteLength,
          savedBytes: 0,
          savedPercent: 0,
          textureCount: textureLump.count,
          croppedCount: 0,
          removedCount: 0,
          unchangedCount: textureLump.count,
          faceCount: geometry.faceCount,
          bspxCount: bspx.length,
          changes,
          skipped
        }
      };
    }

    const newTexinfo = parsedTexinfo.raw.slice();
    const newTexinfoView = new DataView(
      newTexinfo.buffer, newTexinfo.byteOffset, newTexinfo.byteLength
    );
    for (const [index, adjustment] of texinfoAdjustments) {
      const base = index * TEXINFO_BYTES;
      newTexinfoView.setFloat32(
        base + 12,
        newTexinfoView.getFloat32(base + 12, true) + adjustment.s,
        true
      );
      newTexinfoView.setFloat32(
        base + 28,
        newTexinfoView.getFloat32(base + 28, true) + adjustment.t,
        true
      );
    }

    const replacements = new Map();
    replacements.set(LUMP.TEXTURES, buildTextureLump(outputTextures));
    replacements.set(LUMP.TEXINFO, newTexinfo);
    const output = writeBSP(bytes, bsp, replacements, bspx);
    const savedBytes = bytes.byteLength - output.byteLength;
    const croppedCount = changes.filter(change => change.action === 'cropped').length;
    const report = {
      format: bsp.format,
      inputBytes: bytes.byteLength,
      outputBytes: output.byteLength,
      savedBytes,
      savedPercent: bytes.byteLength ? savedBytes * 100 / bytes.byteLength : 0,
      textureCount: textureLump.count,
      croppedCount,
      removedCount,
      unchangedCount: textureLump.count - croppedCount - removedCount,
      faceCount: geometry.faceCount,
      bspxCount: bspx.length,
      changes,
      skipped
    };
    return { buffer: output, report };
  }

  return {
    trimBSP,
    constants: {
      VERSION_BSP29,
      VERSION_BSP2,
      VERSION_BSP2_RMQ,
      NUM_LUMPS,
      LUMP
    }
  };
});
