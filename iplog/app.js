(function (global) {
    "use strict";

    var ENTRY_SIZE = 20;
    var STORED_NAME_BYTES = 16;
    var MAX_NAME_BYTES = 15;
    var MAX_REPETITION = 128;
    var PREVIEW_ROOT = "../namemaker/images/chars/quake/";
    var DEQUAKE_MAP = buildDequakeMap();

    function buildDequakeMap() {
        var map = new Array(256).fill(0);
        var i;

        for (i = 1; i < 12; i++) {
            map[i] = "#".charCodeAt(0);
        }

        map[9] = 9;
        map[10] = 10;
        map[12] = " ".charCodeAt(0);
        map[13] = 13;
        map[1] = ".".charCodeAt(0);
        map[5] = ".".charCodeAt(0);
        map[14] = ".".charCodeAt(0);
        map[15] = ".".charCodeAt(0);
        map[16] = "[".charCodeAt(0);
        map[17] = "]".charCodeAt(0);
        map[28] = ".".charCodeAt(0);
        map[29] = "<".charCodeAt(0);
        map[30] = "-".charCodeAt(0);
        map[31] = ">".charCodeAt(0);

        for (i = 0; i < 10; i++) {
            map[18 + i] = "0".charCodeAt(0) + i;
        }

        for (i = 32; i < 128; i++) {
            map[i] = i;
        }

        for (i = 0; i < 128; i++) {
            map[i + 128] = map[i];
        }

        map[128] = "(".charCodeAt(0);
        map[129] = "=".charCodeAt(0);
        map[130] = ")".charCodeAt(0);
        map[131] = "*".charCodeAt(0);
        map[141] = ">".charCodeAt(0);

        return map;
    }

    function padByte(value) {
        return String(value).padStart(3, "0");
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatAddress(addr) {
        var a = addr >>> 16;
        var b = (addr >>> 8) & 0xff;
        var c = addr & 0xff;
        return a + "." + b + "." + c + ".xxx";
    }

    function prepareStoredNameBytes(rawNameBytes) {
        var copied = new Uint8Array(STORED_NAME_BYTES);
        var limit = Math.min(MAX_NAME_BYTES, rawNameBytes.length);
        var end = MAX_NAME_BYTES;
        var i;

        for (i = 0; i < limit; i++) {
            copied[i] = rawNameBytes[i];
        }

        copied[MAX_NAME_BYTES] = 0;

        while (end >= 0 && (copied[end] === 0 || copied[end] === 32)) {
            copied[end] = 0;
            end--;
        }

        return end < 0 ? new Uint8Array(0) : copied.slice(0, end + 1);
    }

    function nameBytesEqual(left, right) {
        var i;

        if (left.length !== right.length) {
            return false;
        }

        for (i = 0; i < left.length; i++) {
            if (left[i] !== right[i]) {
                return false;
            }
        }

        return true;
    }

    function printableNameFromBytes(nameBytes) {
        var printable = "";
        var i;

        for (i = 0; i < nameBytes.length; i++) {
            var code = DEQUAKE_MAP[nameBytes[i]];
            if (code === 10 || code === 13) {
                code = 32;
            }
            if (code !== 0) {
                printable += String.fromCharCode(code);
            }
        }

        return printable;
    }

    function normalizeBufferSource(source) {
        if (source instanceof ArrayBuffer) {
            return {
                buffer: source,
                byteOffset: 0,
                byteLength: source.byteLength
            };
        }

        if (ArrayBuffer.isView(source)) {
            return {
                buffer: source.buffer,
                byteOffset: source.byteOffset,
                byteLength: source.byteLength
            };
        }

        throw new TypeError("parseIpLogBuffer expects an ArrayBuffer or typed array view.");
    }

    function createNode(addr, nameBytes) {
        return {
            addr: addr,
            nameBytes: nameBytes,
            parent: null,
            children: [null, null]
        };
    }

    function ipLogAdd(tree, addr, rawNameBytes) {
        var nameBytes = prepareStoredNameBytes(rawNameBytes);
        var current;
        var parent;
        var direction;
        var match;
        var matchCount;
        var i;

        if (nameBytes.length === 0) {
            return "empty";
        }

        current = tree.root;
        parent = null;
        match = new Array(MAX_REPETITION);
        matchCount = 0;

        while (current) {
            if (current.addr === addr) {
                if (nameBytesEqual(nameBytes, current.nameBytes)) {
                    return "duplicate";
                }

                match[matchCount] = current;
                matchCount++;

                if (matchCount === MAX_REPETITION) {
                    for (i = 0; i < MAX_REPETITION - 1; i++) {
                        match[i].nameBytes = match[i + 1].nameBytes.slice();
                    }
                    match[MAX_REPETITION - 1].nameBytes = nameBytes.slice();
                    return "replaced";
                }
            }

            parent = current;
            direction = addr > current.addr ? 1 : 0;
            current = current.children[direction];
        }

        current = createNode(addr, nameBytes);
        current.parent = parent;

        if (!parent) {
            tree.root = current;
        } else {
            parent.children[addr > parent.addr ? 1 : 0] = current;
        }

        return "inserted";
    }

    function dumpTree(root, rows) {
        if (!root) {
            return;
        }

        dumpTree(root.children[0], rows);

        var printableName = printableNameFromBytes(root.nameBytes);
        rows.push({
            rowNumber: rows.length + 1,
            addr: root.addr,
            address: formatAddress(root.addr),
            previewCodes: Array.from(root.nameBytes),
            nameKey: Array.from(root.nameBytes).map(padByte).join(" "),
            printableName: printableName,
            searchText: (formatAddress(root.addr) + " " + printableName).toLowerCase()
        });

        dumpTree(root.children[1], rows);
    }

    function buildWarnings(stats) {
        var warnings = [];

        if (stats.trailingBytesIgnored > 0) {
            warnings.push(
                "Ignored " +
                    stats.trailingBytesIgnored +
                    " trailing byte" +
                    (stats.trailingBytesIgnored === 1 ? "" : "s") +
                    " because iplog.dat records are 20 bytes each."
            );
        }

        if (stats.repetitionOverwrites > 0) {
            warnings.push(
                "At least one masked IP exceeded 128 unique names, so older names were shifted out to match qss-m."
            );
        }

        if (stats.rawRecords === 0) {
            warnings.push("No complete 20-byte records were found in this file.");
        }

        return warnings;
    }

    function parseIpLogSources(sources) {
        var tree = { root: null };
        var rows = [];
        var stats = {
            rawRecords: 0,
            duplicatePairsSkipped: 0,
            emptyNamesSkipped: 0,
            repetitionOverwrites: 0,
            trailingBytesIgnored: 0
        };
        var sourceIndex;

        for (sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
            var source = normalizeBufferSource(sources[sourceIndex]);
            var bytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
            var view = new DataView(source.buffer, source.byteOffset, source.byteLength);
            var rawRecords = Math.floor(bytes.length / ENTRY_SIZE);
            var i;

            stats.rawRecords += rawRecords;
            stats.trailingBytesIgnored += bytes.length % ENTRY_SIZE;

            for (i = 0; i < rawRecords; i++) {
                var offset = i * ENTRY_SIZE;
                var addr = view.getUint32(offset, true);
                var rawNameBytes = bytes.slice(offset + 4, offset + ENTRY_SIZE);
                var result = ipLogAdd(tree, addr, rawNameBytes);

                if (result === "duplicate") {
                    stats.duplicatePairsSkipped++;
                } else if (result === "empty") {
                    stats.emptyNamesSkipped++;
                } else if (result === "replaced") {
                    stats.repetitionOverwrites++;
                }
            }
        }

        dumpTree(tree.root, rows);

        return {
            rows: rows,
            stats: stats,
            warnings: buildWarnings(stats),
            textDump: rows
                .map(function (row) {
                    return row.address.padEnd(16, " ") + "  " + row.printableName;
                })
                .join("\n")
        };
    }

    function parseIpLogBuffer(arrayBuffer) {
        return parseIpLogSources([arrayBuffer]);
    }

    function createPreviewHtml(previewCodes) {
        if (!previewCodes.length) {
            return '<span class="empty-state">empty</span>';
        }

        return (
            '<div class="preview-strip" title="' +
            escapeHtml(previewCodes.map(padByte).join(" ")) +
            '">' +
            previewCodes
                .map(function (code) {
                    var padded = padByte(code);
                    return (
                        '<img src="' +
                        PREVIEW_ROOT +
                        padded +
                        '.gif" alt="" aria-hidden="true" width="16" height="16">'
                    );
                })
                .join("") +
            "</div>"
        );
    }

    function buildTextDump(rows) {
        return rows
            .map(function (row) {
                return row.address.padEnd(16, " ") + "  " + row.printableName;
            })
            .join("\n");
    }

    function createApi() {
        return {
            parseIpLogSources: parseIpLogSources,
            parseIpLogBuffer: parseIpLogBuffer,
            formatAddress: formatAddress,
            prepareStoredNameBytes: prepareStoredNameBytes,
            printableNameFromBytes: printableNameFromBytes
        };
    }

    var api = createApi();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.IpLogTool = api;

    if (typeof document === "undefined") {
        return;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var state = {
            fileLabel: "",
            sourceNames: [],
            rows: [],
            filteredRows: [],
            currentTextDump: "",
            stats: null,
            warnings: [],
            hiddenDuplicateNames: 0
        };

        var dropZone = document.getElementById("dropZone");
        var fileInput = document.getElementById("fileInput");
        var clearButton = document.getElementById("clearButton");
        var copyButton = document.getElementById("copyButton");
        var downloadButton = document.getElementById("downloadButton");
        var searchInput = document.getElementById("searchInput");
        var dedupeToggle = document.getElementById("dedupeToggle");
        var status = document.getElementById("status");
        var warningsList = document.getElementById("warnings");
        var summaryPanel = document.getElementById("summaryPanel");
        var resultsPanel = document.getElementById("resultsPanel");
        var fileNameEl = document.getElementById("fileName");
        var rawRecordsStat = document.getElementById("rawRecordsStat");
        var displayedRowsStat = document.getElementById("displayedRowsStat");
        var duplicatesStat = document.getElementById("duplicatesStat");
        var emptyNamesStat = document.getElementById("emptyNamesStat");
        var resultsMeta = document.getElementById("resultsMeta");
        var resultsBody = document.getElementById("resultsBody");

        function updateButtons() {
            var hasRows = state.filteredRows.length > 0;

            clearButton.disabled = state.sourceNames.length === 0;
            copyButton.disabled = !hasRows;
            downloadButton.disabled = !hasRows;
        }

        function renderWarnings() {
            warningsList.innerHTML = "";

            if (!state.warnings.length) {
                warningsList.hidden = true;
                return;
            }

            state.warnings.forEach(function (warning) {
                var item = document.createElement("li");
                item.textContent = warning;
                warningsList.appendChild(item);
            });

            warningsList.hidden = false;
        }

        function updateDerivedRows() {
            var query = searchInput.value.trim().toLowerCase();
            var filteredRows;
            var seenNames;

            if (!query) {
                filteredRows = state.rows.slice();
            } else {
                filteredRows = state.rows.filter(function (row) {
                    return row.searchText.indexOf(query) !== -1;
                });
            }

            state.hiddenDuplicateNames = 0;

            if (dedupeToggle.checked) {
                seenNames = new Set();
                filteredRows = filteredRows.filter(function (row) {
                    if (seenNames.has(row.nameKey)) {
                        state.hiddenDuplicateNames++;
                        return false;
                    }

                    seenNames.add(row.nameKey);
                    return true;
                });
            }

            state.filteredRows = filteredRows;
            state.currentTextDump = buildTextDump(filteredRows);
        }

        function renderSummary() {
            var displayedRows = state.filteredRows.length;

            if (!state.stats) {
                summaryPanel.hidden = true;
                resultsPanel.hidden = true;
                fileNameEl.textContent = "";
                return;
            }

            summaryPanel.hidden = false;
            resultsPanel.hidden = false;
            fileNameEl.textContent = state.fileLabel;
            rawRecordsStat.textContent = String(state.stats.rawRecords);
            displayedRowsStat.textContent = String(displayedRows);
            duplicatesStat.textContent = String(state.stats.duplicatePairsSkipped);
            emptyNamesStat.textContent = String(state.stats.emptyNamesSkipped);
        }

        function renderRows() {
            var totalRows = state.filteredRows.length;
            var pageRows = state.filteredRows;
            var metaText;

            if (!state.stats) {
                resultsBody.innerHTML = "";
                resultsMeta.textContent = "";
                updateButtons();
                return;
            }

            if (!pageRows.length) {
                resultsBody.innerHTML =
                    '<tr><td colspan="4" class="empty-state">No matching entries.</td></tr>';
            } else {
                resultsBody.innerHTML = pageRows
                    .map(function (row, index) {
                        return (
                            "<tr>" +
                            '<td class="row-number">' +
                            (index + 1) +
                            "</td>" +
                            '<td class="masked-ip">' +
                            escapeHtml(row.address) +
                            "</td>" +
                            "<td>" +
                            createPreviewHtml(row.previewCodes) +
                            "</td>" +
                            '<td class="dequake-cell">' +
                            escapeHtml(row.printableName) +
                            "</td>" +
                            "</tr>"
                        );
                    })
                    .join("");
            }

            metaText = totalRows === 1 ? "1 row" : totalRows + " rows";

            if (dedupeToggle.checked && state.hiddenDuplicateNames > 0) {
                metaText +=
                    ", " +
                    state.hiddenDuplicateNames +
                    " duplicate name" +
                    (state.hiddenDuplicateNames === 1 ? "" : "s") +
                    " hidden";
            }

            resultsMeta.textContent = metaText;
            updateButtons();
        }

        function renderAll() {
            renderWarnings();
            updateDerivedRows();
            renderSummary();
            renderRows();
            updateButtons();
        }

        function clearState() {
            state.fileLabel = "";
            state.sourceNames = [];
            state.rows = [];
            state.filteredRows = [];
            state.currentTextDump = "";
            state.stats = null;
            state.warnings = [];
            state.hiddenDuplicateNames = 0;
            fileInput.value = "";
            searchInput.value = "";
            dedupeToggle.checked = false;
            status.textContent = "No file loaded.";
            renderAll();
        }

        function setActiveDropZone(active) {
            dropZone.classList.toggle("active", active);
        }

        function readFileAsArrayBuffer(file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();

                reader.onload = function (event) {
                    resolve(event.target.result);
                };

                reader.onerror = function () {
                    reject(new Error("Could not read " + file.name + "."));
                };

                reader.readAsArrayBuffer(file);
            });
        }

        function buildSourceLabel(names) {
            if (!names.length) {
                return "";
            }

            if (names.length === 1) {
                return names[0];
            }

            return names.length + " files: " + names.join(", ");
        }

        function loadFiles(files) {
            var fileList = Array.from(files);
            var fileNames = fileList.map(function (file) {
                return file.name;
            });

            status.textContent =
                "Loading " +
                (fileList.length === 1 ? fileNames[0] : fileList.length + " files") +
                "...";

            Promise.all(fileList.map(readFileAsArrayBuffer))
                .then(function (buffers) {
                    var parsed = parseIpLogSources(buffers);

                    state.fileLabel = buildSourceLabel(fileNames);
                    state.sourceNames = fileNames;
                    state.rows = parsed.rows;
                    state.filteredRows = parsed.rows.slice();
                    state.currentTextDump = buildTextDump(parsed.rows);
                    state.stats = parsed.stats;
                    state.warnings = parsed.warnings;
                    state.hiddenDuplicateNames = 0;

                    status.textContent =
                        (fileList.length === 1 ? "Loaded " + fileNames[0] : "Merged " + fileList.length + " files") +
                        ". Rebuilt " +
                        parsed.rows.length +
                        " tree entr" +
                        (parsed.rows.length === 1 ? "y" : "ies") +
                        " from " +
                        parsed.stats.rawRecords +
                        " raw record" +
                        (parsed.stats.rawRecords === 1 ? "" : "s") +
                        ".";

                    renderAll();
                })
                .catch(function (error) {
                    status.textContent = error.message;
                });
        }

        function handleFiles(files) {
            if (!files || !files.length) {
                return;
            }

            loadFiles(files);
        }

        dropZone.addEventListener("click", function () {
            fileInput.click();
        });

        dropZone.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInput.click();
            }
        });

        dropZone.addEventListener("dragover", function (event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setActiveDropZone(true);
        });

        dropZone.addEventListener("dragleave", function () {
            setActiveDropZone(false);
        });

        dropZone.addEventListener("drop", function (event) {
            event.preventDefault();
            setActiveDropZone(false);
            handleFiles(event.dataTransfer.files);
        });

        fileInput.addEventListener("change", function () {
            handleFiles(fileInput.files);
        });

        clearButton.addEventListener("click", clearState);

        copyButton.addEventListener("click", function () {
            if (!state.currentTextDump) {
                return;
            }

            if (!navigator.clipboard) {
                status.textContent = "Clipboard copy is not available in this browser.";
                return;
            }

            navigator.clipboard.writeText(state.currentTextDump).then(
                function () {
                    status.textContent = "Copied iplog.txt output to the clipboard.";
                },
                function () {
                    status.textContent = "Clipboard copy failed in this browser.";
                }
            );
        });

        downloadButton.addEventListener("click", function () {
            if (!state.currentTextDump) {
                return;
            }

            var downloadName =
                state.sourceNames.length > 1
                    ? "merged-iplog"
                    : (state.sourceNames[0] || "iplog").replace(/\.dat$/i, "") || "iplog";
            var blob = new Blob([state.currentTextDump + "\n"], { type: "text/plain;charset=utf-8" });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");

            link.href = url;
            link.download = downloadName + ".txt";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });

        searchInput.addEventListener("input", renderAll);
        dedupeToggle.addEventListener("change", renderAll);

        clearState();
    });
})(typeof globalThis !== "undefined" ? globalThis : this);
