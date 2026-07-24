/*
 * BSP Forge — browser-side Quake-family BSP to Valve 220 MAP decompiler.
 *
 * Geometry reconstruction is an independent JavaScript implementation informed
 * by the public BSP formats, ericw-tools' leaf decompiler, and FTEQW's BSPX
 * BRUSHLIST specification/loader. See README.md for provenance and limitations.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { MAX_FILE_BYTES } from "./limits.js";
export { MAX_FILE_BYTES } from "./limits.js";

const Q1_LUMPS = [
  "entities", "planes", "textures", "vertices", "visibility",
  "nodes", "texinfo", "faces", "lighting", "clipnodes",
  "leaves", "marksurfaces", "edges", "surfedges", "models"
];

const Q2_LUMPS = [
  "entities", "planes", "vertices", "visibility", "nodes",
  "texinfo", "faces", "lighting", "leaves", "leaffaces",
  "leafbrushes", "edges", "surfedges", "models", "brushes",
  "brushsides", "pop", "areas", "areaportals"
];

const CONTENTS = {
  EMPTY: -1,
  SOLID: -2,
  WATER: -3,
  SLIME: -4,
  LAVA: -5,
  SKY: -6,
  CLIP: -8
};

const Q2_CONTENTS = {
  AREAPORTAL: 0x00008000,
  PLAYERCLIP: 0x00010000,
  MONSTERCLIP: 0x00020000,
  PROJECTILECLIP: 0x00004000,
  WATER: 0x00000020,
  SLIME: 0x00000010,
  LAVA: 0x00000008
};

const Q2_SURF = {
  NODRAW: 1 << 7,
  HINT: 1 << 8
};

const MAX_RECORDS = 16_000_000;
const MAX_ENTITIES = 100_000;
const MAX_RECURSION = 2_048;
const MAX_SPLIT_DEPTH = 48;
const MAX_SPLIT_BRUSHES_PER_LEAF = 512;
const MAX_OUTPUT_BRUSHES = 250_000;
const MAX_OUTPUT_SIDES = 2_000_000;
const MAX_MAP_CHARACTERS = 256_000_000;
const DEFAULT_EPSILON = 0.01;
const PLANE_EPSILON = 0.05;
const PREVIEW_SEGMENT_LIMIT = 30_000;
const BASE_WINDING_EXTENT = 16_777_216;

const textDecoder = new TextDecoder("windows-1252");

export class BspError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = "BspError";
    this.details = details;
  }
}

class Reader {
  constructor(buffer) {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new BspError("Expected BSP data as an ArrayBuffer.");
    }
    if (buffer.byteLength < 8) {
      throw new BspError("The file is too small to contain a BSP header.");
    }
    if (buffer.byteLength > MAX_FILE_BYTES) {
      throw new BspError("The BSP is larger than the 1 GiB browser safety limit.");
    }
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.bytes = new Uint8Array(buffer);
    this.length = buffer.byteLength;
  }

  ensure(offset, size, label = "read") {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0 || offset + size > this.length) {
      throw new BspError(`${label} is outside the BSP file.`, { offset, size, fileSize: this.length });
    }
  }

  i8(offset) { this.ensure(offset, 1); return this.view.getInt8(offset); }
  u8(offset) { this.ensure(offset, 1); return this.view.getUint8(offset); }
  i16(offset) { this.ensure(offset, 2); return this.view.getInt16(offset, true); }
  u16(offset) { this.ensure(offset, 2); return this.view.getUint16(offset, true); }
  i32(offset) { this.ensure(offset, 4); return this.view.getInt32(offset, true); }
  u32(offset) { this.ensure(offset, 4); return this.view.getUint32(offset, true); }
  f32(offset) { this.ensure(offset, 4); return this.view.getFloat32(offset, true); }

  ascii(offset, length) {
    this.ensure(offset, length, "string");
    let result = "";
    for (let i = 0; i < length; i++) result += String.fromCharCode(this.bytes[offset + i]);
    return result;
  }

  cString(offset, length) {
    this.ensure(offset, length, "string");
    let end = offset;
    const max = offset + length;
    while (end < max && this.bytes[end] !== 0) end++;
    return textDecoder.decode(this.bytes.subarray(offset, end));
  }

  text(offset, length) {
    this.ensure(offset, length, "text lump");
    let end = offset + length;
    while (end > offset && this.bytes[end - 1] === 0) end--;
    return textDecoder.decode(this.bytes.subarray(offset, end));
  }
}

function checkedCount(lump, stride, label, warnings) {
  if (stride <= 0) throw new BspError(`Internal error: invalid ${label} record size.`);
  if (lump.length % stride !== 0) {
    warnings.push(`${label} lump has ${lump.length % stride} trailing byte(s); trailing data was ignored.`);
  }
  const count = Math.floor(lump.length / stride);
  if (count > MAX_RECORDS) {
    throw new BspError(`${label} lump declares an unreasonable ${count.toLocaleString()} records.`);
  }
  return count;
}

function readRecords(reader, lump, stride, label, warnings, callback) {
  const count = checkedCount(lump, stride, label, warnings);
  const result = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = callback(lump.offset + i * stride, i);
  }
  return result;
}

function readLumpHeader(reader, offset, names) {
  const lumps = {};
  for (let i = 0; i < names.length; i++) {
    const record = offset + i * 8;
    const fileOffset = reader.i32(record);
    const length = reader.i32(record + 4);
    if (fileOffset < 0 || length < 0) {
      throw new BspError(`${names[i]} lump has a negative offset or length.`, { fileOffset, length });
    }
    reader.ensure(fileOffset, length, `${names[i]} lump`);
    lumps[names[i]] = { index: i, offset: fileOffset, length };
  }
  return lumps;
}

function validateLumpOverlaps(lumps, warnings) {
  const ranges = Object.entries(lumps)
    .filter(([, lump]) => lump.length > 0)
    .map(([name, lump]) => ({ name, start: lump.offset, end: lump.offset + lump.length }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  for (const [name, lump] of Object.entries(lumps)) {
    if (lump.length > 0 && name !== "entities" && (lump.offset & 3) !== 0) {
      warnings.push(`${name} lump is not 4-byte aligned; compatible engines may still load it.`);
    }
  }

  let furthest = ranges[0];
  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    if (current.start < furthest.end) {
      warnings.push(`${current.name} overlaps ${furthest.name}; the BSP may be packed unusually or corrupt.`);
    }
    if (current.end > furthest.end) furthest = current;
  }
}

function lumpStartsWithEntity(reader, lump) {
  const end = Math.min(lump.offset + lump.length, lump.offset + 4096);
  let offset = lump.offset;
  while (offset < end) {
    const byte = reader.u8(offset);
    if (byte === 0 || byte === 9 || byte === 10 || byte === 13 || byte === 32) {
      offset++;
      continue;
    }
    if (byte === 47 && offset + 1 < end && reader.u8(offset + 1) === 47) {
      offset += 2;
      while (offset < end && reader.u8(offset) !== 10) offset++;
      continue;
    }
    if (byte === 47 && offset + 1 < end && reader.u8(offset + 1) === 42) {
      offset += 2;
      while (offset + 1 < end && !(reader.u8(offset) === 42 && reader.u8(offset + 1) === 47)) offset++;
      offset = Math.min(end, offset + 2);
      continue;
    }
    return byte === 123;
  }
  return false;
}

function vec3(reader, offset) {
  return [reader.f32(offset), reader.f32(offset + 4), reader.f32(offset + 8)];
}

function shorts3(reader, offset) {
  return [reader.i16(offset), reader.i16(offset + 2), reader.i16(offset + 4)];
}

function parseEntityLump(source, warnings) {
  const entities = [];
  let position = 0;

  const skip = () => {
    while (position < source.length) {
      if (/\s/.test(source[position])) {
        position++;
      } else if (source[position] === "/" && source[position + 1] === "/") {
        position += 2;
        while (position < source.length && source[position] !== "\n") position++;
      } else if (source[position] === "/" && source[position + 1] === "*") {
        const end = source.indexOf("*/", position + 2);
        position = end < 0 ? source.length : end + 2;
      } else {
        break;
      }
    }
  };

  const token = () => {
    skip();
    if (position >= source.length) return null;
    const first = source[position];
    if (first === "{" || first === "}") {
      position++;
      return first;
    }
    if (first === "\"") {
      position++;
      let result = "";
      while (position < source.length) {
        const char = source[position++];
        if (char === "\"") return result;
        if (char === "\\" && position < source.length) {
          const escaped = source[position++];
          if (escaped === "n") result += "\n";
          else if (escaped === "t") result += "\t";
          else result += escaped;
        } else {
          result += char;
        }
      }
      warnings.push("The entity lump ends inside a quoted string.");
      return result;
    }
    const start = position;
    while (position < source.length && !/\s|[{}]/.test(source[position])) position++;
    return source.slice(start, position);
  };

  while (entities.length < MAX_ENTITIES) {
    const open = token();
    if (open === null) break;
    if (open !== "{") {
      warnings.push(`Ignored unexpected entity token “${String(open).slice(0, 32)}”.`);
      continue;
    }

    const pairs = [];
    let closed = false;
    while (position < source.length) {
      const key = token();
      if (key === null) break;
      if (key === "}") {
        closed = true;
        break;
      }
      if (key === "{") {
        warnings.push("Ignored a nested opening brace in the entity lump.");
        continue;
      }
      const value = token();
      if (value === null || value === "}") {
        warnings.push(`Entity key “${key}” has no value.`);
        closed = value === "}";
        break;
      }
      pairs.push([String(key), String(value)]);
    }
    entities.push({ pairs });
    if (!closed) {
      warnings.push("The final entity is missing its closing brace.");
      break;
    }
  }

  if (entities.length === MAX_ENTITIES) {
    throw new BspError("Entity count exceeded the browser safety limit.");
  }
  if (!entities.length) {
    warnings.push("No entities were recovered; a synthetic worldspawn will be written.");
    entities.push({ pairs: [["classname", "worldspawn"]] });
  }
  return entities;
}

function entityGet(entity, key) {
  for (let i = entity.pairs.length - 1; i >= 0; i--) {
    if (entity.pairs[i][0] === key) return entity.pairs[i][1];
  }
  return undefined;
}

function modelNumberForEntity(entity, entityIndex) {
  if (entityIndex === 0) return 0;
  const model = entityGet(entity, "model");
  if (!model || model[0] !== "*") return -1;
  const number = Number.parseInt(model.slice(1), 10);
  return Number.isSafeInteger(number) ? number : -1;
}

function parseBspx(reader, headerSize, coreLumps, warnings) {
  const result = { entries: {}, brushList: null };
  const coreEnd = Object.values(coreLumps).reduce(
    (maximum, lump) => Math.max(maximum, lump.offset + lump.length),
    headerSize
  );
  const canonicalOffset = (coreEnd + 3) & ~3;
  // Current FTE and ericw-tools place BSPX after the final aligned core lump.
  // Also recognize the early documented/header-adjacent placement when it
  // does not collide with core data.
  const candidates = [...new Set([canonicalOffset, headerSize])];
  const bspxOffset = candidates.find((offset) =>
    offset + 8 <= reader.length && reader.ascii(offset, 4) === "BSPX"
  );
  if (bspxOffset === undefined) return result;

  const count = reader.u32(bspxOffset + 4);
  if (count > 4096) {
    warnings.push(`Ignored BSPX header with unreasonable lump count ${count}.`);
    return result;
  }
  const directorySize = 8 + count * 32;
  if (bspxOffset + directorySize > reader.length) {
    warnings.push("Ignored truncated BSPX directory.");
    return result;
  }

  for (let i = 0; i < count; i++) {
    const offset = bspxOffset + 8 + i * 32;
    const name = reader.cString(offset, 24);
    const fileOffset = reader.u32(offset + 24);
    const length = reader.u32(offset + 28);
    try {
      reader.ensure(fileOffset, length, `BSPX ${name}`);
      result.entries[name] = { offset: fileOffset, length };
    } catch (error) {
      warnings.push(`Ignored invalid BSPX lump “${name}”.`);
    }
  }

  if (result.entries.BRUSHLIST) {
    try {
      result.brushList = parseBrushList(reader, result.entries.BRUSHLIST);
    } catch (error) {
      warnings.push(`BSPX BRUSHLIST could not be decoded: ${error.message}`);
    }
  }
  return result;
}

