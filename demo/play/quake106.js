/*
 * Quake 1.06 shareware pak0.pak extractor.
 *
 * The LH5 segment decoder is a JavaScript port of the NexQuake quake106
 * extractor, whose LZH logic is derived from github.com/koron-go/lha.
 *
 * Copyright (c) 2018 MURAOKA Taro <koron.kaoriya@gmail.com>
 * Copyright (c) 2026 Brian St. Marie
 * Copyright (c) 2026 q1tools contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.Quake106Shareware = factory(root);
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var DEFAULT_URL = "https://raw.githubusercontent.com/Jason2Brownlee/QuakeOfficialArchive/main/bin/quake106.zip";
  var ZIP_SHA256 = "ec6c9d34b1ae0252ac0066045b6611a7919c2a0d78a3a66d9387a8f597553239";
  var RESOURCE1_SHA256 = "c192c9c71bee41750dd7d14c99378766d61e077977b9d13d1a457b8d9eabe34a";
  var PAK0_SHA256 = "35a9c55e5e5a284a159ad2a62e0e8def23d829561fe2f54eb402dbc0a9a946af";

  var PAK0_SEGMENT = {
    offset: 29041,
    compressedLength: 8612632,
    outputLength: 18689235
  };

  function toUint8Array(input) {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input && input.buffer instanceof ArrayBuffer) {
      return new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength);
    }
    return new Uint8Array(input);
  }

  function arrayBufferFromBytes(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  function readU16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readU32(bytes, offset) {
    return (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>> 0;
  }

  function decodeAscii(bytes, offset, length) {
    var text = "";
    for (var i = 0; i < length; i++) {
      text += String.fromCharCode(bytes[offset + i]);
    }
    return text;
  }

  function baseName(path) {
    var clean = String(path || "").replace(/\\/g, "/");
    var parts = clean.split("/");
    return parts[parts.length - 1] || clean;
  }

  async function sha256Hex(bytes) {
    bytes = toUint8Array(bytes);

    if (typeof require === "function") {
      try {
        var nodeCrypto = require("node:crypto");
        return nodeCrypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
      } catch (_error) {
        // Browser path below.
      }
    }

    if (!root.crypto || !root.crypto.subtle) {
      throw new Error("SHA-256 support is unavailable.");
    }

    var digest = await root.crypto.subtle.digest("SHA-256", arrayBufferFromBytes(bytes));
    return Array.from(new Uint8Array(digest)).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  async function inflateRaw(bytes) {
    bytes = toUint8Array(bytes);

    if (typeof require === "function") {
      try {
        var zlib = require("node:zlib");
        return Uint8Array.from(zlib.inflateRawSync(Buffer.from(bytes)));
      } catch (_error) {
        // Browser path below.
      }
    }

    if (root.pako && typeof root.pako.inflateRaw === "function") {
      return toUint8Array(root.pako.inflateRaw(bytes));
    }

    if (typeof root.DecompressionStream === "function") {
      try {
        var stream = new Blob([arrayBufferFromBytes(bytes)]).stream()
          .pipeThrough(new root.DecompressionStream("deflate-raw"));
        return new Uint8Array(await new Response(stream).arrayBuffer());
      } catch (_error) {
        // Fall through to the explicit error below.
      }
    }

    throw new Error("ZIP deflate support is unavailable.");
  }

  async function fetchBytes(url, onStatus) {
    if (onStatus) {
      onStatus("Downloading quake106.zip...");
    }

    var response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Could not download quake106.zip: HTTP " + response.status);
    }

    var total = Number(response.headers.get("content-length")) || 0;
    if (!response.body || !response.body.getReader) {
      return new Uint8Array(await response.arrayBuffer());
    }

    var reader = response.body.getReader();
    var chunks = [];
    var loaded = 0;

    while (true) {
      var result = await reader.read();
      if (result.done) {
        break;
      }
      chunks.push(result.value);
      loaded += result.value.byteLength;
      if (onStatus && total) {
        onStatus("Downloading quake106.zip... (" + loaded + "/" + total + ")");
      }
    }

    var output = new Uint8Array(loaded);
    var offset = 0;
    chunks.forEach(function (chunk) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    });
    return output;
  }

  async function extractZipEntry(zipBytes, entryName) {
    zipBytes = toUint8Array(zipBytes);
    var minEocd = Math.max(0, zipBytes.length - 65557);
    var eocd = -1;

    for (var pos = zipBytes.length - 22; pos >= minEocd; pos--) {
      if (readU32(zipBytes, pos) === 0x06054b50) {
        eocd = pos;
        break;
      }
    }
    if (eocd < 0) {
      throw new Error("Invalid ZIP: end of central directory not found.");
    }

    var centralCount = readU16(zipBytes, eocd + 10);
    var centralOffset = readU32(zipBytes, eocd + 16);
    var cursor = centralOffset;
    var wanted = String(entryName || "").toLowerCase();

    for (var entryIndex = 0; entryIndex < centralCount; entryIndex++) {
      if (readU32(zipBytes, cursor) !== 0x02014b50) {
        throw new Error("Invalid ZIP: central directory is corrupt.");
      }

      var method = readU16(zipBytes, cursor + 10);
      var compressedSize = readU32(zipBytes, cursor + 20);
      var uncompressedSize = readU32(zipBytes, cursor + 24);
      var fileNameLength = readU16(zipBytes, cursor + 28);
      var extraLength = readU16(zipBytes, cursor + 30);
      var commentLength = readU16(zipBytes, cursor + 32);
      var localOffset = readU32(zipBytes, cursor + 42);
      var name = decodeAscii(zipBytes, cursor + 46, fileNameLength);

      if (baseName(name).toLowerCase() === wanted) {
        if (readU32(zipBytes, localOffset) !== 0x04034b50) {
          throw new Error("Invalid ZIP: local file header is corrupt.");
        }
        var localNameLength = readU16(zipBytes, localOffset + 26);
        var localExtraLength = readU16(zipBytes, localOffset + 28);
        var dataOffset = localOffset + 30 + localNameLength + localExtraLength;
        var compressed = zipBytes.subarray(dataOffset, dataOffset + compressedSize);
        var output;

        if (method === 0) {
          output = compressed;
        } else if (method === 8) {
          output = await inflateRaw(compressed);
        } else {
          throw new Error("Unsupported ZIP compression method: " + method);
        }

        if (output.byteLength !== uncompressedSize) {
          throw new Error("Invalid ZIP: " + entryName + " size mismatch.");
        }
        return output;
      }

      cursor += 46 + fileNameLength + extraLength + commentLength;
    }

    throw new Error(entryName + " was not found in quake106.zip.");
  }

  function BitReader(bytes) {
    this.bytes = bytes;
    this.index = 0;
    this.buffer = 0;
    this.count = 0;
  }

  BitReader.prototype.bits = function (width) {
    while (this.count < width) {
      var byte = this.index < this.bytes.length ? this.bytes[this.index++] : 0;
      this.buffer = (this.buffer << 8) | byte;
      this.count += 8;
    }

    var shift = this.count - width;
    var value = (this.buffer >>> shift) & ((1 << width) - 1);
    this.count -= width;
    this.buffer = this.count ? (this.buffer & ((1 << this.count) - 1)) : 0;
    return value;
  };

  BitReader.prototype.trues = function (max) {
    for (var i = 0; i < max; i++) {
      if (this.bits(1) === 0) {
        return i;
      }
    }
    return max;
  };

  function makeHuffman(lengths) {
    var huffman = {
      one: false,
      value: 0,
      max: 16,
      count: new Uint16Array(17),
      first: new Uint16Array(17),
      start: new Uint16Array(17),
      symbols: null
    };

    lengths.forEach(function (length) {
      if (length !== 0) {
        huffman.count[length]++;
      }
    });

    var code = 0;
    for (var i = 1; i <= huffman.max; i++) {
      code = (code + huffman.count[i - 1]) << 1;
      huffman.first[i] = code;
      huffman.start[i] = huffman.start[i - 1] + huffman.count[i - 1];
    }

    var total = 0;
    for (var j = 1; j <= huffman.max; j++) {
      total += huffman.count[j];
    }

    huffman.symbols = new Uint16Array(total);
    var next = Array.from(huffman.start);
    lengths.forEach(function (length, index) {
      if (length !== 0) {
        huffman.symbols[next[length]] = index;
        next[length]++;
      }
    });

    return huffman;
  }

  function decodeHuffman(huffman, reader) {
    if (huffman.one) {
      return huffman.value;
    }

    var code = 0;
    for (var length = 1; length <= huffman.max; length++) {
      code = (code << 1) | reader.bits(1);
      if (code < huffman.first[length]) {
        continue;
      }

      var delta = code - huffman.first[length];
      if (delta < huffman.count[length]) {
        return huffman.symbols[huffman.start[length] + delta];
      }
    }
    return 0;
  }

  function readPTree(reader, bits, special, count) {
    var used = reader.bits(bits);
    if (used === 0) {
      return { one: true, value: reader.bits(bits) };
    }
    if (used > count) {
      used = count;
    }

    var lengths = new Uint8Array(count);
    for (var i = 0; i < used;) {
      var code = reader.bits(3);
      if (code === 7) {
        code += reader.trues(13);
      }
      lengths[i] = code;
      i++;

      if (i === special) {
        var zeroes = reader.bits(2);
        while (zeroes > 0 && i < used) {
          lengths[i] = 0;
          i++;
          zeroes--;
        }
      }
    }

    return makeHuffman(Array.from(lengths));
  }

  function readCTree(reader, bits, tempTree, count) {
    var used = reader.bits(bits);
    if (used === 0) {
      return { one: true, value: reader.bits(bits) };
    }
    if (used > count) {
      used = count;
    }

    var lengths = new Uint8Array(count);
    for (var i = 0; i < used;) {
      var code = decodeHuffman(tempTree, reader);
      if (code > 2) {
        lengths[i] = code - 2;
        i++;
        continue;
      }

      var zeroes = 1;
      if (code === 1) {
        zeroes = reader.bits(4) + 3;
      } else if (code === 2) {
        zeroes = reader.bits(bits) + 20;
      }

      while (zeroes > 0 && i < count) {
        lengths[i] = 0;
        i++;
        zeroes--;
      }
    }

    return makeHuffman(Array.from(lengths));
  }

  function decodeLH5Segment(resource, segment) {
    var start = segment.offset;
    var end = segment.offset + segment.compressedLength;
    if (start < 0 || segment.compressedLength < 0 || end > resource.length) {
      throw new Error("resource.1 segment bounds are invalid.");
    }

    var windowSize = 1 << 13;
    var output = new Uint8Array(windowSize + segment.outputLength);
    output.fill(32, 0, windowSize);

    var reader = new BitReader(resource.subarray(start, end));
    var position = windowSize;
    var blockRemaining = 0;
    var charTree = null;
    var positionTree = null;

    while (position < output.length) {
      if (blockRemaining === 0) {
        blockRemaining = reader.bits(16);
        var tempTree = readPTree(reader, 5, 3, 19);
        charTree = readCTree(reader, 9, tempTree, 510);
        positionTree = readPTree(reader, 4, -1, 14);
      }

      blockRemaining--;
      var value = decodeHuffman(charTree, reader);
      if (value < 256) {
        output[position++] = value;
        continue;
      }

      var length = value - 253;
      var packedOffset = decodeHuffman(positionTree, reader);
      var offset = packedOffset;
      if (packedOffset > 0) {
        var width = packedOffset - 1;
        offset = (1 << width) + reader.bits(width);
      }

      var source = position - offset - 1;
      if (length > output.length - position) {
        length = output.length - position;
      }
      for (var i = 0; i < length; i++) {
        output[position] = output[source + i];
        position++;
      }
    }

    return output.subarray(windowSize);
  }

  async function extractPak0FromZipBuffer(zipBuffer, options) {
    options = options || {};
    var zipBytes = toUint8Array(zipBuffer);
    var onStatus = options.onStatus || options.setStatus || null;

    if (options.verifyZip !== false) {
      if (onStatus) {
        onStatus("Verifying quake106.zip...");
      }
      var zipHash = await sha256Hex(zipBytes);
      if (zipHash !== ZIP_SHA256) {
        throw new Error("quake106.zip hash mismatch.");
      }
    }

    if (onStatus) {
      onStatus("Extracting resource.1...");
    }
    var resource = await extractZipEntry(zipBytes, "resource.1");
    var resourceHash = await sha256Hex(resource);
    if (resourceHash !== RESOURCE1_SHA256) {
      throw new Error("resource.1 hash mismatch.");
    }

    if (onStatus) {
      onStatus("Extracting pak0.pak...");
    }
    var pak0 = decodeLH5Segment(resource, PAK0_SEGMENT);
    var pak0Hash = await sha256Hex(pak0);
    if (pak0Hash !== PAK0_SHA256) {
      throw new Error("pak0.pak hash mismatch.");
    }

    return pak0;
  }

  async function extractPak0(options) {
    options = options || {};
    var onStatus = options.onStatus || options.setStatus || null;
    var url = options.url || DEFAULT_URL;
    var zipBytes = await fetchBytes(url, onStatus);
    var pak0 = await extractPak0FromZipBuffer(zipBytes, options);
    return arrayBufferFromBytes(pak0);
  }

  return {
    constants: {
      defaultUrl: DEFAULT_URL,
      zipSha256: ZIP_SHA256,
      resource1Sha256: RESOURCE1_SHA256,
      pak0Sha256: PAK0_SHA256
    },
    extractPak0: extractPak0,
    extractPak0FromZipBuffer: extractPak0FromZipBuffer
  };
}));
