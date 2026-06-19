(() => {
    "use strict";

    const GAME_OPTIONS = [
        ["quake1", "Quake 1"],
        ["quake2", "Quake 2"],
        ["hexen2", "Hexen II"],
        ["haktoria", "Haktoria"]
    ];

    const WAD_TYPES = {
        NONE: 0,
        LABEL: 1,
        PALETTE: 64,
        QTEX: 65,
        QPIC: 66,
        SOUND: 67,
        MIPTEX: 68,
        COMPRESSED: 256
    };

    const TYPE_LETTERS = new Map([
        [WAD_TYPES.NONE, "x"],
        [WAD_TYPES.LABEL, "L"],
        [WAD_TYPES.PALETTE, "C"],
        [WAD_TYPES.QTEX, "T"],
        [WAD_TYPES.QPIC, "P"],
        [WAD_TYPES.SOUND, "S"],
        [WAD_TYPES.MIPTEX, "M"],
        [WAD_TYPES.COMPRESSED, "!"]
    ]);

    const state = {
        archiveFile: null,
        archive: null,
        archiveRows: [],
        selectedIndices: new Set(),
        archivePalette: null,
        pakFiles: [],
        pakPalette: null,
        wadFiles: [],
        wadPalette: null,
        maketexFiles: [],
        generatePalette: null
    };

    const ui = {};

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    function log(message, level = "info") {
        if (!ui.log) {
            return;
        }
        const prefix = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "OK";
        ui.log.textContent += `[${prefix}] ${message}\n`;
        ui.log.scrollTop = ui.log.scrollHeight;
    }

    function clearLog() {
        if (ui.log) {
            ui.log.textContent = "";
        }
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) {
            return "-";
        }
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function hex32(value) {
        return `+${(value >>> 0).toString(16).padStart(8, "0")}`;
    }

    function basename(path) {
        return String(path).replace(/\\/g, "/").split("/").pop() || "";
    }

    function extension(path) {
        const base = basename(path);
        const dot = base.lastIndexOf(".");
        return dot < 0 ? "" : base.slice(dot + 1).toLowerCase();
    }

    function withoutExtension(path) {
        const dot = path.lastIndexOf(".");
        return dot < 0 ? path : path.slice(0, dot);
    }

    function replaceExtension(path, ext) {
        return `${withoutExtension(path)}.${ext}`;
    }

    function startsWithPath(path, prefix) {
        return path.toLowerCase().replace(/\\/g, "/").startsWith(prefix.toLowerCase());
    }

    function readAscii(view, offset, length) {
        let out = "";
        for (let i = 0; i < length; i += 1) {
            const c = view.getUint8(offset + i);
            if (c === 0) {
                break;
            }
            out += String.fromCharCode(c);
        }
        return out;
    }

    function writeAscii(bytes, offset, text, length) {
        bytes.fill(0, offset, offset + length);
        const max = Math.min(length, text.length);
        for (let i = 0; i < max; i += 1) {
            bytes[offset + i] = text.charCodeAt(i) & 0xff;
        }
    }

    function writeU32(bytes, offset, value) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        view.setUint32(offset, value >>> 0, true);
    }

    function writeI32(bytes, offset, value) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        view.setInt32(offset, value | 0, true);
    }

    function concatBytes(chunks) {
        const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
            out.set(chunk, offset);
            offset += chunk.length;
        }
        return out;
    }

    function align4(length) {
        return (length + 3) & ~3;
    }

    function bytesFromText(text) {
        return new TextEncoder().encode(text);
    }

    function textFromBytes(bytes) {
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }

    function filePath(file) {
        return (file.webkitRelativePath || file.relativePath || file.name || "").replace(/\\/g, "/");
    }

    async function readFileBytes(file) {
        return new Uint8Array(await file.arrayBuffer());
    }

    function toBlob(bytes, type = "application/octet-stream") {
        return new Blob([bytes], { type });
    }

    function downloadBytes(filename, bytes, type) {
        const url = URL.createObjectURL(toBlob(bytes, type));
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 250);
    }

    async function downloadFileSet(files, suggestedName) {
        if (files.length === 0) {
            log("No files to download.", "warn");
            return;
        }
        if (files.length === 1) {
            downloadBytes(files[0].name, files[0].data, files[0].type);
            return;
        }
        if (!window.JSZip) {
            log("JSZip is not available; downloading the first file only.", "warn");
            downloadBytes(files[0].name, files[0].data, files[0].type);
            return;
        }
        const zip = new JSZip();
        for (const file of files) {
            zip.file(file.name, file.data);
        }
        const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        downloadBytes(suggestedName, bytes, "application/zip");
    }

    function safeExtractPath(name) {
        let input = String(name || "").replace(/\\/g, "/");
        while (input[0] === "/" || input[0] === "\\" || input[0] === ".") {
            input = input.slice(1);
        }
        let out = "";
        for (let i = 0; i < input.length; i += 1) {
            let ch = input[i];
            if (ch === " ") {
                ch = "_";
            }
            if ((ch === "." && input[i + 1] === ".") || (ch === "/" && input[i + 1] === "/")) {
                continue;
            }
            if (!/[A-Za-z0-9_./-]/.test(ch)) {
                ch = "_";
            }
            out += ch;
        }
        return out || "unnamed";
    }

    function safePakInputPath(name) {
        let input = String(name || "").replace(/\\/g, "/");
        while (input[0] === "/" || input[0] === "\\" || input[0] === ".") {
            input = input.slice(1);
        }
        let out = "";
        for (let i = 0; i < input.length; i += 1) {
            let ch = input[i];
            const code = ch.charCodeAt(0);
            if (/\s/.test(ch)) {
                ch = "_";
            }
            if ((ch === "." && input[i + 1] === ".") || (ch === "/" && input[i + 1] === "/")) {
                continue;
            }
            if (code < 32 || code > 126) {
                ch = "_";
            }
            out += ch;
        }
        if (!out) {
            throw new Error("Illegal empty PAK path.");
        }
        if (out.length > 55) {
            throw new Error(`PAK path is longer than 55 characters: ${out}`);
        }
        return out;
    }

    function parsePak(bytes, filename = "archive.pak") {
        if (bytes.length < 12) {
            throw new Error("PAK file is too short.");
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const magic = readAscii(view, 0, 4);
        if (magic !== "PACK") {
            throw new Error("Not a PACK PAK file.");
        }
        const dirOffset = view.getUint32(4, true);
        const dirSize = view.getUint32(8, true);
        if (dirSize % 64 !== 0 || dirOffset + dirSize > bytes.length) {
            throw new Error("Invalid PAK directory.");
        }
        const count = dirSize / 64;
        if (count >= 5000) {
            throw new Error(`Suspicious PAK entry count: ${count}.`);
        }
        const entries = [];
        for (let i = 0; i < count; i += 1) {
            const pos = dirOffset + i * 64;
            const name = readAscii(view, pos, 56);
            const offset = view.getUint32(pos + 56, true);
            const size = view.getUint32(pos + 60, true);
            if (offset + size > bytes.length) {
                throw new Error(`Entry outside file bounds: ${name}`);
            }
            entries.push({
                index: i,
                name,
                offset,
                size,
                type: extension(name).toUpperCase() || "file",
                data: bytes.slice(offset, offset + size)
            });
        }
        return { kind: "pak", filename, bytes, entries };
    }

    function parseWad(bytes, filename = "archive.wad") {
        if (bytes.length < 12) {
            throw new Error("WAD file is too short.");
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const magic = readAscii(view, 0, 4);
        if (magic !== "WAD2") {
            throw new Error("Only WAD2 files are supported.");
        }
        const count = view.getUint32(4, true);
        const dirOffset = view.getUint32(8, true);
        if (dirOffset + count * 32 > bytes.length || count >= 5000) {
            throw new Error("Invalid WAD2 directory.");
        }
        const entries = [];
        for (let i = 0; i < count; i += 1) {
            const pos = dirOffset + i * 32;
            const offset = view.getUint32(pos, true);
            const dsize = view.getUint32(pos + 4, true);
            const size = view.getUint32(pos + 8, true);
            const type = view.getUint8(pos + 12);
            const compression = view.getUint8(pos + 13);
            const name = readAscii(view, pos + 16, 16);
            if (offset + dsize > bytes.length) {
                throw new Error(`Lump outside file bounds: ${name}`);
            }
            entries.push({
                index: i,
                name,
                offset,
                size,
                dsize,
                compression,
                wadType: compression ? WAD_TYPES.COMPRESSED : type,
                type: TYPE_LETTERS.get(compression ? WAD_TYPES.COMPRESSED : type) || "?",
                data: bytes.slice(offset, offset + dsize)
            });
        }
        return { kind: "wad", filename, bytes, entries };
    }

    function buildPakFromEntries(entries) {
        const chunks = [new Uint8Array(12)];
        const dir = [];
        let offset = 12;
        for (const entry of entries) {
            const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
            const start = offset;
            chunks.push(data);
            offset += data.length;
            const pad = align4(offset) - offset;
            if (pad > 0) {
                chunks.push(new Uint8Array(pad));
                offset += pad;
            }
            dir.push({ name: entry.name, offset: start, size: data.length });
        }
        const dirOffset = offset;
        const dirBytes = new Uint8Array(dir.length * 64);
        for (let i = 0; i < dir.length; i += 1) {
            const pos = i * 64;
            writeAscii(dirBytes, pos, dir[i].name, 56);
            writeU32(dirBytes, pos + 56, dir[i].offset);
            writeU32(dirBytes, pos + 60, dir[i].size);
        }
        chunks.push(dirBytes);
        const header = chunks[0];
        writeAscii(header, 0, "PACK", 4);
        writeU32(header, 4, dirOffset);
        writeU32(header, 8, dirBytes.length);
        return concatBytes(chunks);
    }

    function buildWadFromLumps(lumps) {
        const chunks = [new Uint8Array(12)];
        const dir = [];
        let offset = 12;
        for (const lump of lumps) {
            const data = lump.data instanceof Uint8Array ? lump.data : new Uint8Array(lump.data);
            const start = offset;
            chunks.push(data);
            offset += data.length;
            const pad = align4(offset) - offset;
            if (pad > 0) {
                chunks.push(new Uint8Array(pad));
                offset += pad;
            }
            dir.push({ name: lump.name, type: lump.type, start, length: data.length });
        }
        const dirOffset = offset;
        const dirBytes = new Uint8Array(dir.length * 32);
        for (let i = 0; i < dir.length; i += 1) {
            const pos = i * 32;
            writeU32(dirBytes, pos, dir[i].start);
            writeU32(dirBytes, pos + 4, dir[i].length);
            writeU32(dirBytes, pos + 8, dir[i].length);
            dirBytes[pos + 12] = dir[i].type & 0xff;
            dirBytes[pos + 13] = 0;
            dirBytes[pos + 14] = 0;
            dirBytes[pos + 15] = 0;
            writeAscii(dirBytes, pos + 16, dir[i].name, 16);
        }
        chunks.push(dirBytes);
        const header = chunks[0];
        writeAscii(header, 0, "WAD2", 4);
        writeU32(header, 4, dir.length);
        writeU32(header, 8, dirOffset);
        return concatBytes(chunks);
    }

    function parsePaletteText(text) {
        const nums = (text.match(/-?\d+/g) || []).map(Number);
        if (nums.length < 768) {
            throw new Error("Palette text needs 768 numbers.");
        }
        const out = new Uint8Array(768);
        for (let i = 0; i < 768; i += 1) {
            const n = nums[i];
            if (n < 0 || n > 255) {
                throw new Error(`Palette value out of range: ${n}`);
            }
            out[i] = n;
        }
        return Array.from(out);
    }

    async function paletteFromFile(file) {
        if (!file) {
            return null;
        }
        const bytes = await readFileBytes(file);
        let isBinary = false;
        for (const b of bytes) {
            if ((b & 0x80) || b < 7) {
                isBinary = true;
                break;
            }
        }
        if (isBinary) {
            if (bytes.length < 768) {
                throw new Error("Palette file is shorter than 768 bytes.");
            }
            return Array.from(bytes.slice(0, 768));
        }
        return parsePaletteText(textFromBytes(bytes));
    }

    function defaultPalette(game) {
        const palettes = window.QPAKMAN_PALETTES || {};
        const palette = palettes[game] || palettes.quake1;
        if (!palette || palette.length !== 768) {
            throw new Error("Default palette data is unavailable.");
        }
        return palette;
    }

    function resolvePalette(game, customPalette) {
        return customPalette || defaultPalette(game);
    }

    function colorAt(palette, index, transparent = -1) {
        if (index === transparent) {
            return [0, 0, 0, 0];
        }
        const pos = index * 3;
        return [palette[pos], palette[pos + 1], palette[pos + 2], 255];
    }

    function makeColorMapper(palette, options = {}) {
        const game = options.game || "quake1";
        const allowFullbright = Boolean(options.fullbright);
        const transparent = options.transparent ?? 0;
        const minIndex = game === "quake1" ? 1 : 0;
        const maxIndex = allowFullbright ? 255 : 223;
        const cache = new Map();
        return (r, g, b, a = 255) => {
            if (a <= 128) {
                return transparent;
            }
            const key = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
            const cached = cache.get(key);
            if (cached !== undefined) {
                return cached;
            }
            let bestIndex = minIndex;
            let bestDist = Number.MAX_SAFE_INTEGER;
            for (let i = minIndex; i <= maxIndex; i += 1) {
                const pos = i * 3;
                const dr = r - palette[pos];
                const dg = g - palette[pos + 1];
                const db = b - palette[pos + 2];
                const dist = dr * dr + dg * dg + db * db;
                if (dist === 0) {
                    cache.set(key, i);
                    return i;
                }
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIndex = i;
                }
            }
            // The full 24-bit color space fits the cache, so only clear if it
            // somehow grows past a generation pass; never mid-pass thrash.
            if (cache.size >= (1 << 20)) {
                cache.clear();
            }
            cache.set(key, bestIndex);
            return bestIndex;
        };
    }

    async function loadImageData(source) {
        const blob = source instanceof Blob ? source : toBlob(source, "image/png");
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        if (bitmap.close) {
            bitmap.close();
        }
        return { width: canvas.width, height: canvas.height, rgba: new Uint8ClampedArray(data) };
    }

    function imageToPngBytes(image) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        const img = new ImageData(new Uint8ClampedArray(image.rgba), image.width, image.height);
        ctx.putImageData(img, 0, 0);
        return new Promise((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    reject(new Error("Could not encode PNG."));
                    return;
                }
                resolve(new Uint8Array(await blob.arrayBuffer()));
            }, "image/png");
        });
    }

    function scaleNearest(image, width, height) {
        const out = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y += 1) {
            const oldY = Math.floor(y * image.height / height);
            for (let x = 0; x < width; x += 1) {
                const oldX = Math.floor(x * image.width / width);
                const src = (oldY * image.width + oldX) * 4;
                const dst = (y * width + x) * 4;
                out[dst] = image.rgba[src];
                out[dst + 1] = image.rgba[src + 1];
                out[dst + 2] = image.rgba[src + 2];
                out[dst + 3] = image.rgba[src + 3];
            }
        }
        return { width, height, rgba: out };
    }

    function makeMip(image) {
        const width = Math.max(1, Math.floor(image.width / 2));
        const height = Math.max(1, Math.floor(image.height / 2));
        const out = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let r = 0;
                let g = 0;
                let b = 0;
                let a = 0;
                for (let dy = 0; dy < 2; dy += 1) {
                    for (let dx = 0; dx < 2; dx += 1) {
                        const sx = Math.min(image.width - 1, x * 2 + dx);
                        const sy = Math.min(image.height - 1, y * 2 + dy);
                        const src = (sy * image.width + sx) * 4;
                        r += image.rgba[src];
                        g += image.rgba[src + 1];
                        b += image.rgba[src + 2];
                        a += image.rgba[src + 3];
                    }
                }
                const dst = (y * width + x) * 4;
                out[dst] = Math.round(r / 4);
                out[dst + 1] = Math.round(g / 4);
                out[dst + 2] = Math.round(b / 4);
                out[dst + 3] = Math.round(a / 4);
            }
        }
        return { width, height, rgba: out };
    }

    function blackToTransparent(image) {
        const out = new Uint8ClampedArray(image.rgba);
        for (let i = 0; i < out.length; i += 4) {
            if (out[i] === 0 && out[i + 1] === 0 && out[i + 2] === 0 && out[i + 3] === 255) {
                out[i + 3] = 0;
            }
        }
        return { width: image.width, height: image.height, rgba: out };
    }

    function quakeSkyFix(image) {
        const out = new Uint8ClampedArray(image.rgba);
        for (let y = 0; y < image.height; y += 1) {
            for (let x = 0; x < Math.floor(image.width / 2); x += 1) {
                const pos = (y * image.width + x) * 4;
                if (out[pos] === 0 && out[pos + 1] === 0 && out[pos + 2] === 0 && out[pos + 3] === 255) {
                    out[pos + 3] = 0;
                }
            }
        }
        return { width: image.width, height: image.height, rgba: out };
    }

    function indexedPixels(image, mapper) {
        const out = new Uint8Array(image.width * image.height);
        let j = 0;
        for (let i = 0; i < image.rgba.length; i += 4) {
            out[j] = mapper(image.rgba[i], image.rgba[i + 1], image.rgba[i + 2], image.rgba[i + 3]);
            j += 1;
        }
        return out;
    }

    function imageFromIndexed(width, height, pixels, palette, transparent = -1) {
        const rgba = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < pixels.length; i += 1) {
            const color = colorAt(palette, pixels[i], transparent);
            const pos = i * 4;
            rgba[pos] = color[0];
            rgba[pos + 1] = color[1];
            rgba[pos + 2] = color[2];
            rgba[pos + 3] = color[3];
        }
        return { width, height, rgba };
    }

    function parseNumberText(bytes, count, label) {
        const nums = (textFromBytes(bytes).match(/-?\d+/g) || []).map(Number);
        if (nums.length < count) {
            throw new Error(`${label} needs ${count} numbers.`);
        }
        const out = new Uint8Array(count);
        for (let i = 0; i < count; i += 1) {
            if (nums[i] < 0 || nums[i] > 255) {
                throw new Error(`${label} value out of range: ${nums[i]}`);
            }
            out[i] = nums[i];
        }
        return out;
    }

    function paletteTextFromBytes(bytes) {
        const lines = [];
        for (let i = 0; i < 256; i += 1) {
            const p = i * 3;
            lines.push(`${String(bytes[p]).padStart(3, " ")} ${String(bytes[p + 1]).padStart(3, " ")} ${String(bytes[p + 2]).padStart(3, " ")}`);
        }
        return `${lines.join("\n")}\n`;
    }

    function fontsizeTextFromBytes(bytes) {
        const lines = [];
        for (let y = 0; y < 27; y += 1) {
            const row = [];
            for (let x = 0; x < 27; x += 1) {
                row.push(String(bytes[y * 27 + x] || 0).padStart(2, " "));
            }
            lines.push(row.join(" "));
        }
        return `${lines.join("\n")}\n`;
    }

    function lumpNameFromImagePath(path, fullbrightOut) {
        let name = basename(withoutExtension(path)).toLowerCase();
        if (!name) {
            throw new Error(`Invalid image filename: ${path}`);
        }
        if (name.startsWith("star_")) {
            name = `*${name.slice(5)}`;
        } else if (name.startsWith("plus_")) {
            name = `+${name.slice(5)}`;
        } else if (name.startsWith("minu_")) {
            name = `-${name.slice(5)}`;
        } else if (name.startsWith("divd_")) {
            name = `/${name.slice(5)}`;
        }
        if (name.endsWith("_fbr")) {
            fullbrightOut.value = true;
            name = name.slice(0, -4);
        }
        if (name.length > 15) {
            name = `${name.slice(0, 7)}${name.slice(-8)}`;
        }
        return name;
    }

    function outputNameForLump(name, fullbright = false) {
        let result = "";
        if (name[0] === "*") {
            result = "star_";
        } else if (name[0] === "+") {
            result = "plus_";
        } else if (name[0] === "-") {
            result = "minu_";
        } else if (name[0] === "/") {
            result = "divd_";
        } else {
            result = name[0] || "u";
        }
        result += name.slice(1);
        result = result.replace(/ /g, "_").replace(/[^A-Za-z0-9_-]/g, "_");
        if (fullbright) {
            result += "_fbr";
        }
        return `${result}.png`;
    }

    function encodeQpic(image, palette, game, transparent = 255) {
        const mapper = makeColorMapper(palette, { game, fullbright: true, transparent });
        const pixels = indexedPixels(image, mapper);
        const out = new Uint8Array(8 + pixels.length);
        writeU32(out, 0, image.width);
        writeU32(out, 4, image.height);
        out.set(pixels, 8);
        return out;
    }

    function decodeQpic(data, palette, transparent = 255) {
        if (data.length < 8) {
            throw new Error("LMP/PIC data is too short.");
        }
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const width = view.getUint32(0, true);
        const height = view.getUint32(4, true);
        if (width < 1 || height < 1 || width > 4096 || height > 4096 || 8 + width * height > data.length) {
            throw new Error(`Invalid picture size: ${width}x${height}.`);
        }
        return imageFromIndexed(width, height, data.slice(8, 8 + width * height), palette, transparent);
    }

    function encodeMiptex(name, image, palette, game, fullbright) {
        let working = image;
        const newWidth = (working.width + 7) & ~7;
        const newHeight = (working.height + 7) & ~7;
        if (newWidth !== working.width || newHeight !== working.height) {
            working = scaleNearest(working, newWidth, newHeight);
            log(`Scaled ${name} to ${newWidth}x${newHeight} for MIPTEX.`);
        }
        if (name.toLowerCase().startsWith("sky")) {
            working = quakeSkyFix(working);
        }
        const levels = [working];
        for (let i = 1; i < 4; i += 1) {
            levels.push(makeMip(levels[i - 1]));
        }
        const header = new Uint8Array(40);
        writeAscii(header, 0, name, 16);
        writeU32(header, 16, working.width);
        writeU32(header, 20, working.height);
        let dataOffset = 40;
        const indexed = [];
        for (let i = 0; i < 4; i += 1) {
            writeU32(header, 24 + i * 4, dataOffset);
            const mapper = makeColorMapper(palette, { game, fullbright, transparent: 0 });
            const pixels = indexedPixels(levels[i], mapper);
            indexed.push(pixels);
            dataOffset += pixels.length;
        }
        return concatBytes([header, ...indexed]);
    }

    function decodeMiptex(data, palette, lumpName) {
        if (data.length < 40) {
            throw new Error("MIPTEX lump is too short.");
        }
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const width = view.getUint32(16, true);
        const height = view.getUint32(20, true);
        const firstOffset = view.getUint32(24, true);
        const pixelOffset = firstOffset >= 40 && firstOffset + width * height <= data.length ? firstOffset : 40;
        if (width < 8 || height < 8 || width > 4096 || height > 4096 || pixelOffset + width * height > data.length) {
            throw new Error(`Invalid MIPTEX size: ${width}x${height}.`);
        }
        const pixels = data.slice(pixelOffset, pixelOffset + width * height);
        let fullbright = false;
        for (const pix of pixels) {
            if (pix >= 224) {
                fullbright = true;
                break;
            }
        }
        let image = imageFromIndexed(width, height, pixels, palette);
        if (lumpName.toLowerCase().startsWith("sky")) {
            image = quakeSkyFix(image);
        }
        return { image, fullbright };
    }

    function decodeRawBlock(data, palette, name) {
        let width;
        let height;
        if (name.toUpperCase() === "CONCHARS") {
            width = 128;
            height = 128;
        } else if (name.toUpperCase() === "TINYFONT") {
            width = 128;
            height = 32;
        } else {
            if (data.length < 64) {
                throw new Error("Raw block is too small to be an image.");
            }
            for (width = 4096; width > 1 && width * width > data.length; width /= 2) {
                // mirror qpakman's square-size guess.
            }
            height = width;
        }
        if (width < 8 || height < 8 || width * height > data.length) {
            throw new Error(`Invalid raw block size: ${width}x${height}.`);
        }
        return imageFromIndexed(width, height, data.slice(0, width * height), palette, 0);
    }

    function decodeWal(data, palette) {
        if (data.length < 100) {
            throw new Error("WAL data is too short.");
        }
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const width = view.getUint32(32, true);
        const height = view.getUint32(36, true);
        const offset = view.getUint32(40, true);
        if (width < 8 || height < 8 || width > 4096 || height > 4096 || offset < 80 || offset + width * height > data.length) {
            throw new Error(`Invalid WAL image: ${width}x${height}.`);
        }
        return imageFromIndexed(width, height, data.slice(offset, offset + width * height), palette);
    }

    function encodeWal(name, image, palette, game) {
        let working = image;
        const newWidth = (working.width + 7) & ~7;
        const newHeight = (working.height + 7) & ~7;
        if (newWidth !== working.width || newHeight !== working.height) {
            working = scaleNearest(working, newWidth, newHeight);
            log(`Scaled ${name} to ${newWidth}x${newHeight} for WAL.`);
        }
        const levels = [working];
        for (let i = 1; i < 4; i += 1) {
            levels.push(makeMip(levels[i - 1]));
        }
        const header = new Uint8Array(100);
        writeAscii(header, 0, name.slice(0, 31), 32);
        writeU32(header, 32, working.width);
        writeU32(header, 36, working.height);
        let offset = 100;
        const indexed = [];
        for (let i = 0; i < 4; i += 1) {
            writeU32(header, 40 + i * 4, offset);
            const mapper = makeColorMapper(palette, { game, fullbright: true, transparent: 0 });
            const pixels = indexedPixels(levels[i], mapper);
            indexed.push(pixels);
            offset += pixels.length;
        }
        writeAscii(header, 56, "", 32);
        writeI32(header, 88, 0);
        writeI32(header, 92, 0);
        writeI32(header, 96, 0);
        return concatBytes([header, ...indexed]);
    }

    async function createPak(files, options) {
        const palette = resolvePalette(options.game, options.palette);
        const entries = [];
        const seen = new Set();
        let failures = 0;
        let skipped = 0;
        for (const file of files) {
            const originalPath = filePath(file);
            if (!originalPath || originalPath.startsWith(".") || originalPath.startsWith("/") || /^[A-Za-z]:/.test(originalPath)) {
                skipped += 1;
                log(`Skipped bad path: ${originalPath || file.name}`, "warn");
                continue;
            }
            if (originalPath.toLowerCase() === "qpakman" || originalPath.toLowerCase() === "qpakman.exe") {
                skipped += 1;
                continue;
            }
            let path;
            try {
                path = safePakInputPath(originalPath);
            } catch (error) {
                failures += 1;
                log(error.message, "error");
                continue;
            }
            let data = await readFileBytes(file);
            let outName = path;
            try {
                if (!options.raw) {
                    const lower = path.toLowerCase();
                    if (lower === "gfx/palette.txt") {
                        data = parsePaletteText(textFromBytes(data));
                        outName = replaceExtension(path, "lmp");
                    } else if (lower === "gfx/menu/fontsize.txt") {
                        data = parseNumberText(data, 729, "fontsize.txt");
                        outName = replaceExtension(path, "lmp");
                    } else if (basename(path).toLowerCase() === "pop.png") {
                        skipped += 1;
                        log("Skipped pop.png; qpakman treats it as analysis-only.", "warn");
                        continue;
                    } else if (options.game !== "quake2" && extension(path) === "png" && startsWithPath(path, "gfx/")) {
                        const image = await loadImageData(file);
                        data = encodeQpic(image, palette, options.game, 255);
                        outName = replaceExtension(path, "lmp");
                    } else if (options.game === "quake2" && extension(path) === "png" && startsWithPath(path, "textures/")) {
                        const image = await loadImageData(file);
                        data = encodeWal(basename(withoutExtension(path)).toLowerCase(), image, palette, options.game);
                        outName = replaceExtension(path, "wal");
                    }
                }
                outName = safePakInputPath(outName);
                if (seen.has(outName)) {
                    failures += 1;
                    log(`Duplicate PAK entry skipped: ${outName}`, "error");
                    continue;
                }
                seen.add(outName);
                entries.push({ name: outName, data });
            } catch (error) {
                failures += 1;
                log(`${path}: ${error.message}`, "error");
            }
        }
        if (entries.length === 0) {
            throw new Error("No PAK entries were produced.");
        }
        const pak = buildPakFromEntries(entries);
        log(`Packed ${entries.length} files (${formatBytes(pak.length)}), ${skipped} skipped, ${failures} failures.`);
        return pak;
    }

    async function createWad(files, options) {
        const palette = resolvePalette(options.game, options.palette);
        const outputName = basename(options.output || "");
        const picMode = options.pic || outputName.toLowerCase() === "gfx.wad";
        const seen = new Set();
        const lumps = [];
        let failures = 0;
        for (const file of files) {
            const path = filePath(file);
            try {
                const fullbright = { value: false };
                const lumpName = lumpNameFromImagePath(path, fullbright);
                if (seen.has(lumpName.toLowerCase())) {
                    failures += 1;
                    log(`Duplicate WAD lump skipped: ${lumpName}`, "error");
                    continue;
                }
                seen.add(lumpName.toLowerCase());
                let image = await loadImageData(file);
                let data;
                let type;
                let outName = lumpName;
                if (lumpName.toUpperCase() === "CONCHARS" || lumpName.toUpperCase() === "TINYFONT") {
                    image = blackToTransparent(image);
                    const mapper = makeColorMapper(palette, { game: options.game, fullbright: true, transparent: 0 });
                    data = indexedPixels(image, mapper);
                    type = WAD_TYPES.MIPTEX;
                    outName = lumpName.toUpperCase();
                } else if (picMode) {
                    data = encodeQpic(image, palette, options.game, 255);
                    type = WAD_TYPES.QPIC;
                    outName = lumpName.toUpperCase();
                } else {
                    data = encodeMiptex(lumpName, image, palette, options.game, fullbright.value);
                    type = WAD_TYPES.MIPTEX;
                }
                lumps.push({ name: outName, type, data });
            } catch (error) {
                failures += 1;
                log(`${path}: ${error.message}`, "error");
            }
        }
        if (lumps.length === 0) {
            throw new Error("No WAD lumps were produced.");
        }
        const wad = buildWadFromLumps(lumps);
        log(`Mipped ${lumps.length} images (${formatBytes(wad.length)}), ${failures} failures.`);
        return wad;
    }

    async function extractPak(archive, options) {
        const palette = resolvePalette(options.game, options.palette);
        const out = [];
        for (const entry of archive.entries) {
            const path = safeExtractPath(entry.name);
            const lower = path.toLowerCase();
            if (options.raw) {
                out.push({ name: path, data: entry.data });
                continue;
            }
            try {
                if (lower === "gfx/palette.lmp" && entry.data.length >= 768) {
                    out.push({ name: replaceExtension(path, "txt"), data: bytesFromText(paletteTextFromBytes(entry.data)) });
                } else if (lower === "gfx/menu/fontsize.lmp" && entry.data.length >= 729) {
                    out.push({ name: replaceExtension(path, "txt"), data: bytesFromText(fontsizeTextFromBytes(entry.data)) });
                } else if (basename(lower) === "pop.lmp" && entry.data.length >= 256) {
                    const image = imageFromIndexed(16, 16, entry.data.slice(0, 256), palette);
                    out.push({ name: replaceExtension(path, "png"), data: await imageToPngBytes(image), type: "image/png" });
                    out.push({ name: path, data: entry.data });
                } else if (options.game !== "quake2" && extension(path) === "lmp" && startsWithPath(path, "gfx/")) {
                    const image = decodeQpic(entry.data, palette, 255);
                    out.push({ name: replaceExtension(path, "png"), data: await imageToPngBytes(image), type: "image/png" });
                } else if (options.game === "quake2" && extension(path) === "wal") {
                    const image = decodeWal(entry.data, palette);
                    out.push({ name: replaceExtension(path, "png"), data: await imageToPngBytes(image), type: "image/png" });
                } else {
                    out.push({ name: path, data: entry.data });
                }
            } catch (error) {
                log(`${entry.name}: ${error.message}; wrote raw file.`, "warn");
                out.push({ name: path, data: entry.data });
            }
        }
        return out;
    }

    async function extractWad(archive, options) {
        const palette = resolvePalette(options.game, options.palette);
        const out = [];
        for (const entry of archive.entries) {
            const name = safeExtractPath(entry.name);
            try {
                if (options.raw) {
                    out.push({ name: `${name}.lump`, data: entry.data });
                } else if (name.toUpperCase() === "CONCHARS" || name.toUpperCase() === "TINYFONT") {
                    const image = decodeRawBlock(entry.data, palette, name);
                    out.push({ name: outputNameForLump(name), data: await imageToPngBytes(image), type: "image/png" });
                } else if (entry.wadType === WAD_TYPES.QPIC) {
                    const image = decodeQpic(entry.data, palette, 255);
                    out.push({ name: outputNameForLump(name), data: await imageToPngBytes(image), type: "image/png" });
                } else if (entry.wadType === WAD_TYPES.MIPTEX) {
                    const decoded = decodeMiptex(entry.data, palette, name);
                    out.push({ name: outputNameForLump(name, decoded.fullbright), data: await imageToPngBytes(decoded.image), type: "image/png" });
                } else {
                    log(`Skipped non-image WAD lump: ${name}`, "warn");
                }
            } catch (error) {
                log(`${entry.name}: ${error.message}`, "error");
            }
        }
        return out;
    }

    function copyMiptexFromBspBytes(bytes, label, seen, lumps) {
        if (bytes.length < 124) {
            throw new Error(`${label} is too short for a BSP header.`);
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const version = view.getInt32(0, true);
        if (version < 0x17 || version > 0x1f) {
            throw new Error(`${label} has unsupported BSP version ${version}.`);
        }
        const texStart = view.getInt32(4 + 2 * 8, true);
        const texLength = view.getInt32(4 + 2 * 8 + 4, true);
        if (texLength <= 0) {
            return 0;
        }
        if (texStart < 0 || texStart + texLength > bytes.length) {
            throw new Error(`${label} has an invalid texture lump.`);
        }
        const count = view.getInt32(texStart, true);
        let copied = 0;
        for (let i = 0; i < count; i += 1) {
            const rel = view.getInt32(texStart + 4 + i * 4, true);
            if (rel < 0) {
                continue;
            }
            const pos = texStart + rel;
            if (pos + 40 > bytes.length) {
                continue;
            }
            const name = readAscii(view, pos, 16);
            if (!name || seen.has(name.toLowerCase())) {
                continue;
            }
            const width = view.getUint32(pos + 16, true);
            const height = view.getUint32(pos + 20, true);
            if (width > 2048 || height > 2048 || width === 0 || height === 0) {
                continue;
            }
            const total = 40 + Math.floor(width * height / 64 * 85);
            if (pos + total > bytes.length) {
                continue;
            }
            seen.add(name.toLowerCase());
            lumps.push({ name, type: WAD_TYPES.MIPTEX, data: bytes.slice(pos, pos + total) });
            copied += 1;
        }
        return copied;
    }

    async function createTextureWad(files) {
        const seen = new Set();
        const lumps = [];
        for (const file of files) {
            const bytes = await readFileBytes(file);
            const ext = extension(file.name);
            if (ext === "pak") {
                const pak = parsePak(bytes, file.name);
                for (const entry of pak.entries) {
                    const lower = entry.name.toLowerCase();
                    const short = lower.slice(5);
                    if (!lower.startsWith("maps/") || short.startsWith("b_") || !short.endsWith(".bsp") || short.includes("/")) {
                        continue;
                    }
                    const copied = copyMiptexFromBspBytes(entry.data, entry.name, seen, lumps);
                    if (copied) {
                        log(`${entry.name}: copied ${copied} textures.`);
                    }
                }
            } else if (ext === "bsp") {
                const copied = copyMiptexFromBspBytes(bytes, file.name, seen, lumps);
                log(`${file.name}: copied ${copied} textures.`);
            } else if (ext === "wad") {
                const wad = parseWad(bytes, file.name);
                let copied = 0;
                for (const entry of wad.entries) {
                    if (entry.wadType !== WAD_TYPES.MIPTEX || seen.has(entry.name.toLowerCase())) {
                        continue;
                    }
                    seen.add(entry.name.toLowerCase());
                    lumps.push({ name: entry.name, type: WAD_TYPES.MIPTEX, data: entry.data });
                    copied += 1;
                }
                log(`${file.name}: copied ${copied} textures.`);
            } else {
                log(`Skipped unknown MakeTex input: ${file.name}`, "warn");
            }
        }
        if (lumps.length === 0) {
            throw new Error("No MIPTEX lumps were found.");
        }
        const wad = buildWadFromLumps(lumps);
        log(`Built texture WAD with ${lumps.length} unique textures (${formatBytes(wad.length)}).`);
        return wad;
    }

    function generateSpecial(name, game, customPalette) {
        const palette = resolvePalette(game, customPalette);
        const mapper = makeColorMapper(palette, { game, fullbright: true, transparent: 0 });
        if (name === "invpal.lmp") {
            const out = new Uint8Array(64 * 64 * 64);
            let p = 0;
            for (let r = 0; r < 64; r += 1) {
                for (let g = 0; g < 64; g += 1) {
                    for (let b = 0; b < 64; b += 1) {
                        out[p] = mapper(r << 2, g << 2, b << 2, 255);
                        p += 1;
                    }
                }
            }
            return out;
        }
        if (name === "16to8.dat") {
            const out = new Uint8Array(32 * 64 * 32);
            let p = 0;
            for (let b = 0; b < 32; b += 1) {
                for (let g = 0; g < 64; g += 1) {
                    for (let r = 0; r < 32; r += 1) {
                        out[p] = mapper(r << 3, g << 2, b << 3, 255);
                        p += 1;
                    }
                }
            }
            return out;
        }
        if (name === "tinttab.lmp" || name === "tinttab2.lmp") {
            const xMul = name === "tinttab2.lmp" ? 165 : 128;
            const yMul = name === "tinttab2.lmp" ? 91 : 200;
            const out = new Uint8Array(256 * 256);
            let p = 0;
            for (let y = 0; y < 256; y += 1) {
                const yc = colorAt(palette, y);
                for (let x = 0; x < 256; x += 1) {
                    const xc = colorAt(palette, x);
                    const r = Math.min(255, (xc[0] * xMul + yc[0] * yMul) >> 8);
                    const g = Math.min(255, (xc[1] * xMul + yc[1] * yMul) >> 8);
                    const b = Math.min(255, (xc[2] * xMul + yc[2] * yMul) >> 8);
                    out[p] = mapper(r, g, b, 255);
                    p += 1;
                }
            }
            return out;
        }
        throw new Error(`Unknown generated output: ${name}`);
    }

    function setGameSelects() {
        for (const select of [ui.inspectGame, ui.pakGame, ui.wadGame, ui.generateGame]) {
            if (!select) {
                continue;
            }
            select.innerHTML = "";
            for (const [value, label] of GAME_OPTIONS) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                select.appendChild(option);
            }
        }
        ui.generateGame.value = "hexen2";
    }

    function setupDrop(zone, input, callback) {
        let dragDepth = 0;
        zone.addEventListener("click", () => input.click());
        zone.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                input.click();
            }
        });
        zone.addEventListener("dragenter", (event) => {
            event.preventDefault();
            dragDepth += 1;
            zone.classList.add("active");
        });
        zone.addEventListener("dragover", (event) => {
            event.preventDefault();
        });
        zone.addEventListener("dragleave", () => {
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0) {
                zone.classList.remove("active");
            }
        });
        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            dragDepth = 0;
            zone.classList.remove("active");
            callback(Array.from(event.dataTransfer.files || []));
        });
        input.addEventListener("change", () => {
            callback(Array.from(input.files || []));
            input.value = "";
        });
    }

    async function runBusy(button, fn) {
        if (button.dataset.busy === "1") {
            return;
        }
        const labelEl = button.querySelector("span");
        const original = labelEl ? labelEl.textContent : "";
        button.dataset.busy = "1";
        button.disabled = true;
        button.classList.add("busy");
        if (labelEl) {
            labelEl.textContent = "Working…";
        }
        try {
            await fn();
        } finally {
            button.dataset.busy = "";
            button.classList.remove("busy");
            restoreButtonDisabledState(button);
            if (labelEl) {
                labelEl.textContent = original;
            }
            updateSelectionUi();
        }
    }

    function restoreButtonDisabledState(button) {
        if (button === ui.downloadSelected || button === ui.downloadAll) {
            button.disabled = !state.archive;
        } else if (button === ui.buildPak) {
            button.disabled = state.pakFiles.length === 0;
        } else if (button === ui.buildWad) {
            button.disabled = state.wadFiles.length === 0;
        } else if (button === ui.buildMaketex) {
            button.disabled = state.maketexFiles.length === 0;
        } else {
            button.disabled = false;
        }
    }

    async function handleArchiveFiles(files) {
        if (!files.length) {
            return;
        }
        const file = files[0];
        try {
            const bytes = await readFileBytes(file);
            const ext = extension(file.name);
            const archive = ext === "pak" ? parsePak(bytes, file.name) : parseWad(bytes, file.name);
            state.archiveFile = file;
            state.archive = archive;
            state.selectedIndices.clear();
            ui.archiveFormat.textContent = archive.kind.toUpperCase();
            log(`Loaded ${file.name}: ${archive.entries.length} entries, ${formatBytes(bytes.length)}.`);
            renderArchive();
        } catch (error) {
            state.archive = null;
            state.archiveRows = [];
            state.selectedIndices.clear();
            ui.archiveFormat.textContent = "Invalid";
            renderArchive();
            log(error.message, "error");
        }
    }

    function renderSummary(archive) {
        if (!archive) {
            ui.archiveSummary.innerHTML = "";
            return;
        }
        const total = archive.entries.reduce((sum, entry) => sum + entry.size, 0);
        ui.archiveSummary.innerHTML = "";
        for (const item of [
            `${archive.filename}`,
            `${archive.entries.length} entries`,
            `${formatBytes(total)} data`
        ]) {
            const span = document.createElement("span");
            span.className = "summary-chip";
            span.textContent = item;
            ui.archiveSummary.appendChild(span);
        }
    }

    function renderArchive() {
        const archive = state.archive;
        renderSummary(archive);
        ui.entryTableBody.innerHTML = "";
        ui.downloadAll.disabled = !archive;
        ui.downloadSelected.disabled = !archive;
        ui.selectAllEntries.checked = false;
        ui.selectAllEntries.indeterminate = false;
        if (!archive) {
            updateSelectionUi();
            return;
        }
        const filter = ui.entryFilter.value.trim().toLowerCase();
        state.archiveRows = archive.entries.filter((entry) => !filter || entry.name.toLowerCase().includes(filter));
        for (const entry of state.archiveRows) {
            const tr = document.createElement("tr");
            tr.dataset.index = String(entry.index);
            const type = archive.kind === "wad" ? entry.type : entry.type;
            const selectCell = document.createElement("td");
            const check = document.createElement("input");
            check.className = "entry-check";
            check.type = "checkbox";
            check.setAttribute("aria-label", `Select ${entry.name}`);
            check.checked = state.selectedIndices.has(entry.index);
            selectCell.appendChild(check);

            const indexCell = document.createElement("td");
            indexCell.textContent = String(entry.index + 1);

            const nameCell = document.createElement("td");
            nameCell.className = "entry-name";
            nameCell.textContent = entry.name;

            const offsetCell = document.createElement("td");
            offsetCell.textContent = hex32(entry.offset);

            const sizeCell = document.createElement("td");
            sizeCell.textContent = formatBytes(entry.size || entry.dsize);

            const typeCell = document.createElement("td");
            typeCell.textContent = type;

            tr.append(selectCell, indexCell, nameCell, offsetCell, sizeCell, typeCell);
            ui.entryTableBody.appendChild(tr);
        }
        updateSelectAllState();
        updateSelectionUi();
    }

    function updateSelectAllState() {
        const checks = $$(".entry-check");
        const checked = checks.filter((check) => check.checked).length;
        ui.selectAllEntries.checked = checks.length > 0 && checked === checks.length;
        ui.selectAllEntries.indeterminate = checked > 0 && checked < checks.length;
    }

    function updateSelectionUi() {
        const count = state.selectedIndices.size;
        const span = ui.downloadSelected.querySelector("span");
        if (span && ui.downloadSelected.dataset.busy !== "1") {
            span.textContent = count > 0 ? `Selected (${count})` : "Selected";
        }
        ui.downloadSelected.title = count > 0
            ? `Download ${count} checked ${count === 1 ? "entry" : "entries"}`
            : "Download all listed entries (none checked)";
    }

    function setEntrySelected(index, selected) {
        if (selected) {
            state.selectedIndices.add(index);
        } else {
            state.selectedIndices.delete(index);
        }
    }

    function selectedArchiveEntries() {
        if (!state.archive) {
            return [];
        }
        if (state.selectedIndices.size === 0) {
            return state.archiveRows;
        }
        return state.archive.entries.filter((entry) => state.selectedIndices.has(entry.index));
    }

    async function extractEntries(entries) {
        if (!state.archive) {
            return [];
        }
        const archive = { ...state.archive, entries };
        const options = {
            game: ui.inspectGame.value,
            palette: state.archivePalette,
            raw: ui.inspectRaw.checked
        };
        const files = archive.kind === "pak" ? await extractPak(archive, options) : await extractWad(archive, options);
        log(`Prepared ${files.length} output files from ${entries.length} entries.`);
        return files;
    }

    function renderFilePreview(container, files, emptyText, onRemove) {
        container.innerHTML = "";
        container.classList.toggle("empty", files.length === 0);
        if (!files.length) {
            container.textContent = emptyText;
            return;
        }
        files.slice(0, 120).forEach((file, index) => {
            const row = document.createElement("div");
            row.className = "file-item";
            const strong = document.createElement("strong");
            strong.textContent = filePath(file);
            const meta = document.createElement("div");
            meta.className = "file-meta";
            const span = document.createElement("span");
            span.textContent = formatBytes(file.size || 0);
            meta.appendChild(span);
            if (onRemove) {
                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "file-remove";
                remove.setAttribute("aria-label", `Remove ${filePath(file)}`);
                remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                remove.addEventListener("click", () => onRemove(index));
                meta.appendChild(remove);
            }
            row.append(strong, meta);
            container.appendChild(row);
        });
        if (files.length > 120) {
            const more = document.createElement("div");
            more.className = "file-item";
            more.textContent = `${files.length - 120} more files`;
            container.appendChild(more);
        }
    }

    function setPakFiles(files) {
        state.pakFiles = files;
        ui.pakCount.textContent = `${files.length} files`;
        ui.buildPak.disabled = files.length === 0;
        ui.clearPak.disabled = files.length === 0;
        renderFilePreview(ui.pakPreview, files, "No files selected.", (index) => {
            setPakFiles(state.pakFiles.filter((_, i) => i !== index));
        });
    }

    function setWadFiles(files) {
        state.wadFiles = files.filter((file) => extension(file.name) === "png");
        ui.wadCount.textContent = `${state.wadFiles.length} images`;
        ui.buildWad.disabled = state.wadFiles.length === 0;
        ui.clearWad.disabled = state.wadFiles.length === 0;
        renderFilePreview(ui.wadPreview, state.wadFiles, "No images selected.", (index) => {
            setWadFiles(state.wadFiles.filter((_, i) => i !== index));
        });
    }

    function setMaketexFiles(files) {
        state.maketexFiles = files;
        ui.maketexCount.textContent = `${files.length} files`;
        ui.buildMaketex.disabled = files.length === 0;
        ui.clearMaketex.disabled = files.length === 0;
        renderFilePreview(ui.maketexPreview, files, "No files selected.", (index) => {
            setMaketexFiles(state.maketexFiles.filter((_, i) => i !== index));
        });
    }

    function renderGeneratePreview() {
        const name = ui.generateKind.value;
        const rows = [
            ["File", name],
            ["Game", ui.generateGame.options[ui.generateGame.selectedIndex].text],
            ["Size", name === "invpal.lmp" ? "262144 bytes" : "65536 bytes"],
            ["Palette", state.generatePalette ? state.generatePalette.name || "custom" : "default"]
        ];
        ui.generatePreview.textContent = "";
        for (const [key, value] of rows) {
            const row = document.createElement("dl");
            row.className = "spec-row";
            const term = document.createElement("dt");
            term.textContent = key;
            const description = document.createElement("dd");
            description.textContent = value;
            row.append(term, description);
            ui.generatePreview.appendChild(row);
        }
    }

    function setupTabs() {
        $$(".mode-tab").forEach((button) => {
            button.addEventListener("click", () => {
                $$(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
                $$(".mode-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `mode-${button.dataset.mode}`));
            });
        });
    }

    async function loadPaletteInput(input, key, label) {
        try {
            state[key] = await paletteFromFile(input.files[0]);
            log(`${label}: loaded custom palette.`);
        } catch (error) {
            state[key] = null;
            log(`${label}: ${error.message}`, "error");
        }
        renderGeneratePreview();
    }

    function bindEvents() {
        setupTabs();
        setupDrop(ui.archiveDrop, ui.archiveInput, handleArchiveFiles);
        setupDrop(ui.pakDrop, ui.pakInput, setPakFiles);
        setupDrop(ui.wadDrop, ui.wadInput, setWadFiles);
        setupDrop(ui.maketexDrop, ui.maketexInput, setMaketexFiles);

        ui.entryFilter.addEventListener("input", renderArchive);
        ui.selectAllEntries.addEventListener("change", () => {
            const checked = ui.selectAllEntries.checked;
            $$(".entry-check").forEach((check) => {
                check.checked = checked;
                setEntrySelected(Number(check.closest("tr").dataset.index), checked);
            });
            ui.selectAllEntries.indeterminate = false;
            updateSelectionUi();
        });
        ui.entryTableBody.addEventListener("change", (event) => {
            if (!event.target.classList.contains("entry-check")) {
                return;
            }
            setEntrySelected(Number(event.target.closest("tr").dataset.index), event.target.checked);
            updateSelectAllState();
            updateSelectionUi();
        });
        ui.entryTableBody.addEventListener("click", (event) => {
            if (event.target.closest(".entry-check") || event.target.tagName === "INPUT") {
                return;
            }
            const row = event.target.closest("tr");
            const check = row && row.querySelector(".entry-check");
            if (check) {
                check.checked = !check.checked;
                setEntrySelected(Number(row.dataset.index), check.checked);
                updateSelectAllState();
                updateSelectionUi();
            }
        });
        ui.inspectRaw.addEventListener("change", () => log(`Inspect mode: ${ui.inspectRaw.checked ? "raw output" : "converted output"}.`));
        ui.downloadSelected.addEventListener("click", () => runBusy(ui.downloadSelected, async () => {
            try {
                const entries = selectedArchiveEntries();
                const files = await extractEntries(entries);
                await downloadFileSet(files, `${withoutExtension(state.archive.filename)}-selected.zip`);
            } catch (error) {
                log(error.message, "error");
            }
        }));
        ui.downloadAll.addEventListener("click", () => runBusy(ui.downloadAll, async () => {
            try {
                const files = await extractEntries(state.archive.entries);
                await downloadFileSet(files, `${withoutExtension(state.archive.filename)}-extract.zip`);
            } catch (error) {
                log(error.message, "error");
            }
        }));

        ui.inspectPalette.addEventListener("change", () => loadPaletteInput(ui.inspectPalette, "archivePalette", "Inspect palette"));
        ui.pakPalette.addEventListener("change", () => loadPaletteInput(ui.pakPalette, "pakPalette", "PAK palette"));
        ui.wadPalette.addEventListener("change", () => loadPaletteInput(ui.wadPalette, "wadPalette", "WAD palette"));
        ui.generatePalette.addEventListener("change", () => loadPaletteInput(ui.generatePalette, "generatePalette", "Generate palette"));

        ui.buildPak.addEventListener("click", () => runBusy(ui.buildPak, async () => {
            try {
                const bytes = await createPak(state.pakFiles, {
                    output: ui.pakOutput.value,
                    game: ui.pakGame.value,
                    palette: state.pakPalette,
                    raw: ui.pakRaw.checked
                });
                downloadBytes(ui.pakOutput.value || "output.pak", bytes);
            } catch (error) {
                log(error.message, "error");
            }
        }));
        ui.clearPak.addEventListener("click", () => setPakFiles([]));

        ui.buildWad.addEventListener("click", () => runBusy(ui.buildWad, async () => {
            try {
                const bytes = await createWad(state.wadFiles, {
                    output: ui.wadOutput.value,
                    game: ui.wadGame.value,
                    palette: state.wadPalette,
                    pic: ui.wadPic.checked
                });
                downloadBytes(ui.wadOutput.value || "textures.wad", bytes);
            } catch (error) {
                log(error.message, "error");
            }
        }));
        ui.clearWad.addEventListener("click", () => setWadFiles([]));

        ui.buildMaketex.addEventListener("click", () => runBusy(ui.buildMaketex, async () => {
            try {
                const bytes = await createTextureWad(state.maketexFiles);
                downloadBytes(ui.maketexOutput.value || "textures.wad", bytes);
            } catch (error) {
                log(error.message, "error");
            }
        }));
        ui.clearMaketex.addEventListener("click", () => setMaketexFiles([]));

        ui.generateKind.addEventListener("change", renderGeneratePreview);
        ui.generateGame.addEventListener("change", renderGeneratePreview);
        ui.buildGenerated.addEventListener("click", () => {
            try {
                const name = ui.generateKind.value;
                const bytes = generateSpecial(name, ui.generateGame.value, state.generatePalette);
                downloadBytes(name, bytes);
                log(`Generated ${name} (${formatBytes(bytes.length)}).`);
            } catch (error) {
                log(error.message, "error");
            }
        });
        ui.clearLog.addEventListener("click", clearLog);
    }

    function collectUi() {
        Object.assign(ui, {
            log: $("#log"),
            clearLog: $("#clearLog"),
            archiveDrop: $("#archiveDrop"),
            archiveInput: $("#archiveInput"),
            archiveFormat: $("#archiveFormat"),
            inspectGame: $("#inspectGame"),
            inspectPalette: $("#inspectPalette"),
            inspectRaw: $("#inspectRaw"),
            downloadSelected: $("#downloadSelected"),
            downloadAll: $("#downloadAll"),
            entryFilter: $("#entryFilter"),
            entryTableBody: $("#entryTableBody"),
            selectAllEntries: $("#selectAllEntries"),
            archiveSummary: $("#archiveSummary"),
            pakDrop: $("#pakDrop"),
            pakInput: $("#pakInput"),
            pakCount: $("#pakCount"),
            pakOutput: $("#pakOutput"),
            pakGame: $("#pakGame"),
            pakPalette: $("#pakPalette"),
            pakRaw: $("#pakRaw"),
            buildPak: $("#buildPak"),
            clearPak: $("#clearPak"),
            pakPreview: $("#pakPreview"),
            wadDrop: $("#wadDrop"),
            wadInput: $("#wadInput"),
            wadCount: $("#wadCount"),
            wadOutput: $("#wadOutput"),
            wadGame: $("#wadGame"),
            wadPalette: $("#wadPalette"),
            wadPic: $("#wadPic"),
            buildWad: $("#buildWad"),
            clearWad: $("#clearWad"),
            wadPreview: $("#wadPreview"),
            maketexDrop: $("#maketexDrop"),
            maketexInput: $("#maketexInput"),
            maketexCount: $("#maketexCount"),
            maketexOutput: $("#maketexOutput"),
            buildMaketex: $("#buildMaketex"),
            clearMaketex: $("#clearMaketex"),
            maketexPreview: $("#maketexPreview"),
            generateKind: $("#generateKind"),
            generateGame: $("#generateGame"),
            generatePalette: $("#generatePalette"),
            buildGenerated: $("#buildGenerated"),
            generatePreview: $("#generatePreview")
        });
    }

    function init() {
        collectUi();
        setGameSelects();
        bindEvents();
        renderArchive();
        renderGeneratePreview();
        log("QPakMan Web ready.");
    }

    const core = {
        parsePak,
        parseWad,
        buildPakFromEntries,
        buildWadFromLumps,
        safePakInputPath,
        safeExtractPath,
        parsePaletteText,
        generateSpecial,
        decodeMiptex,
        encodeWal,
        decodeWal,
        copyMiptexFromBspBytes,
        WAD_TYPES
    };

    window.QPakManCore = core;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