function parseBrushList(reader, lump) {
  const end = lump.offset + lump.length;
  let cursor = lump.offset;
  const models = new Map();

  while (cursor < end) {
    if (end - cursor < 16) throw new BspError("Truncated BRUSHLIST model header.");
    const version = reader.u32(cursor);
    const modelNumber = reader.u32(cursor + 4);
    const brushCount = reader.u32(cursor + 8);
    const totalPlaneCount = reader.u32(cursor + 12);
    cursor += 16;

    if (version !== 1) throw new BspError(`Unsupported BRUSHLIST version ${version}.`);
    if (brushCount > MAX_RECORDS || totalPlaneCount > MAX_RECORDS) {
      throw new BspError("BRUSHLIST counts exceed safety limits.");
    }

    const brushes = new Array(brushCount);
    let planesRead = 0;
    for (let i = 0; i < brushCount; i++) {
      if (end - cursor < 28) throw new BspError("Truncated BRUSHLIST brush header.");
      const mins = vec3(reader, cursor);
      const maxs = vec3(reader, cursor + 12);
      const contents = reader.i16(cursor + 24);
      const planeCount = reader.u16(cursor + 26);
      cursor += 28;
      if (end - cursor < planeCount * 16) throw new BspError("Truncated BRUSHLIST plane array.");

      const planes = [
        { normal: [1, 0, 0], dist: maxs[0] },
        { normal: [-1, 0, 0], dist: -mins[0] },
        { normal: [0, 1, 0], dist: maxs[1] },
        { normal: [0, -1, 0], dist: -mins[1] },
        { normal: [0, 0, 1], dist: maxs[2] },
        { normal: [0, 0, -1], dist: -mins[2] }
      ];
      for (let p = 0; p < planeCount; p++) {
        const planeOffset = cursor + p * 16;
        planes.push({ normal: vec3(reader, planeOffset), dist: reader.f32(planeOffset + 12) });
      }
      cursor += planeCount * 16;
      planesRead += planeCount;
      brushes[i] = { source: "bspx", sourceIndex: i, contents, mins, maxs, planes };
    }
    if (planesRead !== totalPlaneCount) {
      throw new BspError(`BRUSHLIST plane count mismatch (${planesRead} read, ${totalPlaneCount} declared).`);
    }
    models.set(modelNumber, { version, modelNumber, brushes, totalPlaneCount });
  }

  if (cursor !== end) throw new BspError("BRUSHLIST contains trailing partial data.");
  return models;
}

function parseQ1(reader, ident, warnings) {
  const signature = reader.ascii(0, 4);
  let format;
  if (ident === 28) {
    format = { id: "bsp28", name: "Quake prerelease BSP28", family: "q1", bsp2: false, rmq: false, halfLife: false, q64: false, prerelease: true };
  } else if (ident === 29) {
    format = { id: "bsp29", name: "Quake BSP29", family: "q1", bsp2: false, rmq: false, halfLife: false, q64: false };
  } else if (ident === 30) {
    format = { id: "hl30", name: "Half-Life BSP30", family: "q1", bsp2: false, rmq: false, halfLife: true, q64: false };
  } else if (signature === " 46Q") {
    format = { id: "q64", name: "Quake 64 remastered BSP", family: "q1", bsp2: false, rmq: false, halfLife: false, q64: true };
  } else if (signature === "BSP2") {
    format = { id: "bsp2", name: "Quake BSP2", family: "q1", bsp2: true, rmq: false, halfLife: false, q64: false };
  } else {
    format = { id: "bsp2rmq", name: "Quake BSP2-RMQ", family: "q1", bsp2: true, rmq: true, halfLife: false, q64: false };
  }

  const headerSize = 4 + Q1_LUMPS.length * 8;
  const lumps = readLumpHeader(reader, 4, Q1_LUMPS);
  // Some shipped Blue Shift maps have these two directory entries reversed.
  // FTEQW applies the same compatibility repair before loading their contents.
  if (format.halfLife && lumpStartsWithEntity(reader, lumps.planes) && !lumpStartsWithEntity(reader, lumps.entities)) {
    const entityLump = lumps.entities;
    lumps.entities = lumps.planes;
    lumps.planes = entityLump;
    warnings.push("Repaired a Blue Shift-style BSP30 header with swapped entity and plane lumps.");
  }
  validateLumpOverlaps(lumps, warnings);

  const planes = readRecords(reader, lumps.planes, 20, "planes", warnings, (offset) => ({
    normal: vec3(reader, offset),
    dist: reader.f32(offset + 12),
    type: reader.i32(offset + 16)
  }));

  const vertices = readRecords(reader, lumps.vertices, 12, "vertices", warnings, (offset) => vec3(reader, offset));

  let nodeStride;
  if (!format.bsp2) nodeStride = 24;
  else if (format.rmq) nodeStride = 32;
  else nodeStride = 44;

  const nodes = readRecords(reader, lumps.nodes, nodeStride, "nodes", warnings, (offset) => {
    if (!format.bsp2) {
      return {
        plane: reader.i32(offset),
        children: [reader.i16(offset + 4), reader.i16(offset + 6)],
        mins: shorts3(reader, offset + 8),
        maxs: shorts3(reader, offset + 14),
        firstFace: reader.u16(offset + 20),
        faceCount: reader.u16(offset + 22)
      };
    }
    if (format.rmq) {
      return {
        plane: reader.i32(offset),
        children: [reader.i32(offset + 4), reader.i32(offset + 8)],
        mins: shorts3(reader, offset + 12),
        maxs: shorts3(reader, offset + 18),
        firstFace: reader.u32(offset + 24),
        faceCount: reader.u32(offset + 28)
      };
    }
    return {
      plane: reader.i32(offset),
      children: [reader.i32(offset + 4), reader.i32(offset + 8)],
      mins: vec3(reader, offset + 12),
      maxs: vec3(reader, offset + 24),
      firstFace: reader.u32(offset + 36),
      faceCount: reader.u32(offset + 40)
    };
  });

  const texinfo = readRecords(reader, lumps.texinfo, 40, "texinfo", warnings, (offset) => ({
    vecs: [
      [reader.f32(offset), reader.f32(offset + 4), reader.f32(offset + 8), reader.f32(offset + 12)],
      [reader.f32(offset + 16), reader.f32(offset + 20), reader.f32(offset + 24), reader.f32(offset + 28)]
    ],
    miptex: reader.i32(offset + 32),
    flags: reader.i32(offset + 36),
    value: 0
  }));

  const faceStride = format.bsp2 ? 28 : 20;
  const faces = readRecords(reader, lumps.faces, faceStride, "faces", warnings, (offset) => {
    if (!format.bsp2) {
      return {
        plane: reader.u16(offset),
        side: reader.i16(offset + 2),
        firstEdge: reader.i32(offset + 4),
        edgeCount: reader.i16(offset + 8),
        texinfo: reader.i16(offset + 10)
      };
    }
    return {
      plane: reader.i32(offset),
      side: reader.i32(offset + 4),
      firstEdge: reader.i32(offset + 8),
      edgeCount: reader.i32(offset + 12),
      texinfo: reader.i32(offset + 16)
    };
  });

  const clipStride = format.bsp2 ? 12 : 8;
  const clipnodes = readRecords(reader, lumps.clipnodes, clipStride, "clipnodes", warnings, (offset) => {
    const upcastClipChild = (childOffset) => {
      const raw = reader.u16(childOffset);
      return raw > 0xfff0 ? raw - 0x10000 : raw;
    };
    return {
      plane: reader.i32(offset),
      children: format.bsp2
        ? [reader.i32(offset + 4), reader.i32(offset + 8)]
        : [upcastClipChild(offset + 4), upcastClipChild(offset + 6)]
    };
  });

  let leafStride;
  if (!format.bsp2) leafStride = 28;
  else if (format.rmq) leafStride = 32;
  else leafStride = 44;

  const leaves = readRecords(reader, lumps.leaves, leafStride, "leaves", warnings, (offset) => {
    if (!format.bsp2) {
      return {
        contents: reader.i32(offset),
        mins: shorts3(reader, offset + 8),
        maxs: shorts3(reader, offset + 14),
        firstMarkSurface: reader.u16(offset + 20),
        markSurfaceCount: reader.u16(offset + 22)
      };
    }
    if (format.rmq) {
      return {
        contents: reader.i32(offset),
        mins: shorts3(reader, offset + 8),
        maxs: shorts3(reader, offset + 14),
        firstMarkSurface: reader.u32(offset + 20),
        markSurfaceCount: reader.u32(offset + 24)
      };
    }
    return {
      contents: reader.i32(offset),
      mins: vec3(reader, offset + 8),
      maxs: vec3(reader, offset + 20),
      firstMarkSurface: reader.u32(offset + 32),
      markSurfaceCount: reader.u32(offset + 36)
    };
  });

  const edgeStride = format.bsp2 ? 8 : 4;
  const edges = readRecords(reader, lumps.edges, edgeStride, "edges", warnings, (offset) =>
    format.bsp2
      ? [reader.u32(offset), reader.u32(offset + 4)]
      : [reader.u16(offset), reader.u16(offset + 2)]
  );
  const surfedges = readRecords(reader, lumps.surfedges, 4, "surfedges", warnings, (offset) => reader.i32(offset));

  const textures = parseQ1Textures(reader, lumps.textures, warnings, format.q64);
  for (const info of texinfo) {
    info.texture = textures[info.miptex]?.name || "__missing";
  }

  const modelStride = detectQ1ModelStride(reader, lumps.models, format, { nodes, leaves, faces, clipnodes });
  if (modelStride === 80) {
    format.hexen2 = true;
    format.name = format.bsp2
      ? (format.rmq ? "Hexen II BSP2-RMQ" : "Hexen II BSP2")
      : "Hexen II BSP29";
  } else {
    format.hexen2 = false;
  }

  const headnodeCount = modelStride === 80 ? 8 : 4;
  const models = readRecords(reader, lumps.models, modelStride, "models", warnings, (offset) => {
    const headnodes = new Array(headnodeCount);
    for (let i = 0; i < headnodeCount; i++) headnodes[i] = reader.i32(offset + 36 + i * 4);
    const tail = offset + 36 + headnodeCount * 4;
    return {
      mins: vec3(reader, offset),
      maxs: vec3(reader, offset + 12),
      origin: vec3(reader, offset + 24),
      headnodes,
      visleafs: reader.i32(tail),
      firstFace: reader.i32(tail + 4),
      faceCount: reader.i32(tail + 8)
    };
  });

  const entityText = reader.text(lumps.entities.offset, lumps.entities.length);
  const entities = parseEntityLump(entityText, warnings);
  const bspx = parseBspx(reader, headerSize, lumps, warnings);

  const bsp = {
    reader, format, headerSize, lumps, planes, vertices, nodes, texinfo,
    faces, clipnodes, leaves, edges, surfedges, models, textures, entities,
    entityText, bspx, warnings
  };
  validateQ1References(bsp);
  buildFaceGeometry(bsp);
  return bsp;
}

function parseQ1Textures(reader, lump, warnings, q64 = false) {
  if (lump.length < 4) return [];
  const count = reader.i32(lump.offset);
  if (count < 0 || count > MAX_RECORDS || 4 + count * 4 > lump.length) {
    warnings.push("Texture lump directory is invalid; texture names will use __missing.");
    return [];
  }
  const textures = new Array(count);
  for (let i = 0; i < count; i++) {
    const relative = reader.i32(lump.offset + 4 + i * 4);
    if (relative === -1) {
      textures[i] = null;
      continue;
    }
    const headerSize = q64 ? 44 : 40;
    if (relative < 0 || relative + headerSize > lump.length) {
      warnings.push(`Texture ${i} has an invalid miptex offset.`);
      textures[i] = null;
      continue;
    }
    const offset = lump.offset + relative;
    const texture = {
      name: reader.cString(offset, 16) || "__unnamed",
      width: reader.u32(offset + 16),
      height: reader.u32(offset + 20),
      scaleShift: q64 ? reader.i32(offset + 24) : 0,
      // Pixel-data recovery for WAD extraction. `external` marks textures that
      // carry no embedded mip data (Half-Life external references or -notex
      // builds); `pixels` locates the verbatim miptex block when it is present.
      external: false,
      pixels: null
    };
    describeMiptexPixels(reader, lump, relative, headerSize, texture);
    textures[i] = texture;
  }
  return textures;
}

