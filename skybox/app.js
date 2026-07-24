(function () {
    "use strict";

    var TAU = Math.PI * 2;
    var DEG = Math.PI / 180;
    var PREVIEW_FACE_SIZE = 192;
    var LOOK_WIDTH = 720;
    var LOOK_HEIGHT = 360;
    var STORAGE_KEY = "q1tools.skybox.settings.v2";

    var FACE_ORDER = [
        { suffix: "rt", label: "Right" },
        { suffix: "bk", label: "Back" },
        { suffix: "lf", label: "Left" },
        { suffix: "ft", label: "Front" },
        { suffix: "up", label: "Up" },
        { suffix: "dn", label: "Down" }
    ];
    var FACE_CROSS_ORDER = ["up", "lf", "ft", "rt", "bk", "dn"];
    var FACE_BY_SUFFIX = FACE_ORDER.reduce(function (acc, face) {
        acc[face.suffix] = face;
        return acc;
    }, {});

    var DEFAULT_SETTINGS = {
        skyName: "customsky",
        faceSize: "1024",
        imageFormat: "png",
        sampling: "1",
        yaw: 0,
        pitch: 0,
        roll: 0,
        exposure: 0,
        jpegQuality: 92,
        toneMap: "reinhard",
        whitePoint: 4
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function mod(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }

    function sanitizeSkyName(value) {
        var cleaned = String(value || "")
            .replace(/\\/g, "/")
            .replace(/^.*?gfx\/env\//i, "")
            .replace(/\.(png|jpg|jpeg|webp|avif|hdr|tga|dds|pcx)$/i, "")
            .replace(/[^a-zA-Z0-9_./-]+/g, "_")
            .replace(/\/+/g, "/")
            .replace(/^\/+|\/+$/g, "")
            .replace(/_{2,}/g, "_");

        cleaned = cleaned.split("/").filter(function (part) {
            return part && part !== "." && part !== "..";
        }).join("/");

        return cleaned || "customsky";
    }

    function skyNameFromFileName(filename) {
        return sanitizeSkyName(String(filename || "customsky").replace(/\.[^.]+$/, ""));
    }

    function outputExtension(format) {
        if (format === "jpg")
            return "jpg";
        if (format === "tga")
            return "tga";
        return "png";
    }

    function outputMime(format) {
        if (format === "jpg")
            return "image/jpeg";
        if (format === "tga")
            return "image/x-tga";
        return "image/png";
    }

    function normalize(dir) {
        var len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
        return [dir[0] / len, dir[1] / len, dir[2] / len];
    }

    function rotateX(dir, radians) {
        var c = Math.cos(radians);
        var s = Math.sin(radians);
        return [dir[0], dir[1] * c + dir[2] * s, -dir[1] * s + dir[2] * c];
    }

    function rotateY(dir, radians) {
        var c = Math.cos(radians);
        var s = Math.sin(radians);
        return [dir[0] * c + dir[2] * s, dir[1], -dir[0] * s + dir[2] * c];
    }

    function rotateZ(dir, radians) {
        var c = Math.cos(radians);
        var s = Math.sin(radians);
        return [dir[0] * c - dir[1] * s, dir[0] * s + dir[1] * c, dir[2]];
    }

    function sourceRotationSettings(settingsOrYaw) {
        if (typeof settingsOrYaw === "number")
            return { yaw: settingsOrYaw, pitch: 0, roll: 0 };
        return settingsOrYaw || DEFAULT_SETTINGS;
    }

    function rotateForSource(dir, settingsOrYaw) {
        var cfg = sourceRotationSettings(settingsOrYaw);
        var out = dir;
        out = rotateZ(out, (Number(cfg.yaw) || 0) * DEG);
        out = rotateX(out, (Number(cfg.pitch) || 0) * DEG);
        out = rotateY(out, (Number(cfg.roll) || 0) * DEG);
        return out;
    }

    function getFaceDirection(suffix, u, v) {
        var s = u * 2 - 1;
        var t = 1 - v * 2;

        if (suffix === "rt")
            return [1, -s, t];
        if (suffix === "bk")
            return [s, 1, t];
        if (suffix === "lf")
            return [-1, s, t];
        if (suffix === "ft")
            return [-s, -1, t];
        if (suffix === "up")
            return [-t, -s, 1];
        if (suffix === "dn")
            return [t, -s, -1];

        return [0, -1, 0];
    }

    function directionToEquirect(dir, settingsOrYaw) {
        var rotated = normalize(rotateForSource(dir, settingsOrYaw));
        var lon = Math.atan2(rotated[0], -rotated[1]);
        var lat = Math.asin(clamp(rotated[2], -1, 1));

        return {
            u: mod(0.5 + lon / TAU, 1),
            v: clamp(0.5 - lat / Math.PI, 0, 1)
        };
    }

    function directionToFaceUv(dir) {
        var x = dir[0];
        var y = dir[1];
        var z = dir[2];
        var ax = Math.abs(x);
        var ay = Math.abs(y);
        var az = Math.abs(z);
        var suffix;
        var s;
        var t;
        var d;

        if (ax >= ay && ax >= az) {
            if (x >= 0) {
                suffix = "rt";
                d = ax || 1;
                s = -y / d;
                t = z / d;
            } else {
                suffix = "lf";
                d = ax || 1;
                s = y / d;
                t = z / d;
            }
        } else if (ay >= ax && ay >= az) {
            if (y >= 0) {
                suffix = "bk";
                d = ay || 1;
                s = x / d;
                t = z / d;
            } else {
                suffix = "ft";
                d = ay || 1;
                s = -x / d;
                t = z / d;
            }
        } else if (z >= 0) {
            suffix = "up";
            d = az || 1;
            s = -y / d;
            t = -x / d;
        } else {
            suffix = "dn";
            d = az || 1;
            s = -y / d;
            t = x / d;
        }

        return {
            suffix: suffix,
            u: clamp((s + 1) * 0.5, 0, 1),
            v: clamp((1 - t) * 0.5, 0, 1)
        };
    }

    function toneMapValue(value, settings, isHdr) {
        var exposed = value * Math.pow(2, Number(settings.exposure) || 0);
        var whitePoint = Math.max(0.001, Number(settings.whitePoint) || DEFAULT_SETTINGS.whitePoint);

        if (!isHdr)
            return clamp(exposed, 0, 1);

        if (settings.toneMap === "linear")
            return clamp(exposed / whitePoint, 0, 1);

        if (settings.toneMap === "aces") {
            var x = exposed / whitePoint;
            return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1);
        }

        return clamp(exposed / (exposed + whitePoint), 0, 1);
    }

    function finishSample(source, rgb, settings) {
        var isHdr = source.kind === "hdr";
        settings = settings || DEFAULT_SETTINGS;
        return [
            toneMapValue(rgb[0], settings, isHdr),
            toneMapValue(rgb[1], settings, isHdr),
            toneMapValue(rgb[2], settings, isHdr)
        ];
    }

    function sampleSource(source, u, v, settings) {
        if (settings && String(settings.sampling) === "3")
            return sampleSourceLanczos(source, u, v, settings);
        return sampleSourceBilinear(source, u, v, settings);
    }

    function sampleSourceBilinear(source, u, v, settings) {
        var width = source.width;
        var height = source.height;
        var x = u * width - 0.5;
        var y = clamp(v * height - 0.5, 0, height - 1);
        var x0 = Math.floor(x);
        var y0 = Math.floor(y);
        var tx = x - x0;
        var ty = y - y0;
        var xA = mod(x0, width);
        var xB = mod(x0 + 1, width);
        var yA = clamp(y0, 0, height - 1);
        var yB = clamp(y0 + 1, 0, height - 1);
        var c00 = readSourcePixel(source, xA, yA);
        var c10 = readSourcePixel(source, xB, yA);
        var c01 = readSourcePixel(source, xA, yB);
        var c11 = readSourcePixel(source, xB, yB);
        var r0 = c00[0] + (c10[0] - c00[0]) * tx;
        var g0 = c00[1] + (c10[1] - c00[1]) * tx;
        var b0 = c00[2] + (c10[2] - c00[2]) * tx;
        var r1 = c01[0] + (c11[0] - c01[0]) * tx;
        var g1 = c01[1] + (c11[1] - c01[1]) * tx;
        var b1 = c01[2] + (c11[2] - c01[2]) * tx;

        return finishSample(source, [
            r0 + (r1 - r0) * ty,
            g0 + (g1 - g0) * ty,
            b0 + (b1 - b0) * ty
        ], settings);
    }

    function lanczosWeight(x, radius) {
        var ax = Math.abs(x);
        if (ax < 0.000001)
            return 1;
        if (ax >= radius)
            return 0;
        var pix = Math.PI * ax;
        return radius * Math.sin(pix) * Math.sin(pix / radius) / (pix * pix);
    }

    function sampleSourceLanczos(source, u, v, settings) {
        var width = source.width;
        var height = source.height;
        var x = u * width - 0.5;
        var y = clamp(v * height - 0.5, 0, height - 1);
        var baseX = Math.floor(x);
        var baseY = Math.floor(y);
        var radius = 3;
        var total = [0, 0, 0];
        var weightSum = 0;

        for (var yy = baseY - radius + 1; yy <= baseY + radius; yy++) {
            var wy = lanczosWeight(y - yy, radius);
            if (!wy)
                continue;
            var sy = clamp(yy, 0, height - 1);
            for (var xx = baseX - radius + 1; xx <= baseX + radius; xx++) {
                var wx = lanczosWeight(x - xx, radius);
                var weight = wx * wy;
                if (!weight)
                    continue;
                var sx = mod(xx, width);
                var c = readSourcePixel(source, sx, sy);
                total[0] += c[0] * weight;
                total[1] += c[1] * weight;
                total[2] += c[2] * weight;
                weightSum += weight;
            }
        }

        if (Math.abs(weightSum) < 0.000001)
            return sampleSourceBilinear(source, u, v, settings);

        return finishSample(source, [
            total[0] / weightSum,
            total[1] / weightSum,
            total[2] / weightSum
        ], settings);
    }

    function readSourcePixel(source, x, y) {
        var index;

        if (source.kind === "hdr") {
            index = (y * source.width + x) * 3;
            return [source.data[index], source.data[index + 1], source.data[index + 2]];
        }

        index = (y * source.width + x) * 4;
        return [
            source.data[index] / 255,
            source.data[index + 1] / 255,
            source.data[index + 2] / 255
        ];
    }

    function sampleImageData(face, u, v) {
        var width = face.width;
        var height = face.height;
        var x = clamp(u * width - 0.5, 0, width - 1);
        var y = clamp(v * height - 0.5, 0, height - 1);
        var x0 = Math.floor(x);
        var y0 = Math.floor(y);
        var x1 = Math.min(width - 1, x0 + 1);
        var y1 = Math.min(height - 1, y0 + 1);
        var tx = x - x0;
        var ty = y - y0;
        var data = face.data;

        function px(ix, iy) {
            var i = (iy * width + ix) * 4;
            return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
        }

        var c00 = px(x0, y0);
        var c10 = px(x1, y0);
        var c01 = px(x0, y1);
        var c11 = px(x1, y1);
        return [
            c00[0] * (1 - tx) * (1 - ty) + c10[0] * tx * (1 - ty) + c01[0] * (1 - tx) * ty + c11[0] * tx * ty,
            c00[1] * (1 - tx) * (1 - ty) + c10[1] * tx * (1 - ty) + c01[1] * (1 - tx) * ty + c11[1] * tx * ty,
            c00[2] * (1 - tx) * (1 - ty) + c10[2] * tx * (1 - ty) + c01[2] * (1 - tx) * ty + c11[2] * tx * ty
        ];
    }

    function sampleCubemap(faceData, dir) {
        var faceUv = directionToFaceUv(dir);
        var face = faceData.get(faceUv.suffix);
        if (!face)
            return [0.08, 0.1, 0.1];
        return sampleImageData(face, faceUv.u, faceUv.v);
    }

    function parseRadianceHDR(arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        var decoder = new TextDecoder("ascii");
        var pos = 0;
        var resolution = null;
        var formatFound = false;

        function readLine() {
            var start = pos;
            while (pos < bytes.length && bytes[pos] !== 10)
                pos++;
            var end = pos;
            if (pos < bytes.length && bytes[pos] === 10)
                pos++;
            if (end > start && bytes[end - 1] === 13)
                end--;
            return decoder.decode(bytes.subarray(start, end));
        }

        var first = readLine();
        if (!/^#\?(RADIANCE|RGBE)/i.test(first))
            throw new Error("Not a Radiance HDR file.");

        while (pos < bytes.length) {
            var line = readLine().trim();
            var match = line.match(/^([+-])Y\s+(\d+)\s+([+-])X\s+(\d+)$/i);
            if (match) {
                resolution = match;
                break;
            }
            if (/^FORMAT=32-bit_rle_rgbe$/i.test(line))
                formatFound = true;
        }

        if (!formatFound)
            throw new Error("HDR format must be 32-bit_rle_rgbe.");
        if (!resolution)
            throw new Error("HDR resolution line is missing.");

        var ySign = resolution[1];
        var height = parseInt(resolution[2], 10);
        var xSign = resolution[3];
        var width = parseInt(resolution[4], 10);
        var data = new Float32Array(width * height * 3);

        function storePixel(fileX, fileY, r, g, b, e) {
            var outX = xSign === "+" ? fileX : width - 1 - fileX;
            var outY = ySign === "-" ? fileY : height - 1 - fileY;
            var out = (outY * width + outX) * 3;
            var scale = e ? Math.pow(2, e - 136) : 0;
            data[out] = (r + 0.5) * scale;
            data[out + 1] = (g + 0.5) * scale;
            data[out + 2] = (b + 0.5) * scale;
        }

        if (width < 8 || width > 32767 || pos + 4 > bytes.length || bytes[pos] !== 2 || bytes[pos + 1] !== 2) {
            for (var py = 0; py < height; py++) {
                for (var px = 0; px < width; px++) {
                    if (pos + 4 > bytes.length)
                        throw new Error("HDR pixel data ended early.");
                    storePixel(px, py, bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
                    pos += 4;
                }
            }
            return { width: width, height: height, data: data };
        }

        var scanline = new Uint8Array(width * 4);
        for (var y = 0; y < height; y++) {
            if (pos + 4 > bytes.length)
                throw new Error("HDR scanline ended early.");
            if (bytes[pos] !== 2 || bytes[pos + 1] !== 2 || (bytes[pos + 2] & 0x80))
                throw new Error("Unsupported mixed HDR RLE encoding.");

            var scanWidth = (bytes[pos + 2] << 8) | bytes[pos + 3];
            pos += 4;
            if (scanWidth !== width)
                throw new Error("HDR scanline width mismatch.");

            for (var channel = 0; channel < 4; channel++) {
                var x = 0;
                while (x < width) {
                    if (pos >= bytes.length)
                        throw new Error("HDR RLE data ended early.");
                    var count = bytes[pos++];
                    if (count > 128) {
                        var run = count - 128;
                        if (run === 0 || pos >= bytes.length || x + run > width)
                            throw new Error("Invalid HDR RLE run.");
                        var value = bytes[pos++];
                        scanline.fill(value, channel * width + x, channel * width + x + run);
                        x += run;
                    } else {
                        if (count === 0 || pos + count > bytes.length || x + count > width)
                            throw new Error("Invalid HDR RLE literal.");
                        scanline.set(bytes.subarray(pos, pos + count), channel * width + x);
                        pos += count;
                        x += count;
                    }
                }
            }

            for (var sx = 0; sx < width; sx++) {
                storePixel(
                    sx,
                    y,
                    scanline[sx],
                    scanline[width + sx],
                    scanline[width * 2 + sx],
                    scanline[width * 3 + sx]
                );
            }
        }

        return { width: width, height: height, data: data };
    }

    var CRC_TABLE = null;

    function makeCrcTable() {
        var table = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++)
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        return table;
    }

    function crc32(bytes) {
        if (!CRC_TABLE)
            CRC_TABLE = makeCrcTable();

        var crc = 0xffffffff;
        for (var i = 0; i < bytes.length; i++)
            crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
    }

    function dateToDos(date) {
        var year = Math.max(1980, date.getFullYear());
        return {
            time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
            date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
        };
    }

    function writeU16(out, value) {
        out.push(value & 255, (value >>> 8) & 255);
    }

    function writeU32(out, value) {
        out.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
    }

    function appendBytes(out, bytes) {
        for (var i = 0; i < bytes.length; i++)
            out.push(bytes[i]);
    }

    function buildStoredZip(entries) {
        var encoder = new TextEncoder();
        var now = dateToDos(new Date());
        var local = [];
        var central = [];

        entries.forEach(function (entry) {
            var nameBytes = encoder.encode(entry.name);
            var data = entry.data;
            var crc = crc32(data);
            var localStart = local.length;

            writeU32(local, 0x04034b50);
            writeU16(local, 20);
            writeU16(local, 0x0800);
            writeU16(local, 0);
            writeU16(local, now.time);
            writeU16(local, now.date);
            writeU32(local, crc);
            writeU32(local, data.length);
            writeU32(local, data.length);
            writeU16(local, nameBytes.length);
            writeU16(local, 0);
            appendBytes(local, nameBytes);
            appendBytes(local, data);

            writeU32(central, 0x02014b50);
            writeU16(central, 20);
            writeU16(central, 20);
            writeU16(central, 0x0800);
            writeU16(central, 0);
            writeU16(central, now.time);
            writeU16(central, now.date);
            writeU32(central, crc);
            writeU32(central, data.length);
            writeU32(central, data.length);
            writeU16(central, nameBytes.length);
            writeU16(central, 0);
            writeU16(central, 0);
            writeU16(central, 0);
            writeU16(central, 0);
            writeU32(central, 0);
            writeU32(central, localStart);
            appendBytes(central, nameBytes);
        });

        var centralOffset = local.length;
        appendBytes(local, central);
        writeU32(local, 0x06054b50);
        writeU16(local, 0);
        writeU16(local, 0);
        writeU16(local, entries.length);
        writeU16(local, entries.length);
        writeU32(local, central.length);
        writeU32(local, centralOffset);
        writeU16(local, 0);

        return new Uint8Array(local);
    }

    function createCanvas(width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (blob)
                    resolve(blob);
                else
                    reject(new Error("Could not encode image."));
            }, type, quality);
        });
    }

    function initPage() {
        var els = {
            dropZone: document.getElementById("dropZone"),
            dropIcon: document.getElementById("dropIcon"),
            dropTitle: document.getElementById("dropTitle"),
            dropHint: document.getElementById("dropHint"),
            dropThumb: document.getElementById("dropThumb"),
            fileInput: document.getElementById("fileInput"),
            samplePreset: document.getElementById("samplePreset"),
            sampleButton: document.getElementById("sampleButton"),
            skyName: document.getElementById("skyName"),
            faceSize: document.getElementById("faceSize"),
            imageFormat: document.getElementById("imageFormat"),
            sampling: document.getElementById("sampling"),
            yaw: document.getElementById("yaw"),
            yawNumber: document.getElementById("yawNumber"),
            pitch: document.getElementById("pitch"),
            pitchNumber: document.getElementById("pitchNumber"),
            roll: document.getElementById("roll"),
            rollNumber: document.getElementById("rollNumber"),
            exposure: document.getElementById("exposure"),
            exposureNumber: document.getElementById("exposureNumber"),
            jpegQuality: document.getElementById("jpegQuality"),
            jpegQualityNumber: document.getElementById("jpegQualityNumber"),
            toneMap: document.getElementById("toneMap"),
            whitePoint: document.getElementById("whitePoint"),
            whitePointNumber: document.getElementById("whitePointNumber"),
            renderButton: document.getElementById("renderButton"),
            cancelButton: document.getElementById("cancelButton"),
            zipButton: document.getElementById("zipButton"),
            progress: document.getElementById("progress"),
            progressFill: document.getElementById("progressFill"),
            status: document.getElementById("status"),
            sourceBadge: document.getElementById("sourceBadge"),
            outputReadout: document.getElementById("outputReadout"),
            yawReadout: document.getElementById("yawReadout"),
            pitchReadout: document.getElementById("pitchReadout"),
            rollReadout: document.getElementById("rollReadout"),
            exposureReadout: document.getElementById("exposureReadout"),
            qualityReadout: document.getElementById("qualityReadout"),
            lookCanvas: document.getElementById("lookCanvas"),
            panoramaCanvas: document.getElementById("panoramaCanvas"),
            warningList: document.getElementById("warningList"),
            seamBadge: document.getElementById("seamBadge"),
            faceGrid: document.getElementById("faceGrid"),
            emptyFaces: document.getElementById("emptyFaces")
        };
        var state = {
            source: null,
            sourceName: "",
            brightest: null,
            faceCanvases: new Map(),
            faceLinks: new Map(),
            facePaths: new Map(),
            faceData: new Map(),
            generatedUrls: [],
            renderSerial: 0,
            previewTimer: 0,
            renderWorker: null,
            renderActive: false,
            renderReject: null,
            seamReport: null,
            lookYaw: 0,
            lookPitch: 0
        };

        applyStoredSettings(els);
        createFaceCards(els, state);
        bindControls(els, state);
        updateReadouts(els, state);
        drawEmptyLook(els.lookCanvas);
        clearCanvas(els.panoramaCanvas);

        function bindControls(els, state) {
            bindDropZone(els, state);
            bindRangePair(els.yaw, els.yawNumber, DEFAULT_SETTINGS.yaw, -180, 180, function () {
                onSettingsChanged(els, state, true);
            });
            bindRangePair(els.pitch, els.pitchNumber, DEFAULT_SETTINGS.pitch, -90, 90, function () {
                onSettingsChanged(els, state, true);
            });
            bindRangePair(els.roll, els.rollNumber, DEFAULT_SETTINGS.roll, -180, 180, function () {
                onSettingsChanged(els, state, true);
            });
            bindRangePair(els.exposure, els.exposureNumber, DEFAULT_SETTINGS.exposure, -3, 3, function () {
                onSettingsChanged(els, state, true);
            });
            bindRangePair(els.jpegQuality, els.jpegQualityNumber, DEFAULT_SETTINGS.jpegQuality, 70, 98, function () {
                onSettingsChanged(els, state, false);
            });
            bindRangePair(els.whitePoint, els.whitePointNumber, DEFAULT_SETTINGS.whitePoint, 1, 16, function () {
                onSettingsChanged(els, state, true);
            });

            [els.skyName, els.faceSize, els.imageFormat, els.sampling, els.toneMap].forEach(function (input) {
                input.addEventListener("input", function () {
                    onSettingsChanged(els, state, input !== els.faceSize && input !== els.sampling && input !== els.imageFormat);
                });
            });
            els.renderButton.addEventListener("click", function () {
                renderFullFaces(els, state);
            });
            els.cancelButton.addEventListener("click", function () {
                cancelActiveRender(els, state, "Render canceled.");
            });
            els.zipButton.addEventListener("click", function () {
                downloadZip(els, state);
            });
            els.sampleButton.addEventListener("click", function () {
                loadSamplePanorama(els, state);
            });
            bindLookCanvas(els, state);
        }
    }

    function bindRangePair(range, number, defaultValue, min, max, onInput) {
        function syncFrom(source) {
            var value = clamp(Number(source.value) || 0, min, max);
            range.value = String(value);
            number.value = String(value);
            onInput();
        }

        range.addEventListener("input", function () {
            syncFrom(range);
        });
        number.addEventListener("input", function () {
            syncFrom(number);
        });
        [range, number].forEach(function (input) {
            input.addEventListener("dblclick", function () {
                range.value = String(defaultValue);
                number.value = String(defaultValue);
                onInput();
            });
        });
    }

    function bindDropZone(els, state) {
        els.dropZone.addEventListener("click", function () {
            els.fileInput.click();
        });
        els.dropZone.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                els.fileInput.click();
            }
        });
        ["dragenter", "dragover"].forEach(function (eventName) {
            els.dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                els.dropZone.classList.add("active");
            });
        });
        ["dragleave", "drop"].forEach(function (eventName) {
            els.dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                els.dropZone.classList.remove("active");
            });
        });
        els.dropZone.addEventListener("drop", function (event) {
            var file = event.dataTransfer.files && event.dataTransfer.files[0];
            if (file)
                loadFile(file, els, state);
        });
        els.fileInput.addEventListener("change", function () {
            var file = els.fileInput.files && els.fileInput.files[0];
            if (file)
                loadFile(file, els, state);
        });
    }

    function bindLookCanvas(els, state) {
        var active = false;
        var lastX = 0;
        var lastY = 0;

        els.lookCanvas.addEventListener("pointerdown", function (event) {
            active = true;
            lastX = event.clientX;
            lastY = event.clientY;
            els.lookCanvas.setPointerCapture(event.pointerId);
        });
        els.lookCanvas.addEventListener("pointermove", function (event) {
            if (!active)
                return;
            state.lookYaw += (event.clientX - lastX) * 0.25;
            state.lookPitch = clamp(state.lookPitch + (event.clientY - lastY) * 0.2, -88, 88);
            lastX = event.clientX;
            lastY = event.clientY;
            renderLookPreview(els, state);
        });
        els.lookCanvas.addEventListener("pointerup", function (event) {
            active = false;
            els.lookCanvas.releasePointerCapture(event.pointerId);
        });
        els.lookCanvas.addEventListener("dblclick", function () {
            state.lookYaw = 0;
            state.lookPitch = 0;
            renderLookPreview(els, state);
        });
    }

    function createFaceCards(els, state) {
        FACE_CROSS_ORDER.forEach(function (suffix) {
            var face = FACE_BY_SUFFIX[suffix];
            var card = document.createElement("article");
            var canvas = createCanvas(PREVIEW_FACE_SIZE, PREVIEW_FACE_SIZE);
            var meta = document.createElement("div");
            var title = document.createElement("div");
            var path = document.createElement("div");
            var link = document.createElement("a");

            card.className = "face-card face-" + suffix;
            meta.className = "face-meta";
            title.className = "face-title";
            path.className = "face-path";
            link.className = "face-download disabled";
            link.href = "#";
            link.innerHTML = '<i class="fa-solid fa-download"></i><span>Download</span>';
            title.innerHTML = "<span>" + face.label + "</span><span>" + face.suffix + "</span>";
            meta.append(title, path, link);
            card.append(canvas, meta);
            els.faceGrid.appendChild(card);
            state.faceCanvases.set(face.suffix, canvas);
            state.faceLinks.set(face.suffix, link);
            state.facePaths.set(face.suffix, path);
            clearCanvas(canvas);
        });
    }

    function settings(els) {
        return {
            skyName: sanitizeSkyName(els.skyName.value),
            faceSize: els.faceSize.value,
            imageFormat: els.imageFormat.value,
            sampling: els.sampling.value,
            yaw: Number(els.yaw.value) || 0,
            pitch: Number(els.pitch.value) || 0,
            roll: Number(els.roll.value) || 0,
            exposure: Number(els.exposure.value) || 0,
            jpegQuality: Number(els.jpegQuality.value) || DEFAULT_SETTINGS.jpegQuality,
            toneMap: els.toneMap.value,
            whitePoint: Number(els.whitePoint.value) || DEFAULT_SETTINGS.whitePoint
        };
    }

    function applyStoredSettings(els) {
        var stored = {};
        try {
            stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
        } catch (e) {
            stored = {};
        }
        var cfg = Object.assign({}, DEFAULT_SETTINGS, stored);

        els.skyName.value = sanitizeSkyName(cfg.skyName);
        els.faceSize.value = String(cfg.faceSize);
        els.imageFormat.value = ["png", "jpg", "tga"].indexOf(cfg.imageFormat) >= 0 ? cfg.imageFormat : "png";
        els.sampling.value = ["1", "2", "3"].indexOf(String(cfg.sampling)) >= 0 ? String(cfg.sampling) : "1";
        els.yaw.value = els.yawNumber.value = String(clamp(Number(cfg.yaw) || 0, -180, 180));
        els.pitch.value = els.pitchNumber.value = String(clamp(Number(cfg.pitch) || 0, -90, 90));
        els.roll.value = els.rollNumber.value = String(clamp(Number(cfg.roll) || 0, -180, 180));
        els.exposure.value = els.exposureNumber.value = String(clamp(Number(cfg.exposure) || 0, -3, 3));
        els.jpegQuality.value = els.jpegQualityNumber.value = String(clamp(Number(cfg.jpegQuality) || 92, 70, 98));
        els.toneMap.value = ["reinhard", "aces", "linear"].indexOf(cfg.toneMap) >= 0 ? cfg.toneMap : "reinhard";
        els.whitePoint.value = els.whitePointNumber.value = String(clamp(Number(cfg.whitePoint) || 4, 1, 16));
    }

    function saveSettings(els) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings(els)));
        } catch (e) {
            /* localStorage may be unavailable in strict browser modes. */
        }
    }

    function onSettingsChanged(els, state, previewMatters) {
        if (state.renderActive)
            cancelActiveRender(els, state, "Settings changed. Render canceled; preview will update.");
        updateReadouts(els, state);
        saveSettings(els);
        markExportsStale(els, state);
        updateWarnings(els, state);

        if (!state.source)
            return;
        if (previewMatters)
            schedulePreviewRender(els, state);
    }

    function outputPath(els, suffix) {
        var cfg = settings(els);
        return "gfx/env/" + cfg.skyName + suffix + "." + outputExtension(cfg.imageFormat);
    }

    function updateReadouts(els, state) {
        var cfg = settings(els);
        els.outputReadout.textContent = "gfx/env/" + cfg.skyName + "rt." + outputExtension(cfg.imageFormat);
        els.yawReadout.textContent = cfg.yaw + " deg";
        els.pitchReadout.textContent = cfg.pitch + " deg";
        els.rollReadout.textContent = cfg.roll + " deg";
        els.exposureReadout.textContent = cfg.exposure.toFixed(1) + " stops";
        els.qualityReadout.textContent = cfg.imageFormat === "jpg" ? String(Math.round(cfg.jpegQuality)) : "lossless";
        els.jpegQuality.disabled = cfg.imageFormat !== "jpg";
        els.jpegQualityNumber.disabled = cfg.imageFormat !== "jpg";

        FACE_ORDER.forEach(function (face) {
            var path = state.facePaths.get(face.suffix);
            if (path)
                path.textContent = outputPath(els, face.suffix);
        });
    }

    async function loadFile(file, els, state) {
        if (state.renderActive)
            cancelActiveRender(els, state, "Loading a new panorama canceled the active render.");
        clearGeneratedUrls(state);
        state.seamReport = null;
        updateSeamBadge(els, state);
        setStatus(els, "Loading " + file.name + "...");
        setProgress(els, 0);
        els.renderButton.disabled = true;
        els.zipButton.disabled = true;

        try {
            var source = /\.hdr$/i.test(file.name) ? await decodeHdrFile(file) : await decodeImageFile(file);
            state.source = source;
            state.sourceName = file.name;
            state.brightest = findBrightestPoint(source);
            els.skyName.value = skyNameFromFileName(file.name);
            afterSourceLoaded(els, state);
            setStatus(els, "Preview ready. Render faces when you want export files.", "success");
        } catch (error) {
            state.source = null;
            state.sourceName = "";
            els.sourceBadge.textContent = "No file";
            updateDropZoneEmpty(els);
            updateWarnings(els, state, [error.message]);
            setStatus(els, error.message, "error");
        } finally {
            setProgress(els, null);
        }
    }

    function afterSourceLoaded(els, state) {
        els.sourceBadge.textContent = state.source.width + " x " + state.source.height;
        els.renderButton.disabled = false;
        els.zipButton.disabled = true;
        updateDropZoneLoaded(els, state);
        updateReadouts(els, state);
        updateSeamBadge(els, state);
        updateWarnings(els, state);
        saveSettings(els);
        drawPanoramaPreview(els, state);
        renderPreviewFaces(els, state);
    }

    async function decodeImageFile(file) {
        var url = URL.createObjectURL(file);
        try {
            var image = await new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () {
                    resolve(img);
                };
                img.onerror = function () {
                    reject(new Error("The browser could not decode this image."));
                };
                img.src = url;
            });
            var canvas = createCanvas(image.naturalWidth, image.naturalHeight);
            var ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(image, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return {
                kind: "ldr",
                width: canvas.width,
                height: canvas.height,
                data: imageData.data,
                filename: file.name
            };
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async function decodeHdrFile(file) {
        var parsed = parseRadianceHDR(await file.arrayBuffer());
        return {
            kind: "hdr",
            width: parsed.width,
            height: parsed.height,
            data: parsed.data,
            filename: file.name
        };
    }

    async function loadSamplePanorama(els, state) {
        var preset = els.samplePreset.value || "dawn";
        var sample = buildSamplePanorama(preset);
        if (state.renderActive)
            cancelActiveRender(els, state, "Loading a sample canceled the active render.");
        clearGeneratedUrls(state);
        state.seamReport = null;
        updateSeamBadge(els, state);
        state.source = sample;
        state.sourceName = sample.filename;
        state.brightest = findBrightestPoint(sample);
        els.faceSize.value = "256";
        els.skyName.value = preset + "_sky";
        afterSourceLoaded(els, state);
        setStatus(els, "Sample preview ready. Render faces to create downloads.", "success");
    }

    function buildSamplePanorama(preset) {
        var width = 1024;
        var height = 512;
        var data = new Uint8ClampedArray(width * height * 4);

        for (var y = 0; y < height; y++) {
            var lat = y / (height - 1);
            for (var x = 0; x < width; x++) {
                var lon = x / (width - 1);
                var i = (y * width + x) * 4;
                var r;
                var g;
                var b;
                if (preset === "space") {
                    var star = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
                    star = star < 0 ? star + 1 : star;
                    var nebula = Math.max(0, Math.sin(lon * 14 + lat * 11) * 0.5 + 0.5);
                    r = 10 + nebula * 28 + (star > 0.996 ? 230 : 0);
                    g = 16 + nebula * 18 + (star > 0.996 ? 230 : 0);
                    b = 34 + nebula * 68 + (star > 0.996 ? 230 : 0);
                } else if (preset === "storm") {
                    var cloud = Math.max(0, Math.sin(lon * Math.PI * 18 + lat * 10) * 0.5 + 0.5);
                    var breakLight = Math.max(0, 1 - Math.hypot(lon - 0.72, lat - 0.48) * 5);
                    r = 38 + cloud * 42 + breakLight * 80;
                    g = 52 + cloud * 48 + breakLight * 88;
                    b = 70 + cloud * 55 + breakLight * 110;
                } else {
                    var sun = Math.max(0, 1 - Math.hypot(lon - 0.62, lat - 0.34) * 8);
                    var haze = Math.max(0, 1 - Math.abs(lat - 0.58) * 4);
                    r = 56 + 100 * (1 - lat) + sun * 120 + haze * 45;
                    g = 104 + 110 * (1 - lat) + sun * 88 + haze * 55;
                    b = 165 + 75 * (1 - lat) + sun * 32;
                }
                data[i] = Math.round(clamp(r, 0, 255));
                data[i + 1] = Math.round(clamp(g, 0, 255));
                data[i + 2] = Math.round(clamp(b, 0, 255));
                data[i + 3] = 255;
            }
        }

        return {
            kind: "ldr",
            width: width,
            height: height,
            data: data,
            filename: preset + "-sample.png"
        };
    }

    function updateDropZoneLoaded(els, state) {
        var canvas = els.dropThumb;
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        var cfg = settings(els);

        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
                var color = sampleSource(state.source, (x + 0.5) / canvas.width, (y + 0.5) / canvas.height, cfg);
                var out = (y * canvas.width + x) * 4;
                imageData.data[out] = Math.round(color[0] * 255);
                imageData.data[out + 1] = Math.round(color[1] * 255);
                imageData.data[out + 2] = Math.round(color[2] * 255);
                imageData.data[out + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.hidden = false;
        els.dropIcon.hidden = true;
        els.dropTitle.textContent = state.sourceName || state.source.filename || "Panorama loaded";
        els.dropHint.textContent = (state.source.kind === "hdr" ? "HDR" : "LDR") + " - " + state.source.width + " x " + state.source.height;
    }

    function updateDropZoneEmpty(els) {
        els.dropThumb.hidden = true;
        els.dropIcon.hidden = false;
        els.dropTitle.textContent = "Drop a true 360\u00b0 panorama";
        els.dropHint.textContent = "JPG, PNG, WebP, AVIF, or Radiance HDR";
    }

    function findBrightestPoint(source) {
        var best = { x: 0.5, y: 0.5, value: -1 };
        var step = Math.max(1, Math.floor(Math.max(source.width, source.height) / 512));
        for (var y = 0; y < source.height; y += step) {
            for (var x = 0; x < source.width; x += step) {
                var c = readSourcePixel(source, x, y);
                var luma = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
                if (luma > best.value)
                    best = { x: (x + 0.5) / source.width, y: (y + 0.5) / source.height, value: luma };
            }
        }
        return best;
    }

    function drawPanoramaPreview(els, state) {
        if (!state.source) {
            clearCanvas(els.panoramaCanvas);
            return;
        }

        var canvas = els.panoramaCanvas;
        var ctx = canvas.getContext("2d");
        var width = canvas.width;
        var height = canvas.height;
        var imageData = ctx.createImageData(width, height);
        var cfg = settings(els);

        for (var y = 0; y < height; y++) {
            var v = (y + 0.5) / height;
            for (var x = 0; x < width; x++) {
                var u = (x + 0.5) / width;
                var color = sampleSource(state.source, u, v, cfg);
                var out = (y * width + x) * 4;
                imageData.data[out] = Math.round(color[0] * 255);
                imageData.data[out + 1] = Math.round(color[1] * 255);
                imageData.data[out + 2] = Math.round(color[2] * 255);
                imageData.data[out + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        ctx.strokeStyle = "rgba(255, 220, 168, 0.8)";
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, Math.round(height / 2) + 0.5);
        ctx.lineTo(width, Math.round(height / 2) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);

        if (state.brightest) {
            var bx = state.brightest.x * width;
            var by = state.brightest.y * height;
            ctx.strokeStyle = "#fff2d6";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bx, by, 10, 0, TAU);
            ctx.moveTo(bx - 16, by);
            ctx.lineTo(bx + 16, by);
            ctx.moveTo(bx, by - 16);
            ctx.lineTo(bx, by + 16);
            ctx.stroke();
        }
        ctx.restore();
    }

    function schedulePreviewRender(els, state) {
        clearTimeout(state.previewTimer);
        state.previewTimer = setTimeout(function () {
            drawPanoramaPreview(els, state);
            renderPreviewFaces(els, state);
        }, 140);
    }

    async function renderPreviewFaces(els, state) {
        if (!state.source)
            return;
        var serial = ++state.renderSerial;
        var cfg = settings(els);

        setStatus(els, "Updating preview...");
        state.faceData = new Map();
        for (var i = 0; i < FACE_ORDER.length; i++) {
            if (serial !== state.renderSerial)
                return;
            var face = FACE_ORDER[i];
            var canvas = state.faceCanvases.get(face.suffix);
            var imageData = await renderFaceToCanvas(state.source, cfg, face, canvas, PREVIEW_FACE_SIZE, 1, null);
            state.faceData.set(face.suffix, imageDataToFace(imageData));
        }
        if (els.emptyFaces)
            els.emptyFaces.hidden = true;
        state.seamReport = analyzeSeams(state.faceData);
        renderLookPreview(els, state);
        updateSeamBadge(els, state);
        updateWarnings(els, state);
        setStatus(els, "Preview ready. Render faces when you want export files.", "success");
    }

    async function renderFullFaces(els, state) {
        if (!state.source)
            return;
        if (state.renderActive) {
            cancelActiveRender(els, state, "Render canceled.");
            return;
        }

        var serial = ++state.renderSerial;
        var cfg = settings(els);
        var size = Number(cfg.faceSize) || 1024;
        var sampling = cfg.sampling || "1";

        clearGeneratedUrls(state);
        state.seamReport = null;
        updateSeamBadge(els, state);
        setProgress(els, 0);
        state.renderActive = true;
        els.renderButton.disabled = true;
        els.cancelButton.hidden = false;
        els.cancelButton.disabled = false;
        els.zipButton.disabled = true;
        setStatus(els, "Rendering " + size + " x " + size + " export faces...");

        try {
            state.faceData = new Map();
            if (canUseWorkerRenderer()) {
                try {
                    await renderFullFacesWithWorker(els, state, cfg, size, sampling, serial);
                } catch (workerError) {
                    if (workerError && workerError._skyboxCanceled)
                        throw workerError;
                    if (serial !== state.renderSerial)
                        return;
                    state.renderWorker = null;
                    state.renderReject = null;
                    console.warn("Skybox worker renderer failed; falling back to main thread.", workerError);
                    state.faceData = new Map();
                    clearGeneratedUrls(state);
                    setStatus(els, "Worker unavailable. Rendering on the main thread...");
                    await renderFullFacesOnMain(els, state, cfg, size, sampling, serial);
                }
            } else {
                await renderFullFacesOnMain(els, state, cfg, size, sampling, serial);
            }

            if (serial !== state.renderSerial)
                return;

            setProgress(els, 1);
            state.seamReport = analyzeSeams(state.faceData);
            renderLookPreview(els, state);
            updateSeamBadge(els, state);
            updateWarnings(els, state);
            els.zipButton.disabled = false;
            setStatus(els, "Ready: six Quakespasm faces exported under gfx/env/. " + seamSummary(state.seamReport), "success");
        } catch (error) {
            if (error && error._skyboxCanceled)
                setStatus(els, error.message || "Render canceled.");
            else
                setStatus(els, error.message, "error");
        } finally {
            if (state.renderWorker) {
                state.renderWorker.terminate();
                state.renderWorker = null;
            }
            state.renderReject = null;
            state.renderActive = false;
            els.cancelButton.hidden = true;
            els.cancelButton.disabled = true;
            els.renderButton.disabled = !state.source;
            setTimeout(function () {
                setProgress(els, null);
            }, 500);
        }
    }

    async function renderFullFacesOnMain(els, state, cfg, size, sampling, serial) {
        for (var i = 0; i < FACE_ORDER.length; i++) {
            if (serial !== state.renderSerial)
                throw createCanceledError("Render canceled.");
            var face = FACE_ORDER[i];
            var canvas = state.faceCanvases.get(face.suffix);
            var imageData = await renderFaceToCanvas(state.source, cfg, face, canvas, size, sampling, function (row, totalRows) {
                setProgress(els, (i + row / totalRows) / FACE_ORDER.length);
            }, function () {
                return serial !== state.renderSerial;
            });
            var faceData = imageDataToFace(imageData);
            state.faceData.set(face.suffix, faceData);
            await updateFaceDownload(els, state, face, cfg, canvas, faceData);
            setStatus(els, "Rendered " + (i + 1) + " of " + FACE_ORDER.length + " faces...");
            await waitFrame();
        }
    }

    function renderFullFacesWithWorker(els, state, cfg, size, sampling, serial) {
        return new Promise(function (resolve, reject) {
            var worker;
            var downloadTasks = [];
            var settled = false;

            function fail(error) {
                if (settled)
                    return;
                settled = true;
                if (worker)
                    worker.terminate();
                if (state.renderWorker === worker)
                    state.renderWorker = null;
                reject(error);
            }

            function finish() {
                if (settled)
                    return;
                settled = true;
                if (worker)
                    worker.terminate();
                if (state.renderWorker === worker)
                    state.renderWorker = null;
                Promise.all(downloadTasks).then(resolve, reject);
            }

            try {
                worker = new Worker("worker.js");
            } catch (error) {
                reject(error);
                return;
            }

            state.renderWorker = worker;
            state.renderReject = fail;

            worker.onerror = function (event) {
                fail(new Error(event.message || "Worker renderer failed."));
            };

            worker.onmessage = function (event) {
                var message = event.data || {};
                if (message.jobId !== serial)
                    return;
                if (serial !== state.renderSerial) {
                    fail(createCanceledError("Render canceled."));
                    return;
                }

                if (message.type === "progress") {
                    setProgress(els, (message.faceIndex + message.row / message.totalRows) / FACE_ORDER.length);
                    return;
                }

                if (message.type === "face") {
                    var face = FACE_BY_SUFFIX[message.suffix];
                    var canvas = state.faceCanvases.get(message.suffix);
                    var faceData = {
                        width: message.width,
                        height: message.height,
                        data: new Uint8ClampedArray(message.buffer)
                    };
                    putFaceDataToCanvas(canvas, faceData);
                    state.faceData.set(message.suffix, faceData);
                    if (els.emptyFaces)
                        els.emptyFaces.hidden = true;
                    downloadTasks.push(updateFaceDownload(els, state, face, cfg, canvas, faceData));
                    setStatus(els, "Rendered " + message.doneFaces + " of " + FACE_ORDER.length + " faces...");
                    return;
                }

                if (message.type === "done") {
                    finish();
                    return;
                }

                if (message.type === "error")
                    fail(new Error(message.message || "Worker renderer failed."));
            };

            worker.postMessage({
                type: "renderFaces",
                jobId: serial,
                source: cloneSourceForWorker(state.source),
                cfg: cfg,
                size: size,
                sampling: sampling
            });
        });
    }

    function canUseWorkerRenderer() {
        return typeof Worker !== "undefined";
    }

    function cloneSourceForWorker(source) {
        var data = source.kind === "hdr"
            ? new Float32Array(source.data)
            : new Uint8ClampedArray(source.data);
        return {
            kind: source.kind,
            width: source.width,
            height: source.height,
            data: data,
            filename: source.filename
        };
    }

    function cancelActiveRender(els, state, message) {
        if (!state.renderActive)
            return;
        state.renderSerial++;
        if (state.renderWorker) {
            state.renderWorker.terminate();
            state.renderWorker = null;
        }
        if (state.renderReject) {
            state.renderReject(createCanceledError(message || "Render canceled."));
            state.renderReject = null;
        }
        state.renderActive = false;
        els.cancelButton.hidden = true;
        els.cancelButton.disabled = true;
        els.renderButton.disabled = !state.source;
        els.zipButton.disabled = true;
        setProgress(els, null);
        setStatus(els, message || "Render canceled.");
    }

    function createCanceledError(message) {
        var error = new Error(message || "Render canceled.");
        error._skyboxCanceled = true;
        return error;
    }

    function sampleOffsets(sampling) {
        return String(sampling) === "2"
            ? [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]
            : [[0.5, 0.5]];
    }

    function renderFacePixels(source, cfg, face, size, sampling, onProgress) {
        var data = new Uint8ClampedArray(size * size * 4);
        var offsets = sampleOffsets(sampling);

        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                var color = [0, 0, 0];
                for (var s = 0; s < offsets.length; s++) {
                    var u = (x + offsets[s][0]) / size;
                    var v = (y + offsets[s][1]) / size;
                    var dir = getFaceDirection(face.suffix, u, v);
                    var uv = directionToEquirect(dir, cfg);
                    var sample = sampleSource(source, uv.u, uv.v, cfg);
                    color[0] += sample[0];
                    color[1] += sample[1];
                    color[2] += sample[2];
                }
                var out = (y * size + x) * 4;
                data[out] = Math.round((color[0] / offsets.length) * 255);
                data[out + 1] = Math.round((color[1] / offsets.length) * 255);
                data[out + 2] = Math.round((color[2] / offsets.length) * 255);
                data[out + 3] = 255;
            }
            if (y % 32 === 31 && onProgress)
                onProgress(y + 1, size);
        }

        if (onProgress)
            onProgress(size, size);

        return {
            width: size,
            height: size,
            data: data
        };
    }

    async function renderFaceToCanvas(source, cfg, face, canvas, size, sampling, onProgress, shouldCancel) {
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext("2d", { willReadFrequently: false });
        var imageData = ctx.createImageData(size, size);
        var offsets = sampleOffsets(sampling);

        for (var y = 0; y < size; y++) {
            if (shouldCancel && shouldCancel())
                throw createCanceledError("Render canceled.");
            for (var x = 0; x < size; x++) {
                var color = [0, 0, 0];
                for (var s = 0; s < offsets.length; s++) {
                    var u = (x + offsets[s][0]) / size;
                    var v = (y + offsets[s][1]) / size;
                    var dir = getFaceDirection(face.suffix, u, v);
                    var uv = directionToEquirect(dir, cfg);
                    var sample = sampleSource(source, uv.u, uv.v, cfg);
                    color[0] += sample[0];
                    color[1] += sample[1];
                    color[2] += sample[2];
                }
                var out = (y * size + x) * 4;
                imageData.data[out] = Math.round((color[0] / offsets.length) * 255);
                imageData.data[out + 1] = Math.round((color[1] / offsets.length) * 255);
                imageData.data[out + 2] = Math.round((color[2] / offsets.length) * 255);
                imageData.data[out + 3] = 255;
            }
            if (y % 32 === 31) {
                if (onProgress)
                    onProgress(y + 1, size);
                await waitFrame();
            }
        }

        if (onProgress)
            onProgress(size, size);
        ctx.putImageData(imageData, 0, 0);
        return imageData;
    }

    function imageDataToFace(imageData) {
        return {
            width: imageData.width,
            height: imageData.height,
            data: imageData.data
        };
    }

    function putFaceDataToCanvas(canvas, faceData) {
        canvas.width = faceData.width;
        canvas.height = faceData.height;
        var ctx = canvas.getContext("2d", { willReadFrequently: false });
        var imageData = ctx.createImageData(faceData.width, faceData.height);
        imageData.data.set(faceData.data);
        ctx.putImageData(imageData, 0, 0);
    }

    function encodeTga(faceData) {
        var width = faceData.width;
        var height = faceData.height;
        if (width > 65535 || height > 65535)
            throw new Error("TGA export is limited to 65535 pixels per side.");

        var source = faceData.data;
        var out = new Uint8Array(18 + width * height * 3);
        out[2] = 2;
        out[12] = width & 255;
        out[13] = (width >> 8) & 255;
        out[14] = height & 255;
        out[15] = (height >> 8) & 255;
        out[16] = 24;
        out[17] = 0x20;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var src = (y * width + x) * 4;
                var dst = 18 + (y * width + x) * 3;
                out[dst] = source[src + 2];
                out[dst + 1] = source[src + 1];
                out[dst + 2] = source[src];
            }
        }

        return out;
    }

    function renderLookPreview(els, state) {
        var canvas = els.lookCanvas;
        var ctx = canvas.getContext("2d");
        canvas.width = LOOK_WIDTH;
        canvas.height = LOOK_HEIGHT;

        if (!state.faceData || !state.faceData.size) {
            drawEmptyLook(canvas);
            return;
        }

        var imageData = ctx.createImageData(canvas.width, canvas.height);
        var aspect = canvas.width / canvas.height;
        var fov = 90 * DEG;
        var tanHalf = Math.tan(fov * 0.5);
        var yaw = state.lookYaw * DEG;
        var pitch = state.lookPitch * DEG;

        for (var y = 0; y < canvas.height; y++) {
            var py = (1 - ((y + 0.5) / canvas.height) * 2) * tanHalf;
            for (var x = 0; x < canvas.width; x++) {
                var px = (((x + 0.5) / canvas.width) * 2 - 1) * tanHalf * aspect;
                var dir = normalize([px, -1, py]);
                dir = rotateX(dir, pitch);
                dir = rotateZ(dir, yaw);
                var color = sampleCubemap(state.faceData, dir);
                var out = (y * canvas.width + x) * 4;
                imageData.data[out] = Math.round(color[0] * 255);
                imageData.data[out + 1] = Math.round(color[1] * 255);
                imageData.data[out + 2] = Math.round(color[2] * 255);
                imageData.data[out + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
        ctx.stroke();
        ctx.restore();
    }

    function drawEmptyLook(canvas) {
        var ctx = canvas.getContext("2d");
        canvas.width = LOOK_WIDTH;
        canvas.height = LOOK_HEIGHT;
        ctx.fillStyle = "#121717";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#aebcbc";
        ctx.font = "16px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Load a panorama to preview from inside the skybox", canvas.width / 2, canvas.height / 2);
    }

    async function updateFaceDownload(els, state, face, cfg, canvas, faceData) {
        var link = state.faceLinks.get(face.suffix);
        var path = outputPath(els, face.suffix);
        var filename = path.split("/").pop();
        var blob = await faceBlob(cfg, canvas, faceData);
        var url = URL.createObjectURL(blob);

        state.generatedUrls.push(url);
        link.href = url;
        link.download = filename;
        link.dataset.path = path;
        link.classList.remove("disabled");
        link._skyboxBlob = blob;
        state.facePaths.get(face.suffix).textContent = path;
    }

    async function faceBlob(cfg, canvas, faceData) {
        if (cfg.imageFormat === "tga")
            return new Blob([encodeTga(faceData)], { type: outputMime(cfg.imageFormat) });
        return canvasToBlob(canvas, outputMime(cfg.imageFormat), clamp(cfg.jpegQuality / 100, 0.7, 0.98));
    }

    async function downloadZip(els, state) {
        var cfg = settings(els);
        var entries = [];

        for (var i = 0; i < FACE_ORDER.length; i++) {
            var face = FACE_ORDER[i];
            var link = state.faceLinks.get(face.suffix);
            if (!link || !link._skyboxBlob)
                return;
            entries.push({
                name: outputPath(els, face.suffix),
                data: new Uint8Array(await link._skyboxBlob.arrayBuffer())
            });
        }
        entries.push({
            name: (cfg.skyName.split("/").pop() || "skybox") + "-quakespasm-skybox.txt",
            data: new TextEncoder().encode(buildExportManifest(els, state, cfg))
        });

        var zipBytes = buildStoredZip(entries);
        var basename = cfg.skyName.split("/").pop() || "skybox";
        downloadBlob(new Blob([zipBytes], { type: "application/zip" }), basename + "-quakespasm-skybox.zip");
    }

    function buildExportManifest(els, state, cfg) {
        var lines = [
            "Quakespasm skybox export",
            "",
            "worldspawn key: sky " + cfg.skyName,
            "console command: sky " + cfg.skyName,
            "face size: " + (Number(cfg.faceSize) || 1024) + " x " + (Number(cfg.faceSize) || 1024),
            "format: " + outputExtension(cfg.imageFormat).toUpperCase(),
            seamSummary(state.seamReport),
            "",
            "files:"
        ];
        FACE_ORDER.forEach(function (face) {
            lines.push("- " + outputPath(els, face.suffix));
        });
        return lines.join("\n") + "\n";
    }

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function clearGeneratedUrls(state) {
        state.generatedUrls.forEach(function (url) {
            URL.revokeObjectURL(url);
        });
        state.generatedUrls = [];
        FACE_ORDER.forEach(function (face) {
            var link = state.faceLinks.get(face.suffix);
            if (link) {
                link.href = "#";
                link.download = "";
                link._skyboxBlob = null;
                link.classList.add("disabled");
            }
        });
    }

    function markExportsStale(els, state) {
        clearGeneratedUrls(state);
        state.seamReport = null;
        updateSeamBadge(els, state);
        els.zipButton.disabled = true;
        els.renderButton.disabled = !state.source;
        if (state.source)
            setStatus(els, "Settings changed. Preview will update; render faces to refresh downloads.");
    }

    function analyzeSeams(faceData) {
        if (!faceData || faceData.size < FACE_ORDER.length)
            return null;

        var edges = ["left", "right", "top", "bottom"];
        var epsilon = 0.001;
        var total = 0;
        var max = 0;
        var count = 0;
        var worst = null;

        FACE_ORDER.forEach(function (face) {
            var own = faceData.get(face.suffix);
            if (!own)
                return;

            var samples = clamp(Math.floor(Math.min(own.width, own.height) / 16), 16, 128);
            edges.forEach(function (edge) {
                for (var i = 0; i < samples; i++) {
                    var t = (i + 0.5) / samples;
                    var ownUv = edgeUv(edge, t, 0);
                    var outsideUv = edgeUv(edge, t, epsilon);
                    var neighborUv = directionToFaceUv(getFaceDirection(face.suffix, outsideUv.u, outsideUv.v));
                    if (neighborUv.suffix === face.suffix)
                        continue;
                    var neighbor = faceData.get(neighborUv.suffix);
                    if (!neighbor)
                        continue;
                    var a = sampleImageData(own, ownUv.u, ownUv.v);
                    var b = sampleImageData(neighbor, neighborUv.u, neighborUv.v);
                    var diff = ((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3) * 255;
                    total += diff;
                    count++;
                    if (diff > max) {
                        max = diff;
                        worst = face.suffix + " " + edge + " to " + neighborUv.suffix;
                    }
                }
            });
        });

        if (!count)
            return null;

        return {
            avg: total / count,
            max: max,
            worst: worst,
            count: count
        };
    }

    function edgeUv(edge, t, outside) {
        if (edge === "left")
            return { u: 0 - outside, v: t };
        if (edge === "right")
            return { u: 1 + outside, v: t };
        if (edge === "top")
            return { u: t, v: 0 - outside };
        return { u: t, v: 1 + outside };
    }

    function seamSummary(report) {
        if (!report)
            return "Seams unchecked.";
        return "Seams avg " + report.avg.toFixed(1) + ", max " + report.max.toFixed(1) + ".";
    }

    function updateSeamBadge(els, state) {
        if (!els.seamBadge)
            return;
        var report = state.seamReport;
        els.seamBadge.classList.remove("good", "warn", "bad");
        if (!report) {
            els.seamBadge.textContent = "seams unchecked";
            return;
        }

        els.seamBadge.textContent = "avg " + report.avg.toFixed(1) + " max " + report.max.toFixed(1);
        if (report.max > 24 || report.avg > 4)
            els.seamBadge.classList.add("bad");
        else if (report.max > 12 || report.avg > 2)
            els.seamBadge.classList.add("warn");
        else
            els.seamBadge.classList.add("good");
    }

    function validateExportState(els, state) {
        var problems = [];
        var cfg = settings(els);
        var size = Number(cfg.faceSize) || 1024;
        var seen = new Set();

        if (cfg.skyName.length > 56)
            problems.push("Sky name is long. Shorter names are easier to type in the Quakespasm console.");
        if (cfg.skyName.indexOf("/") >= 0)
            problems.push("Sky name uses subfolders. Use the full path after gfx/env/ in the sky command.");
        if (cfg.imageFormat === "tga" && size >= 4096)
            problems.push("4096 TGA faces are large. ZIP output may be hundreds of megabytes.");

        FACE_ORDER.forEach(function (face) {
            var path = outputPath(els, face.suffix);
            if (seen.has(path))
                problems.push("Duplicate output path: " + path);
            seen.add(path);

            var faceData = state.faceData && state.faceData.get(face.suffix);
            if (faceData && (faceData.width !== size || faceData.height !== size))
                problems.push(face.suffix + " is " + faceData.width + " x " + faceData.height + "; expected " + size + " x " + size + ".");
        });

        return problems;
    }

    function updateWarnings(els, state, forcedWarnings) {
        var warnings = forcedWarnings ? forcedWarnings.slice() : [];
        if (state.source) {
            var cfg = settings(els);
            var ratio = state.source.width / state.source.height;
            if (Math.abs(ratio - 2) > 0.03)
                warnings.push("Input aspect is " + ratio.toFixed(2) + ":1. A true equirectangular sky panorama should be 2:1.");
            if (state.source.width < (Number(cfg.faceSize) || 1024) * 4)
                warnings.push("The source is low for this face size. Smaller faces may look sharper.");
            if ((cfg.sampling === "2" || cfg.sampling === "3") && Number(cfg.faceSize) >= 4096)
                warnings.push("High-quality sampling at 4096 can take a while even with the worker renderer.");
            if (state.seamReport && (state.seamReport.max > 24 || state.seamReport.avg > 4))
                warnings.push("Seam check found a visible mismatch near " + state.seamReport.worst + ".");
            if (hasExportedFaces(state)) {
                validateExportState(els, state).forEach(function (problem) {
                    warnings.push(problem);
                });
            }
        }

        if (!warnings.length) {
            els.warningList.hidden = true;
            els.warningList.textContent = "";
            return;
        }

        els.warningList.hidden = false;
        els.warningList.innerHTML = warnings.map(function (warning) {
            return "<div>" + escapeHtml(warning) + "</div>";
        }).join("");
    }

    function hasExportedFaces(state) {
        return FACE_ORDER.every(function (face) {
            var link = state.faceLinks && state.faceLinks.get(face.suffix);
            return !!(link && link._skyboxBlob);
        });
    }

    function setStatus(els, message, kind) {
        els.status.textContent = message;
        els.status.classList.toggle("error", kind === "error");
        els.status.classList.toggle("success", kind === "success");
    }

    function setProgress(els, value) {
        if (value == null) {
            els.progress.hidden = true;
            els.progressFill.style.width = "0%";
            return;
        }
        els.progress.hidden = false;
        els.progressFill.style.width = Math.round(clamp(value, 0, 1) * 100) + "%";
    }

    function clearCanvas(canvas) {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#161b1c";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(142, 210, 217, 0.2)";
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function waitFrame() {
        return new Promise(function (resolve) {
            requestAnimationFrame(resolve);
        });
    }

    var SkyboxCore = {
        FACE_ORDER: FACE_ORDER,
        sanitizeSkyName: sanitizeSkyName,
        getFaceDirection: getFaceDirection,
        directionToEquirect: directionToEquirect,
        directionToFaceUv: directionToFaceUv,
        sampleSource: sampleSource,
        renderFacePixels: renderFacePixels,
        analyzeSeams: analyzeSeams,
        encodeTga: encodeTga,
        parseRadianceHDR: parseRadianceHDR,
        crc32: crc32,
        buildStoredZip: buildStoredZip
    };

    if (typeof window !== "undefined")
        window.SkyboxCore = SkyboxCore;
    if (typeof self !== "undefined" && typeof window === "undefined")
        self.SkyboxCore = SkyboxCore;
    if (typeof module !== "undefined" && module.exports)
        module.exports = SkyboxCore;
    if (typeof document !== "undefined")
        document.addEventListener("DOMContentLoaded", initPage);
})();
