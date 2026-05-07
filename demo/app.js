(function () {
    'use strict';

    const parserApi = window.QuakeDemoParser;
    const dzipApi = window.QuakeDemoDzip;
    const dzipSupported = !!(dzipApi &&
        typeof dzipApi.extractDemoEntries === 'function' &&
        typeof dzipApi.createDzipFromDemoBuffer === 'function');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const clearButton = document.getElementById('clearButton');
    const statusEl = document.getElementById('status');
    const warningsEl = document.getElementById('warnings');
    const summaryPanel = document.getElementById('summaryPanel');
    const summaryGrid = document.getElementById('summaryGrid');
    const summaryActions = document.getElementById('summaryActions');
    const resultsPanel = document.getElementById('resultsPanel');
    const folderInput = document.getElementById('folderInput');
    const folderLink = document.getElementById('folderLink');
    const demoPlayerDropZone = document.getElementById('demoPlayerDropZone');
    const demoPlayerInput = document.getElementById('demoPlayerInput');
    const folderAnalysisPanel = document.getElementById('folderAnalysisPanel');
    const folderAnalysisContent = document.getElementById('folderAnalysisContent');
    const captimePanel = document.getElementById('captimePanel');
    const captimeContent = document.getElementById('captimeContent');
    const DEMO_PLAYER_URL = 'qtubetest/play.html';
    const DEMO_PLAYER_STORAGE_PREFIX = 'q1tools-demo-player:';
    const PREVIEW_ROOT = '../namemaker/images/chars/quake/';
    const LEGACY_PANTS_TINTS = [
        [123, 123, 123],
        [83, 59, 27],
        [79, 79, 115],
        [55, 55, 7],
        [71, 0, 0],
        [95, 71, 7],
        [143, 67, 51],
        [127, 83, 63],
        [87, 55, 67],
        [95, 51, 63],
        [107, 87, 71],
        [47, 67, 55],
        [123, 99, 7],
        [47, 47, 127]
    ];

    let parsedFiles = [];
    let folderMode = false;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function setStatus(message, tone) {
        statusEl.textContent = message;
        statusEl.classList.remove('error', 'success');
        if (tone) {
            statusEl.classList.add(tone);
        }
    }

    function setWarnings(items) {
        if (!items.length) {
            warningsEl.hidden = true;
            warningsEl.innerHTML = '';
            return;
        }

        warningsEl.hidden = false;
        warningsEl.innerHTML = items.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
        }).join('');
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) {
            return 'Unknown';
        }

        if (bytes < 1024) {
            return bytes + ' B';
        }

        const units = ['KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = -1;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }

        return value.toFixed(value >= 10 ? 1 : 2) + ' ' + units[unitIndex];
    }

    function formatDate(timestamp) {
        if (!timestamp) {
            return 'Unknown';
        }

        try {
            return new Date(timestamp).toLocaleString();
        } catch (_error) {
            return 'Unknown';
        }
    }

    function formatDuration(seconds) {
        if (!Number.isFinite(seconds)) {
            return 'Unknown';
        }

        const value = Math.max(0, seconds);
        if (value < 1) {
            return value.toFixed(3) + 's';
        }

        const totalSeconds = Math.floor(value);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainder = totalSeconds % 60;
        const parts = [];

        if (hours) {
            parts.push(hours + 'h');
        }
        if (minutes || hours) {
            parts.push(minutes + 'm');
        }
        parts.push(remainder + 's');
        return parts.join(' ');
    }

    function formatTrimTime(seconds) {
        const value = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
        const totalMilliseconds = Math.round(value * 1000);
        const hours = Math.floor(totalMilliseconds / 3600000);
        const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
        const remainderSeconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const milliseconds = totalMilliseconds % 1000;

        if (hours) {
            return hours + ':' +
                String(minutes).padStart(2, '0') + ':' +
                String(remainderSeconds).padStart(2, '0') + '.' +
                String(milliseconds).padStart(3, '0');
        }

        return minutes + ':' +
            String(remainderSeconds).padStart(2, '0') + '.' +
            String(milliseconds).padStart(3, '0');
    }

    function parseTrimTime(value) {
        const text = String(value || '').trim();
        if (!text) {
            return null;
        }

        if (/^\d+(?:\.\d+)?$/.test(text)) {
            return Number(text);
        }

        const parts = text.split(':');
        if (parts.length < 2 || parts.length > 3) {
            return null;
        }

        let total = 0;
        for (let index = 0; index < parts.length; index += 1) {
            const part = parts[index].trim();
            if (!/^\d+(?:\.\d+)?$/.test(part)) {
                return null;
            }
            total = (total * 60) + Number(part);
        }
        return total;
    }

    function clampNumber(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function formatDecimal(value, suffix) {
        if (!Number.isFinite(value)) {
            return 'Unknown';
        }
        return Number(value).toFixed(Math.abs(value) >= 100 ? 0 : 2).replace(/\.00$/, '') + (suffix || '');
    }

    function formatSignedDelta(value) {
        if (!Number.isFinite(value)) {
            return 'Unknown';
        }
        return (value > 0 ? '+' : '') + value;
    }

    function formatProgressValue(current, total) {
        return (Number(current) || 0) + ' / ' + (Number(total) || 0);
    }

    function isLikelyMultiplayerDemo(data) {
        if ((data && data.gameType) === 1) {
            return true;
        }
        if (data.players.length > 1) {
            return true;
        }
        if (data.chatLog.length > 0) {
            return true;
        }
        return data.players.some(function (player) {
            return player.frags !== 0;
        });
    }

    function shouldShowProgressMetric(data, current, total) {
        const currentValue = Number(current) || 0;
        const totalValue = Number(total) || 0;

        if (currentValue !== 0 || totalValue !== 0) {
            return true;
        }

        return !isLikelyMultiplayerDemo(data);
    }

    function padByte(value) {
        return String(value & 0xff).padStart(3, '0');
    }

    function renderStatCard(label, value) {
        return [
            '<div class="stat-card">',
            '<div class="stat-label">' + escapeHtml(label) + '</div>',
            '<div class="stat-value">' + escapeHtml(value) + '</div>',
            '</div>'
        ].join('');
    }

    function renderMetric(label, value) {
        return [
            '<div class="metric">',
            '<div class="metric-label">' + escapeHtml(label) + '</div>',
            '<div class="metric-value">' + escapeHtml(value) + '</div>',
            '</div>'
        ].join('');
    }

    function renderMiniMetric(label, value) {
        return [
            '<div class="mini-metric">',
            '<div class="mini-label">' + escapeHtml(label) + '</div>',
            '<div class="mini-value">' + escapeHtml(value) + '</div>',
            '</div>'
        ].join('');
    }

    function renderPill(label, extraClass) {
        return '<span class="pill ' + escapeAttribute(extraClass || 'neutral') + '">' + escapeHtml(label) + '</span>';
    }

    function renderEmptyState(message) {
        return '<div class="empty-state">' + escapeHtml(message) + '</div>';
    }

    // Quake byte → Unicode (using Windows-1252 for 128-159 to avoid invisible C1 control chars)
    var QUAKE_CHR_OVERRIDES = {
        0:'\u001C', 4:'\u201E', 6:'\u2020', 7:'\u2021', 8:'\u02C6', 9:'\u2030',
        10:' ', 13:'>', 16:'[', 17:']',
        128:'\u20AC', 130:'\u201A', 131:'\u0192', 132:'\u201E', 133:'\u2026',
        134:'\u2020', 135:'\u2021', 136:'\u02C6', 137:'\u2030', 138:'\u0160',
        139:'\u2039', 140:'\u0152', 142:'\u017D',
        144:'[', 145:'\u2018', 146:'\u2019', 147:'\u201C', 148:'\u201D', 149:'\u2022',
        150:'\u2013', 151:'\u2014', 152:'\u02DC', 153:'\u2122', 154:'\u0161',
        155:'\u203A', 156:'\u0153', 158:'\u017E', 159:'\u0178'
    };

    function encodeQuakeName(codes) {
        var result = '';
        for (var i = 0; i < codes.length; i++) {
            var c = codes[i] & 255;
            result += (c in QUAKE_CHR_OVERRIDES) ? QUAKE_CHR_OVERRIDES[c] : String.fromCharCode(c);
        }
        return result;
    }

    function decodePlayerName(previewCodes, fallbackLabel) {
        const codes = Array.isArray(previewCodes) ? previewCodes.filter(Number.isFinite) : [];
        if (codes.length && parserApi && typeof parserApi.decodeScoreboardBytes === 'function') {
            const decoded = parserApi.decodeScoreboardBytes(codes).trim();
            if (decoded) {
                return decoded;
            }
        }
        if (codes.length && parserApi && typeof parserApi.decodeQuakeBytes === 'function') {
            const fallbackDecoded = parserApi.decodeQuakeBytes(codes).trim();
            if (fallbackDecoded) {
                return fallbackDecoded;
            }
        }
        return String(fallbackLabel || '(unnamed player)');
    }

    function cleanNameCodes(codes) {
        if (!Array.isArray(codes) || !codes.length) { return codes; }
        var ascii = '';
        for (var i = 0; i < codes.length; i++) {
            ascii += String.fromCharCode(codes[i] & 127);
        }
        var lower = ascii.toLowerCase();
        var statusWords = ['ready', 'dead', 'afk', 'typing', 'brb'];
        var cutAt = codes.length;
        for (var s = 0; s < statusWords.length; s++) {
            var idx = lower.indexOf(statusWords[s]);
            if (idx >= 0) {
                var trim = idx;
                while (trim > 0 && (ascii.charCodeAt(trim - 1) === 32)) { trim--; }
                if (trim < cutAt) { cutAt = trim; }
            }
        }
        var result = codes.slice(0, cutAt);
        if (result.length > 15) { result = result.slice(0, 15); }
        return result;
    }

    function renderQuakePreview(previewCodes, fallbackLabel) {
        const codes = cleanNameCodes(Array.isArray(previewCodes) ? previewCodes.filter(Number.isFinite) : []);
        if (!codes.length) {
            return '<span class="quake-name-fallback">' + escapeHtml(fallbackLabel || '(unnamed player)') + '</span>';
        }

        var quakeName = encodeQuakeName(codes);
        var displayName = decodePlayerName(codes, fallbackLabel);
        var rawCodes = JSON.stringify(codes.map(function (c) { return c & 255; }));

        return [
            '<div class="preview-strip" title="Double-click to copy: ' + escapeAttribute(displayName) + '" data-quake-name="' + escapeAttribute(quakeName) + '" data-quake-codes="' + escapeAttribute(rawCodes) + '">',
            codes.map(function (code) {
                const padded = padByte(code);
                return '<img src="' + PREVIEW_ROOT + padded + '.gif" alt="" aria-hidden="true" width="14" height="14">';
            }).join(''),
            '</div>'
        ].join('');
    }

    function playerCardStyle(player) {
        const tint = LEGACY_PANTS_TINTS[player && Number.isInteger(player.pants) ? player.pants : -1];
        if (!tint) {
            return '';
        }
        return '--player-tint:' + tint.join(', ') + ';';
    }

    function trimExportSupported(data) {
        return data.protocols.every(function (protocol) {
            return /^(15|666|999)(?:\+fte)?$/i.test(protocol);
        });
    }

    function smoothExportSupported(data) {
        if (data && typeof data.smoothSupported === 'boolean') {
            return data.smoothSupported;
        }
        return data.protocols.length > 0 && data.protocols.every(function (protocol) {
            return /^(15|666|999)$/i.test(protocol);
        });
    }

    function timelineStart(data) {
        return data.timeline && Number.isFinite(data.timeline.startTime) ? data.timeline.startTime : 0;
    }

    function timelineEnd(data) {
        if (data.timeline && Number.isFinite(data.timeline.endTime)) {
            return data.timeline.endTime;
        }
        return Number.isFinite(data.duration) ? data.duration : 0;
    }

    function relativeFrameTime(data, frameIndex) {
        const safeFrame = clampNumber(Math.round(frameIndex || 1), 1, Math.max(1, data.frameCount || 1));
        const frameTimes = data.timeline && Array.isArray(data.timeline.frameTimes) ? data.timeline.frameTimes : [];
        const absolute = Number.isFinite(frameTimes[safeFrame - 1]) ? frameTimes[safeFrame - 1] : timelineStart(data);
        return Math.max(0, absolute - timelineStart(data));
    }

    function totalTimelineDuration(data) {
        const frameTimes = data.timeline && Array.isArray(data.timeline.frameTimes) ? data.timeline.frameTimes : [];
        if (frameTimes.length) {
            return Math.max(0, timelineEnd(data) - timelineStart(data));
        }
        return Number.isFinite(data.duration) ? Math.max(0, data.duration) : 0;
    }

    function framePositionPercent(data, frameIndex) {
        const duration = totalTimelineDuration(data);
        if (duration > 0) {
            return clampNumber((relativeFrameTime(data, frameIndex) / duration) * 100, 0, 100);
        }
        if ((data.frameCount || 1) <= 1) {
            return 0;
        }
        return ((clampNumber(frameIndex, 1, data.frameCount) - 1) / (data.frameCount - 1)) * 100;
    }

    function frameFromRelativeTime(data, seconds, preferEnd) {
        const frameTimes = data.timeline && Array.isArray(data.timeline.frameTimes) ? data.timeline.frameTimes : [];
        if (!frameTimes.length) {
            const duration = Math.max(0.001, totalTimelineDuration(data));
            const ratio = clampNumber(seconds / duration, 0, 1);
            return clampNumber(Math.round(ratio * Math.max(0, data.frameCount - 1)) + 1, 1, Math.max(1, data.frameCount));
        }

        const target = clampNumber(timelineStart(data) + seconds, timelineStart(data), timelineEnd(data));
        let low = 0;
        let high = frameTimes.length - 1;
        let answer = preferEnd ? 0 : high;

        while (low <= high) {
            const mid = (low + high) >> 1;
            const time = frameTimes[mid];
            if (preferEnd) {
                if (time <= target) {
                    answer = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            } else if (time >= target) {
                answer = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        return clampNumber(answer + 1, 1, Math.max(1, data.frameCount));
    }

    function safeClipLabel(seconds) {
        return formatTrimTime(seconds).replace(/[:.]/g, '-');
    }

    function downloadBaseName(fileName, fallback) {
        const text = String(fileName || fallback || '').replace(/\\/g, '/');
        const parts = text.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : String(fallback || 'demo.dem');
    }

    function buildClipFileName(fileName, startSeconds, endSeconds) {
        const baseName = downloadBaseName(fileName, 'demo.dem').replace(/\.dem$/i, '');
        return baseName + '__clip_' + safeClipLabel(startSeconds) + '__' + safeClipLabel(endSeconds) + '.dem';
    }

    function buildSmoothFileName(fileName) {
        const baseName = downloadBaseName(fileName, 'demo.dem').replace(/\.dem$/i, '');
        return baseName + '__smoothed.dem';
    }

    function buildCombinedFileName(items) {
        const count = Array.isArray(items) ? items.length : 0;
        if (count <= 0) {
            return 'combined_demos.dem';
        }
        if (count === 1) {
            return downloadBaseName(items[0].data.fileName, 'demo.dem').replace(/\.dem$/i, '') + '__combined.dem';
        }
        const firstName = downloadBaseName(items[0].data.fileName, 'demo.dem').replace(/\.dem$/i, '');
        return firstName + '__plus_' + (count - 1) + '_more.dem';
    }

    function buildSuperimposedFileName(items) {
        const baseItem = Array.isArray(items) && items.length ? items[0] : null;
        const baseName = baseItem && baseItem.data
            ? downloadBaseName(baseItem.data.fileName, 'demo.dem').replace(/\.dem$/i, '')
            : 'demo';
        return baseName + '__superimposed.dem';
    }

    function buildDzipFileName(fileName) {
        const baseName = downloadBaseName(fileName, 'demo.dem');
        if (/\.dz$/i.test(baseName)) {
            return baseName;
        }
        if (/\.dem$/i.test(baseName)) {
            return baseName.replace(/\.dem$/i, '.dz');
        }
        return baseName + '.dz';
    }

    function cloneArrayBuffer(bufferLike) {
        if (bufferLike instanceof ArrayBuffer) {
            return bufferLike.slice(0);
        }
        if (ArrayBuffer.isView(bufferLike)) {
            const view = bufferLike;
            return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
        }
        throw new TypeError('Expected binary demo data.');
    }

    async function triggerDemoDownload(bytes, fileName, format, lastModified) {
        if (format === 'dz') {
            if (!dzipSupported) {
                throw new Error('DZip export support is unavailable.');
            }
            const archiveBytes = await dzipApi.createDzipFromDemoBuffer(bytes, fileName, {
                lastModified: lastModified
            });
            triggerDownload(archiveBytes, buildDzipFileName(fileName));
            return;
        }
        triggerDownload(bytes, downloadBaseName(fileName, 'demo.dem'));
    }

    function exportFormatLabel(format) {
        return format === 'dz' ? '.dz archive' : '.dem';
    }

    function triggerDownload(bytes, fileName) {
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function renderTrimTimelineMaps(data) {
        if (!data.maps.length) {
            return '';
        }

        return data.maps.map(function (map) {
            const start = framePositionPercent(data, map.startFrame || 1);
            const end = framePositionPercent(data, map.endFrame || map.startFrame || 1);
            const width = Math.max(2, end - start);
            return [
                '<div class="trim-map-span" style="left:',
                escapeAttribute(String(start)),
                '%; width:',
                escapeAttribute(String(width)),
                '%;">',
                '<span class="trim-map-label">',
                escapeHtml(map.mapName || map.levelName || 'map'),
                '</span>',
                '</div>'
            ].join('');
        }).join('');
    }

    function renderTrimTimelineHeader(data) {
        if (!data.maps.length) {
            return '';
        }

        if (data.maps.length === 1) {
            const map = data.maps[0];
            return [
                '<div class="trim-map-caption">',
                '<div class="trim-map-name">' + escapeHtml(map.mapName || '(unknown map)') + '</div>',
                '<div class="trim-map-subtitle">' + escapeHtml(map.levelName || '(no level title)') + '</div>',
                '</div>'
            ].join('');
        }

        return '<div class="trim-map-rail">' + renderTrimTimelineMaps(data) + '</div>';
    }

    function renderTrimSection(item, index) {
        const data = item.data;
        if (!trimExportSupported(data)) {
            return [
                '<div class="trim-panel trim-panel-disabled">',
                '<div class="trim-header-row">',
                '<div>',
                '<h4 class="trim-title">Trim Demo</h4>',
                '<p class="trim-copy">Timeline export is currently limited to protocol 15, 666, and 999 clips.</p>',
                '</div>',
                renderPill('Unsupported export', 'bad'),
                '</div>',
                '</div>'
            ].join('');
        }

        const startFrame = 1;
        const endFrame = Math.max(1, data.frameCount);
        const startTime = relativeFrameTime(data, startFrame);
        const endTime = relativeFrameTime(data, endFrame);

        return [
            '<div class="trim-panel" data-demo-index="' + escapeAttribute(index) + '">',
            '<div class="trim-header-row">',
            '<div>',
            '<h4 class="trim-title">Trim Demo</h4>',
            '<p class="trim-copy">Set a clean in/out range on the timeline, then export a clipped <code>.dem</code>.</p>',
            '</div>',
            renderPill('Timeline export'),
            '</div>',
            '<div class="mini-metrics trim-summary-metrics">',
            '<div class="mini-metric"><div class="mini-label">Clip length</div><div class="mini-value" data-trim-output="clip-length">' + escapeHtml(formatDuration(endTime - startTime)) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Included frames</div><div class="mini-value" data-trim-output="frame-count">' + escapeHtml(String(endFrame - startFrame + 1)) + '</div></div>',
            '</div>',
            '<div class="trim-timeline-shell">',
            renderTrimTimelineHeader(data),
            '<div class="trim-slider">',
            '<div class="trim-slider-track"></div>',
            '<div class="trim-slider-selection" data-trim-selection></div>',
            '<input class="trim-range trim-range-start" type="range" min="1" max="' + escapeAttribute(data.frameCount) + '" step="1" value="' + escapeAttribute(startFrame) + '" aria-label="Trim start frame">',
            '<input class="trim-range trim-range-end" type="range" min="1" max="' + escapeAttribute(data.frameCount) + '" step="1" value="' + escapeAttribute(endFrame) + '" aria-label="Trim end frame">',
            '</div>',
            '<div class="trim-ruler">',
            '<span>0:00.000</span>',
            '<span>' + escapeHtml(formatTrimTime(totalTimelineDuration(data))) + '</span>',
            '</div>',
            '</div>',
            '<div class="trim-field-grid">',
            '<label class="trim-field">',
            '<span class="trim-field-label">Start time</span>',
            '<input class="trim-time-input" type="text" data-boundary="start" value="' + escapeAttribute(formatTrimTime(startTime)) + '" inputmode="decimal">',
            '</label>',
            '<label class="trim-field">',
            '<span class="trim-field-label">End time</span>',
            '<input class="trim-time-input" type="text" data-boundary="end" value="' + escapeAttribute(formatTrimTime(endTime)) + '" inputmode="decimal">',
            '</label>',
            '<label class="trim-field">',
            '<span class="trim-field-label">Start frame</span>',
            '<input class="trim-frame-input" type="number" data-boundary="start" min="1" max="' + escapeAttribute(data.frameCount) + '" step="1" value="' + escapeAttribute(startFrame) + '">',
            '</label>',
            '<label class="trim-field">',
            '<span class="trim-field-label">End frame</span>',
            '<input class="trim-frame-input" type="number" data-boundary="end" min="1" max="' + escapeAttribute(data.frameCount) + '" step="1" value="' + escapeAttribute(endFrame) + '">',
            '</label>',
            '</div>',
            '<div class="trim-actions">',
            '<div class="trim-hint">Mid-demo trims rebuild signon state from the selected frame so the clip can start cleanly.</div>',
            '<button class="trim-download-button trim-download-dem-button" type="button">Export clipped .dem</button>',
            dzipSupported ? '<button class="trim-download-button trim-download-dzip-button" type="button">Export clipped .dz</button>' : '',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderSmoothSection(item, index) {
        const data = item.data;
        if (!smoothExportSupported(data)) {
            return [
                '<div class="trim-panel trim-panel-disabled">',
                '<div class="trim-header-row">',
                '<div>',
                '<h4 class="trim-title">Smooth Demo</h4>',
                '<p class="trim-copy">' + escapeHtml(data.smoothUnsupportedReason || 'Demsmooth export is not available for this demo.') + '</p>',
                '</div>',
                renderPill('Unsupported export', 'bad'),
                '</div>',
                '</div>'
            ].join('');
        }

        return [
            '<div class="trim-panel smooth-panel" data-demo-index="' + escapeAttribute(index) + '">',
            '<div class="trim-header-row">',
            '<div>',
            '<h4 class="trim-title">Smooth Demo</h4>',
            '<p class="trim-copy">Apply demsmooth-style camera smoothing, roll, and POV motion smoothing across the full demo, then export a processed <code>.dem</code>. Original demsmooth by Mandel (Mathias Thore).</p>',
            '</div>',
            renderPill('Full demo export'),
            '</div>',
            '<div class="mini-metrics trim-summary-metrics">',
            '<div class="mini-metric"><div class="mini-label">Profile</div><div class="mini-value">demsmooth 1.3</div></div>',
            '<div class="mini-metric"><div class="mini-label">Camera</div><div class="mini-value">XY + roll + Z</div></div>',
            '<div class="mini-metric"><div class="mini-label">Motion</div><div class="mini-value">POV path only</div></div>',
            '<div class="mini-metric"><div class="mini-label">Protocol</div><div class="mini-value">' + escapeHtml(data.protocols.join(', ')) + '</div></div>',
            '</div>',
            '<div class="trim-actions">',
            '<div class="trim-hint">This writes a separate smoothed copy and leaves the original demo untouched.</div>',
            '<button class="trim-download-button smooth-download-button" type="button">Export smoothed .dem</button>',
            dzipSupported ? '<button class="trim-download-button smooth-download-dzip-button" type="button">Export smoothed .dz</button>' : '',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderCombineSection(items) {
        const successful = items.filter(function (item) {
            return !!item.data;
        });
        if (!successful.length) {
            return '';
        }

        const combineEnabled = successful.length >= 2;
        const totalDuration = successful.reduce(function (sum, item) {
            return sum + (Number.isFinite(item.data.duration) ? item.data.duration : 0);
        }, 0);
        const totalFrames = successful.reduce(function (sum, item) {
            return sum + (Number(item.data.frameCount) || 0);
        }, 0);

        return [
            '<section class="subsection subsection-collapsible">',
            '<details class="section-disclosure">',
            '<summary class="subsection-head disclosure-summary">',
            '<span class="subsection-title">Combine</span>',
            '<span class="disclosure-meta" aria-hidden="true"></span>',
            '</summary>',
            '<div class="disclosure-body">',
            '<div class="trim-panel combine-panel' + (combineEnabled ? '' : ' trim-panel-disabled combine-panel-disabled') + '">',
            '<div class="trim-header-row">',
            '<div>',
            '<h4 class="trim-title">Combine Demos</h4>',
            '<p class="trim-copy">Combine the currently loaded demos into one continuous <code>.dem</code>, using the loaded order shown below.</p>',
            '</div>',
            renderPill(combineEnabled ? 'Summary export' : 'Need 2 demos', combineEnabled ? 'neutral' : 'bad'),
            '</div>',
            '<div class="mini-metrics trim-summary-metrics">',
            '<div class="mini-metric"><div class="mini-label">Demo count</div><div class="mini-value">' + escapeHtml(String(successful.length)) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Total frames</div><div class="mini-value">' + escapeHtml(String(totalFrames)) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Decoded time</div><div class="mini-value">' + escapeHtml(formatDuration(totalDuration)) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Output</div><div class="mini-value">Single .dem</div></div>',
            '</div>',
            '<ol class="combine-order-list">',
            successful.map(function (item) {
                return '<li>' + escapeHtml(item.data.fileName) + '</li>';
            }).join(''),
            '</ol>',
            '<div class="trim-actions">',
            '<div class="trim-hint">' + escapeHtml(combineEnabled
                ? 'Only successfully parsed demos are included. The first demo header is kept, and each demo’s complete frame stream is appended after it.'
                : 'Load at least two successfully parsed demos to export a combined file.') + '</div>',
            '<button id="combineDownloadButton" class="trim-download-button" type="button"' + (combineEnabled ? '' : ' disabled aria-disabled="true"') + '>Export combined .dem</button>',
            dzipSupported ? '<button id="combineDownloadDzipButton" class="trim-download-button" type="button"' + (combineEnabled ? '' : ' disabled aria-disabled="true"') + '>Export combined .dz</button>' : '',
            '</div>',
            '</div>',
            '</div>',
            '</details>',
            '</section>'
        ].join('');
    }

    function renderSuperimposeSection(items) {
        const successful = items.filter(function (item) {
            return !!item.data;
        });
        if (!successful.length) {
            return '';
        }

        const enabled = successful.length >= 2;
        const baseDemo = successful[0].data;
        const ghostCount = Math.max(0, successful.length - 1);

        return [
            '<section class="subsection subsection-collapsible">',
            '<details class="section-disclosure">',
            '<summary class="subsection-head disclosure-summary">',
            '<span class="subsection-title">Superimpose</span>',
            '<span class="disclosure-meta" aria-hidden="true"></span>',
            '</summary>',
            '<div class="disclosure-body">',
            '<div class="trim-panel combine-panel' + (enabled ? '' : ' trim-panel-disabled combine-panel-disabled') + '">',
            '<div class="trim-header-row">',
            '<div>',
            '<h4 class="trim-title">Superimpose Ghosts</h4>',
            '<p class="trim-copy">Add ghost runs from the later loaded demos into the first loaded base demo, then export one combined ghosted <code>.dem</code>. Based on demsuperimpose by Matthew Earl.</p>',
            '</div>',
            renderPill(enabled ? 'Summary export' : 'Need 2 demos', enabled ? 'neutral' : 'bad'),
            '</div>',
            '<div class="mini-metrics trim-summary-metrics">',
            '<div class="mini-metric"><div class="mini-label">Base demo</div><div class="mini-value">' + escapeHtml(baseDemo.fileName) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Ghost demos</div><div class="mini-value">' + escapeHtml(String(ghostCount)) + '</div></div>',
            '<div class="mini-metric"><div class="mini-label">Map mode</div><div class="mini-value">Single map</div></div>',
            '<div class="mini-metric"><div class="mini-label">Ghost style</div><div class="mini-value">View entity only</div></div>',
            '</div>',
            '<ol class="combine-order-list">',
            successful.map(function (item, index) {
                return '<li>' + escapeHtml(index === 0 ? item.data.fileName + ' (base)' : item.data.fileName + ' (ghost)') + '</li>';
            }).join(''),
            '</ol>',
            '<label class="summary-option">',
            '<input id="superimposeIgnoreMapToggle" type="checkbox">',
            '<span>Ignore map name</span>',
            '</label>',
            '<div class="trim-actions">',
            '<div class="trim-hint">' + escapeHtml(enabled
                ? 'Current browser export supports classic single-map demos only. Ghost names and scoreboard colors are not rewritten yet; the base demo stays the first loaded file.'
                : 'Load at least two successfully parsed demos to export a ghosted file.') + '</div>',
            '<button id="superimposeDownloadButton" class="trim-download-button" type="button"' + (enabled ? '' : ' disabled aria-disabled="true"') + '>Export superimposed .dem</button>',
            dzipSupported ? '<button id="superimposeDownloadDzipButton" class="trim-download-button" type="button"' + (enabled ? '' : ' disabled aria-disabled="true"') + '>Export superimposed .dz</button>' : '',
            '</div>',
            '</div>',
            '</div>',
            '</details>',
            '</section>'
        ].join('');
    }

    function renderMapSection(data) {
        if (!data.maps.length) {
            return renderEmptyState('No map changes were decoded from this demo.');
        }

        return data.maps.map(function (map) {
            const stats = map.povStats || {};
            const miniMetrics = [
                renderMiniMetric('Duration', formatDuration(map.duration)),
                renderMiniMetric('Frames', Number.isFinite(map.endFrame) && Number.isFinite(map.startFrame) ? String(Math.max(0, map.endFrame - map.startFrame + 1)) : 'Unknown')
            ];

            if (shouldShowProgressMetric(data, stats.kills, stats.totalMonsters)) {
                miniMetrics.push(renderMiniMetric('Kills', formatProgressValue(stats.kills, stats.totalMonsters)));
            }
            if (shouldShowProgressMetric(data, stats.secrets, stats.totalSecrets)) {
                miniMetrics.push(renderMiniMetric('Secrets', formatProgressValue(stats.secrets, stats.totalSecrets)));
            }

            return [
                '<div class="map-card">',
                '<h4 class="map-title">' + escapeHtml(map.mapName || '(unknown map)') + '</h4>',
                '<div class="map-subtitle">' + escapeHtml(map.levelName || '(no level title)') + '</div>',
                '<div class="mini-metrics">' + miniMetrics.join('') + '</div>',
                '</div>'
            ].join('');
        }).join('');
    }

    function renderPlayerSection(data) {
        if (!data.players.length) {
            return renderEmptyState('No player roster was decoded from this demo.');
        }

        return data.players.map(function (player) {
            const readableName = player.displayName || decodePlayerName(player.nameCodes, player.name || '(unnamed player)');
            const subtitleParts = [];
            if (player.slot !== null && player.slot !== undefined) {
                subtitleParts.push('Slot ' + player.slot);
            }
            if (player.shirt !== null && player.pants !== null) {
                subtitleParts.push('Colors ' + player.shirt + '/' + player.pants);
            }

            const metrics = [
                renderMiniMetric('Frags', String(player.frags)),
                renderMiniMetric('Tracked time', formatDuration(player.movement.trackedTime)),
                renderMiniMetric('Distance', formatDecimal(player.movement.distance, 'u')),
                renderMiniMetric('Max speed', formatDecimal(player.movement.maxSpeed, 'u/s')),
                renderMiniMetric('Avg speed', formatDecimal(player.movement.averageSpeed, 'u/s')),
                player.movement.filteredSegments > 0
                    ? renderMiniMetric('Filtered jumps', String(player.movement.filteredSegments))
                    : '',
                renderMiniMetric('Chat lines', String(player.chatCount))
            ].join('');

            return [
                '<div class="player-card" style="' + escapeAttribute(playerCardStyle(player)) + '">',
                '<div class="player-title">' + renderQuakePreview(player.nameCodes, readableName) + '</div>',
                '<div class="player-readable-name">' + escapeHtml(readableName) + '</div>',
                '<div class="player-subtitle">' + escapeHtml(subtitleParts.join(' · ') || 'No color or slot metadata') + '</div>',
                '<div class="mini-metrics">' + metrics + '</div>',
                '</div>'
            ].join('');
        }).join('');
    }

    function renderWeaponUsage(weaponUsage) {
        if (!weaponUsage.length) {
            return renderEmptyState('No POV weapon state changes were tracked.');
        }

        return weaponUsage.map(function (entry) {
            const metrics = [
                renderMiniMetric('Switches', String(entry.switches)),
                renderMiniMetric('Active time', formatDuration(entry.activeTime)),
                renderMiniMetric('Ammo spent', entry.unit ? formatDecimal(entry.ammoSpent, ' ' + entry.unit) : formatDecimal(entry.ammoSpent)),
                renderMiniMetric('Estimated shots', formatDecimal(entry.estimatedShots))
            ].join('');

            return [
                '<div class="weapon-card">',
                '<h4 class="weapon-title">' + escapeHtml(entry.weaponName) + '</h4>',
                '<div class="mini-metrics">' + metrics + '</div>',
                '</div>'
            ].join('');
        }).join('');
    }

    function renderEventList(events, formatter) {
        if (!events.length) {
            return renderEmptyState('Nothing to show.');
        }

        return [
            '<ul class="event-list">',
            events.map(function (event) {
                return '<li>' + formatter(event) + '</li>';
            }).join(''),
            '</ul>'
        ].join('');
    }

    function pluralize(count, singular, plural) {
        return count + ' ' + (count === 1 ? singular : (plural || singular + 's'));
    }

    function shouldUseFlagLabels(happenings) {
        let redFlagMentions = 0;
        let blueFlagMentions = 0;

        (happenings || []).forEach(function (entry) {
            const text = String(entry.text || '').toUpperCase();
            if (text.includes('RED FLAG')) {
                redFlagMentions += 1;
            }
            if (text.includes('BLUE FLAG')) {
                blueFlagMentions += 1;
            }
        });

        return redFlagMentions > 0 && blueFlagMentions > 0;
    }

    function extractCaptimeRecords(happenings) {
        var records = [];
        var captimePattern = /^New (\d+(?:st|nd|rd|th)) place match captime/i;
        var detailPattern = /^(.+?)\s+-\s+(\d+:\d+\.\d+)\s*([RB]?)$/;

        for (var i = 0; i < happenings.length; i++) {
            var match = captimePattern.exec(happenings[i].text);
            if (match) {
                var place = match[1];
                var isRecord = /record was set/i.test(happenings[i].text);
                var record = {
                    place: place,
                    isRecord: isRecord,
                    time: happenings[i].time,
                    player: null,
                    captime: null,
                    team: null
                };

                if (i + 1 < happenings.length) {
                    var detailMatch = detailPattern.exec(happenings[i + 1].text);
                    if (detailMatch) {
                        record.player = detailMatch[1].trim();
                        record.captime = detailMatch[2];
                        record.team = detailMatch[3] || null;
                        i++;
                    }
                }

                records.push(record);
            }
        }

        return records;
    }

    function updateCaptimePanel(items) {
        var allRecords = [];

        items.forEach(function (item) {
            if (!item.data) { return; }
            var happenings = collectServerHappenings(item.data);
            var records = extractCaptimeRecords(happenings);
            if (records.length) {
                allRecords.push({
                    demoName: item.data.fileName || item.fileName || item.displayName,
                    records: records
                });
            }
        });

        if (!allRecords.length) {
            captimePanel.hidden = true;
            captimeContent.innerHTML = '';
            return;
        }

        var totalRecords = 0;
        allRecords.forEach(function (entry) { totalRecords += entry.records.length; });

        var html = allRecords.map(function (entry) {
            var rows = entry.records.map(function (rec) {
                var teamLabel = rec.team === 'R' ? 'Red' : rec.team === 'B' ? 'Blue' : '';
                var teamClass = rec.team === 'R' ? 'captime-team-red' : rec.team === 'B' ? 'captime-team-blue' : '';

                return [
                    '<div class="captime-entry' + (rec.isRecord ? ' captime-new-record' : '') + '">',
                    '<div class="captime-place">' + escapeHtml(rec.place) + ' place' + (rec.isRecord ? ' (new record!)' : '') + '</div>',
                    rec.player ? '<div class="captime-player">' + escapeHtml(rec.player) + '</div>' : '',
                    '<div class="captime-details">',
                    rec.captime ? '<span class="captime-time">' + escapeHtml(rec.captime) + '</span>' : '',
                    teamLabel ? '<span class="captime-team ' + teamClass + '">' + escapeHtml(teamLabel) + '</span>' : '',
                    '</div>',
                    '</div>'
                ].join('');
            });

            return [
                '<div class="captime-demo-group">',
                allRecords.length > 1 ? '<div class="captime-demo-name">' + escapeHtml(entry.demoName) + '</div>' : '',
                '<div class="captime-list">' + rows.join('') + '</div>',
                '</div>'
            ].join('');
        });

        captimeContent.innerHTML = [
            '<p class="subsection-copy">' + totalRecords + ' captime record' + (totalRecords === 1 ? '' : 's') + ' found across ' + allRecords.length + ' demo' + (allRecords.length === 1 ? '' : 's') + '.</p>',
            html.join('')
        ].join('');
        captimePanel.hidden = false;
    }

    function extractMatchStats(data) {
        var prints = (data && data.prints) || [];
        var startIndex = -1;
        for (var i = 0; i < prints.length; i++) {
            if (/^\s*match statistics\s*$/i.test(prints[i].text)) {
                startIndex = i;
                break;
            }
        }
        if (startIndex === -1) { return null; }

        var endIndex = prints.length;
        for (var i = startIndex + 1; i < prints.length; i++) {
            if (/^\s*The match is over\s*$/i.test(prints[i].text)) {
                endIndex = i + 1;
                while (endIndex < prints.length && /^The\s+(Red|Blue)\s+team has\s+\d+\s+frags$/i.test(prints[endIndex].text.trim())) {
                    endIndex++;
                }
                break;
            }
        }

        var lines = [];
        for (var i = startIndex + 1; i < endIndex; i++) {
            lines.push(prints[i].text);
        }
        if (!lines.length) { return null; }

        function isSep(line) {
            var t = line.trim();
            return t.length > 0 && /^[-+\s]+$/.test(t) && t.includes('+') && t.includes('-');
        }

        var header = { map: '', date: '', server: '' };
        var sections = [];
        var lastTableEnd = 0;

        var bodyStart = 0;
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (t.includes('|') || isSep(t)) { bodyStart = i; break; }
            if (/^map:\s*/i.test(t)) {
                header.map = t.replace(/^map:\s*/i, '').trim();
            } else if (/^\d{2}-\d{2}-\d{4}/.test(t)) {
                header.date = t;
            } else if (header.map && header.date && !header.server) {
                header.server = t;
            } else {
                bodyStart = i;
                break;
            }
            bodyStart = i + 1;
        }

        var pendingTitle = '';
        var i = bodyStart;
        while (i < lines.length) {
            var t = lines[i].trim();

            if (isSep(t)) {
                var headerLine = '';
                for (var h = i - 1; h >= bodyStart; h--) {
                    if (lines[h].includes('|')) {
                        headerLine = lines[h];
                        break;
                    }
                }
                var headers = headerLine ? headerLine.split('|').map(function (s) { return s.trim(); }) : [];
                while (headers.length > 0 && headers[headers.length - 1] === '') { headers.pop(); }

                var rows = [];
                i++;
                while (i < lines.length && lines[i].includes('|') && !isSep(lines[i].trim())) {
                    if (i + 1 < lines.length && isSep(lines[i + 1].trim())) {
                        break;
                    }
                    var cells = lines[i].split('|').map(function (s) { return s.trim(); });
                    while (cells.length > 0 && cells[cells.length - 1] === '') { cells.pop(); }
                    rows.push(cells);
                    i++;
                }

                if (headers.length > 0) {
                    sections.push({ title: pendingTitle, headers: headers, rows: rows });
                    lastTableEnd = i;
                }
                pendingTitle = '';
                continue;
            }

            if (t.includes('|')) {
                i++;
                continue;
            }

            pendingTitle = t;
            i++;
        }

        var footer = [];
        for (var i = lastTableEnd; i < lines.length; i++) {
            var t = lines[i].trim();
            if (t && !t.includes('|') && !isSep(t)) {
                footer.push(t);
            }
        }

        if (!sections.length) { return null; }

        return { header: header, sections: sections, footer: footer };
    }

    function renderMatchStatsSection(stats) {
        var html = [];

        var teamScores = [];
        if (stats.footer) {
            stats.footer.forEach(function (line) {
                var m = line.match(/^The\s+(Red|Blue)\s+team has\s+(\d+)\s+frags$/i);
                if (m) {
                    teamScores.push({ team: m[1], frags: m[2] });
                }
            });
        }

        if (stats.header.map || stats.header.date || stats.header.server || teamScores.length) {
            html.push('<div class="match-stats-header">');
            if (stats.header.map) {
                html.push('<div class="match-stats-map">' + escapeHtml(stats.header.map) + '</div>');
            }
            var sub = [];
            if (stats.header.date) { sub.push(escapeHtml(stats.header.date)); }
            if (stats.header.server) { sub.push(escapeHtml(stats.header.server)); }
            if (sub.length) {
                html.push('<div class="match-stats-sub">' + sub.join(' &middot; ') + '</div>');
            }
            if (teamScores.length) {
                html.push('<div class="match-stats-scores">');
                teamScores.forEach(function (ts) {
                    var cls = ts.team.toLowerCase() === 'red' ? 'match-stats-score-red' : 'match-stats-score-blue';
                    html.push('<div class="match-stats-score ' + cls + '">' + escapeHtml(ts.team) + ' <span class="match-stats-score-value">' + escapeHtml(ts.frags) + '</span></div>');
                });
                html.push('</div>');
            }
            html.push('</div>');
        }

        stats.sections.forEach(function (section) {
            if (section.title) {
                html.push('<h4 class="match-stats-section-title">' + escapeHtml(section.title) + '</h4>');
            }

            var headers = section.headers;
            var rows = section.rows;
            var lastIdx = headers.length - 1;
            if (lastIdx >= 0 && headers[lastIdx].toLowerCase().trim() === 'name') {
                headers = [headers[lastIdx]].concat(headers.slice(0, lastIdx));
                rows = rows.map(function (row) {
                    if (row.length > lastIdx) {
                        return [row[lastIdx]].concat(row.slice(0, lastIdx));
                    }
                    return row;
                });
            }

            var teamIndices = [];
            rows.forEach(function (row, idx) {
                var name = (row[0] || '').trim();
                if (!/team$/i.test(name)) { return; }
                var empty = 0;
                for (var c = 1; c < row.length; c++) {
                    if (!(row[c] || '').trim()) { empty++; }
                }
                if (empty >= row.length - 2) { teamIndices.push(idx); }
            });
            if (teamIndices.length) {
                var reordered = [];
                var lastEnd = 0;
                teamIndices.forEach(function (ti) {
                    reordered.push(rows[ti]);
                    for (var r = lastEnd; r < ti; r++) { reordered.push(rows[r]); }
                    lastEnd = ti + 1;
                });
                for (var r = lastEnd; r < rows.length; r++) { reordered.push(rows[r]); }
                rows = reordered;
            }

            html.push('<div class="match-stats-table-wrap">');
            html.push('<table class="match-stats-table">');
            html.push('<thead><tr>');
            headers.forEach(function (h) {
                html.push('<th>' + escapeHtml(h || '') + '</th>');
            });
            html.push('</tr></thead>');
            html.push('<tbody>');
            rows.forEach(function (row) {
                var name = (row[0] || '').trim().toLowerCase();
                var rowClass = '';
                if (/^red\s+team$/i.test(name)) { rowClass = ' class="match-stats-row-red"'; }
                else if (/^blue\s+team$/i.test(name)) { rowClass = ' class="match-stats-row-blue"'; }
                html.push('<tr' + rowClass + '>');
                for (var c = 0; c < headers.length; c++) {
                    html.push('<td>' + escapeHtml(row[c] || '') + '</td>');
                }
                html.push('</tr>');
            });
            html.push('</tbody>');
            html.push('</table>');
            html.push('</div>');
        });

        if (stats.footer && stats.footer.length) {
            var captimeLines = [];
            var otherLines = [];

            stats.footer.forEach(function (line) {
                if (/capture-time record:/i.test(line)) {
                    captimeLines.push(line);
                } else if (/the match is over/i.test(line) || /team has \d+ frags/i.test(line) || /team has won/i.test(line)) {
                    // team scores shown at top, skip these
                } else {
                    otherLines.push(line);
                }
            });

            if (!captimeLines.length && !otherLines.length) {
                return html.join('');
            }

            html.push('<div class="match-stats-footer">');

            if (captimeLines.length) {
                html.push('<div class="match-stats-captime-block">');
                captimeLines.forEach(function (line) {
                    var m = line.match(/^(.+?)\s+(match|trial)\s+capture-time record:\s*(\S+)\s+([rb])\s+(.+)$/i);
                    if (m) {
                        var teamLetter = m[4].toUpperCase();
                        var teamLabel = teamLetter === 'R' ? 'Red' : 'Blue';
                        var teamClass = teamLetter === 'R' ? 'captime-team-red' : 'captime-team-blue';
                        html.push(
                            '<div class="match-stats-captime-row">' +
                            '<span class="match-stats-captime-type">' + escapeHtml(m[2]) + ' record</span>' +
                            '<span class="match-stats-captime-player">' + escapeHtml(m[5]) + '</span>' +
                            '<span class="captime-time">' + escapeHtml(m[3]) + '</span>' +
                            '<span class="captime-team ' + teamClass + '">' + escapeHtml(teamLabel) + '</span>' +
                            '</div>'
                        );
                    } else {
                        html.push('<div class="match-stats-footer-line">' + escapeHtml(line) + '</div>');
                    }
                });
                html.push('</div>');
            }


            if (otherLines.length) {
                otherLines.forEach(function (line) {
                    html.push('<div class="match-stats-footer-line">' + escapeHtml(line) + '</div>');
                });
            }

            html.push('</div>');
        }

        return html.join('');
    }

    function remapItemEventForFlags(event) {
        if (!event || event.group !== 'keys') {
            return event;
        }

        if (event.item === 'Gold Key') {
            return Object.assign({}, event, {
                item: 'Red Flag'
            });
        }
        if (event.item === 'Silver Key') {
            return Object.assign({}, event, {
                item: 'Blue Flag'
            });
        }

        return event;
    }

    function summarizeItemEvents(events, options) {
        const useFlagLabels = !!(options && options.useFlagLabels);
        const groupOrder = ['weapons', 'inventory', 'keys', 'powerups', 'sigils'];
        const groupLabels = {
            weapons: 'Weapons',
            inventory: 'Inventory',
            keys: useFlagLabels ? 'Flags' : 'Keys',
            powerups: 'Powerups',
            sigils: 'Sigils'
        };
        const groups = new Map();

        events.forEach(function (event) {
            const normalizedEvent = useFlagLabels ? remapItemEventForFlags(event) : event;
            const groupKey = groupLabels[normalizedEvent.group] ? normalizedEvent.group : 'other';
            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    key: groupKey,
                    label: groupLabels[groupKey] || 'Other',
                    count: 0,
                    entries: new Map()
                });
            }

            const group = groups.get(groupKey);
            group.count += 1;

            if (!group.entries.has(normalizedEvent.item)) {
                group.entries.set(normalizedEvent.item, {
                    item: normalizedEvent.item,
                    acquired: 0,
                    lost: 0,
                    lastTime: normalizedEvent.time
                });
            }

            const summary = group.entries.get(normalizedEvent.item);
            if (normalizedEvent.type === 'acquired') {
                summary.acquired += 1;
            } else if (normalizedEvent.type === 'lost') {
                summary.lost += 1;
            }
            summary.lastTime = Math.max(summary.lastTime, normalizedEvent.time);
        });

        return Array.from(groups.values())
            .map(function (group) {
                return {
                    key: group.key,
                    label: group.label,
                    count: group.count,
                    entries: Array.from(group.entries.values()).sort(function (left, right) {
                        if (left.lastTime !== right.lastTime) {
                            return right.lastTime - left.lastTime;
                        }
                        return left.item.localeCompare(right.item);
                    })
                };
            })
            .sort(function (left, right) {
                const leftIndex = groupOrder.indexOf(left.key);
                const rightIndex = groupOrder.indexOf(right.key);
                const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
                const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
                if (normalizedLeft !== normalizedRight) {
                    return normalizedLeft - normalizedRight;
                }
                return left.label.localeCompare(right.label);
            });
    }

    function summarizeResourceEvents(events) {
        const statOrder = ['Health', 'Armor', 'Ammo', 'Shells', 'Nails', 'Rockets', 'Cells'];
        const summaries = new Map();

        events.forEach(function (event) {
            if (!summaries.has(event.label)) {
                summaries.set(event.label, {
                    label: event.label,
                    gains: 0,
                    losses: 0,
                    gainEvents: 0,
                    lossEvents: 0,
                    finalValue: event.value,
                    lastTime: event.time
                });
            }

            const summary = summaries.get(event.label);
            if (event.delta > 0) {
                summary.gains += event.delta;
                summary.gainEvents += 1;
            } else if (event.delta < 0) {
                summary.losses += Math.abs(event.delta);
                summary.lossEvents += 1;
            }
            summary.finalValue = event.value;
            summary.lastTime = Math.max(summary.lastTime, event.time);
        });

        return Array.from(summaries.values()).sort(function (left, right) {
            const leftIndex = statOrder.indexOf(left.label);
            const rightIndex = statOrder.indexOf(right.label);
            const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
            const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
            if (normalizedLeft !== normalizedRight) {
                return normalizedLeft - normalizedRight;
            }
            return left.label.localeCompare(right.label);
        });
    }

    function renderItemEventSummary(events, options) {
        if (!events.length) {
            return renderEmptyState('No POV item-bit transitions were tracked.');
        }

        const groups = summarizeItemEvents(events, options);
        const uniqueItems = groups.reduce(function (sum, group) {
            return sum + group.entries.length;
        }, 0);

        return [
            '<div class="mini-metrics grouped-summary-metrics">',
            renderMiniMetric('Event count', String(events.length)),
            renderMiniMetric('Items touched', String(uniqueItems)),
            '</div>',
            '<div class="event-group-grid">',
            groups.map(function (group) {
                return [
                    '<section class="event-group-card">',
                    '<div class="event-group-head">',
                    '<div class="event-group-title">' + escapeHtml(group.label) + '</div>',
                    '<div class="event-group-count">' + escapeHtml(pluralize(group.count, 'event')) + '</div>',
                    '</div>',
                    '<ul class="event-summary-list">',
                    group.entries.map(function (entry) {
                        const parts = [];
                        if (entry.acquired) {
                            parts.push('picked up ' + entry.acquired);
                        }
                        if (entry.lost) {
                            parts.push('lost ' + entry.lost);
                        }
                        parts.push('last ' + formatDuration(entry.lastTime));
                        return '<li><strong>' + escapeHtml(entry.item) + '</strong> ' + escapeHtml(parts.join(' · ')) + '</li>';
                    }).join(''),
                    '</ul>',
                    '</section>'
                ].join('');
            }).join(''),
            '</div>'
        ].join('');
    }

    function renderResourceChangeSummary(events) {
        if (!events.length) {
            return renderEmptyState('No POV health, armor, or ammo deltas were tracked.');
        }

        const summaries = summarizeResourceEvents(events);

        return [
            '<div class="mini-metrics grouped-summary-metrics">',
            renderMiniMetric('Update count', String(events.length)),
            renderMiniMetric('Stats changed', String(summaries.length)),
            '</div>',
            '<ul class="event-summary-list resource-summary-list">',
            summaries.map(function (entry) {
                const parts = [];
                if (entry.gains) {
                    parts.push('+' + entry.gains + ' across ' + pluralize(entry.gainEvents, 'update'));
                }
                if (entry.losses) {
                    parts.push('-' + entry.losses + ' across ' + pluralize(entry.lossEvents, 'update'));
                }
                parts.push('final ' + entry.finalValue);
                parts.push('last ' + formatDuration(entry.lastTime));
                return '<li><strong>' + escapeHtml(entry.label) + '</strong> ' + escapeHtml(parts.join(' · ')) + '</li>';
            }).join(''),
            '</ul>'
        ].join('');
    }

    function collectServerHappenings(data) {
        const items = [];
        let skippingPingTimes = false;
        let pending = null;

        function isPingTimesHeader(text) {
            return /^Client ping times:/i.test(text);
        }

        function isPingTimesLine(text) {
            return /^\d{1,4}\s+\S/.test(text);
        }

        function flushPending() {
            if (!pending) {
                return;
            }

            const text = pending.text.trim();
            if (!text) {
                pending = null;
                return;
            }

            if (isPingTimesHeader(text)) {
                skippingPingTimes = true;
                pending = null;
                return;
            }

            if (skippingPingTimes) {
                if (isPingTimesLine(text)) {
                    pending = null;
                    return;
                }
                skippingPingTimes = false;
            }

            items.push({
                time: pending.time,
                frame: pending.frame,
                source: pending.source,
                text: text
            });
            pending = null;
        }

        function appendFragment(entry, fragment) {
            if (!pending) {
                pending = {
                    time: entry.time,
                    frame: entry.frame,
                    source: entry.source,
                    text: ''
                };
            }
            pending.text += fragment;
        }

        data.prints.forEach(function (entry) {
            const text = String(entry.text || '');
            const sameStream = pending &&
                pending.time === entry.time &&
                pending.frame === entry.frame &&
                pending.source === entry.source;

            if (!sameStream) {
                flushPending();
            }

            text.split(/(\r\n|\n|\r)/).forEach(function (part) {
                if (!part) {
                    return;
                }

                if (part === '\n' || part === '\r' || part === '\r\n') {
                    flushPending();
                    return;
                }

                appendFragment(entry, part);
            });
        });

        flushPending();

        return items;
    }

    function renderLocalSection(data, options) {
        const stats = data.local.finalStats || {};
        const movement = data.local.movement || {};
        const summaryMetrics = [
            renderMetric('Estimated jumps', String(movement.estimatedJumps || 0)),
            renderMetric('Ground time', formatDuration(movement.groundTime)),
            renderMetric('Air time', formatDuration(movement.airTime)),
            renderMetric('Water time', formatDuration(movement.waterTime))
        ];

        if (shouldShowProgressMetric(data, stats.kills, stats.totalMonsters)) {
            summaryMetrics.splice(2, 0, renderMetric('Kills', formatProgressValue(stats.kills, stats.totalMonsters)));
        }
        if (shouldShowProgressMetric(data, stats.secrets, stats.totalSecrets)) {
            const insertIndex = shouldShowProgressMetric(data, stats.kills, stats.totalMonsters) ? 3 : 2;
            summaryMetrics.splice(insertIndex, 0, renderMetric('Secrets', formatProgressValue(stats.secrets, stats.totalSecrets)));
        }

        const itemEvents = renderItemEventSummary(data.local.itemEvents, {
            useFlagLabels: !!(options && options.useFlagLabels)
        });
        const resourceEvents = renderResourceChangeSummary(data.local.resourceEvents);

        return [
            '<div class="analytics-stack">',
            '<div class="metrics">' + summaryMetrics.join('') + '</div>',
            '<div class="analytics-block">',
            '<h4 class="analytics-title">Weapon Usage</h4>',
            '<div class="weapon-grid">' + renderWeaponUsage(data.local.weaponUsage) + '</div>',
            '</div>',
            '<div class="timeline-grid analytics-timeline-grid">',
            '<div class="timeline-card analytics-card">',
            '<h4 class="timeline-title">Item Events</h4>',
            '<div class="timeline-subtitle">Tracked from POV item-bit transitions.</div>',
            itemEvents,
            '</div>',
            '<div class="timeline-card analytics-card">',
            '<h4 class="timeline-title">Resource Changes</h4>',
            '<div class="timeline-subtitle">Health, armor, and ammo deltas seen by the POV client.</div>',
            resourceEvents,
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    }

    function speakerOptions(data) {
        const seen = new Set();
        const options = [{ value: 'all', label: 'All players' }];

        data.chatLog.forEach(function (entry) {
            if (seen.has(entry.speakerKey)) {
                return;
            }
            seen.add(entry.speakerKey);
            options.push({
                value: entry.speakerKey,
                label: entry.speaker
            });
        });

        return options;
    }

    function renderChatSection(data, index) {
        if (!data.chatLog.length) {
            return renderEmptyState('No chat lines were detected.');
        }

        const options = speakerOptions(data).map(function (option) {
            return '<option value="' + escapeAttribute(option.value) + '">' + escapeHtml(option.label) + '</option>';
        }).join('');

        const entries = data.chatLog.map(function (entry) {
            return [
                '<div class="chat-entry ' + (entry.team ? 'team' : '') + '" data-speaker-key="' + escapeAttribute(entry.speakerKey) + '">',
                '<div class="chat-time">' + escapeHtml(formatDuration(entry.time)) + '</div>',
                '<div class="chat-speaker">' + escapeHtml(entry.team ? '(' + entry.speaker + ')' : entry.speaker) + '</div>',
                '<div class="chat-message">' + escapeHtml(entry.message) + '</div>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<div class="chat-toolbar">',
            '<label for="chatFilter' + index + '">Speaker</label>',
            '<select id="chatFilter' + index + '" class="chat-filter" data-chat-target="chatLog' + index + '">',
            options,
            '</select>',
            '</div>',
            '<div id="chatLog' + index + '" class="chat-log">',
            entries,
            '</div>'
        ].join('');
    }

    function renderServerHappeningsSection(happenings, index) {
        if (!happenings.length) {
            return renderEmptyState('No non-chat server messages were detected.');
        }

        const defaultVisibleCount = happenings.filter(function (entry) {
            return entry.source !== 'centerprint';
        }).length;

        return [
            '<div class="server-panel">',
            '<div class="server-toolbar" data-server-target="serverLog' + index + '" data-server-empty-target="serverEmpty' + index + '">',
            '<label class="toggle-control server-toggle">',
            '<input type="checkbox" class="server-filter-checkbox" value="server" checked>',
            'Server',
            '</label>',
            '<label class="toggle-control server-toggle">',
            '<input type="checkbox" class="server-filter-checkbox" value="center">',
            'Centerprint',
            '</label>',
            '</div>',
            '<div id="serverLog' + index + '" class="server-log">',
            happenings.map(function (entry) {
                const sourceType = entry.source === 'centerprint' ? 'center' : 'server';
                const sourceLabel = sourceType;
                const sourceClass = entry.source === 'centerprint' ? 'center' : 'print';

                return [
                    '<div class="server-entry ' + escapeAttribute(sourceClass) + '" data-server-source="' + escapeAttribute(sourceType) + '"' + (sourceType === 'center' ? ' hidden' : '') + '>',
                    '<div class="server-time">' + escapeHtml(formatDuration(entry.time)) + '</div>',
                    '<div class="server-source">' + escapeHtml(sourceLabel) + '</div>',
                    '<div class="server-message">' + escapeHtml(entry.text) + '</div>',
                    '</div>'
                ].join('');
            }).join(''),
            '</div>',
            '<div id="serverEmpty' + index + '" class="empty-state"' + (defaultVisibleCount > 0 ? ' hidden' : '') + '>No server happenings match the current filters.</div>',
            '</div>'
        ].join('');
    }

    function renderWarningsSection(data) {
        if (!data.warnings.length) {
            return renderEmptyState('No parser warnings for this file.');
        }

        return [
            '<ul class="warning-list">',
            data.warnings.map(function (warning) {
                return '<li>' + escapeHtml(warning) + '</li>';
            }).join(''),
            '</ul>'
        ].join('');
    }

    function renderSaveAsSection(item, index) {
        const sourceFormat = item && item.sourceFormat === 'dz' ? 'dz' : 'dem';
        const targetFormat = sourceFormat === 'dz' ? 'dem' : 'dz';

        if (targetFormat === 'dz' && !dzipSupported) {
            return [
                '<section class="subsection subsection-collapsible">',
                '<details class="section-disclosure">',
                '<summary class="subsection-head disclosure-summary">',
                '<span class="subsection-title">Save As</span>',
                '<span class="disclosure-meta" aria-hidden="true"></span>',
                '</summary>',
                '<div class="disclosure-body">',
                '<div class="trim-panel trim-panel-disabled">',
                '<p class="subsection-copy">Repackage the loaded demo as a fresh <code>.dz</code> archive.</p>',
                '<div class="trim-actions">',
                '<div class="trim-hint">DZip export support is unavailable in this browser.</div>',
                '</div>',
                '</div>',
                '</div>',
                '</details>',
                '</section>'
            ].join('');
        }

        const copy = targetFormat === 'dem'
            ? 'Extract the loaded demo entry as a raw <code>.dem</code> file.'
            : 'Repackage the loaded demo as a fresh <code>.dz</code> archive.';
        const hint = targetFormat === 'dem'
            ? 'This saves the extracted demo stream without the surrounding DZip archive.'
            : 'This writes a new DZip archive containing the loaded demo entry.';

        return [
            '<section class="subsection subsection-collapsible">',
            '<details class="section-disclosure">',
            '<summary class="subsection-head disclosure-summary">',
            '<span class="subsection-title">Save As</span>',
            '<span class="disclosure-meta" aria-hidden="true"></span>',
            '</summary>',
            '<div class="disclosure-body">',
            '<div class="trim-panel save-as-panel" data-demo-index="' + escapeAttribute(index) + '">',
            '<p class="subsection-copy">' + copy + '</p>',
            '<div class="trim-actions">',
            '<div class="trim-hint">' + hint + '</div>',
            '<button class="trim-download-button save-as-button" type="button" data-export-format="' + escapeAttribute(targetFormat) + '">Save as .' + escapeHtml(targetFormat) + '</button>',
            '</div>',
            '</div>',
            '</div>',
            '</details>',
            '</section>'
        ].join('');
    }

    function renderDemoError(item) {
        return [
            '<article class="save-card demo-card">',
            '<div class="save-header">',
            '<div class="save-headline">',
            '<div>',
            '<h2 class="save-title">' + escapeHtml(item.displayName || item.fileName || '(unknown demo)') + '</h2>',
            '<div class="save-subtitle">' + escapeHtml(formatBytes(item.fileSize)) + ' · ' + escapeHtml(formatDate(item.lastModified)) + (item.archiveName ? ' · ' + escapeHtml('from ' + item.archiveName) : '') + '</div>',
            '</div>',
            '<div class="save-meta">' + renderPill('Parse failed', 'bad') + '</div>',
            '</div>',
            '</div>',
            '<div class="save-body">',
            '<div class="save-error"><p>' + escapeHtml(item.error) + '</p></div>',
            '</div>',
            '</article>'
        ].join('');
    }

    function renderDemoCard(item, index) {
        if (!item.data) {
            return renderDemoError(item);
        }

        const data = item.data;
        const happenings = collectServerHappenings(data);
        const useFlagLabels = shouldUseFlagLabels(happenings);
        const pills = [];
        data.protocols.forEach(function (protocol) {
            pills.push(renderPill('Protocol ' + protocol));
        });
        pills.push(renderPill(data.maps.length + ' map' + (data.maps.length === 1 ? '' : 's')));
        pills.push(renderPill(data.players.length + ' player' + (data.players.length === 1 ? '' : 's')));
        pills.push(renderPill(happenings.length + ' server event' + (happenings.length === 1 ? '' : 's')));
        pills.push(renderPill(data.chatLog.length + ' chat line' + (data.chatLog.length === 1 ? '' : 's')));
        if (data.players.some(function (player) { return player.isPov; })) {
            pills.push(renderPill('POV detected', 'pov'));
        }
        if (item.archiveName) {
            pills.push(renderPill('From ' + item.archiveName));
        }
        var captimeRecords = extractCaptimeRecords(happenings);
        if (captimeRecords.length) {
            pills.push(renderPill(captimeRecords.length + ' captime' + (captimeRecords.length === 1 ? '' : 's'), 'captime'));
        }
        var matchStats = extractMatchStats(data);
        if (matchStats) {
            pills.push(renderPill('Match Stats', 'match-stats'));
        }

        const metrics = [
            renderMetric('Duration', formatDuration(data.duration)),
            renderMetric('Frames', String(data.frameCount)),
            renderMetric('Messages', String(data.messageCount)),
            renderMetric('Forcetrack', data.forcetrack === null ? 'Unknown' : String(data.forcetrack))
        ];

        if (shouldShowProgressMetric(data, data.local.finalStats.kills, data.local.finalStats.totalMonsters)) {
            metrics.push(renderMetric('POV kills', formatProgressValue(data.local.finalStats.kills, data.local.finalStats.totalMonsters)));
        }
        if (shouldShowProgressMetric(data, data.local.finalStats.secrets, data.local.finalStats.totalSecrets)) {
            metrics.push(renderMetric('POV secrets', formatProgressValue(data.local.finalStats.secrets, data.local.finalStats.totalSecrets)));
        }

        return [
            '<article class="save-card demo-card">',
            '<div class="save-header">',
            '<div class="save-headline">',
            '<div>',
            '<h2 class="save-title">' + escapeHtml(data.fileName) + '</h2>',
            '<div class="save-subtitle">' + escapeHtml(formatBytes(data.fileSize)) + ' · ' + escapeHtml(formatDate(data.lastModified)) + (item.archiveName ? ' · ' + escapeHtml('from ' + item.archiveName) : '') + '</div>',
            '</div>',
            '<div class="save-meta">' + pills.join('') + '</div>',
            '</div>',
            '</div>',
            '<div class="save-body">',
            '<div class="metrics">' + metrics.join('') + '</div>',
            '<div class="section-stack">',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">' + escapeHtml(data.maps.length === 1 ? 'Map' : 'Maps') + '</h3></div>',
            '<div class="map-grid">' + renderMapSection(data) + '</div>',
            '</section>',
            '<section class="subsection subsection-collapsible">',
            '<details class="section-disclosure">',
            '<summary class="subsection-head disclosure-summary">',
            '<span class="subsection-title">Trim</span>',
            '<span class="disclosure-meta" aria-hidden="true"></span>',
            '</summary>',
            '<div class="disclosure-body">',
            renderTrimSection(item, index),
            '</div>',
            '</details>',
            '</section>',
            '<section class="subsection subsection-collapsible">',
            '<details class="section-disclosure">',
            '<summary class="subsection-head disclosure-summary">',
            '<span class="subsection-title">Smooth</span>',
            '<span class="disclosure-meta" aria-hidden="true"></span>',
            '</summary>',
            '<div class="disclosure-body">',
            renderSmoothSection(item, index),
            '</div>',
            '</details>',
            '</section>',
            renderSaveAsSection(item, index),
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Players</h3>' + (data.players.length ? '<button type="button" class="txt-export-button" data-export="players" data-demo-index="' + index + '" title="Save as .txt"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.5M4.5 7 8 10.5 11.5 7"/><path d="M2.5 12.5v1.5h11v-1.5"/></svg></button>' : '') + '</div>',
            '<div class="player-grid">' + renderPlayerSection(data) + '</div>',
            '</section>',
            matchStats ? [
                '<section class="subsection subsection-collapsible">',
                '<details class="section-disclosure" open>',
                '<summary class="subsection-head disclosure-summary">',
                '<span class="subsection-title">Match Statistics</span>',
                '<span class="disclosure-meta" aria-hidden="true"></span>',
                '</summary>',
                '<div class="disclosure-body">',
                renderMatchStatsSection(matchStats),
                '</div>',
                '</details>',
                '</section>'
            ].join('') : '',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">POV Analytics</h3></div>',
            renderLocalSection(data, { useFlagLabels: useFlagLabels }),
            '</section>',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Server Happenings</h3>' + (happenings.length ? '<button type="button" class="txt-export-button" data-export="server" data-demo-index="' + index + '" title="Save as .txt"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.5M4.5 7 8 10.5 11.5 7"/><path d="M2.5 12.5v1.5h11v-1.5"/></svg></button>' : '') + '</div>',
            renderServerHappeningsSection(happenings, index),
            '</section>',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Chat Log</h3>' + (data.chatLog.length ? '<button type="button" class="txt-export-button" data-export="chat" data-demo-index="' + index + '" title="Save as .txt"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.5M4.5 7 8 10.5 11.5 7"/><path d="M2.5 12.5v1.5h11v-1.5"/></svg></button>' : '') + '</div>',
            renderChatSection(data, index),
            '</section>',
            data.warnings.length ? [
                '<section class="subsection">',
                '<div class="subsection-head"><h3 class="subsection-title">Warnings</h3></div>',
                renderWarningsSection(data),
                '</section>'
            ].join('') : '',
            '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    function updateSummary(items) {
        const successful = items.filter(function (item) {
            return !!item.data;
        });

        if (!successful.length) {
            summaryPanel.hidden = true;
            summaryGrid.innerHTML = '';
            if (summaryActions) {
                summaryActions.hidden = true;
                summaryActions.innerHTML = '';
            }
            return;
        }

        const mapSet = new Set();
        const protocolSet = new Set();
        const playerSet = new Set();
        let chatLines = 0;
        let serverEvents = 0;
        let frames = 0;
        let duration = 0;

        successful.forEach(function (item) {
            item.data.maps.forEach(function (map) {
                mapSet.add((map.mapName || map.levelName || 'unknown').toLowerCase());
            });
            item.data.protocols.forEach(function (protocol) {
                protocolSet.add(protocol);
            });
            item.data.players.forEach(function (player) {
                playerSet.add(player.key);
            });
            chatLines += item.data.chatLog.length;
            serverEvents += collectServerHappenings(item.data).length;
            frames += item.data.frameCount;
            if (Number.isFinite(item.data.duration)) {
                duration += item.data.duration;
            }
        });

        summaryGrid.innerHTML = [
            renderStatCard('Demos', String(successful.length)),
            renderStatCard('Unique maps', String(mapSet.size)),
            renderStatCard(successful.length === 1 ? 'Protocol' : 'Protocols', Array.from(protocolSet).join(', ')),
            renderStatCard('Players seen', String(playerSet.size)),
            renderStatCard('Server events', String(serverEvents)),
            renderStatCard('Chat lines', String(chatLines)),
            renderStatCard('Frames', String(frames)),
            renderStatCard('Decoded time', formatDuration(duration))
        ].join('');
        if (summaryActions) {
            const sections = [
                renderCombineSection(items),
                renderSuperimposeSection(items)
            ].filter(Boolean);
            summaryActions.innerHTML = sections.join('');
            summaryActions.hidden = sections.length === 0;
        }
        summaryPanel.hidden = false;
    }

    function buildFolderAnalysis(items) {
        var successful = items.filter(function (item) { return !!item.data; });
        var totalSize = 0;
        var totalDuration = 0;
        var totalFrames = 0;
        var totalMessages = 0;
        var totalWarnings = 0;
        var playerMap = {};
        var mapMap = {};
        var allChat = [];
        var weaponMap = {};
        var protocolCounts = {};
        var timeline = [];
        var itemPickups = {};
        var movementTotals = { distance: 0, horizontalDistance: 0, maxSpeed: 0, speedSum: 0, speedCount: 0, jumps: 0, groundTime: 0, airTime: 0, waterTime: 0, demoCount: 0 };
        var allWarnings = [];
        var duplicateKeys = {};
        var headToHead = {};

        successful.forEach(function (item, itemIndex) {
            var data = item.data;
            var demoName = item.fileName || item.displayName;
            totalSize += item.fileSize || 0;
            totalFrames += data.frameCount || 0;
            totalMessages += data.messageCount || 0;
            if (Number.isFinite(data.duration)) {
                totalDuration += data.duration;
            }

            if (data.warnings && data.warnings.length) {
                totalWarnings += data.warnings.length;
                data.warnings.forEach(function (w) {
                    allWarnings.push({ demo: demoName, message: w });
                });
            }

            var dupKey = data.maps.map(function (m) { return (m.mapName || '').toLowerCase(); }).join('+') +
                '|' + (Number.isFinite(data.duration) ? Math.round(data.duration) : '?') +
                '|' + data.players.map(function (p) { return (p.displayName || p.name || '').toLowerCase(); }).sort().join(',');
            if (!duplicateKeys[dupKey]) {
                duplicateKeys[dupKey] = [];
            }
            duplicateKeys[dupKey].push(demoName);

            data.protocols.forEach(function (p) {
                protocolCounts[p] = (protocolCounts[p] || 0) + 1;
            });

            var playerNamesInDemo = [];
            timeline.push({
                fileName: demoName,
                lastModified: item.lastModified,
                fileSize: item.fileSize,
                duration: data.duration,
                maps: data.maps.map(function (m) { return m.mapName || m.levelName || '?'; }),
                playerCount: data.players.length,
                chatCount: data.chatLog.length,
                index: itemIndex
            });

            data.players.forEach(function (player) {
                var nameKey = (player.displayName || player.name || '').toLowerCase().trim();
                if (!nameKey) { nameKey = '__unnamed__'; }
                playerNamesInDemo.push(nameKey);
                if (!playerMap[nameKey]) {
                    playerMap[nameKey] = {
                        displayName: player.displayName || player.name,
                        nameCodes: player.nameCodes,
                        totalFrags: 0,
                        maxFrags: -Infinity,
                        totalPlaytime: 0,
                        appearances: 0,
                        totalChatCount: 0,
                        totalDistance: 0,
                        maxSpeed: 0,
                        speedSum: 0,
                        speedCount: 0,
                        shirts: {},
                        pants: {},
                        aliases: {},
                        demos: []
                    };
                }
                var entry = playerMap[nameKey];
                entry.appearances += 1;
                entry.totalFrags += player.frags || 0;
                if ((player.frags || 0) > entry.maxFrags) {
                    entry.maxFrags = player.frags || 0;
                }
                entry.totalChatCount += player.chatCount || 0;
                if (player.movement) {
                    if (Number.isFinite(player.movement.trackedTime)) {
                        entry.totalPlaytime += player.movement.trackedTime;
                    }
                    if (Number.isFinite(player.movement.distance)) {
                        entry.totalDistance += player.movement.distance;
                    }
                    if (Number.isFinite(player.movement.maxSpeed) && player.movement.maxSpeed > entry.maxSpeed) {
                        entry.maxSpeed = player.movement.maxSpeed;
                    }
                    if (Number.isFinite(player.movement.averageSpeed) && player.movement.averageSpeed > 0) {
                        entry.speedSum += player.movement.averageSpeed;
                        entry.speedCount += 1;
                    }
                }
                if (Number.isInteger(player.shirt)) {
                    entry.shirts[player.shirt] = (entry.shirts[player.shirt] || 0) + 1;
                }
                if (Number.isInteger(player.pants)) {
                    entry.pants[player.pants] = (entry.pants[player.pants] || 0) + 1;
                }
                if (!entry.nameCodes && player.nameCodes) {
                    entry.nameCodes = player.nameCodes;
                }
                var statusAliasPattern = /\b(ready|typing|dead|afk|brb)\b/i;
                if (Array.isArray(player.aliases)) {
                    player.aliases.forEach(function (alias) {
                        var aKey = alias.toLowerCase().trim();
                        if (aKey && aKey !== nameKey && !statusAliasPattern.test(aKey)) {
                            entry.aliases[aKey] = alias;
                        }
                    });
                }
                var rawName = (player.name || '').trim();
                if (rawName) {
                    var rnKey = rawName.toLowerCase();
                    if (rnKey !== nameKey && !statusAliasPattern.test(rnKey)) {
                        entry.aliases[rnKey] = rawName;
                    }
                }
                entry.demos.push(demoName);
            });

            for (var pi = 0; pi < playerNamesInDemo.length; pi++) {
                for (var pj = pi + 1; pj < playerNamesInDemo.length; pj++) {
                    var pairA = playerNamesInDemo[pi];
                    var pairB = playerNamesInDemo[pj];
                    var pairKey = pairA < pairB ? pairA + '|||' + pairB : pairB + '|||' + pairA;
                    headToHead[pairKey] = (headToHead[pairKey] || 0) + 1;
                }
            }

            data.maps.forEach(function (map) {
                var mapKey = (map.mapName || map.levelName || 'unknown').toLowerCase();
                if (!mapMap[mapKey]) {
                    mapMap[mapKey] = {
                        mapName: map.mapName || map.levelName || 'unknown',
                        levelName: map.levelName || '',
                        playCount: 0,
                        totalTime: 0,
                        protocols: {},
                        totalKills: 0,
                        totalMonsters: 0,
                        totalSecrets: 0,
                        totalSecretsAvailable: 0,
                        bestTime: Infinity,
                        bestTimeDemo: '',
                        bestKillPct: 0,
                        bestKillPctDemo: '',
                        bestSecretPct: 0,
                        bestSecretPctDemo: ''
                    };
                }
                var mEntry = mapMap[mapKey];
                mEntry.playCount += 1;
                if (Number.isFinite(map.duration)) {
                    mEntry.totalTime += map.duration;
                    if (map.duration < mEntry.bestTime) {
                        mEntry.bestTime = map.duration;
                        mEntry.bestTimeDemo = demoName;
                    }
                }
                if (map.protocol) {
                    mEntry.protocols[map.protocol] = true;
                }
                if (map.povStats) {
                    var kills = Number(map.povStats.kills) || 0;
                    var monsters = Number(map.povStats.totalMonsters) || 0;
                    var secrets = Number(map.povStats.secrets) || 0;
                    var totalSec = Number(map.povStats.totalSecrets) || 0;
                    mEntry.totalKills += kills;
                    mEntry.totalMonsters += monsters;
                    mEntry.totalSecrets += secrets;
                    mEntry.totalSecretsAvailable += totalSec;
                    var killPct = monsters > 0 ? (kills / monsters) * 100 : 0;
                    var secretPct = totalSec > 0 ? (secrets / totalSec) * 100 : 0;
                    if (killPct > mEntry.bestKillPct) {
                        mEntry.bestKillPct = killPct;
                        mEntry.bestKillPctDemo = demoName;
                    }
                    if (secretPct > mEntry.bestSecretPct) {
                        mEntry.bestSecretPct = secretPct;
                        mEntry.bestSecretPctDemo = demoName;
                    }
                }
            });

            data.chatLog.forEach(function (chat) {
                allChat.push({
                    time: chat.time,
                    frame: chat.frame,
                    speaker: chat.speaker,
                    speakerKey: chat.speakerKey,
                    team: chat.team,
                    message: chat.message,
                    demoFileName: demoName,
                    demoDate: item.lastModified,
                    demoIndex: itemIndex
                });
            });

            if (data.local) {
                if (Array.isArray(data.local.weaponUsage)) {
                    data.local.weaponUsage.forEach(function (wu) {
                        var wKey = wu.weaponName || ('weapon_' + wu.weapon);
                        if (!weaponMap[wKey]) {
                            weaponMap[wKey] = {
                                weaponName: wu.weaponName,
                                totalSwitches: 0,
                                totalActiveTime: 0,
                                totalAmmoSpent: 0,
                                totalEstimatedShots: 0,
                                unit: wu.unit,
                                demoCount: 0
                            };
                        }
                        var wEntry = weaponMap[wKey];
                        wEntry.totalSwitches += wu.switches || 0;
                        wEntry.totalActiveTime += wu.activeTime || 0;
                        wEntry.totalAmmoSpent += wu.ammoSpent || 0;
                        wEntry.totalEstimatedShots += wu.estimatedShots || 0;
                        wEntry.demoCount += 1;
                    });
                }

                if (Array.isArray(data.local.itemEvents)) {
                    data.local.itemEvents.forEach(function (ev) {
                        if (ev.type === 'acquired' && ev.item) {
                            var iKey = ev.item;
                            if (!itemPickups[iKey]) {
                                itemPickups[iKey] = { item: ev.item, group: ev.group || 'other', count: 0 };
                            }
                            itemPickups[iKey].count += 1;
                        }
                    });
                }

                if (data.local.movement) {
                    var lm = data.local.movement;
                    movementTotals.demoCount += 1;
                    if (Number.isFinite(lm.estimatedJumps)) { movementTotals.jumps += lm.estimatedJumps; }
                    if (Number.isFinite(lm.groundTime)) { movementTotals.groundTime += lm.groundTime; }
                    if (Number.isFinite(lm.airTime)) { movementTotals.airTime += lm.airTime; }
                    if (Number.isFinite(lm.waterTime)) { movementTotals.waterTime += lm.waterTime; }
                }
            }

            data.players.forEach(function (player) {
                if (player.isPov && player.movement) {
                    if (Number.isFinite(player.movement.distance)) {
                        movementTotals.distance += player.movement.distance;
                    }
                    if (Number.isFinite(player.movement.horizontalDistance)) {
                        movementTotals.horizontalDistance += player.movement.horizontalDistance;
                    }
                    if (Number.isFinite(player.movement.maxSpeed) && player.movement.maxSpeed > movementTotals.maxSpeed) {
                        movementTotals.maxSpeed = player.movement.maxSpeed;
                    }
                    if (Number.isFinite(player.movement.averageSpeed) && player.movement.averageSpeed > 0) {
                        movementTotals.speedSum += player.movement.averageSpeed;
                        movementTotals.speedCount += 1;
                    }
                }
            });
        });

        var playerRoster = Object.keys(playerMap).map(function (key) {
            var p = playerMap[key];
            if (p.maxFrags === -Infinity) { p.maxFrags = 0; }
            p.avgSpeed = p.speedCount > 0 ? Math.round(p.speedSum / p.speedCount) : 0;
            p.aliasList = Object.keys(p.aliases).map(function (k) { return p.aliases[k]; });
            return p;
        }).sort(function (a, b) { return b.totalFrags - a.totalFrags; });

        var mapFrequency = Object.keys(mapMap).map(function (key) {
            var m = mapMap[key];
            if (m.bestTime === Infinity) { m.bestTime = null; }
            return m;
        }).sort(function (a, b) { return b.playCount - a.playCount; });

        var weaponUsage = Object.keys(weaponMap).map(function (key) {
            return weaponMap[key];
        }).sort(function (a, b) { return b.totalAmmoSpent - a.totalAmmoSpent; });

        var itemPickupList = Object.keys(itemPickups).map(function (key) {
            return itemPickups[key];
        }).sort(function (a, b) { return b.count - a.count; });

        timeline.sort(function (a, b) {
            return (a.lastModified || 0) - (b.lastModified || 0);
        });

        var headToHeadList = Object.keys(headToHead).map(function (key) {
            var parts = key.split('|||');
            var nameA = (playerMap[parts[0]] && playerMap[parts[0]].displayName) || parts[0];
            var nameB = (playerMap[parts[1]] && playerMap[parts[1]].displayName) || parts[1];
            var codesA = playerMap[parts[0]] && playerMap[parts[0]].nameCodes;
            var codesB = playerMap[parts[1]] && playerMap[parts[1]].nameCodes;
            return { playerA: nameA, playerB: nameB, codesA: codesA, codesB: codesB, count: headToHead[key] };
        }).sort(function (a, b) { return b.count - a.count; });

        var colorCensus = { shirts: {}, pants: {} };
        playerRoster.forEach(function (p) {
            Object.keys(p.shirts).forEach(function (c) {
                colorCensus.shirts[c] = (colorCensus.shirts[c] || 0) + p.shirts[c];
            });
            Object.keys(p.pants).forEach(function (c) {
                colorCensus.pants[c] = (colorCensus.pants[c] || 0) + p.pants[c];
            });
        });

        var duplicates = [];
        Object.keys(duplicateKeys).forEach(function (key) {
            if (duplicateKeys[key].length > 1) {
                duplicates.push(duplicateKeys[key]);
            }
        });

        return {
            meta: {
                demoCount: successful.length,
                failCount: items.length - successful.length,
                totalSize: totalSize,
                totalDuration: totalDuration,
                totalFrames: totalFrames,
                totalMessages: totalMessages,
                totalWarnings: totalWarnings
            },
            playerRoster: playerRoster,
            mapFrequency: mapFrequency,
            chatLog: allChat,
            timeline: timeline,
            weaponUsage: weaponUsage,
            protocolCounts: protocolCounts,
            itemPickups: itemPickupList,
            movementTotals: movementTotals,
            headToHead: headToHeadList,
            colorCensus: colorCensus,
            warnings: allWarnings,
            duplicates: duplicates
        };
    }

    function renderFolderMeta(meta) {
        var cards = [
            renderStatCard('Demos parsed', String(meta.demoCount)),
            renderStatCard('Total size', formatBytes(meta.totalSize)),
            renderStatCard('Total duration', formatDuration(meta.totalDuration)),
            renderStatCard('Total frames', String(meta.totalFrames)),
            renderStatCard('Total messages', String(meta.totalMessages))
        ];
        if (meta.failCount > 0) {
            cards.push(renderStatCard('Parse failures', String(meta.failCount)));
        }
        if (meta.totalWarnings > 0) {
            cards.push(renderStatCard('Warnings', String(meta.totalWarnings)));
        }
        return '<div class="summary-grid">' + cards.join('') + '</div>';
    }

    function renderFolderPlayerRoster(roster) {
        if (!roster.length) {
            return renderEmptyState('No players found.');
        }

        var sortButtons = [
            '<div class="folder-sort-controls">',
            '<span class="folder-sort-label">Sort by:</span>',
            '<button class="folder-sort-button active" type="button" data-sort="frags">Frags</button>',
            '<button class="folder-sort-button" type="button" data-sort="appearances">Demos</button>',
            '<button class="folder-sort-button" type="button" data-sort="playtime">Playtime</button>',
            '<button class="folder-sort-button" type="button" data-sort="chat">Chat</button>',
            '<button class="folder-sort-button" type="button" data-sort="speed">Avg speed</button>',
            '<button class="folder-sort-button" type="button" data-sort="maxspeed">Max speed</button>',
            '</div>'
        ].join('');

        var cards = roster.map(function (player) {
            var mostPants = null;
            var maxPantsCount = 0;
            Object.keys(player.pants).forEach(function (k) {
                if (player.pants[k] > maxPantsCount) {
                    maxPantsCount = player.pants[k];
                    mostPants = Number(k);
                }
            });

            var style = '';
            if (Number.isInteger(mostPants) && LEGACY_PANTS_TINTS[mostPants]) {
                var tint = LEGACY_PANTS_TINTS[mostPants];
                style = ' style="--player-tint: ' + tint[0] + ', ' + tint[1] + ', ' + tint[2] + ';"';
            }

            return [
                '<div class="player-card folder-roster-card"' + style,
                ' data-sort-frags="' + escapeAttribute(player.totalFrags) + '"',
                ' data-sort-appearances="' + escapeAttribute(player.appearances) + '"',
                ' data-sort-playtime="' + escapeAttribute(Math.round(player.totalPlaytime)) + '"',
                ' data-sort-chat="' + escapeAttribute(player.totalChatCount) + '"',
                ' data-sort-speed="' + escapeAttribute(player.avgSpeed) + '"',
                ' data-sort-maxspeed="' + escapeAttribute(Math.round(player.maxSpeed)) + '"',
                '>',
                '<div class="player-title">',
                renderQuakePreview(player.nameCodes, player.displayName),
                '</div>',
                '<div class="mini-metrics">',
                renderMiniMetric('Total frags', String(player.totalFrags)),
                renderMiniMetric('Best frags', String(player.maxFrags)),
                renderMiniMetric('Demos played', String(player.appearances)),
                renderMiniMetric('Total playtime', formatDuration(player.totalPlaytime)),
                renderMiniMetric('Chat lines', String(player.totalChatCount)),
                renderMiniMetric('Avg frags', player.appearances ? String(Math.round(player.totalFrags / player.appearances)) : '0'),
                renderMiniMetric('Avg speed', formatDecimal(player.avgSpeed, ' u/s')),
                renderMiniMetric('Max speed', formatDecimal(player.maxSpeed, ' u/s')),
                renderMiniMetric('Distance', formatDecimal(player.totalDistance, ' u')),
                '</div>',
                '</div>'
            ].join('');
        });

        var exportButton = '<button type="button" class="txt-export-button folder-roster-export-button" title="Save as .txt" aria-label="Export players list as .txt"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v7.5M4.5 7 8 10.5 11.5 7"/><path d="M2.5 12.5v1.5h11v-1.5"/></svg></button>';

        return [
            '<details class="section-disclosure subsection subsection-collapsible" open>',
            '<summary><div class="disclosure-summary disclosure-summary-with-action"><span class="disclosure-meta">Players (' + roster.length + ')</span>' + exportButton + '</div></summary>',
            '<div class="disclosure-body">',
            sortButtons,
            '<div class="player-grid folder-roster-grid">' + cards.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderMapFrequency(maps) {
        if (!maps.length) {
            return renderEmptyState('No maps found.');
        }

        var sortButtons = [
            '<div class="folder-sort-controls">',
            '<span class="folder-sort-label">Sort by:</span>',
            '<button class="folder-sort-button active" type="button" data-sort="count">Play count</button>',
            '<button class="folder-sort-button" type="button" data-sort="time">Total time</button>',
            '<button class="folder-sort-button" type="button" data-sort="killpct">Kill %</button>',
            '</div>'
        ].join('');

        var cards = maps.map(function (map) {
            var killPct = map.totalMonsters > 0 ? Math.round((map.totalKills / map.totalMonsters) * 100) : 0;
            var secretPct = map.totalSecretsAvailable > 0 ? Math.round((map.totalSecrets / map.totalSecretsAvailable) * 100) : 0;
            var hasStats = map.totalMonsters > 0 || map.totalSecretsAvailable > 0;
            var hasBest = map.bestTime !== null || map.bestKillPct > 0;

            var statsHtml = '';
            if (hasStats) {
                statsHtml =
                    renderMiniMetric('Kills', map.totalKills + ' / ' + map.totalMonsters + ' (' + killPct + '%)') +
                    renderMiniMetric('Secrets', map.totalSecrets + ' / ' + map.totalSecretsAvailable + ' (' + secretPct + '%)');
            }

            var bestHtml = '';
            if (hasBest) {
                var bestParts = [];
                if (map.bestTime !== null) {
                    bestParts.push(renderMiniMetric('Fastest run', formatDuration(map.bestTime)));
                }
                if (map.bestKillPct > 0) {
                    bestParts.push(renderMiniMetric('Best kill %', Math.round(map.bestKillPct) + '%'));
                }
                if (map.bestSecretPct > 0) {
                    bestParts.push(renderMiniMetric('Best secret %', Math.round(map.bestSecretPct) + '%'));
                }
                bestHtml = bestParts.join('');
            }

            return [
                '<div class="map-card folder-map-card"',
                ' data-sort-count="' + escapeAttribute(map.playCount) + '"',
                ' data-sort-time="' + escapeAttribute(Math.round(map.totalTime)) + '"',
                ' data-sort-killpct="' + escapeAttribute(killPct) + '"',
                '>',
                '<div class="map-title">' + escapeHtml(map.mapName) + '</div>',
                map.levelName ? '<div class="map-subtitle">' + escapeHtml(map.levelName) + '</div>' : '',
                '<div class="mini-metrics">',
                renderMiniMetric('Times played', String(map.playCount)),
                renderMiniMetric('Total time', formatDuration(map.totalTime)),
                statsHtml,
                bestHtml,
                '</div>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible" open>',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Maps (' + maps.length + ')</span></div></summary>',
            '<div class="disclosure-body">',
            sortButtons,
            '<div class="map-grid folder-map-grid">' + cards.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderChatExport(chatLog) {
        var total = chatLog.length;
        if (!total) {
            return '';
        }

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Chat Log (' + total + ' lines)</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="folder-chat-export">',
            '<p class="subsection-copy">' + total + ' chat messages across all demos.</p>',
            '<button class="trim-download-button folder-chat-export-button" type="button">Export chat log as .txt</button>',
            '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderTimeline(timeline) {
        if (!timeline.length) {
            return '';
        }

        var dateGroups = {};
        timeline.forEach(function (entry) {
            var dateKey = entry.lastModified ? new Date(entry.lastModified).toLocaleDateString() : 'Unknown date';
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = [];
            }
            dateGroups[dateKey].push(entry);
        });

        var groupKeys = Object.keys(dateGroups);
        var html = groupKeys.map(function (dateKey) {
            var entries = dateGroups[dateKey];
            var rows = entries.map(function (entry) {
                return [
                    '<div class="timeline-card">',
                    '<div class="timeline-title">' + escapeHtml(entry.fileName) + '</div>',
                    '<div class="mini-metrics">',
                    renderMiniMetric('Maps', escapeHtml(entry.maps.join(', '))),
                    renderMiniMetric('Duration', formatDuration(entry.duration)),
                    renderMiniMetric('Size', formatBytes(entry.fileSize)),
                    renderMiniMetric('Players', String(entry.playerCount)),
                    '</div>',
                    '</div>'
                ].join('');
            });
            return [
                '<div class="folder-timeline-group">',
                '<h4 class="folder-timeline-date">' + escapeHtml(dateKey) + '</h4>',
                '<div class="timeline-grid">' + rows.join('') + '</div>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Timeline (' + timeline.length + ' demos)</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="folder-timeline-stack">' + html.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderWeaponUsage(weapons) {
        if (!weapons.length) {
            return '';
        }

        var cards = weapons.map(function (w) {
            return [
                '<div class="weapon-card">',
                '<div class="weapon-title">' + escapeHtml(w.weaponName) + '</div>',
                '<div class="mini-metrics">',
                renderMiniMetric('Total ammo', String(w.totalAmmoSpent) + (w.unit ? ' ' + w.unit : '')),
                renderMiniMetric('Est. shots', String(w.totalEstimatedShots)),
                renderMiniMetric('Active time', formatDuration(w.totalActiveTime)),
                renderMiniMetric('Switches', String(w.totalSwitches)),
                renderMiniMetric('Demos used', String(w.demoCount)),
                '</div>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">POV Weapon Usage</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="weapon-grid">' + cards.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderProtocols(protocolCounts) {
        var keys = Object.keys(protocolCounts);
        if (!keys.length) {
            return '';
        }

        var pills = keys.sort().map(function (p) {
            return renderPill(p + ' (' + protocolCounts[p] + ')', 'neutral');
        }).join(' ');

        return [
            '<div class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Protocols</h3></div>',
            '<div class="folder-protocol-pills">' + pills + '</div>',
            '</div>'
        ].join('');
    }

    function renderFolderHeadToHead(pairs) {
        if (!pairs.length) {
            return '';
        }

        var top = pairs.slice(0, 30);
        var rows = top.map(function (pair) {
            return [
                '<div class="folder-h2h-row">',
                '<span class="folder-h2h-players">',
                renderQuakePreview(pair.codesA, pair.playerA),
                ' <span class="folder-h2h-vs">+</span> ',
                renderQuakePreview(pair.codesB, pair.playerB),
                '</span>',
                '<span class="folder-h2h-count">' + pair.count + ' demo' + (pair.count === 1 ? '' : 's') + '</span>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Head-to-Head (top ' + top.length + ' pairs)</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="folder-h2h-list">' + rows.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderColorCensus(colorCensus) {
        var shirtKeys = Object.keys(colorCensus.shirts).sort(function (a, b) {
            return colorCensus.shirts[b] - colorCensus.shirts[a];
        });
        var pantsKeys = Object.keys(colorCensus.pants).sort(function (a, b) {
            return colorCensus.pants[b] - colorCensus.pants[a];
        });

        if (!shirtKeys.length && !pantsKeys.length) {
            return '';
        }

        function renderColorBar(keys, counts) {
            return keys.map(function (c) {
                var idx = Number(c);
                var tint = LEGACY_PANTS_TINTS[idx];
                var bg = tint ? 'rgb(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ')' : '#555';
                return '<div class="folder-color-swatch" style="background:' + bg + ';" title="Color ' + c + ': ' + counts[c] + ' uses">' +
                    '<span class="folder-color-count">' + counts[c] + '</span></div>';
            }).join('');
        }

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Color Census</span></div></summary>',
            '<div class="disclosure-body">',
            shirtKeys.length ? '<div class="folder-color-section"><h4 class="folder-color-heading">Shirt Colors</h4><div class="folder-color-bar">' + renderColorBar(shirtKeys, colorCensus.shirts) + '</div></div>' : '',
            pantsKeys.length ? '<div class="folder-color-section"><h4 class="folder-color-heading">Pants Colors</h4><div class="folder-color-bar">' + renderColorBar(pantsKeys, colorCensus.pants) + '</div></div>' : '',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderItemPickups(itemPickups) {
        if (!itemPickups.length) {
            return '';
        }

        var groups = {};
        itemPickups.forEach(function (ip) {
            var g = ip.group || 'other';
            if (!groups[g]) { groups[g] = []; }
            groups[g].push(ip);
        });

        var groupOrder = ['weapons', 'inventory', 'powerups', 'keys', 'sigils', 'other'];
        var html = groupOrder.map(function (g) {
            if (!groups[g] || !groups[g].length) { return ''; }
            var items = groups[g].sort(function (a, b) { return b.count - a.count; });
            var cards = items.map(function (ip) {
                return [
                    '<div class="folder-item-entry">',
                    '<span class="folder-item-name">' + escapeHtml(ip.item) + '</span>',
                    '<span class="folder-item-count">' + ip.count + '</span>',
                    '</div>'
                ].join('');
            });
            return [
                '<div class="event-group-card">',
                '<div class="event-group-head">',
                '<span class="event-group-title">' + escapeHtml(g) + '</span>',
                '</div>',
                '<div class="folder-item-list">' + cards.join('') + '</div>',
                '</div>'
            ].join('');
        }).filter(Boolean);

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Item Pickups (' + itemPickups.reduce(function (s, i) { return s + i.count; }, 0) + ' total)</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="event-group-grid">' + html.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderMovement(m) {
        if (!m.demoCount) {
            return '';
        }

        var avgSpeed = m.speedCount > 0 ? Math.round(m.speedSum / m.speedCount) : 0;
        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">POV Movement Stats</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="mini-metrics">',
            renderMiniMetric('Total distance', formatDecimal(m.distance, ' u')),
            renderMiniMetric('Horiz. distance', formatDecimal(m.horizontalDistance, ' u')),
            renderMiniMetric('Max speed', formatDecimal(m.maxSpeed, ' u/s')),
            renderMiniMetric('Avg speed', formatDecimal(avgSpeed, ' u/s')),
            renderMiniMetric('Est. jumps', String(m.jumps)),
            renderMiniMetric('Ground time', formatDuration(m.groundTime)),
            renderMiniMetric('Air time', formatDuration(m.airTime)),
            renderMiniMetric('Water time', formatDuration(m.waterTime)),
            renderMiniMetric('Demos with POV', String(m.demoCount)),
            '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderWarnings(warnings) {
        if (!warnings.length) {
            return '';
        }

        var grouped = {};
        warnings.forEach(function (w) {
            if (!grouped[w.message]) {
                grouped[w.message] = [];
            }
            grouped[w.message].push(w.demo);
        });

        var rows = Object.keys(grouped).map(function (msg) {
            var demos = grouped[msg];
            return [
                '<div class="warning-card">',
                '<div class="folder-warning-msg">' + escapeHtml(msg) + '</div>',
                '<div class="folder-warning-demos">' + demos.length + ' demo' + (demos.length === 1 ? '' : 's') + ': ' + escapeHtml(demos.slice(0, 5).join(', ')) + (demos.length > 5 ? '...' : '') + '</div>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Warnings (' + warnings.length + ')</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="warning-grid">' + rows.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderDuplicates(duplicates) {
        if (!duplicates.length) {
            return '';
        }

        var rows = duplicates.map(function (group) {
            return [
                '<div class="warning-card">',
                '<div class="folder-warning-msg">Possible duplicates (' + group.length + ' demos)</div>',
                '<ul class="alias-list">' + group.map(function (name) {
                    return '<li>' + escapeHtml(name) + '</li>';
                }).join('') + '</ul>',
                '</div>'
            ].join('');
        });

        return [
            '<details class="section-disclosure subsection subsection-collapsible">',
            '<summary><div class="disclosure-summary"><span class="disclosure-meta">Possible Duplicates (' + duplicates.length + ' group' + (duplicates.length === 1 ? '' : 's') + ')</span></div></summary>',
            '<div class="disclosure-body">',
            '<div class="warning-grid">' + rows.join('') + '</div>',
            '</div>',
            '</details>'
        ].join('');
    }

    function renderFolderAnalysis(items) {
        var analysis = buildFolderAnalysis(items);

        folderAnalysisContent.innerHTML = [
            '<div class="section-stack">',
            renderFolderMeta(analysis.meta),
            renderFolderProtocols(analysis.protocolCounts),
            renderFolderPlayerRoster(analysis.playerRoster),
            renderFolderHeadToHead(analysis.headToHead),
            renderFolderColorCensus(analysis.colorCensus),
            renderFolderMapFrequency(analysis.mapFrequency),
            renderFolderWeaponUsage(analysis.weaponUsage),
            renderFolderItemPickups(analysis.itemPickups),
            renderFolderMovement(analysis.movementTotals),
            renderFolderChatExport(analysis.chatLog),
            renderFolderTimeline(analysis.timeline),
            renderFolderDuplicates(analysis.duplicates),
            renderFolderWarnings(analysis.warnings),
            '</div>'
        ].join('');

        bindFolderSortControls();
        bindFolderPlayerExport(analysis.playerRoster);
        bindFolderChatExport(analysis.chatLog);
        folderAnalysisPanel.hidden = false;
    }

    function bindFolderPlayerExport(roster) {
        var button = folderAnalysisContent.querySelector('.folder-roster-export-button');
        if (!button || !roster || !roster.length) { return; }

        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var lines = ['name\tname_hex'];
            roster.forEach(function (player) {
                var codes = Array.isArray(player.nameCodes) ? player.nameCodes : [];
                if (!codes.length) { return; }
                var dequaked = decodePlayerName(codes, player.displayName || '');
                var hex = codes.map(function (b) {
                    return ('0' + (b & 0xff).toString(16)).slice(-2);
                }).join('');
                lines.push(dequaked + '\t' + hex);
            });
            if (lines.length <= 1) { return; }
            triggerDownload(new TextEncoder().encode(lines.join('\n')), 'players.txt');
        });
    }

    function bindFolderSortControls() {
        var containers = folderAnalysisContent.querySelectorAll('.folder-sort-controls');
        containers.forEach(function (container) {
            var buttons = container.querySelectorAll('.folder-sort-button');
            var grid = container.parentElement.querySelector('.player-grid, .map-grid');
            if (!grid) { return; }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    buttons.forEach(function (b) { b.classList.remove('active'); });
                    button.classList.add('active');
                    var sortKey = button.getAttribute('data-sort');
                    var cards = Array.from(grid.children);
                    cards.sort(function (a, b) {
                        return (Number(b.getAttribute('data-sort-' + sortKey)) || 0) -
                               (Number(a.getAttribute('data-sort-' + sortKey)) || 0);
                    });
                    cards.forEach(function (card) { grid.appendChild(card); });
                });
            });
        });
    }

    function bindFolderChatExport(chatLog) {
        var button = folderAnalysisContent.querySelector('.folder-chat-export-button');
        if (!button || !chatLog.length) { return; }

        button.addEventListener('click', function () {
            var lines = chatLog.map(function (entry) {
                var timeStr = Number.isFinite(entry.time) ? formatTrimTime(entry.time) : '?';
                var prefix = entry.team ? '(team) ' : '';
                return '[' + entry.demoFileName + ' @ ' + timeStr + '] ' + prefix + entry.speaker + ': ' + entry.message;
            });
            var text = lines.join('\n');
            triggerDownload(new TextEncoder().encode(text), 'chat_log.txt');
        });
    }

    function renderResults(items) {
        if (!items.length) {
            resultsPanel.hidden = true;
            resultsPanel.innerHTML = '';
            clearButton.disabled = true;
            updateSummary([]);
            return;
        }

        resultsPanel.hidden = false;
        clearButton.disabled = false;
        resultsPanel.innerHTML = items.map(renderDemoCard).join('');
        updateSummary(items);
        bindSaveAsPanels();
        bindCombinePanel();
        bindSuperimposePanel();
        bindTrimPanels();
        bindSmoothPanels();
        bindChatFilters();
        bindServerFilters();
        bindTextExportButtons();
    }

    function bindSaveAsPanels() {
        const panels = resultsPanel.querySelectorAll('.save-as-panel[data-demo-index]');

        panels.forEach(function (panel) {
            const demoIndex = Number(panel.getAttribute('data-demo-index'));
            const item = parsedFiles[demoIndex];
            if (!item || !item.data) {
                return;
            }

            const button = panel.querySelector('.save-as-button');
            if (!button) {
                return;
            }

            const runExport = async function (format) {
                button.disabled = true;
                button.textContent = 'Saving .' + format + '...';

                try {
                    await triggerDemoDownload(
                        item.sourceBuffer,
                        item.data.fileName,
                        format,
                        item.data.lastModified
                    );
                    setStatus('Prepared ' + downloadBaseName(item.data.fileName, 'demo.dem') + ' as ' + exportFormatLabel(format) + '.', 'success');
                } catch (error) {
                    setStatus(error && error.message ? error.message : 'Failed to save the loaded demo.', 'error');
                } finally {
                    button.disabled = false;
                    button.textContent = 'Save as .' + format;
                }
            };

            button.addEventListener('click', function () {
                runExport(button.getAttribute('data-export-format') || 'dem');
            });
        });
    }

    function bindCombinePanel() {
        if (!summaryActions || summaryActions.hidden) {
            return;
        }

        const demButton = summaryActions.querySelector('#combineDownloadButton');
        const dzButton = summaryActions.querySelector('#combineDownloadDzipButton');
        if (!demButton && !dzButton) {
            return;
        }

        const runExport = async function (format) {
            const successful = parsedFiles.filter(function (item) {
                return !!item.data;
            });

            if (successful.length < 2) {
                setStatus('Load at least two parsed demos to combine them.', 'error');
                return;
            }

            if (demButton) {
                demButton.disabled = true;
                demButton.textContent = 'Building combined demo...';
            }
            if (dzButton) {
                dzButton.disabled = true;
                dzButton.textContent = 'Building combined DZip...';
            }

            try {
                const combined = parserApi.combineDemoBuffers(successful.map(function (item) {
                    return item.sourceBuffer;
                }));
                await triggerDemoDownload(combined, buildCombinedFileName(successful), format);
                setStatus('Prepared combined ' + exportFormatLabel(format) + ' from ' + successful.length + ' loaded demos.', 'success');
            } catch (error) {
                setStatus(error && error.message ? error.message : 'Failed to export combined demo.', 'error');
            } finally {
                if (demButton) {
                    demButton.disabled = false;
                    demButton.textContent = 'Export combined .dem';
                }
                if (dzButton) {
                    dzButton.disabled = false;
                    dzButton.textContent = 'Export combined .dz';
                }
            }
        };

        if (demButton) {
            demButton.addEventListener('click', function () {
                runExport('dem');
            });
        }
        if (dzButton) {
            dzButton.addEventListener('click', function () {
                runExport('dz');
            });
        }
    }

    function bindSuperimposePanel() {
        if (!summaryActions || summaryActions.hidden) {
            return;
        }

        const demButton = summaryActions.querySelector('#superimposeDownloadButton');
        const dzButton = summaryActions.querySelector('#superimposeDownloadDzipButton');
        const ignoreMapToggle = summaryActions.querySelector('#superimposeIgnoreMapToggle');
        if (!demButton && !dzButton) {
            return;
        }

        const runExport = async function (format) {
            const successful = parsedFiles.filter(function (item) {
                return !!item.data;
            });

            if (successful.length < 2) {
                setStatus('Load at least two parsed demos to superimpose them.', 'error');
                return;
            }

            if (demButton) {
                demButton.disabled = true;
                demButton.textContent = 'Building ghost demo...';
            }
            if (dzButton) {
                dzButton.disabled = true;
                dzButton.textContent = 'Building ghost DZip...';
            }

            try {
                const output = parserApi.superimposeDemoBuffers(successful.map(function (item) {
                    return item.sourceBuffer;
                }), {
                    ignoreMapName: !!(ignoreMapToggle && ignoreMapToggle.checked)
                });
                await triggerDemoDownload(output, buildSuperimposedFileName(successful), format);
                setStatus('Prepared superimposed ' + exportFormatLabel(format) + ' using ' + successful[0].data.fileName + ' as the base.', 'success');
            } catch (error) {
                setStatus(error && error.message ? error.message : 'Failed to export superimposed demo.', 'error');
            } finally {
                if (demButton) {
                    demButton.disabled = false;
                    demButton.textContent = 'Export superimposed .dem';
                }
                if (dzButton) {
                    dzButton.disabled = false;
                    dzButton.textContent = 'Export superimposed .dz';
                }
            }
        };

        if (demButton) {
            demButton.addEventListener('click', function () {
                runExport('dem');
            });
        }
        if (dzButton) {
            dzButton.addEventListener('click', function () {
                runExport('dz');
            });
        }
    }

    function bindTrimPanels() {
        const panels = resultsPanel.querySelectorAll('.trim-panel[data-demo-index]');

        panels.forEach(function (panel) {
            const demoIndex = Number(panel.getAttribute('data-demo-index'));
            const item = parsedFiles[demoIndex];
            const data = item && item.data;
            const startRange = panel.querySelector('.trim-range-start');
            const endRange = panel.querySelector('.trim-range-end');
            const startTimeInput = panel.querySelector('.trim-time-input[data-boundary="start"]');
            const endTimeInput = panel.querySelector('.trim-time-input[data-boundary="end"]');
            const startFrameInput = panel.querySelector('.trim-frame-input[data-boundary="start"]');
            const endFrameInput = panel.querySelector('.trim-frame-input[data-boundary="end"]');
            const selection = panel.querySelector('[data-trim-selection]');
            const demButton = panel.querySelector('.trim-download-dem-button');
            const dzButton = panel.querySelector('.trim-download-dzip-button');

            if (!item || !data || !startRange || !endRange || !startTimeInput || !endTimeInput || !startFrameInput || !endFrameInput || !selection || !demButton) {
                return;
            }

            const outputs = {
                clipLength: panel.querySelector('[data-trim-output="clip-length"]'),
                frameCount: panel.querySelector('[data-trim-output="frame-count"]')
            };

            const readState = function () {
                return {
                    startFrame: clampNumber(Number(startRange.value) || 1, 1, data.frameCount),
                    endFrame: clampNumber(Number(endRange.value) || data.frameCount, 1, data.frameCount)
                };
            };

            const writeState = function (startFrame, endFrame) {
                const safeStart = clampNumber(Math.round(startFrame), 1, data.frameCount);
                const safeEnd = clampNumber(Math.round(endFrame), safeStart, data.frameCount);
                const startTime = relativeFrameTime(data, safeStart);
                const endTime = relativeFrameTime(data, safeEnd);
                const left = framePositionPercent(data, safeStart);
                const right = framePositionPercent(data, safeEnd);

                startRange.value = String(safeStart);
                endRange.value = String(safeEnd);
                startFrameInput.value = String(safeStart);
                endFrameInput.value = String(safeEnd);
                startTimeInput.value = formatTrimTime(startTime);
                endTimeInput.value = formatTrimTime(endTime);

                selection.style.setProperty('--trim-selection-start', String(left));
                selection.style.setProperty('--trim-selection-end', String(right));

                outputs.clipLength.textContent = formatDuration(Math.max(0, endTime - startTime));
                outputs.frameCount.textContent = String((safeEnd - safeStart) + 1);
            };

            const syncFromFrames = function (source) {
                let startFrame = clampNumber(Number(startFrameInput.value || startRange.value) || 1, 1, data.frameCount);
                let endFrame = clampNumber(Number(endFrameInput.value || endRange.value) || data.frameCount, 1, data.frameCount);

                if (source === 'start') {
                    endFrame = Math.max(startFrame, endFrame);
                } else if (source === 'end') {
                    startFrame = Math.min(startFrame, endFrame);
                }

                writeState(startFrame, endFrame);
            };

            const syncFromTimes = function (source) {
                const parsedStart = parseTrimTime(startTimeInput.value);
                const parsedEnd = parseTrimTime(endTimeInput.value);
                let startFrame = parsedStart === null ? Number(startRange.value) : frameFromRelativeTime(data, parsedStart, false);
                let endFrame = parsedEnd === null ? Number(endRange.value) : frameFromRelativeTime(data, parsedEnd, true);

                if (source === 'start') {
                    endFrame = Math.max(startFrame, endFrame);
                } else if (source === 'end') {
                    startFrame = Math.min(startFrame, endFrame);
                }

                writeState(startFrame, endFrame);
            };

            startRange.addEventListener('input', function () {
                writeState(Number(startRange.value), Math.max(Number(startRange.value), Number(endRange.value)));
            });

            endRange.addEventListener('input', function () {
                writeState(Math.min(Number(startRange.value), Number(endRange.value)), Number(endRange.value));
            });

            startFrameInput.addEventListener('change', function () {
                syncFromFrames('start');
            });
            endFrameInput.addEventListener('change', function () {
                syncFromFrames('end');
            });
            startTimeInput.addEventListener('change', function () {
                syncFromTimes('start');
            });
            endTimeInput.addEventListener('change', function () {
                syncFromTimes('end');
            });

            const runExport = async function (format) {
                const state = readState();
                const startTime = relativeFrameTime(data, state.startFrame);
                const endTime = relativeFrameTime(data, state.endFrame);
                const syntheticStart = !data.maps.some(function (map) {
                    return map.startFrame === state.startFrame;
                });

                demButton.disabled = true;
                demButton.textContent = 'Building clip...';
                if (dzButton) {
                    dzButton.disabled = true;
                    dzButton.textContent = 'Building DZip...';
                }

                try {
                    const clippedBytes = parserApi.trimDemoBuffer(item.sourceBuffer, {
                        startFrame: state.startFrame,
                        endFrame: state.endFrame,
                        syntheticStart: syntheticStart
                    });

                    await triggerDemoDownload(
                        clippedBytes,
                        buildClipFileName(data.fileName, startTime, endTime),
                        format,
                        data.lastModified
                    );
                    setStatus('Prepared clipped ' + exportFormatLabel(format) + ' from ' + formatTrimTime(startTime) + ' to ' + formatTrimTime(endTime) + '.', 'success');
                } catch (error) {
                    setStatus(error && error.message ? error.message : 'Failed to export trimmed demo.', 'error');
                } finally {
                    demButton.disabled = false;
                    demButton.textContent = 'Export clipped .dem';
                    if (dzButton) {
                        dzButton.disabled = false;
                        dzButton.textContent = 'Export clipped .dz';
                    }
                }
            };

            demButton.addEventListener('click', function () {
                runExport('dem');
            });
            if (dzButton) {
                dzButton.addEventListener('click', function () {
                    runExport('dz');
                });
            }

            writeState(1, data.frameCount);
        });
    }

    function bindSmoothPanels() {
        const panels = resultsPanel.querySelectorAll('.smooth-panel[data-demo-index]');

        panels.forEach(function (panel) {
            const demoIndex = Number(panel.getAttribute('data-demo-index'));
            const item = parsedFiles[demoIndex];
            if (!item || !item.data) {
                return;
            }

            const demButton = panel.querySelector('.smooth-download-button');
            const dzButton = panel.querySelector('.smooth-download-dzip-button');
            if (!demButton) {
                return;
            }

            const runExport = async function (format) {
                demButton.disabled = true;
                demButton.textContent = 'Building smoothed demo...';
                if (dzButton) {
                    dzButton.disabled = true;
                    dzButton.textContent = 'Building smoothed DZip...';
                }

                try {
                    const smoothedBytes = parserApi.smoothDemoBuffer(item.sourceBuffer);
                    await triggerDemoDownload(
                        smoothedBytes,
                        buildSmoothFileName(item.data.fileName),
                        format,
                        item.data.lastModified
                    );
                    setStatus('Prepared demsmooth ' + exportFormatLabel(format) + ' for ' + item.data.fileName + '.', 'success');
                } catch (error) {
                    setStatus(error && error.message ? error.message : 'Failed to export smoothed demo.', 'error');
                } finally {
                    demButton.disabled = false;
                    demButton.textContent = 'Export smoothed .dem';
                    if (dzButton) {
                        dzButton.disabled = false;
                        dzButton.textContent = 'Export smoothed .dz';
                    }
                }
            };

            demButton.addEventListener('click', function () {
                runExport('dem');
            });
            if (dzButton) {
                dzButton.addEventListener('click', function () {
                    runExport('dz');
                });
            }
        });
    }

    function bindChatFilters() {
        const filters = resultsPanel.querySelectorAll('.chat-filter');
        filters.forEach(function (filter) {
            const target = document.getElementById(filter.getAttribute('data-chat-target'));
            if (!target) {
                return;
            }

            const applyFilter = function () {
                const value = filter.value;
                const entries = target.querySelectorAll('.chat-entry');
                entries.forEach(function (entry) {
                    const speakerKey = entry.getAttribute('data-speaker-key');
                    entry.hidden = value !== 'all' && speakerKey !== value;
                });
            };

            filter.addEventListener('change', applyFilter);
            applyFilter();
        });
    }

    function bindServerFilters() {
        const toolbars = resultsPanel.querySelectorAll('.server-toolbar');

        toolbars.forEach(function (toolbar) {
            const target = document.getElementById(toolbar.getAttribute('data-server-target'));
            const emptyState = document.getElementById(toolbar.getAttribute('data-server-empty-target'));
            const checkboxes = Array.from(toolbar.querySelectorAll('.server-filter-checkbox'));

            if (!target || !checkboxes.length) {
                return;
            }

            const applyFilter = function () {
                const allowedSources = new Set(
                    checkboxes.filter(function (checkbox) {
                        return checkbox.checked;
                    }).map(function (checkbox) {
                        return checkbox.value;
                    })
                );

                let visibleCount = 0;
                const entries = target.querySelectorAll('.server-entry');
                entries.forEach(function (entry) {
                    const source = entry.getAttribute('data-server-source');
                    const visible = allowedSources.has(source);
                    entry.hidden = !visible;
                    if (visible) {
                        visibleCount += 1;
                    }
                });

                if (emptyState) {
                    emptyState.hidden = visibleCount > 0;
                }
            };

            checkboxes.forEach(function (checkbox) {
                checkbox.addEventListener('change', applyFilter);
            });

            applyFilter();
        });
    }

    function bindTextExportButtons() {
        var buttons = resultsPanel.querySelectorAll('.txt-export-button[data-demo-index]');

        buttons.forEach(function (button) {
            var demoIndex = Number(button.getAttribute('data-demo-index'));
            var exportType = button.getAttribute('data-export');

            button.addEventListener('click', function () {
                var item = parsedFiles[demoIndex];
                if (!item || !item.data) { return; }

                var data = item.data;
                var baseName = downloadBaseName(data.fileName, 'demo.dem').replace(/\.(dem|dz)$/i, '');
                var lines;
                var fileName;

                if (exportType === 'chat') {
                    lines = data.chatLog.map(function (entry) {
                        var timeStr = Number.isFinite(entry.time) ? formatTrimTime(entry.time) : '?';
                        var prefix = entry.team ? '(team) ' : '';
                        return '[' + timeStr + '] ' + prefix + entry.speaker + ': ' + entry.message;
                    });
                    fileName = baseName + '_chat.txt';
                } else if (exportType === 'players') {
                    lines = ['name\tname_hex'];
                    data.players.forEach(function (player) {
                        var codes = Array.isArray(player.nameCodes) ? player.nameCodes : [];
                        if (!codes.length) { return; }
                        var dequaked = decodePlayerName(codes, player.name || '');
                        var hex = codes.map(function (b) {
                            return ('0' + (b & 0xff).toString(16)).slice(-2);
                        }).join('');
                        lines.push(dequaked + '\t' + hex);
                    });
                    fileName = baseName + '_players.txt';
                } else {
                    var happenings = collectServerHappenings(data);
                    lines = happenings.map(function (entry) {
                        var timeStr = Number.isFinite(entry.time) ? formatTrimTime(entry.time) : '?';
                        return '[' + timeStr + '] ' + entry.text;
                    });
                    fileName = baseName + '_server.txt';
                }

                if (!lines.length) { return; }
                triggerDownload(new TextEncoder().encode(lines.join('\n')), fileName);
            });
        });
    }

    function cleanDemlValue(value) {
        return String(value || '')
            .trim()
            .replace(/^["']|["']$/g, '')
            .trim();
    }

    function splitDemlList(value) {
        if (Array.isArray(value)) {
            return value;
        }

        return String(value || '')
            .split(/[\n,;]/)
            .map(cleanDemlValue)
            .filter(Boolean);
    }

    function fileNameFromPath(value) {
        var clean = String(value || '').split(/[?#]/)[0].replace(/\\/g, '/');
        var parts = clean.split('/');
        try {
            return cleanDemlValue(decodeURIComponent(parts[parts.length - 1] || ''));
        } catch (_error) {
            return cleanDemlValue(parts[parts.length - 1] || '');
        }
    }

    function inferMapFromDemoSource(source) {
        var fileName = fileNameFromPath(source).replace(/\.(dem|mvd|qwd|qwz|dz)$/i, '');
        var bracketMatch = fileName.match(/\[([a-z0-9_+.-]+)\]/i);
        if (bracketMatch) {
            return bracketMatch[1];
        }

        var prefixMatch = fileName.match(/^([a-z0-9_+.-]+?)(?:_\d{2}-\d{2}-\d{4}|_\d{8}|-\d{8}|_\d{6}|-\d{6})/i);
        return prefixMatch ? prefixMatch[1] : '';
    }

    function firstDemlCommandArgument(text) {
        var match = String(text || '').match(/\+?playdemo\s+("[^"]+"|'[^']+'|[^\s]+)/i);
        return match ? cleanDemlValue(match[1]) : '';
    }

    function firstDemoLikeReference(text) {
        var value = String(text || '');
        var urlMatch = value.match(/https?:\/\/[^\s"'<>]+/i);
        if (urlMatch) {
            return cleanDemlValue(urlMatch[0]);
        }

        var fileMatch = value.match(/[^\s"'<>]+\.(?:dem|mvd|qwd|qwz|dz)\b/i);
        return fileMatch ? cleanDemlValue(fileMatch[0]) : '';
    }

    function resolveDemlSource(source) {
        if (/^(https?:|data:|blob:)/i.test(source) || /^[a-z]:[\\/]/i.test(source)) {
            return source;
        }

        try {
            return new URL(source, window.location.href).href;
        } catch (_error) {
            return source;
        }
    }

    function pickDemlValue(source, keys) {
        if (!source || typeof source !== 'object') {
            return '';
        }

        for (var i = 0; i < keys.length; i++) {
            if (Object.prototype.hasOwnProperty.call(source, keys[i]) && source[keys[i]] != null) {
                return source[keys[i]];
            }
        }
        return '';
    }

    function parseJsonDeml(text) {
        var parsed;
        try {
            parsed = JSON.parse(text);
        } catch (_error) {
            return null;
        }

        var root = Array.isArray(parsed) ? parsed[0] : parsed;
        if (typeof root === 'string') {
            return { source: cleanDemlValue(root), maps: [] };
        }
        if (!root || typeof root !== 'object') {
            return null;
        }

        var nestedDemo = root.demo && typeof root.demo === 'object' ? root.demo : null;
        var sourceKeys = ['source', 'src', 'url', 'href', 'file', 'path', 'demo', 'demoUrl', 'demo_url', 'download', 'downloadUrl'];
        var mapKeys = ['map', 'mapName', 'map_name', 'level', 'bsp'];
        var mapsKeys = ['maps', 'mapList', 'map_list', 'bsps'];
        var titleKeys = ['title', 'name', 'label'];
        var source = pickDemlValue(root, sourceKeys);
        if (source && typeof source === 'object') {
            source = '';
        }
        source = source || pickDemlValue(nestedDemo, sourceKeys);
        var maps = [];

        splitDemlList(pickDemlValue(root, mapsKeys)).forEach(function (map) { maps.push(map); });
        splitDemlList(pickDemlValue(root, mapKeys)).forEach(function (map) { maps.push(map); });
        if (nestedDemo) {
            splitDemlList(pickDemlValue(nestedDemo, mapsKeys)).forEach(function (map) { maps.push(map); });
            splitDemlList(pickDemlValue(nestedDemo, mapKeys)).forEach(function (map) { maps.push(map); });
        }

        return {
            source: cleanDemlValue(source),
            title: cleanDemlValue(pickDemlValue(root, titleKeys) || pickDemlValue(nestedDemo, titleKeys)),
            maps: maps
        };
    }

    function parsePlainDeml(text) {
        var lines = String(text || '').split(/\r?\n/);
        var fields = {};
        var maps = [];

        lines.forEach(function (line) {
            var trimmed = line.trim();
            var keyValueMatch;
            if (!trimmed || /^#|^\/\//.test(trimmed)) {
                return;
            }

            var commandArgument = firstDemlCommandArgument(trimmed);
            if (commandArgument && !fields.source) {
                fields.source = commandArgument;
            }

            keyValueMatch = trimmed.match(/^([a-z][a-z0-9_.-]*)\s*(?:=|:)\s*(.+)$/i);
            if (!keyValueMatch) {
                return;
            }

            var key = keyValueMatch[1].toLowerCase();
            var value = cleanDemlValue(keyValueMatch[2]);
            if (/^(source|src|url|href|file|path|demo|dem|mvd|download|downloadurl|demo_url|demo-url)$/.test(key)) {
                fields.source = fields.source || value;
            } else if (/^(map|mapname|map_name|level|bsp)$/.test(key)) {
                maps.push(value);
            } else if (/^(maps|maplist|map_list|bsps)$/.test(key)) {
                splitDemlList(value).forEach(function (map) { maps.push(map); });
            } else if (/^(title|name|label)$/.test(key)) {
                fields.title = fields.title || value;
            }
        });

        fields.source = fields.source || firstDemoLikeReference(text);
        fields.maps = maps;
        return fields;
    }

    function parseDemlText(text, fallbackName) {
        var spec = parseJsonDeml(text) || parsePlainDeml(text);
        var source = cleanDemlValue(spec && spec.source);
        var maps = [];
        var seenMaps = {};

        splitDemlList(spec && spec.maps).forEach(function (map) {
            var key = String(map).toLowerCase();
            if (key && !seenMaps[key]) {
                maps.push(map);
                seenMaps[key] = true;
            }
        });

        if (!source) {
            throw new Error('The .deml file did not include a demo URL or file reference.');
        }

        if (!maps.length) {
            var inferredMap = inferMapFromDemoSource(source);
            if (inferredMap) {
                maps.push(inferredMap);
            }
        }

        return {
            source: resolveDemlSource(source),
            file: fileNameFromPath(source) || fileNameFromPath(fallbackName) || 'demo.dem',
            title: cleanDemlValue(spec && spec.title) || fileNameFromPath(source) || fileNameFromPath(fallbackName) || 'Demo',
            maps: maps
        };
    }

    function openPendingPlayerWindow() {
        try {
            return window.open('about:blank', 'q1tools-demo-player', 'width=704,height=620,resizable=yes,scrollbars=yes');
        } catch (_error) {
            return null;
        }
    }

    function buildPlayerLaunchUrl(spec) {
        var key = DEMO_PLAYER_STORAGE_PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2);
        try {
            window.localStorage.setItem(key, JSON.stringify(spec));
            return DEMO_PLAYER_URL + '?launch=' + encodeURIComponent(key);
        } catch (_error) {
            var params = new URLSearchParams();
            params.set('source', spec.source);
            params.set('file', spec.file);
            params.set('title', spec.title);
            if (spec.maps.length) {
                params.set('maps', spec.maps.join(','));
            }
            return DEMO_PLAYER_URL + '?' + params.toString();
        }
    }

    function navigatePlayerWindow(playerWindow, url) {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.location.replace(url);
            playerWindow.opener = null;
            playerWindow.focus();
            return true;
        }

        var opened = window.open(url, 'q1tools-demo-player', 'width=704,height=620,resizable=yes,scrollbars=yes');
        if (opened) {
            opened.opener = null;
            opened.focus();
            return true;
        }
        return false;
    }

    async function buildDemoPlayerSpecFromFile(file) {
        var buffer = await file.arrayBuffer();
        var maps = [];
        var seenMaps = {};
        var warnings = [];

        try {
            var data = parserApi.parseDemoBuffer(buffer, {
                name: file.name,
                size: file.size,
                lastModified: file.lastModified
            });
            data.maps.forEach(function (map) {
                var mapName = cleanDemlValue(map.mapName || '');
                var key = mapName.toLowerCase();
                if (key && !seenMaps[key]) {
                    maps.push(mapName);
                    seenMaps[key] = true;
                }
            });
        } catch (error) {
            warnings.push('Could not read map names from "' + file.name + '": ' + (error && error.message ? error.message : String(error)));
        }

        if (!maps.length) {
            var inferredMap = inferMapFromDemoSource(file.name);
            if (inferredMap) {
                maps.push(inferredMap);
            }
        }

        return {
            spec: {
                source: URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' })),
                file: file.name,
                title: file.name,
                maps: maps
            },
            warnings: warnings
        };
    }

    async function handleDemoPlayerFiles(fileList, playerWindow) {
        var files = Array.from(fileList || []);
        var demoFiles = files.filter(function (file) {
            return /\.dem$/i.test(file.name || '');
        });
        var demlFiles = files.filter(function (file) {
            return /\.deml$/i.test(file.name || '');
        });
        var spec;
        var launchUrl;
        var warnings = [];

        if (demoFiles.length) {
            setStatus('Preparing ' + demoFiles[0].name + ' for playback...');
            var demoResult = await buildDemoPlayerSpecFromFile(demoFiles[0]);
            spec = demoResult.spec;
            warnings = warnings.concat(demoResult.warnings);
            if (demoFiles.length > 1) {
                warnings.push('Loaded "' + demoFiles[0].name + '" and ignored ' + (demoFiles.length - 1) + ' additional .dem file' + (demoFiles.length === 2 ? '' : 's') + '.');
            }
            if (!spec.maps.length) {
                warnings.push('No map was decoded from the demo. The player will try to resolve the map from the demo stream.');
            }
        } else if (demlFiles.length) {
            setStatus('Reading ' + demlFiles[0].name + '...');
            var text = await demlFiles[0].text();
            spec = parseDemlText(text, demlFiles[0].name);
            if (demlFiles.length > 1) {
                warnings.push('Loaded "' + demlFiles[0].name + '" and ignored ' + (demlFiles.length - 1) + ' additional .deml file' + (demlFiles.length === 2 ? '' : 's') + '.');
            }
            if (!spec.maps.length) {
                warnings.push('No map was listed in the .deml file. The player will try to resolve the map from the demo stream.');
            }
        } else {
            setWarnings(['No .dem file was provided.']);
            setStatus('No demo was loaded.', 'error');
            return;
        }

        launchUrl = buildPlayerLaunchUrl(spec);
        if (!navigatePlayerWindow(playerWindow, launchUrl)) {
            setWarnings(warnings.concat(['The browser blocked the demo player popup. Allow popups for this site and drop the .dem again.']));
            setStatus('Unable to open the demo player.', 'error');
            return;
        }

        setWarnings(warnings);
        setStatus('Opening ' + spec.title + ' in the demo player.', 'success');
    }

    async function collectAcceptedInputs(fileList) {
        const warnings = [];
        const accepted = [];

        for (const file of Array.from(fileList || [])) {
            if (/\.dem$/i.test(file.name)) {
                accepted.push({
                    displayName: file.name,
                    fileName: file.name,
                    sourceFormat: 'dem',
                    sourceBuffer: await file.arrayBuffer(),
                    fileSize: file.size,
                    lastModified: file.lastModified
                });
                continue;
            }

            if (/\.dz$/i.test(file.name)) {
                if (!dzipSupported) {
                    warnings.push('Skipped "' + file.name + '" because DZip support is unavailable.');
                    continue;
                }

                try {
                    const archiveBuffer = await file.arrayBuffer();
                    const entries = await dzipApi.extractDemoEntries(archiveBuffer);
                    if (!entries.length) {
                        warnings.push('Skipped "' + file.name + '" because it does not contain any .dem entries.');
                        continue;
                    }

                    entries.forEach(function (entry) {
                        accepted.push({
                            displayName: entry.name,
                            fileName: entry.name,
                            sourceFormat: 'dz',
                            archiveName: file.name,
                            sourceBuffer: cloneArrayBuffer(entry.bytes),
                            fileSize: entry.bytes.byteLength,
                            lastModified: entry.lastModified || file.lastModified
                        });
                    });
                } catch (error) {
                    warnings.push('Skipped "' + file.name + '" because the DZip archive could not be read: ' + (error && error.message ? error.message : String(error)));
                }
                continue;
            }

            warnings.push('Skipped "' + file.name + '" because it is not a .dem or .dz file.');
        }

        return {
            warnings: warnings,
            accepted: accepted
        };
    }

    async function handleFiles(fileList, isFolder) {
        const fileCount = Array.from(fileList || []).length;
        setStatus('Inspecting ' + fileCount + ' file' + (fileCount === 1 ? '' : 's') + '...');

        const inputResult = await collectAcceptedInputs(fileList);
        const warnings = inputResult.warnings;
        const accepted = inputResult.accepted;

        if (!accepted.length) {
            setWarnings(warnings.length ? warnings : ['No .dem or .dz files were provided.']);
            setStatus('No supported demos were loaded.', 'error');
            renderResults([]);
            return;
        }

        if (isFolder) {
            var folderWarnings = warnings.filter(function (w) {
                return !/^Skipped .* because it is not a \.dem or \.dz file\.$/.test(w);
            });
            setWarnings(folderWarnings);
        } else {
            setWarnings(warnings);
        }
        folderMode = !!isFolder;

        if (folderMode) {
            setStatus('Parsing demo 1 of ' + accepted.length + '...');
            var items = [];
            for (var i = 0; i < accepted.length; i++) {
                if (i % 5 === 0) {
                    setStatus('Parsing demo ' + (i + 1) + ' of ' + accepted.length + '...');
                    await new Promise(function (resolve) { setTimeout(resolve, 0); });
                }
                var input = accepted[i];
                try {
                    items.push({
                        displayName: input.displayName,
                        fileName: input.fileName,
                        sourceFormat: input.sourceFormat,
                        archiveName: input.archiveName,
                        fileSize: input.fileSize,
                        lastModified: input.lastModified,
                        data: parserApi.parseDemoBuffer(input.sourceBuffer, {
                            name: input.fileName,
                            size: input.fileSize,
                            lastModified: input.lastModified
                        })
                    });
                } catch (error) {
                    items.push({
                        displayName: input.displayName,
                        fileName: input.fileName,
                        sourceFormat: input.sourceFormat,
                        archiveName: input.archiveName,
                        fileSize: input.fileSize,
                        lastModified: input.lastModified,
                        error: error && error.message ? error.message : String(error)
                    });
                }
            }

            parsedFiles = items;
            resultsPanel.hidden = true;
            resultsPanel.innerHTML = '';
            clearButton.disabled = false;
            updateSummary(items);
            if (summaryActions) {
                summaryActions.hidden = true;
                summaryActions.innerHTML = '';
            }
            renderFolderAnalysis(items);
            updateCaptimePanel(items);
        } else {
            setStatus('Reading ' + accepted.length + ' demo' + (accepted.length === 1 ? '' : 's') + '...');

            const items = await Promise.all(accepted.map(async function (input) {
                try {
                    return {
                        displayName: input.displayName,
                        fileName: input.fileName,
                        sourceFormat: input.sourceFormat,
                        archiveName: input.archiveName,
                        fileSize: input.fileSize,
                        lastModified: input.lastModified,
                        sourceBuffer: input.sourceBuffer,
                        data: parserApi.parseDemoBuffer(input.sourceBuffer, {
                            name: input.fileName,
                            size: input.fileSize,
                            lastModified: input.lastModified
                        })
                    };
                } catch (error) {
                    return {
                        displayName: input.displayName,
                        fileName: input.fileName,
                        sourceFormat: input.sourceFormat,
                        archiveName: input.archiveName,
                        fileSize: input.fileSize,
                        lastModified: input.lastModified,
                        error: error && error.message ? error.message : String(error)
                    };
                }
            }));

            parsedFiles = items;
            folderAnalysisPanel.hidden = true;
            folderAnalysisContent.innerHTML = '';
            renderResults(parsedFiles);
            updateCaptimePanel(parsedFiles);
        }

        const successes = parsedFiles.filter(function (item) { return !!item.data; }).length;
        const failures = parsedFiles.length - successes;
        if (successes && !failures) {
            setStatus('Parsed ' + successes + ' demo' + (successes === 1 ? '' : 's') + '.', 'success');
        } else if (successes) {
            setStatus('Parsed ' + successes + ' demo' + (successes === 1 ? '' : 's') + ' with ' + failures + ' failure' + (failures === 1 ? '' : 's') + '.', 'success');
        } else {
            setStatus('Unable to parse the selected demos.', 'error');
        }
    }

    function reset() {
        parsedFiles = [];
        folderMode = false;
        fileInput.value = '';
        folderInput.value = '';
        setWarnings([]);
        setStatus('No demos loaded.');
        folderAnalysisPanel.hidden = true;
        folderAnalysisContent.innerHTML = '';
        captimePanel.hidden = true;
        captimeContent.innerHTML = '';
        renderResults([]);
    }

    function collectDroppedFiles(dataTransferItems) {
        var files = [];

        function readEntry(entry) {
            return new Promise(function (resolve) {
                if (entry.isFile) {
                    entry.file(function (file) {
                        files.push(file);
                        resolve();
                    }, function () {
                        resolve();
                    });
                } else if (entry.isDirectory) {
                    var reader = entry.createReader();
                    var allEntries = [];

                    function readBatch() {
                        reader.readEntries(function (batch) {
                            if (batch.length === 0) {
                                Promise.all(allEntries.map(readEntry)).then(resolve);
                            } else {
                                allEntries = allEntries.concat(Array.from(batch));
                                readBatch();
                            }
                        }, function () {
                            resolve();
                        });
                    }

                    readBatch();
                } else {
                    resolve();
                }
            });
        }

        var entries = [];
        for (var i = 0; i < dataTransferItems.length; i++) {
            var entry = dataTransferItems[i].webkitGetAsEntry && dataTransferItems[i].webkitGetAsEntry();
            if (entry) {
                entries.push(entry);
            }
        }

        return Promise.all(entries.map(readEntry)).then(function () {
            return files;
        });
    }

    function bindDropZone() {
        const setActive = function (active) {
            dropZone.classList.toggle('active', active);
        };

        dropZone.addEventListener('click', function (event) {
            if (event.target.id === 'folderLink' || event.target.closest('#folderLink')) {
                return;
            }
            fileInput.click();
        });

        dropZone.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(function (eventName) {
            dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                setActive(true);
            });
        });

        ['dragleave', 'drop'].forEach(function (eventName) {
            dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                setActive(false);
            });
        });

        dropZone.addEventListener('drop', function (event) {
            if (!event.dataTransfer) { return; }

            var hasDirectory = false;
            var items = event.dataTransfer.items;
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    var entry = items[i].webkitGetAsEntry && items[i].webkitGetAsEntry();
                    if (entry && entry.isDirectory) {
                        hasDirectory = true;
                        break;
                    }
                }
            }

            if (hasDirectory) {
                collectDroppedFiles(event.dataTransfer.items).then(function (files) {
                    handleFiles(files, true).catch(function (error) {
                        setWarnings([error && error.message ? error.message : String(error)]);
                        setStatus('Failed to load the dropped folder.', 'error');
                        renderResults([]);
                    });
                });
            } else if (event.dataTransfer.files) {
                handleFiles(event.dataTransfer.files).catch(function (error) {
                    setWarnings([error && error.message ? error.message : String(error)]);
                    setStatus('Failed to load the dropped files.', 'error');
                    renderResults([]);
                });
            }
        });
    }

    function bindDemoPlayerDropZone() {
        if (!demoPlayerDropZone || !demoPlayerInput) {
            return;
        }

        const setActive = function (active) {
            demoPlayerDropZone.classList.toggle('active', active);
        };

        demoPlayerDropZone.addEventListener('click', function () {
            demoPlayerInput.click();
        });

        demoPlayerDropZone.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                demoPlayerInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(function (eventName) {
            demoPlayerDropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                setActive(true);
            });
        });

        ['dragleave', 'drop'].forEach(function (eventName) {
            demoPlayerDropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                setActive(false);
            });
        });

        demoPlayerDropZone.addEventListener('drop', function (event) {
            if (!event.dataTransfer || !event.dataTransfer.files) { return; }
            var playerWindow = openPendingPlayerWindow();
            handleDemoPlayerFiles(event.dataTransfer.files, playerWindow).catch(function (error) {
                setWarnings([error && error.message ? error.message : String(error)]);
                setStatus('Failed to load the demo player.', 'error');
            });
        });
    }

    clearButton.addEventListener('click', reset);
    fileInput.addEventListener('change', function (event) {
        handleFiles(event.target.files).catch(function (error) {
            setWarnings([error && error.message ? error.message : String(error)]);
            setStatus('Failed to load the selected files.', 'error');
            renderResults([]);
        });
    });

    if (demoPlayerInput) {
        demoPlayerInput.addEventListener('change', function (event) {
            var playerWindow = openPendingPlayerWindow();
            handleDemoPlayerFiles(event.target.files, playerWindow).catch(function (error) {
                setWarnings([error && error.message ? error.message : String(error)]);
                setStatus('Failed to load the demo player.', 'error');
            }).finally(function () {
                demoPlayerInput.value = '';
            });
        });
    }

    folderLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        folderInput.click();
    });

    folderInput.addEventListener('change', function (event) {
        handleFiles(event.target.files, true).catch(function (error) {
            setWarnings([error && error.message ? error.message : String(error)]);
            setStatus('Failed to load the selected folder.', 'error');
            renderResults([]);
        });
    });

    if (!parserApi || typeof parserApi.parseDemoBuffer !== 'function' || typeof parserApi.trimDemoBuffer !== 'function' || typeof parserApi.combineDemoBuffers !== 'function' || typeof parserApi.superimposeDemoBuffers !== 'function' || typeof parserApi.smoothDemoBuffer !== 'function') {
        setWarnings(['The demo parser failed to load.']);
        setStatus('The demo parser is unavailable.', 'error');
        return;
    }

    bindDropZone();
    bindDemoPlayerDropZone();
    reset();

    document.addEventListener('dblclick', function (e) {
        var strip = e.target.closest('.preview-strip');
        if (!strip) { return; }
        var codesStr = strip.getAttribute('data-quake-codes');
        if (!codesStr) { return; }
        var codes = JSON.parse(codesStr);
        var text = codes.map(function (c) { return String.fromCharCode(c & 255); }).join('');
        navigator.clipboard.writeText(text).then(function () {
            strip.classList.add('copied');
            setTimeout(function () { strip.classList.remove('copied'); }, 800);
        });
    });
}());