// Resolve the embedded miptex pixel block so it can be copied verbatim into a
// Quake WAD2. Mip offsets are stored relative to the miptex start, so the block
// stays self-consistent when the [start, start + size) range is copied as-is.
function describeMiptexPixels(reader, lump, relative, headerSize, texture) {
  const { width, height } = texture;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
      || width > 16_384 || height > 16_384) {
    texture.external = true;
    return;
  }
  // The four mip offsets sit immediately after name(16)+width(4)+height(4),
  // i.e. headerSize - 16 bytes into the miptex (24 for Quake, 28 for Quake 64).
  const mipBase = relative + (headerSize - 16);
  let extent = headerSize;
  let anyOffset = false;
  for (let mip = 0; mip < 4; mip++) {
    const mipOffset = reader.u32(lump.offset + mipBase + mip * 4);
    if (mipOffset === 0) continue;
    anyOffset = true;
    const mipBytes = (width >> mip) * (height >> mip);
    if (mipOffset < headerSize || relative + mipOffset + mipBytes > lump.length) {
      // A referenced mip runs outside the texture lump; treat the whole texture
      // as external rather than emitting a corrupt WAD lump.
      texture.external = true;
      return;
    }
    extent = Math.max(extent, mipOffset + mipBytes);
  }
  if (!anyOffset) {
    texture.external = true;
    return;
  }
  texture.pixels = { blockOffset: lump.offset + relative, blockSize: extent };
}

const TYP_MIPTEX = 0x44;

// Build a Quake WAD2 file from the miptex blocks a BSP embeds, so decompiled
// MAP files open in an editor with their textures visible. Returns a summary
// with a transferable ArrayBuffer, or a summary with buffer=null when nothing
// embeddable was found.
function extractQ1Wad(bsp) {
  if (bsp.format.family !== "q1") return null;
  if (bsp.format.q64) {
    return { buffer: null, recovered: 0, embedded: 0, external: 0, skippedFormat: true };
  }
  const textures = bsp.textures || [];
  const seen = new Set();
  const lumps = [];
  let embedded = 0;
  let external = 0;
  for (const texture of textures) {
    if (!texture) continue;
    const name = texture.name;
    if (!name || name === "__missing" || name === "__unnamed") continue;
    if (texture.external || !texture.pixels) {
      external++;
      continue;
    }
    embedded++;
    const key = name.toLowerCase();
    if (seen.has(key)) continue; // WAD2 lump names must be unique.
    seen.add(key);
    const { blockOffset, blockSize } = texture.pixels;
    lumps.push({ name, data: bsp.reader.bytes.subarray(blockOffset, blockOffset + blockSize) });
  }
  if (!lumps.length) return { buffer: null, recovered: 0, embedded, external };
  return { buffer: buildWad2(lumps), recovered: lumps.length, embedded, external };
}

function buildWad2(lumps) {
  const HEADER_SIZE = 12;
  const ENTRY_SIZE = 32;
  const align4 = (value) => (value + 3) & ~3;

  let cursor = HEADER_SIZE;
  const offsets = lumps.map((lump) => {
    const at = cursor;
    cursor += align4(lump.data.length);
    return at;
  });
  const infoTableOffset = cursor;
  const total = infoTableOffset + lumps.length * ENTRY_SIZE;

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  out[0] = 0x57; out[1] = 0x41; out[2] = 0x44; out[3] = 0x32; // "WAD2"
  view.setInt32(4, lumps.length, true);
  view.setInt32(8, infoTableOffset, true);

  const nameEncoder = new TextEncoder();
  for (let i = 0; i < lumps.length; i++) {
    const lump = lumps[i];
    const filePos = offsets[i];
    const size = lump.data.length;
    out.set(lump.data, filePos);

    const entry = infoTableOffset + i * ENTRY_SIZE;
    view.setInt32(entry, filePos, true);
    view.setInt32(entry + 4, size, true);      // disksize (uncompressed)
    view.setInt32(entry + 8, size, true);      // size
    out[entry + 12] = TYP_MIPTEX;
    out[entry + 13] = 0;                        // compression: none
    // entry + 14..15 padding stays zero.
    const encoded = nameEncoder.encode(lump.name).subarray(0, 16);
    out.set(encoded, entry + 16);              // name (null-padded, ≤16 bytes)
  }
  return out.buffer;
}

function detectQ1ModelStride(reader, lump, format, counts) {
  // Quake maps are allowed to omit clipnodes while leaving zeroed hull
  // headnodes, so Q1 model validation cannot require every collision head to
  // index the current clipnode lump. Hexen II detection follows ericw-tools:
  // prefer its 80-byte structure only when the whole candidate validates.
  const q1Valid = lump.length > 0 && lump.length % 64 === 0;
  const h2Valid = lump.length % 80 === 0 && validateModelsAtStride(reader, lump, 80, 8, counts);
  if (h2Valid) return 80;
  if (q1Valid) return 64;
  throw new BspError(`${format.name} model lump is neither valid Quake (64-byte) nor Hexen II (80-byte) data.`);
}

function validateModelsAtStride(reader, lump, stride, headnodeCount, counts) {
  if (!lump.length) return false;
  const count = lump.length / stride;
  for (let i = 0; i < count; i++) {
    const offset = lump.offset + i * stride;
    const head0 = reader.i32(offset + 36);
    if (head0 >= counts.nodes.length) return false;
    for (let h = 1; h < headnodeCount; h++) {
      if (reader.i32(offset + 36 + h * 4) >= counts.clipnodes.length) return false;
    }
    const tail = offset + 36 + headnodeCount * 4;
    const visleafs = reader.i32(tail);
    const firstFace = reader.i32(tail + 4);
    const faceCount = reader.i32(tail + 8);
    if (visleafs < 0 || visleafs > counts.leaves.length || firstFace < 0 || faceCount < 0 || firstFace + faceCount > counts.faces.length) {
      return false;
    }
  }
  return true;
}

function validateQ1References(bsp) {
  for (let i = 0; i < bsp.nodes.length; i++) {
    const node = bsp.nodes[i];
    if (node.plane < 0 || node.plane >= bsp.planes.length) {
      throw new BspError(`Node ${i} references invalid plane ${node.plane}.`);
    }
    if (node.firstFace < 0 || node.faceCount < 0 || node.firstFace + node.faceCount > bsp.faces.length) {
      throw new BspError(`Node ${i} references faces outside the face lump.`);
    }
  }
  for (let i = 0; i < bsp.faces.length; i++) {
    const face = bsp.faces[i];
    if (face.plane < 0 || face.plane >= bsp.planes.length) throw new BspError(`Face ${i} references invalid plane ${face.plane}.`);
    if (face.texinfo < 0 || face.texinfo >= bsp.texinfo.length) {
      bsp.warnings.push(`Face ${i} references invalid texinfo ${face.texinfo}; geometry was kept with a fallback material.`);
      face.texinfo = -1;
    }
    if (face.firstEdge < 0 || face.edgeCount < 0 || face.firstEdge + face.edgeCount > bsp.surfedges.length) {
      throw new BspError(`Face ${i} references surfedges outside the surfedge lump.`);
    }
  }
}

function parseQ2(reader, ident, warnings) {
  const qbism = ident === "QBSP";
  const version = reader.i32(4);
  if (version !== 38) {
    throw new BspError(`${ident} version ${version} is not supported; expected Quake II BSP version 38.`);
  }
  const format = {
    id: qbism ? "qbism38" : "q2bsp38",
    name: qbism ? "Quake II Qbism BSP38" : "Quake II BSP38",
    family: "q2",
    qbism
  };
  const headerSize = 8 + Q2_LUMPS.length * 8;
  const lumps = readLumpHeader(reader, 8, Q2_LUMPS);
  validateLumpOverlaps(lumps, warnings);

  const planes = readRecords(reader, lumps.planes, 20, "planes", warnings, (offset) => ({
    normal: vec3(reader, offset),
    dist: reader.f32(offset + 12),
    type: reader.i32(offset + 16)
  }));
  const vertices = readRecords(reader, lumps.vertices, 12, "vertices", warnings, (offset) => vec3(reader, offset));

  const nodeStride = qbism ? 44 : 28;
  const nodes = readRecords(reader, lumps.nodes, nodeStride, "nodes", warnings, (offset) => {
    if (qbism) {
      return {
        plane: reader.i32(offset),
        children: [reader.i32(offset + 4), reader.i32(offset + 8)],
        mins: vec3(reader, offset + 12),
        maxs: vec3(reader, offset + 24),
        firstFace: reader.u32(offset + 36),
        faceCount: reader.u32(offset + 40)
      };
    }
    return {
      plane: reader.i32(offset),
      children: [reader.i32(offset + 4), reader.i32(offset + 8)],
      mins: shorts3(reader, offset + 12),
      maxs: shorts3(reader, offset + 18),
      firstFace: reader.u16(offset + 24),
      faceCount: reader.u16(offset + 26)
    };
  });

  const texinfo = readRecords(reader, lumps.texinfo, 76, "texinfo", warnings, (offset) => ({
    vecs: [
      [reader.f32(offset), reader.f32(offset + 4), reader.f32(offset + 8), reader.f32(offset + 12)],
      [reader.f32(offset + 16), reader.f32(offset + 20), reader.f32(offset + 24), reader.f32(offset + 28)]
    ],
    flags: reader.i32(offset + 32),
    value: reader.i32(offset + 36),
    texture: reader.cString(offset + 40, 32) || "e1u1/skip",
    next: reader.i32(offset + 72)
  }));

  const faceStride = qbism ? 28 : 20;
  const faces = readRecords(reader, lumps.faces, faceStride, "faces", warnings, (offset) => {
    if (qbism) {
      return {
        plane: reader.u32(offset),
        side: reader.i32(offset + 4),
        firstEdge: reader.i32(offset + 8),
        edgeCount: reader.i32(offset + 12),
        texinfo: reader.i32(offset + 16)
      };
    }
    return {
      plane: reader.u16(offset),
      side: reader.i16(offset + 2),
      firstEdge: reader.i32(offset + 4),
      edgeCount: reader.i16(offset + 8),
      texinfo: reader.i16(offset + 10)
    };
  });

  const leafStride = qbism ? 52 : 28;
  const leaves = readRecords(reader, lumps.leaves, leafStride, "leaves", warnings, (offset) => {
    if (qbism) {
      return {
        contents: reader.i32(offset),
        mins: vec3(reader, offset + 12),
        maxs: vec3(reader, offset + 24),
        firstLeafFace: reader.u32(offset + 36),
        leafFaceCount: reader.u32(offset + 40),
        firstLeafBrush: reader.u32(offset + 44),
        leafBrushCount: reader.u32(offset + 48)
      };
    }
    return {
      contents: reader.i32(offset),
      mins: shorts3(reader, offset + 8),
      maxs: shorts3(reader, offset + 14),
      firstLeafFace: reader.u16(offset + 20),
      leafFaceCount: reader.u16(offset + 22),
      firstLeafBrush: reader.u16(offset + 24),
      leafBrushCount: reader.u16(offset + 26)
    };
  });

  const indexStride = qbism ? 4 : 2;
  const leafbrushes = readRecords(reader, lumps.leafbrushes, indexStride, "leafbrushes", warnings, (offset) =>
    qbism ? reader.u32(offset) : reader.u16(offset)
  );
  const edgeStride = qbism ? 8 : 4;
  const edges = readRecords(reader, lumps.edges, edgeStride, "edges", warnings, (offset) =>
    qbism ? [reader.u32(offset), reader.u32(offset + 4)] : [reader.u16(offset), reader.u16(offset + 2)]
  );
  const surfedges = readRecords(reader, lumps.surfedges, 4, "surfedges", warnings, (offset) => reader.i32(offset));

  const models = readRecords(reader, lumps.models, 48, "models", warnings, (offset) => ({
    mins: vec3(reader, offset),
    maxs: vec3(reader, offset + 12),
    origin: vec3(reader, offset + 24),
    headnodes: [reader.i32(offset + 36)],
    firstFace: reader.i32(offset + 40),
    faceCount: reader.i32(offset + 44)
  }));

  const brushes = readRecords(reader, lumps.brushes, 12, "brushes", warnings, (offset, index) => ({
    source: "q2",
    sourceIndex: index,
    firstSide: reader.i32(offset),
    sideCount: reader.i32(offset + 4),
    contents: reader.i32(offset + 8)
  }));

  const brushSideStride = qbism ? 8 : 4;
  const brushsides = readRecords(reader, lumps.brushsides, brushSideStride, "brushsides", warnings, (offset) => ({
    plane: qbism ? reader.u32(offset) : reader.u16(offset),
    texinfo: qbism ? reader.i32(offset + 4) : reader.i16(offset + 2)
  }));

  const entityText = reader.text(lumps.entities.offset, lumps.entities.length);
  const entities = parseEntityLump(entityText, warnings);
  const bspx = parseBspx(reader, headerSize, lumps, warnings);

  const bsp = {
    reader, format, headerSize, lumps, planes, vertices, nodes, texinfo, faces,
    leaves, leafbrushes, edges, surfedges, models, brushes, brushsides,
    entities, entityText, bspx, warnings, clipnodes: [], textures: []
  };
  validateQ2References(bsp);
  buildFaceGeometry(bsp);
  return bsp;
}

function validateQ2References(bsp) {
  for (let i = 0; i < bsp.nodes.length; i++) {
    const node = bsp.nodes[i];
    if (node.plane < 0 || node.plane >= bsp.planes.length) throw new BspError(`Node ${i} references invalid plane ${node.plane}.`);
  }
  for (let i = 0; i < bsp.faces.length; i++) {
    const face = bsp.faces[i];
    if (face.plane < 0 || face.plane >= bsp.planes.length) throw new BspError(`Face ${i} references invalid plane ${face.plane}.`);
    if (face.texinfo < 0 || face.texinfo >= bsp.texinfo.length) {
      bsp.warnings.push(`Face ${i} references invalid texinfo ${face.texinfo}; geometry was kept with a fallback material.`);
      face.texinfo = -1;
    }
    if (face.firstEdge < 0 || face.edgeCount < 0 || face.firstEdge + face.edgeCount > bsp.surfedges.length) {
      throw new BspError(`Face ${i} references surfedges outside the surfedge lump.`);
    }
  }
  for (let i = 0; i < bsp.brushes.length; i++) {
    const brush = bsp.brushes[i];
    if (brush.firstSide < 0 || brush.sideCount < 0 || brush.firstSide + brush.sideCount > bsp.brushsides.length) {
      throw new BspError(`Brush ${i} references brush sides outside the brushside lump.`);
    }
  }
  for (let i = 0; i < bsp.brushsides.length; i++) {
    const side = bsp.brushsides[i];
    if (side.texinfo < -1 || side.texinfo >= bsp.texinfo.length) {
      bsp.warnings.push(`Brushside ${i} references invalid texinfo ${side.texinfo}; a fallback material will be used.`);
      side.texinfo = -1;
    }
  }
}

function buildFaceGeometry(bsp) {
  for (let index = 0; index < bsp.faces.length; index++) {
    const face = bsp.faces[index];
    const points = [];
    for (let edgeOffset = 0; edgeOffset < face.edgeCount; edgeOffset++) {
      const surfaceEdge = bsp.surfedges[face.firstEdge + edgeOffset];
      const edgeIndex = Math.abs(surfaceEdge);
      if (edgeIndex >= bsp.edges.length) throw new BspError(`Face ${index} references invalid edge ${edgeIndex}.`);
      const edge = bsp.edges[edgeIndex];
      const vertexIndex = surfaceEdge >= 0 ? edge[0] : edge[1];
      if (vertexIndex >= bsp.vertices.length) throw new BspError(`Edge ${edgeIndex} references invalid vertex ${vertexIndex}.`);
      points.push(bsp.vertices[vertexIndex]);
    }
    face.points = removeDuplicatePoints(points);
    const sourcePlane = bsp.planes[face.plane];
    face.orientedPlane = face.side
      ? { normal: scale3(sourcePlane.normal, -1), dist: -sourcePlane.dist }
      : { normal: [...sourcePlane.normal], dist: sourcePlane.dist };
    face.index = index;
  }
}

export function parseBsp(buffer) {
  const reader = new Reader(buffer);
  const warnings = [];
  const identNumber = reader.i32(0);
  const identText = reader.ascii(0, 4);

  if (identNumber === 28 || identNumber === 29 || identNumber === 30
      || identText === "BSP2" || identText === "2PSB" || identText === " 46Q") {
    return parseQ1(reader, identNumber, warnings);
  }
  if (identText === "IBSP" || identText === "QBSP") {
    return parseQ2(reader, identText, warnings);
  }

  const printable = identText.replace(/[^\x20-\x7e]/g, "?");
  throw new BspError(`Unsupported BSP signature “${printable}” (0x${reader.u32(0).toString(16).padStart(8, "0")}).`);
}

// ---------------------------------------------------------------------------
// Vector, plane, winding, and texture helpers
// ---------------------------------------------------------------------------

function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function scale3(a, scalar) { return [a[0] * scalar, a[1] * scalar, a[2] * scalar]; }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}
function length3(a) { return Math.hypot(a[0], a[1], a[2]); }
function normalize3(a) {
  const length = length3(a);
  return length > 1e-12 ? scale3(a, 1 / length) : [0, 0, 0];
}
function finite3(a) { return a.length === 3 && a.every(Number.isFinite); }
function distanceToPlane(point, plane) { return dot3(point, plane.normal) - plane.dist; }
function flipPlane(plane) { return { ...plane, normal: scale3(plane.normal, -1), dist: -plane.dist }; }

function normalizedPlane(plane) {
  const length = length3(plane.normal);
  if (!Number.isFinite(length) || length < 1e-8 || !Number.isFinite(plane.dist)) return null;
  return { ...plane, normal: scale3(plane.normal, 1 / length), dist: plane.dist / length };
}

function planeKey(plane) {
  return `${Math.round(plane.normal[0] * 1000)},${Math.round(plane.normal[1] * 1000)},${Math.round(plane.normal[2] * 1000)},${Math.round(plane.dist * 20)}`;
}

const FACE_NORMAL_CELL = 0.1;
const FACE_DISTANCE_CELL = 0.25;

function facePlaneCell(plane, offsets = [0, 0, 0, 0]) {
  return [
    Math.floor(plane.normal[0] / FACE_NORMAL_CELL) + offsets[0],
    Math.floor(plane.normal[1] / FACE_NORMAL_CELL) + offsets[1],
    Math.floor(plane.normal[2] / FACE_NORMAL_CELL) + offsets[2],
    Math.floor(plane.dist / FACE_DISTANCE_CELL) + offsets[3]
  ].join(",");
}

function planesEquivalent(a, b, normalEpsilon = 0.002, distEpsilon = PLANE_EPSILON) {
  return dot3(a.normal, b.normal) > 1 - normalEpsilon && Math.abs(a.dist - b.dist) <= distEpsilon;
}

function removeDuplicatePoints(points, epsilon = 1e-5) {
  if (points.length < 2) return points.slice();
  const result = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (!previous || length3(sub3(point, previous)) > epsilon) result.push(point);
  }
  if (result.length > 2 && length3(sub3(result[0], result[result.length - 1])) <= epsilon) result.pop();
  return result;
}

function clipPolygon(poly, plane, epsilon = DEFAULT_EPSILON) {
  if (!poly || poly.length < 3) return { front: null, back: null };
  const front = [];
  const back = [];

  for (let i = 0; i < poly.length; i++) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];
    const currentDistance = distanceToPlane(current, plane);
    const nextDistance = distanceToPlane(next, plane);
    const currentFront = currentDistance > epsilon;
    const currentBack = currentDistance < -epsilon;

    if (!currentBack) front.push(current);
    if (!currentFront) back.push(current);

    if ((currentDistance > epsilon && nextDistance < -epsilon) || (currentDistance < -epsilon && nextDistance > epsilon)) {
      const fraction = currentDistance / (currentDistance - nextDistance);
      const intersection = [
        current[0] + (next[0] - current[0]) * fraction,
        current[1] + (next[1] - current[1]) * fraction,
        current[2] + (next[2] - current[2]) * fraction
      ];
      front.push(intersection);
      back.push(intersection);
    }
  }

  const cleanFront = removeDuplicatePoints(front);
  const cleanBack = removeDuplicatePoints(back);
  return {
    front: cleanFront.length >= 3 ? cleanFront : null,
    back: cleanBack.length >= 3 ? cleanBack : null
  };
}

function clipPolygonToBrush(poly, planes, skipPlane = null) {
  let result = poly;
  for (const plane of planes) {
    if (plane === skipPlane) continue;
    result = clipPolygon(result, plane).back;
    if (!result) return null;
  }
  return result;
}

function tangentBasis(normal) {
  const reference = Math.abs(normal[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1];
  const tangent = normalize3(cross3(reference, normal));
  const bitangent = normalize3(cross3(normal, tangent));
  return { tangent, bitangent };
}

function baseWinding(plane, extent = BASE_WINDING_EXTENT) {
  const center = scale3(plane.normal, plane.dist);
  const { tangent, bitangent } = tangentBasis(plane.normal);
  const t = scale3(tangent, extent);
  const b = scale3(bitangent, extent);
  // Winding order is intentionally opposite conventional CCW because Quake
  // map planes use cross(p0 - p1, p2 - p1).
  return [
    add3(add3(center, t), b),
    add3(sub3(center, t), b),
    sub3(sub3(center, t), b),
    sub3(add3(center, t), b)
  ];
}

function windingForSide(side, planes) {
  return clipPolygonToBrush(baseWinding(side), planes, side);
}

function polygonArea(poly) {
  if (!poly || poly.length < 3) return 0;
  let sum = [0, 0, 0];
  for (let i = 0; i < poly.length; i++) sum = add3(sum, cross3(poly[i], poly[(i + 1) % poly.length]));
  return length3(sum) * 0.5;
}

function polygonBounds(poly) {
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (const point of poly || []) {
    for (let axis = 0; axis < 3; axis++) {
      mins[axis] = Math.min(mins[axis], point[axis]);
      maxs[axis] = Math.max(maxs[axis], point[axis]);
    }
  }
  return { mins, maxs };
}

function brushBounds(brush) {
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  let found = false;
  for (const side of brush.sides) {
    const winding = side.winding || windingForSide(side.plane, brush.sides.map((entry) => entry.plane));
    for (const point of winding || []) {
      found = true;
      for (let axis = 0; axis < 3; axis++) {
        mins[axis] = Math.min(mins[axis], point[axis]);
        maxs[axis] = Math.max(maxs[axis], point[axis]);
      }
    }
  }
  return found ? { mins, maxs } : null;
}

function defaultAxes(normal) {
  const largest = Math.abs(normal[0]) > Math.abs(normal[1])
    ? (Math.abs(normal[0]) > Math.abs(normal[2]) ? 0 : 2)
    : (Math.abs(normal[1]) > Math.abs(normal[2]) ? 1 : 2);
  const first = largest === 2
    ? normalize3(cross3([0, 1, 0], normal))
    : normalize3(cross3([0, 0, 1], normal));
  return [first, normalize3(cross3(first, normal))];
}

function validTextureProjection(axes, normal) {
  if (!axes.every((axis) => finite3(axis) && length3(axis) > 1e-10)) return false;
  const textureNormal = normalize3(cross3(axes[0], axes[1]));
  return finite3(textureNormal) && Math.abs(dot3(textureNormal, normal)) > 1e-6;
}

function valveFromTexinfo(info, normal) {
  if (!info) {
    const axes = defaultAxes(normal);
    return { axes, shifts: [0, 0], scales: [1, 1], repaired: false };
  }
  const axes = [];
  const shifts = [];
  const scales = [];
  let repaired = false;
  for (let row = 0; row < 2; row++) {
    const xyz = info.vecs[row].slice(0, 3);
    const length = length3(xyz);
    if (length > 1e-10 && finite3(xyz)) {
      axes.push(scale3(xyz, 1 / length));
      scales.push(1 / length);
    } else {
      axes.push(defaultAxes(normal)[row]);
      scales.push(1);
      repaired = true;
    }
    if (Number.isFinite(info.vecs[row][3])) shifts.push(info.vecs[row][3]);
    else {
      shifts.push(0);
      repaired = true;
    }
  }
  if (repaired || !validTextureProjection(axes, normal)
      || !scales.every((scale) => Number.isFinite(scale) && Math.abs(scale) > 1e-10)) {
    return { axes: defaultAxes(normal), shifts: [0, 0], scales: [1, 1], repaired: true };
  }
  return { axes, shifts, scales, repaired: false };
}

export const __test = {
  parseEntityLump,
  entityGet,
  clipPolygon,
  baseWinding,
  windingForSide,
  polygonArea,
  valveFromTexinfo,
  planeKey,
  validTextureProjection,
  safeTextureName,
  escapeMapString,
  basenameWithoutExtension,
  extractQ1Wad,
  buildWad2
};

// ---------------------------------------------------------------------------
// Geometry recovery
// ---------------------------------------------------------------------------

function boundsPlanes(mins, maxs) {
  if (!finite3(mins) || !finite3(maxs)) throw new BspError("Model bounds contain non-finite values.");
  if (mins.some((value, axis) => value > maxs[axis])) {
    throw new BspError("Model bounds are inverted.");
  }
  return [
    { normal: [1, 0, 0], dist: maxs[0], boundary: true },
    { normal: [-1, 0, 0], dist: -mins[0], boundary: true },
    { normal: [0, 1, 0], dist: maxs[1], boundary: true },
    { normal: [0, -1, 0], dist: -mins[1], boundary: true },
    { normal: [0, 0, 1], dist: maxs[2], boundary: true },
    { normal: [0, 0, -1], dist: -mins[2], boundary: true }
  ];
}

function sanitizePlanes(input, warnings, context) {
  const planes = [];
  for (const inputPlane of input) {
    const plane = normalizedPlane(inputPlane);
    if (!plane) {
      warnings.push(`${context}: discarded a degenerate or non-finite plane.`);
      continue;
    }
    const existing = planes.find((candidate) => planesEquivalent(candidate, plane, 0.0001, 0.01));
    if (!existing) planes.push(plane);
  }
  return planes;
}

function removeRedundantPlanes(input, warnings, context) {
  const planes = sanitizePlanes(input, warnings, context);
  if (planes.length <= 4) return planes;
  const useful = [];
  for (const plane of planes) {
    const winding = clipPolygonToBrush(baseWinding(plane), planes, plane);
    if (winding && polygonArea(winding) > 1e-4) useful.push(plane);
  }
  return useful;
}

function collectQ1NodeTasks(bsp, model, modelNumber, warnings) {
  const headnode = model.headnodes[0];
  let mins = model.mins;
  let maxs = model.maxs;
  if (headnode >= 0 && headnode < bsp.nodes.length) {
    mins = bsp.nodes[headnode].mins;
    maxs = bsp.nodes[headnode].maxs;
  }
  const initialPlanes = boundsPlanes(mins, maxs);
  const tasks = [];

  if (headnode < 0) {
    const leafIndex = -headnode - 1;
    const leaf = bsp.leaves[leafIndex];
    if (!leaf) throw new BspError(`Model ${modelNumber} references invalid leaf ${leafIndex}.`);
    if (leaf.contents !== CONTENTS.EMPTY) tasks.push({ planes: initialPlanes, leafIndex, contents: leaf.contents });
    return tasks;
  }
  if (headnode >= bsp.nodes.length) throw new BspError(`Model ${modelNumber} references invalid node ${headnode}.`);

  const stack = [{ nodeIndex: headnode, planes: initialPlanes, depth: 0 }];
  const visited = new Set();
  while (stack.length) {
    const entry = stack.pop();
    if (visited.has(entry.nodeIndex)) {
      throw new BspError(`Model ${modelNumber} BSP traversal revisited node ${entry.nodeIndex} (cycle or shared subtree).`);
    }
    visited.add(entry.nodeIndex);
    if (entry.depth > MAX_RECURSION) throw new BspError(`Model ${modelNumber} BSP tree is too deep or cyclic.`);
    const node = bsp.nodes[entry.nodeIndex];
    if (!node) throw new BspError(`Model ${modelNumber} traversal reached invalid node ${entry.nodeIndex}.`);
    const sourcePlane = normalizedPlane(bsp.planes[node.plane]);
    if (!sourcePlane) throw new BspError(`Node ${entry.nodeIndex} has a degenerate plane.`);

    for (let childSide = 1; childSide >= 0; childSide--) {
      const child = node.children[childSide];
      const outward = childSide === 0 ? flipPlane(sourcePlane) : { ...sourcePlane };
      outward.nodeIndex = entry.nodeIndex;
      const planes = entry.planes.concat(outward);
      if (child < 0) {
        const leafIndex = -child - 1;
        const leaf = bsp.leaves[leafIndex];
        if (!leaf) throw new BspError(`Node ${entry.nodeIndex} references invalid leaf ${leafIndex}.`);
        if (leaf.contents !== CONTENTS.EMPTY) {
          tasks.push({ planes, leafIndex, contents: leaf.contents });
        }
      } else {
        if (child >= bsp.nodes.length) throw new BspError(`Node ${entry.nodeIndex} references invalid child node ${child}.`);
        stack.push({ nodeIndex: child, planes, depth: entry.depth + 1 });
      }
    }
  }
  return tasks;
}

function collectQ1ClipTasks(bsp, model, modelNumber, hullNumber) {
  if (hullNumber <= 0 || hullNumber >= model.headnodes.length) {
    throw new BspError(`Hull ${hullNumber} is not available for model ${modelNumber}.`);
  }
  const headnode = model.headnodes[hullNumber];
  const initialPlanes = boundsPlanes(model.mins, model.maxs);
  const tasks = [];

  if (headnode < 0) {
    if (headnode !== CONTENTS.EMPTY) tasks.push({ planes: initialPlanes, contents: headnode, clipHull: hullNumber });
    return tasks;
  }
  if (headnode >= bsp.clipnodes.length) throw new BspError(`Model ${modelNumber} hull ${hullNumber} references invalid clipnode ${headnode}.`);

  const stack = [{ nodeIndex: headnode, planes: initialPlanes, depth: 0 }];
  const visited = new Set();
  while (stack.length) {
    const entry = stack.pop();
    if (visited.has(entry.nodeIndex)) {
      throw new BspError(`Hull ${hullNumber} traversal revisited clipnode ${entry.nodeIndex} (cycle or shared subtree).`);
    }
    visited.add(entry.nodeIndex);
    if (entry.depth > MAX_RECURSION) throw new BspError(`Hull ${hullNumber} tree is too deep or cyclic.`);
    const node = bsp.clipnodes[entry.nodeIndex];
    if (!node) throw new BspError(`Hull ${hullNumber} traversal reached invalid clipnode ${entry.nodeIndex}.`);
    const sourcePlane = normalizedPlane(bsp.planes[node.plane]);
    if (!sourcePlane) throw new BspError(`Clipnode ${entry.nodeIndex} has a degenerate plane.`);

    for (let childSide = 1; childSide >= 0; childSide--) {
      const child = node.children[childSide];
      const outward = childSide === 0 ? flipPlane(sourcePlane) : { ...sourcePlane };
      outward.clipnodeIndex = entry.nodeIndex;
      const planes = entry.planes.concat(outward);
      if (child < 0) {
        if (child !== CONTENTS.EMPTY) tasks.push({ planes, contents: child, clipHull: hullNumber });
      } else {
        if (child >= bsp.clipnodes.length) throw new BspError(`Clipnode ${entry.nodeIndex} references invalid child ${child}.`);
        stack.push({ nodeIndex: child, planes, depth: entry.depth + 1 });
      }
    }
  }
  return tasks;
}

function nodeFaceCandidates(bsp, plane, brushPlanes) {
  if (!Number.isInteger(plane.nodeIndex)) return [];
  const node = bsp.nodes[plane.nodeIndex];
  const candidates = [];
  for (let i = 0; i < node.faceCount; i++) {
    const face = bsp.faces[node.firstFace + i];
    if (!face || dot3(plane.normal, face.orientedPlane.normal) < 0.9) continue;
    const clipped = clipPolygonToBrush(face.points, brushPlanes);
    const area = polygonArea(clipped);
    if (clipped && area > 1e-4) candidates.push({ face, poly: clipped, area });
  }
  return candidates;
}

function indexModelFaces(bsp, model) {
  const buckets = new Map();
  const start = Math.max(0, model.firstFace);
  const end = Math.min(bsp.faces.length, start + Math.max(0, model.faceCount));
  for (let i = start; i < end; i++) {
    const face = bsp.faces[i];
    const key = facePlaneCell(face.orientedPlane);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(face);
  }
  return buckets;
}

function indexedFaceCandidates(faceIndex, plane, brushPlanes) {
  const candidates = [];
  const possible = new Set();
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        for (let d = -1; d <= 1; d++) {
          for (const face of faceIndex.get(facePlaneCell(plane, [x, y, z, d])) || []) possible.add(face);
        }
      }
    }
  }
  for (const face of possible) {
    if (!planesEquivalent(plane, face.orientedPlane, 0.002, 0.1)) continue;
    const clipped = clipPolygonToBrush(face.points, brushPlanes);
    const area = polygonArea(clipped);
    if (clipped && area > 1e-4) candidates.push({ face, poly: clipped, area });
  }
  return candidates;
}

function initialLeafBrush(bsp, task, warnings, context) {
  const planes = removeRedundantPlanes(task.planes, warnings, context);
  if (planes.length < 4) {
    warnings.push(`${context}: skipped a leaf volume with fewer than four useful planes.`);
    return null;
  }
  const sides = planes.map((plane) => ({
    plane,
    faces: nodeFaceCandidates(bsp, plane, planes)
  }));
  return {
    source: "tree",
    sourceIndex: task.leafIndex ?? -1,
    contents: task.contents,
    sides
  };
}

function initialBspxBrush(bsp, source, faceIndex, warnings, context) {
  const planes = removeRedundantPlanes(source.planes, warnings, context);
  if (planes.length < 4) {
    warnings.push(`${context}: skipped a BSPX brush with fewer than four valid planes.`);
    return null;
  }
  const sides = planes.map((plane) => ({
    plane,
    faces: indexedFaceCandidates(faceIndex, plane, planes)
  }));
  return {
    source: "bspx",
    sourceIndex: source.sourceIndex,
    contents: source.contents,
    sides
  };
}

function faceTextureIdentity(candidate) {
  return candidate.face.texinfo;
}

function sideNeedsSplitting(side) {
  if (side.faces.length <= 1) return false;
  const first = faceTextureIdentity(side.faces[0]);
  return side.faces.some((candidate) => faceTextureIdentity(candidate) !== first);
}

function edgeSplitPlanes(side) {
  const result = [];
  const seen = new Set();
  for (const candidate of side.faces) {
    const poly = candidate.poly;
    const center = poly.reduce((sum, point) => add3(sum, point), [0, 0, 0]).map((value) => value / poly.length);
    for (let i = 0; i < poly.length; i++) {
      const p0 = poly[i];
      const p1 = poly[(i + 1) % poly.length];
      let normal = normalize3(cross3(sub3(p1, p0), side.plane.normal));
      if (length3(normal) < 0.5) continue;
      let dist = dot3(normal, p0);
      if (dot3(normal, center) - dist < 0) {
        normal = scale3(normal, -1);
        dist = -dist;
      }
      const plane = { normal, dist, split: true };
      const key = planeKey(plane);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(plane);
      }
    }
  }
  return result;
}

function chooseSplitPlane(side) {
  let best = null;
  for (const plane of edgeSplitPlanes(side)) {
    let frontCount = 0;
    let backCount = 0;
    let fragments = 0;
    const frontTextures = new Set();
    const backTextures = new Set();
    for (const candidate of side.faces) {
      const clipped = clipPolygon(candidate.poly, plane);
      if (clipped.front && polygonArea(clipped.front) > 1e-4) {
        frontCount++;
        fragments++;
        frontTextures.add(faceTextureIdentity(candidate));
      }
      if (clipped.back && polygonArea(clipped.back) > 1e-4) {
        backCount++;
        fragments++;
        backTextures.add(faceTextureIdentity(candidate));
      }
    }
    if (!frontCount || !backCount) continue;
    const score = fragments * 100 + Math.abs(frontCount - backCount) * 5 + frontTextures.size + backTextures.size;
    if (!best || score < best.score) best = { plane, score };
  }
  return best?.plane || null;
}

function splitBrushByPlane(brush, splitPlane) {
  const frontSides = [];
  const backSides = [];
  for (const side of brush.sides) {
    const frontFaces = [];
    const backFaces = [];
    for (const candidate of side.faces) {
      const clipped = clipPolygon(candidate.poly, splitPlane);
      if (clipped.front && polygonArea(clipped.front) > 1e-4) {
        frontFaces.push({ ...candidate, poly: clipped.front, area: polygonArea(clipped.front) });
      }
      if (clipped.back && polygonArea(clipped.back) > 1e-4) {
        backFaces.push({ ...candidate, poly: clipped.back, area: polygonArea(clipped.back) });
      }
    }
    frontSides.push({ ...side, faces: frontFaces });
    backSides.push({ ...side, faces: backFaces });
  }
  frontSides.push({ plane: flipPlane(splitPlane), faces: [] });
  backSides.push({ plane: { ...splitPlane }, faces: [] });
  return [
    { ...brush, sides: frontSides },
    { ...brush, sides: backSides }
  ];
}

function brushIsViable(brush) {
  const planes = brush.sides.map((side) => side.plane);
  let liveSides = 0;
  for (const side of brush.sides) {
    const winding = windingForSide(side.plane, planes);
    if (winding && polygonArea(winding) > 1e-4) liveSides++;
  }
  return liveSides >= 4;
}

function stabilizeBrushGeometry(brush, warnings, context) {
  let removed = 0;
  for (let pass = 0; pass < 3; pass++) {
    const planes = brush.sides.map((side) => side.plane);
    const live = [];
    for (const side of brush.sides) {
      const winding = windingForSide(side.plane, planes);
      if (!winding || !winding.every(finite3) || polygonArea(winding) <= 1e-4) {
        removed++;
        continue;
      }
      side.winding = winding;
      live.push(side);
    }
    brush.sides = live;
    if (live.length === planes.length) break;
  }

  if (brush.sides.length < 4) {
    warnings?.push(`${context}: skipped an empty or incomplete convex brush after clipping.`);
    return null;
  }
  const bounds = brushBounds(brush);
  if (!bounds || bounds.mins.some((value, axis) => !Number.isFinite(value) || bounds.maxs[axis] - value <= 1e-4)) {
    warnings?.push(`${context}: skipped a zero-volume convex brush.`);
    return null;
  }
  if ([...bounds.mins, ...bounds.maxs].some((value) => Math.abs(value) >= BASE_WINDING_EXTENT * 0.9)) {
    warnings?.push(`${context}: skipped an open or implausibly large brush.`);
    return null;
  }
  brush.removedSides = (brush.removedSides || 0) + removed;
  return brush;
}

function splitBrushTextureBoundaries(brush, warnings, context) {
  const output = [];
  const stack = [{ brush, depth: 0 }];

  while (stack.length) {
    const entry = stack.pop();
    const conflict = entry.brush.sides.find(sideNeedsSplitting);
    if (!conflict) {
      output.push(entry.brush);
      continue;
    }
    if (entry.depth >= MAX_SPLIT_DEPTH || output.length + stack.length >= MAX_SPLIT_BRUSHES_PER_LEAF) {
      warnings.push(`${context}: texture-boundary splitting reached its safety limit; the largest surviving face wins.`);
      output.push(entry.brush);
      continue;
    }
    const splitPlane = chooseSplitPlane(conflict);
    if (!splitPlane) {
      warnings.push(`${context}: could not find a stable plane for one texture boundary.`);
      output.push(entry.brush);
      continue;
    }
    const [front, back] = splitBrushByPlane(entry.brush, splitPlane);
    if (!brushIsViable(front) || !brushIsViable(back)) {
      warnings.push(`${context}: rejected a degenerate texture split.`);
      output.push(entry.brush);
      continue;
    }
    stack.push({ brush: back, depth: entry.depth + 1 }, { brush: front, depth: entry.depth + 1 });
  }
  return output;
}

function defaultTextureForContents(format, contents) {
  if (format.family === "q2") {
    if (contents & Q2_CONTENTS.WATER) return "e1u1/water4";
    if (contents & Q2_CONTENTS.SLIME) return "e1u1/sewer1";
    if (contents & Q2_CONTENTS.LAVA) return "e1u1/brlava";
    if (contents & (Q2_CONTENTS.PLAYERCLIP | Q2_CONTENTS.MONSTERCLIP | Q2_CONTENTS.PROJECTILECLIP)) return "e1u1/clip";
    if (contents & Q2_CONTENTS.AREAPORTAL) return "e1u1/trigger";
    return "e1u1/skip";
  }
  if (contents === CONTENTS.WATER) return "*waterskip";
  if (contents === CONTENTS.SLIME) return "*slimeskip";
  if (contents === CONTENTS.LAVA) return "*lavaskip";
  if (contents === CONTENTS.SKY) return "skyskip";
  if (contents === CONTENTS.CLIP) return "clip";
  return "skip";
}

function overrideTextureForContents(format, contents, texture) {
  if (format.family !== "q2") return texture;
  if (contents & Q2_CONTENTS.PLAYERCLIP) return "e1u1/clip_player";
  if (contents & Q2_CONTENTS.MONSTERCLIP) return "e1u1/clip_mon";
  if (contents & Q2_CONTENTS.PROJECTILECLIP) return "e1u1/clip_proj";
  return texture;
}

function decorateBrush(bsp, brush, options, warnings = null, context = "brush") {
  if (!stabilizeBrushGeometry(brush, warnings, context)) return null;
  bsp.geometrySideRepairs = (bsp.geometrySideRepairs || 0) + (brush.removedSides || 0);
  for (const side of brush.sides) {
    let candidate = null;
    for (const possible of side.faces || []) {
      if (!candidate || possible.area > candidate.area) candidate = possible;
    }
    const info = candidate ? bsp.texinfo[candidate.face.texinfo] : null;
    side.texture = info?.texture || defaultTextureForContents(bsp.format, brush.contents);
    side.texture = overrideTextureForContents(bsp.format, brush.contents, side.texture);
    side.valve = options.recoverTextures && info
      ? valveFromTexinfo(info, side.plane.normal)
      : valveFromTexinfo(null, side.plane.normal);
    if (side.valve.repaired) bsp.textureProjectionRepairs = (bsp.textureProjectionRepairs || 0) + 1;
    side.flags = info?.flags || 0;
    side.value = info?.value || 0;
    side.matchedFace = candidate?.face.index;
  }

  // Match ericw-tools' useful hidden-face cleanup: copy the texture from the
  // closest opposite visible side where no compiled face survived.
  for (const side of brush.sides) {
    if (side.matchedFace !== undefined) continue;
    let closest = null;
    let closestDot = -Infinity;
    for (const other of brush.sides) {
      if (other === side || other.matchedFace === undefined) continue;
      const score = dot3(scale3(side.plane.normal, -1), other.plane.normal);
      if (score > closestDot) {
        closestDot = score;
        closest = other;
      }
    }
    if (closest) side.texture = closest.texture;
  }
  return brush;
}

function makeGeometryOnlyBrush(bsp, task, warnings, context) {
  const planes = removeRedundantPlanes(task.planes, warnings, context);
  if (planes.length < 4) return null;
  const brush = {
    source: "clip",
    sourceIndex: task.clipHull ?? -1,
    contents: task.contents,
    sides: planes.map((plane) => ({ plane, faces: [] }))
  };
  return decorateBrush(bsp, brush, { recoverTextures: false }, warnings, context);
}

function recoverQ1TreeModel(bsp, model, modelNumber, options, warnings) {
  const tasks = options.hullNumber > 0
    ? collectQ1ClipTasks(bsp, model, modelNumber, options.hullNumber)
    : collectQ1NodeTasks(bsp, model, modelNumber, warnings);
  const result = [];

  for (let i = 0; i < tasks.length; i++) {
    const context = options.hullNumber > 0
      ? `model ${modelNumber}, hull ${options.hullNumber}, volume ${i}`
      : `model ${modelNumber}, leaf ${tasks[i].leafIndex}`;
    if (options.hullNumber > 0) {
      const brush = makeGeometryOnlyBrush(bsp, tasks[i], warnings, context);
      if (brush) result.push(brush);
      continue;
    }
    const initial = initialLeafBrush(bsp, tasks[i], warnings, context);
    if (!initial) continue;
    const split = options.splitTextures ? splitBrushTextureBoundaries(initial, warnings, context) : [initial];
    for (const brush of split) {
      const decorated = decorateBrush(bsp, brush, options, warnings, context);
      if (decorated) result.push(decorated);
    }
  }
  return result;
}

function recoverBspxModel(bsp, model, modelNumber, source, options, warnings) {
  const faceIndex = indexModelFaces(bsp, model);
  const result = [];
  for (let i = 0; i < source.brushes.length; i++) {
    const context = `model ${modelNumber}, BSPX brush ${i}`;
    const initial = initialBspxBrush(bsp, source.brushes[i], faceIndex, warnings, context);
    if (!initial) continue;
    const split = options.splitTextures ? splitBrushTextureBoundaries(initial, warnings, context) : [initial];
    for (const brush of split) {
      const decorated = decorateBrush(bsp, brush, options, warnings, context);
      if (decorated) result.push(decorated);
    }
  }
  return result;
}

function collectQ2BrushIndices(bsp, model, modelNumber) {
  const headnode = model.headnodes[0];
  const indices = new Set();
  const visitLeaf = (leafIndex) => {
    const leaf = bsp.leaves[leafIndex];
    if (!leaf) throw new BspError(`Model ${modelNumber} references invalid leaf ${leafIndex}.`);
    if (leaf.firstLeafBrush < 0 || leaf.leafBrushCount < 0 || leaf.firstLeafBrush + leaf.leafBrushCount > bsp.leafbrushes.length) {
      throw new BspError(`Leaf ${leafIndex} references brushes outside the leafbrush lump.`);
    }
    for (let i = 0; i < leaf.leafBrushCount; i++) {
      const brushIndex = bsp.leafbrushes[leaf.firstLeafBrush + i];
      if (brushIndex >= bsp.brushes.length) throw new BspError(`Leaf ${leafIndex} references invalid brush ${brushIndex}.`);
      indices.add(brushIndex);
    }
  };

  if (headnode < 0) {
    visitLeaf(-headnode - 1);
    return indices;
  }
  if (headnode >= bsp.nodes.length) throw new BspError(`Model ${modelNumber} references invalid node ${headnode}.`);

  const stack = [{ index: headnode, depth: 0 }];
  const visited = new Set();
  while (stack.length) {
    const entry = stack.pop();
    if (visited.has(entry.index)) {
      throw new BspError(`Model ${modelNumber} Q2 traversal revisited node ${entry.index} (cycle or shared subtree).`);
    }
    visited.add(entry.index);
    if (entry.depth > MAX_RECURSION) throw new BspError(`Model ${modelNumber} Q2 BSP tree is too deep or cyclic.`);
    const node = bsp.nodes[entry.index];
    if (!node) throw new BspError(`Model ${modelNumber} traversal reached invalid node ${entry.index}.`);
    for (const child of node.children) {
      if (child < 0) visitLeaf(-child - 1);
      else stack.push({ index: child, depth: entry.depth + 1 });
    }
  }
  return indices;
}

function q2BrushToCompiled(bsp, source, options, warnings, context) {
  const rawSides = [];
  let invalidGeometry = false;
  for (let i = 0; i < source.sideCount; i++) {
    const brushside = bsp.brushsides[source.firstSide + i];
    const sourcePlane = bsp.planes[brushside.plane];
    const plane = sourcePlane ? normalizedPlane(sourcePlane) : null;
    if (!plane) {
      warnings.push(`${context}: invalid or degenerate brushside plane prevents exact recovery; the brush was skipped.`);
      invalidGeometry = true;
      continue;
    }
    rawSides.push({ plane, brushside });
  }
  if (invalidGeometry) return null;

  // Q2 compilers can leave redundant planes. Process from last to first so a
  // later duplicate wins, mirroring ericw-tools' brush path.
  const sides = [];
  for (let i = rawSides.length - 1; i >= 0; i--) {
    const candidate = rawSides[i];
    if (sides.some((side) => planesEquivalent(side.plane, candidate.plane, 0.0001, 0.01))) continue;
    sides.push(candidate);
  }
  sides.reverse();
  if (sides.length < 4) {
    warnings.push(`${context}: skipped a brush with fewer than four useful sides.`);
    return null;
  }
  const planes = sides.map((side) => side.plane);
  const compiled = {
    source: "q2",
    sourceIndex: source.sourceIndex,
    contents: source.contents,
    sides: sides.map(({ plane, brushside }) => {
      const info = brushside.texinfo >= 0 ? bsp.texinfo[brushside.texinfo] : null;
      const hint = source.contents === 0;
      const hiddenContents = source.contents & (
        Q2_CONTENTS.AREAPORTAL
        | Q2_CONTENTS.PLAYERCLIP
        | Q2_CONTENTS.MONSTERCLIP
        | Q2_CONTENTS.PROJECTILECLIP
      );
      return {
        plane,
        faces: [],
        winding: windingForSide(plane, planes),
        texture: hint
          ? "e1u1/hint"
          : overrideTextureForContents(bsp.format, source.contents, info?.texture || defaultTextureForContents(bsp.format, source.contents)),
        valve: !hint && options.recoverTextures && info
          ? valveFromTexinfo(info, plane.normal)
          : valveFromTexinfo(null, plane.normal),
        flags: hint ? Q2_SURF.HINT : (hiddenContents || !info ? Q2_SURF.NODRAW : info.flags),
        value: hint ? 0 : (info?.value || 0),
        directTexinfo: brushside.texinfo
      };
    })
  };
  if (!stabilizeBrushGeometry(compiled, warnings, context)) return null;
  bsp.geometrySideRepairs = (bsp.geometrySideRepairs || 0) + (compiled.removedSides || 0);
  for (const side of compiled.sides) {
    if (side.valve.repaired) bsp.textureProjectionRepairs = (bsp.textureProjectionRepairs || 0) + 1;
  }
  if (!brushIsViable(compiled)) {
    warnings.push(`${context}: brush is open or fully clipped; emitted from its declared planes for forensic recovery.`);
  }
  return compiled;
}

function recoverQ2Model(bsp, model, modelNumber, options, warnings, includeAreaPortals = false) {
  const indices = collectQ2BrushIndices(bsp, model, modelNumber);
  const result = [];
  for (const index of indices) {
    const source = bsp.brushes[index];
    const areaPortal = Boolean(source.contents & Q2_CONTENTS.AREAPORTAL);
    if (areaPortal !== includeAreaPortals && areaPortal) continue;
    const brush = q2BrushToCompiled(bsp, source, options, warnings, `model ${modelNumber}, Q2 brush ${index}`);
    if (brush) result.push(brush);
  }
  return result;
}

function parseOrigin(entity) {
  const value = entityGet(entity, "origin");
  if (!value) return null;
  const numbers = value.trim().split(/\s+/).slice(0, 3).map(Number);
  if (numbers.length !== 3 || !numbers.every(Number.isFinite) || numbers.every((number) => number === 0)) return null;
  return numbers;
}

function findQ2AreaPortalBrush(bsp, entity) {
  const style = Number.parseInt(entityGet(entity, "style") || "", 10);
  if (!Number.isSafeInteger(style) || style < 1) return null;
  let remaining = style;
  for (const brush of bsp.brushes) {
    if (!(brush.contents & Q2_CONTENTS.AREAPORTAL)) continue;
    if (--remaining === 0) return brush;
  }
  return null;
}

function originBrush(bsp, offset) {
  const planes = boundsPlanes([-8, -8, -8], [8, 8, 8]);
  return {
    source: "origin",
    sourceIndex: -1,
    contents: bsp.format.family === "q2" ? 0x01000000 : CONTENTS.SOLID,
    offset,
    sides: planes.map((plane) => ({
      plane,
      faces: [],
      winding: windingForSide(plane, planes),
      texture: bsp.format.family === "q2" ? "e1u1/origin" : "origin",
      valve: valveFromTexinfo(null, plane.normal),
      flags: bsp.format.family === "q2" ? 0x80 : 0,
      value: 0
    }))
  };
}

function recoverEntityBrushes(bsp, entity, entityIndex, options, warnings) {
  const classname = entityGet(entity, "classname") || (entityIndex === 0 ? "worldspawn" : "");
  if (bsp.format.family === "q2" && classname === "func_group") return { brushes: [], modelNumber: -1, offset: null, skipEntity: true };

  const modelNumber = modelNumberForEntity(entity, entityIndex);
  let brushes = [];
  let offset = modelNumber > 0 ? parseOrigin(entity) : null;
  let areaPortal = false;

  if (bsp.format.family === "q2" && classname === "func_areaportal" && modelNumber < 0) {
    const source = findQ2AreaPortalBrush(bsp, entity);
    if (source) {
      const compiled = q2BrushToCompiled(bsp, source, options, warnings, `func_areaportal style ${entityGet(entity, "style")}`);
      if (compiled) brushes.push(compiled);
      areaPortal = true;
    } else {
      warnings.push(`func_areaportal entity ${entityIndex} did not match a Q2 areaportal brush.`);
    }
  } else if (modelNumber >= 0) {
    const model = bsp.models[modelNumber];
    if (!model) {
      warnings.push(`Entity ${entityIndex} references missing model *${modelNumber}; entity keys were kept.`);
      return { brushes, modelNumber, offset, areaPortal };
    }

    if (bsp.format.family === "q2") {
      brushes = recoverQ2Model(bsp, model, modelNumber, options, warnings);
    } else {
      const bspxModel = bsp.bspx.brushList?.get(modelNumber);
      const wantsBspx = options.geometrySource === "bspx"
        || (options.hullNumber === 0 && options.geometrySource === "auto" && bspxModel);
      if (wantsBspx && bspxModel) {
        brushes = recoverBspxModel(bsp, model, modelNumber, bspxModel, options, warnings);
      } else if (options.geometrySource === "bspx") {
        warnings.push(`Model ${modelNumber} has no BSPX BRUSHLIST entry; no geometry was emitted for BSPX-only mode.`);
      } else {
        brushes = recoverQ1TreeModel(bsp, model, modelNumber, options, warnings);
      }
    }
  }

  if (modelNumber > 0 && classname.startsWith("trigger_")) {
    for (const brush of brushes) {
      for (const side of brush.sides) {
        side.texture = bsp.format.family === "q2" ? "e1u1/trigger" : "trigger";
        if (bsp.format.family === "q2") side.flags = 0x80;
      }
    }
  }
  if (offset && brushes.length) {
    for (const brush of brushes) brush.offset = offset;
    brushes.push(originBrush(bsp, offset));
  }
  return { brushes, modelNumber, offset, areaPortal, skipEntity: false };
}

// ---------------------------------------------------------------------------
// MAP writing, preview extraction, and public orchestration
// ---------------------------------------------------------------------------

function cleanNumber(value, precision) {
  if (!Number.isFinite(value)) return "0";
  const threshold = 0.5 * 10 ** -precision;
  if (Math.abs(value) < threshold) value = 0;
  const nearest = Math.round(value);
  if (Math.abs(value - nearest) < threshold) return String(nearest);
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function formatVec(vector, precision) {
  return vector.map((value) => cleanNumber(value, precision)).join(" ");
}

function projectToPlane(point, plane) {
  return sub3(point, scale3(plane.normal, distanceToPlane(point, plane)));
}

function stableWindingPoints(winding, plane) {
  if (!winding || winding.length < 3 || polygonArea(winding) <= 1) return null;
  const points = removeDuplicatePoints(winding.map((point) => projectToPlane(point, plane)));
  if (points.length < 3) return null;

  // Pick a wide baseline and the vertex furthest from it. This is more stable
  // under MAP decimal rounding than blindly taking a tiny/collinear corner.
  let first = 0;
  let second = 1;
  let widest = 0;
  if (points.length <= 64) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = length3(sub3(points[j], points[i]));
        if (distance > widest) {
          widest = distance;
          first = i;
          second = j;
        }
      }
    }
  } else {
    for (let j = 1; j < points.length; j++) {
      const distance = length3(sub3(points[j], points[0]));
      if (distance > widest) {
        widest = distance;
        second = j;
      }
    }
  }

  let third = -1;
  let bestArea = 0;
  const baseline = sub3(points[second], points[first]);
  for (let i = 0; i < points.length; i++) {
    if (i === first || i === second) continue;
    const area = length3(cross3(baseline, sub3(points[i], points[first])));
    if (area > bestArea) {
      bestArea = area;
      third = i;
    }
  }
  if (third < 0 || bestArea <= 1e-6) return null;

  const result = [points[first], points[second], points[third]];
  const mapNormal = normalize3(cross3(sub3(result[0], result[1]), sub3(result[2], result[1])));
  if (dot3(mapNormal, plane.normal) < 0) [result[1], result[2]] = [result[2], result[1]];
  return result;
}

function mapPlanePoints(side, offset = null) {
  const plane = side.plane;
  const windingPoints = stableWindingPoints(side.winding, plane);
  if (windingPoints) {
    return offset ? windingPoints.map((point) => add3(point, offset)) : windingPoints;
  }
  const center = scale3(plane.normal, plane.dist);
  const { tangent, bitangent } = tangentBasis(plane.normal);
  const size = 64;
  const points = [
    center,
    add3(center, scale3(bitangent, size)),
    add3(center, scale3(tangent, size))
  ];
  return offset ? points.map((point) => add3(point, offset)) : points;
}

function safeTextureName(texture) {
  return String(texture || "__missing")
    .replace(/[\x00-\x20\x7f-\x9f]+/g, "_")
    .replace(/[(){}\[\]"]/g, "_");
}

function q2Metadata(side, contents) {
  const nativeContents = contents | 0;
  if (!nativeContents && !side.flags && !side.value) return "";
  return ` ${nativeContents} ${side.flags | 0} ${side.value | 0}`;
}

function writeBrush(bsp, brush, options, lines, brushNumber) {
  if (options.writeComments) {
    const label = brush.source === "bspx"
      ? `BSPX brush ${brush.sourceIndex}`
      : brush.source === "tree"
        ? `leaf ${brush.sourceIndex}`
        : brush.source === "q2"
          ? `Q2 brush ${brush.sourceIndex}`
          : brush.source === "clip"
            ? `collision hull ${brush.sourceIndex}`
            : "origin helper";
    lines.push(`// brush ${brushNumber}: recovered from ${label}`);
  }
  lines.push("{");
  for (const side of brush.sides) {
    const points = mapPlanePoints(side, brush.offset);
    const valve = {
      axes: side.valve.axes.map((axis) => [...axis]),
      shifts: [...side.valve.shifts],
      scales: [...side.valve.scales]
    };
    if (brush.offset) {
      valve.shifts[0] -= dot3(brush.offset, valve.axes[0]);
      valve.shifts[1] -= dot3(brush.offset, valve.axes[1]);
    }
    const line = [
      `( ${formatVec(points[0], options.precision)} )`,
      `( ${formatVec(points[1], options.precision)} )`,
      `( ${formatVec(points[2], options.precision)} )`,
      safeTextureName(side.texture),
      `[ ${formatVec(valve.axes[0], options.precision)} ${cleanNumber(valve.shifts[0], options.precision)} ]`,
      `[ ${formatVec(valve.axes[1], options.precision)} ${cleanNumber(valve.shifts[1], options.precision)} ]`,
      "0",
      cleanNumber(valve.scales[0], options.precision),
      cleanNumber(valve.scales[1], options.precision)
    ].join(" ");
    lines.push(line + (bsp.format.family === "q2" ? q2Metadata(side, brush.contents) : ""));
  }
  lines.push("}");
}

function escapeMapString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "");
}

function writeEntity(bsp, entity, entityIndex, recovered, options, lines, counters) {
  if (recovered.skipEntity) return;
  lines.push("{");
  const skipModelKey = recovered.modelNumber >= 0;
  for (const [key, value] of entity.pairs) {
    if (skipModelKey && key === "model" && value.startsWith("*")) continue;
    if (recovered.offset && key === "origin") continue;
    if (recovered.areaPortal && key === "style") continue;
    // The extracted WAD replaces any original wad reference on worldspawn.
    if (entityIndex === 0 && options.wadFileName && key === "wad") continue;
    lines.push(`"${escapeMapString(key)}" "${escapeMapString(value)}"`);
  }
  if (entityIndex === 0 && !entityGet(entity, "classname")) lines.push("\"classname\" \"worldspawn\"");
  if (entityIndex === 0 && options.wadFileName) lines.push(`"wad" "${escapeMapString(options.wadFileName)}"`);

  for (const brush of recovered.brushes) {
    if (counters.brushes >= MAX_OUTPUT_BRUSHES) {
      throw new BspError(`MAP output exceeded the ${MAX_OUTPUT_BRUSHES.toLocaleString()}-brush browser safety limit.`);
    }
    if (counters.sides + brush.sides.length > MAX_OUTPUT_SIDES) {
      throw new BspError(`MAP output exceeded the ${MAX_OUTPUT_SIDES.toLocaleString()}-side browser safety limit.`);
    }
    writeBrush(bsp, brush, options, lines, counters.brushes++);
    counters.sides += brush.sides.length;
  }
  lines.push("}");
}

class MapLines {
  constructor() {
    this.values = [];
    this.characters = 0;
  }

  push(...values) {
    for (const value of values) {
      const line = String(value);
      this.characters += line.length + 1;
      if (this.characters > MAX_MAP_CHARACTERS) {
        throw new BspError("MAP output exceeded the 256-million-character browser safety limit.");
      }
      this.values.push(line);
    }
    return this.values.length;
  }

  join(separator) {
    return this.values.join(separator);
  }
}

function addPreviewBrush(brush, preview, seen) {
  const offset = brush.offset || [0, 0, 0];
  for (const side of brush.sides) {
    if (preview.segments.length >= PREVIEW_SEGMENT_LIMIT) {
      preview.truncated = true;
      return;
    }
    const winding = side.winding;
    if (!winding || winding.length < 2) continue;
    for (let i = 0; i < winding.length; i++) {
      const a3 = add3(winding[i], offset);
      const b3 = add3(winding[(i + 1) % winding.length], offset);
      const a = [a3[0], a3[1]];
      const b = [b3[0], b3[1]];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01) continue;
      const first = `${Math.round(a[0] * 8)},${Math.round(a[1] * 8)}`;
      const second = `${Math.round(b[0] * 8)},${Math.round(b[1] * 8)}`;
      const key = first < second ? `${first}|${second}` : `${second}|${first}`;
      if (seen.has(key)) continue;
      seen.add(key);
      preview.segments.push([a[0], a[1], b[0], b[1], brush.source === "bspx" || brush.source === "q2" ? 1 : 0]);
      preview.mins[0] = Math.min(preview.mins[0], a[0], b[0]);
      preview.mins[1] = Math.min(preview.mins[1], a[1], b[1]);
      preview.maxs[0] = Math.max(preview.maxs[0], a[0], b[0]);
      preview.maxs[1] = Math.max(preview.maxs[1], a[1], b[1]);
    }
  }
}

function normalizeOptions(options) {
  const geometrySource = ["auto", "bspx", "tree"].includes(options.geometrySource) ? options.geometrySource : "auto";
  const precision = [3, 5, 8].includes(Number(options.precision)) ? Number(options.precision) : 8;
  const hullNumber = Math.max(0, Math.min(7, Number.parseInt(options.hullNumber, 10) || 0));
  return {
    geometrySource,
    precision,
    hullNumber,
    recoverTextures: options.recoverTextures !== false,
    splitTextures: options.splitTextures !== false,
    extractTextures: options.extractTextures !== false,
    writeComments: options.writeComments !== false,
    fileName: options.fileName || "input.bsp",
    onProgress: typeof options.onProgress === "function" ? options.onProgress : () => {}
  };
}

function basenameWithoutExtension(fileName) {
  const base = String(fileName).split(/[\\/]/).pop() || "recovered";
  let stem = base
    .replace(/\.[^.]+$/, "")
    .replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 180);
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = `_${stem}`;
  return stem || "recovered";
}

function safeCommentText(value) {
  return String(value).replace(/[\x00-\x1f\x7f-\x9f]+/g, " ").trim();
}

function trenchBroomHeader(format) {
  if (format.family === "q2") return { game: "Quake 2", mapFormat: "Quake2 (Valve)" };
  if (format.halfLife) return { game: "Half-Life", mapFormat: "Valve" };
  if (format.hexen2) return { game: "Hexen 2", mapFormat: "Valve" };
  return { game: "Quake", mapFormat: "Valve" };
}

export function decompileBsp(buffer, rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  options.onProgress(0.04, "Validating BSP header and lumps…");
  const bsp = parseBsp(buffer);
  const warnings = [...bsp.warnings];

  if (bsp.format.family === "q2" && options.hullNumber > 0) {
    warnings.push("Quake II stores exact brushes instead of separate Quake 1 clipnode hulls; collision hull selection was ignored.");
    options.hullNumber = 0;
  }
  if (bsp.format.family === "q2" && options.geometrySource !== "auto") {
    warnings.push("Geometry-source selection applies to Quake 1-family BSPs; Quake II's exact brush lump was used.");
  }
  if (options.hullNumber > 0 && options.geometrySource === "bspx") {
    warnings.push("BSPX BRUSHLIST contains unexpanded source brushes; the selected compiled collision hull was ignored in BSPX-only mode.");
  }

  const baseName = basenameWithoutExtension(options.fileName);
  let wad = null;
  if (options.extractTextures) {
    wad = extractQ1Wad(bsp);
    if (wad?.buffer) {
      wad.fileName = `${baseName}.decompile.wad`;
      options.wadFileName = wad.fileName;
    }
    if (wad?.skippedFormat) {
      warnings.push("Quake 64 remaster textures use a nonstandard miptex header and palette; no WAD was extracted.");
    } else if (wad && !wad.buffer && wad.external > 0 && wad.embedded === 0) {
      warnings.push(`All ${wad.external} texture(s) reference external WADs with no embedded pixel data (e.g. a -notex or Half-Life external build); no WAD was extracted.`);
    } else if (wad?.buffer && wad.external > 0) {
      warnings.push(`${wad.external} texture(s) had no embedded pixel data and were omitted from the extracted WAD.`);
    }
  }

  options.onProgress(0.16, `Parsed ${bsp.format.name}; recovering entities…`);
  const lines = new MapLines();
  const mapHeader = trenchBroomHeader(bsp.format);
  // TrenchBroom reads these exact first two lines to select a game and parser
  // without prompting or guessing.
  lines.push(`// Game: ${mapHeader.game}`);
  lines.push(`// Format: ${mapHeader.mapFormat}`);
  lines.push("");
  lines.push("// BSP Forge — q1tools browser BSP decompiler");
  lines.push(`// Source: ${safeCommentText(options.fileName)}`);
  lines.push(`// Container: ${bsp.format.name}`);
  lines.push(`// Geometry: ${options.geometrySource}${options.hullNumber ? `, hull ${options.hullNumber}` : ""}`);
  lines.push("// Output: Valve 220 MAP");
  lines.push("//");
  lines.push("// A BSP cannot preserve original CSG order or brush boundaries erased by compilation.");
  lines.push("// Inspect and rebuild this recovery before shipping a derived map.");
  lines.push("");

  const counters = { brushes: 0, sides: 0 };
  const recoveredEntities = [];
  const preview = {
    mins: [Infinity, Infinity],
    maxs: [-Infinity, -Infinity],
    segments: [],
    truncated: false
  };
  const previewSeen = new Set();
  const entityCount = bsp.entities.length;

  for (let i = 0; i < entityCount; i++) {
    const recovered = recoverEntityBrushes(bsp, bsp.entities[i], i, options, warnings);
    recoveredEntities.push(recovered);
    writeEntity(bsp, bsp.entities[i], i, recovered, options, lines, counters);
    for (const brush of recovered.brushes) addPreviewBrush(brush, preview, previewSeen);
    if (i % 8 === 0 || i === entityCount - 1) {
      options.onProgress(0.18 + 0.7 * ((i + 1) / entityCount), `Recovering entity ${i + 1} of ${entityCount}…`);
    }
  }

  if (bsp.textureProjectionRepairs) {
    warnings.push(`Repaired ${bsp.textureProjectionRepairs.toLocaleString()} invalid compiled texture projection(s) with stable face-aligned axes.`);
  }
  if (preview.truncated) warnings.push(`Preview was capped at ${PREVIEW_SEGMENT_LIMIT.toLocaleString()} unique segments; MAP output is complete.`);
  if (!preview.segments.length) {
    preview.mins = [0, 0];
    preview.maxs = [1, 1];
  }

  const mapText = `${lines.join("\n")}\n`;
  const bspxBrushCount = bsp.bspx.brushList
    ? [...bsp.bspx.brushList.values()].reduce((sum, model) => sum + model.brushes.length, 0)
    : 0;
  const sourceCounts = {};
  for (const entry of recoveredEntities) {
    for (const brush of entry.brushes) sourceCounts[brush.source] = (sourceCounts[brush.source] || 0) + 1;
  }
  const exactBrushes = (sourceCounts.bspx || 0) + (sourceCounts.q2 || 0);
  let geometryPath;
  if (sourceCounts.q2) geometryPath = "Quake II brush lump";
  else if (sourceCounts.bspx && sourceCounts.tree) geometryPath = "BSPX BRUSHLIST + BSP tree fallback";
  else if (sourceCounts.bspx) geometryPath = "BSPX BRUSHLIST";
  else if (sourceCounts.clip) geometryPath = `clipnode hull ${options.hullNumber}`;
  else if (sourceCounts.tree) geometryPath = "BSP leaf reconstruction";
  else geometryPath = "No brush geometry recovered";
  options.onProgress(1, "MAP recovery complete.");

  return {
    fileName: `${baseName}.decompile.map`,
    mapText,
    wad: wad?.buffer
      ? { fileName: wad.fileName, buffer: wad.buffer, recovered: wad.recovered, external: wad.external }
      : null,
    preview,
    warnings: [...new Set(warnings)],
    diagnostics: {
      format: bsp.format.name,
      formatId: bsp.format.id,
      fileBytes: buffer.byteLength,
      entities: bsp.entities.length,
      models: bsp.models.length,
      planes: bsp.planes.length,
      nodes: bsp.nodes.length,
      leaves: bsp.leaves.length,
      faces: bsp.faces.length,
      textures: bsp.format.family === "q2" ? bsp.texinfo.length : bsp.textures.filter(Boolean).length,
      texturesEmbedded: wad ? wad.embedded : 0,
      texturesExternal: wad ? wad.external : 0,
      wadTextures: wad?.buffer ? wad.recovered : 0,
      wadBytes: wad?.buffer ? wad.buffer.byteLength : 0,
      bspxLumps: Object.keys(bsp.bspx.entries),
      bspxBrushes: bspxBrushCount,
      outputBrushes: counters.brushes,
      outputSides: counters.sides,
      exactBrushes,
      textureProjectionRepairs: bsp.textureProjectionRepairs || 0,
      geometrySideRepairs: bsp.geometrySideRepairs || 0,
      sourceCounts,
      geometryPath,
      mapBytes: new TextEncoder().encode(mapText).byteLength
    }
  };
}
