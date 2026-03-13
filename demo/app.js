(function () {
    'use strict';

    const parserApi = window.QuakeDemoParser;

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const clearButton = document.getElementById('clearButton');
    const statusEl = document.getElementById('status');
    const warningsEl = document.getElementById('warnings');
    const summaryPanel = document.getElementById('summaryPanel');
    const summaryGrid = document.getElementById('summaryGrid');
    const resultsPanel = document.getElementById('resultsPanel');
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

    function renderQuakePreview(previewCodes, fallbackLabel) {
        const codes = Array.isArray(previewCodes) ? previewCodes.filter(Number.isFinite) : [];
        if (!codes.length) {
            return '<span class="quake-name-fallback">' + escapeHtml(fallbackLabel || '(unnamed player)') + '</span>';
        }

        return [
            '<div class="preview-strip" title="' + escapeAttribute((fallbackLabel || '').trim() || 'Quake name') + '">',
            codes.map(function (code) {
                const padded = padByte(code);
                return '<img src="' + PREVIEW_ROOT + padded + '.gif" alt="" aria-hidden="true" width="16" height="16">';
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

    function buildClipFileName(fileName, startSeconds, endSeconds) {
        const baseName = String(fileName || 'demo.dem').replace(/\.dem$/i, '');
        return baseName + '__clip_' + safeClipLabel(startSeconds) + '__' + safeClipLabel(endSeconds) + '.dem';
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
            '<button class="trim-download-button" type="button">Export clipped .dem</button>',
            '</div>',
            '</div>'
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
            return /^Client ping times:\s*$/i.test(text);
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
            'Center',
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

    function renderDemoError(item) {
        return [
            '<article class="save-card demo-card">',
            '<div class="save-header">',
            '<div class="save-headline">',
            '<div>',
            '<h2 class="save-title">' + escapeHtml(item.file.name) + '</h2>',
            '<div class="save-subtitle">' + escapeHtml(formatBytes(item.file.size)) + ' · ' + escapeHtml(formatDate(item.file.lastModified)) + '</div>',
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
            '<div class="save-subtitle">' + escapeHtml(formatBytes(data.fileSize)) + ' · ' + escapeHtml(formatDate(data.lastModified)) + '</div>',
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
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Players</h3></div>',
            '<div class="player-grid">' + renderPlayerSection(data) + '</div>',
            '</section>',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">POV Analytics</h3></div>',
            renderLocalSection(data, { useFlagLabels: useFlagLabels }),
            '</section>',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Server Happenings</h3></div>',
            renderServerHappeningsSection(happenings, index),
            '</section>',
            '<section class="subsection">',
            '<div class="subsection-head"><h3 class="subsection-title">Chat Log</h3></div>',
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
        summaryPanel.hidden = false;
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
        bindTrimPanels();
        bindChatFilters();
        bindServerFilters();
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
            const exportButton = panel.querySelector('.trim-download-button');

            if (!item || !data || !startRange || !endRange || !startTimeInput || !endTimeInput || !startFrameInput || !endFrameInput || !selection || !exportButton) {
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

            exportButton.addEventListener('click', function () {
                const state = readState();
                const startTime = relativeFrameTime(data, state.startFrame);
                const endTime = relativeFrameTime(data, state.endFrame);
                const syntheticStart = !data.maps.some(function (map) {
                    return map.startFrame === state.startFrame;
                });

                exportButton.disabled = true;
                exportButton.textContent = 'Building clip...';

                try {
                    const clippedBytes = parserApi.trimDemoBuffer(item.sourceBuffer, {
                        startFrame: state.startFrame,
                        endFrame: state.endFrame,
                        syntheticStart: syntheticStart
                    });

                    triggerDownload(clippedBytes, buildClipFileName(data.fileName, startTime, endTime));
                    setStatus('Prepared clipped demo from ' + formatTrimTime(startTime) + ' to ' + formatTrimTime(endTime) + '.', 'success');
                } catch (error) {
                    setStatus(error && error.message ? error.message : 'Failed to export trimmed demo.', 'error');
                } finally {
                    exportButton.disabled = false;
                    exportButton.textContent = 'Export clipped .dem';
                }
            });

            writeState(1, data.frameCount);
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

    async function handleFiles(fileList) {
        const warnings = [];
        const accepted = [];

        Array.from(fileList || []).forEach(function (file) {
            if (/\.dem$/i.test(file.name)) {
                accepted.push(file);
            } else {
                warnings.push('Skipped "' + file.name + '" because it does not end in .dem.');
            }
        });

        if (!accepted.length) {
            setWarnings(warnings.length ? warnings : ['No .dem files were provided.']);
            setStatus('No supported demos were loaded.', 'error');
            renderResults([]);
            return;
        }

        setWarnings(warnings);
        setStatus('Reading ' + accepted.length + ' demo' + (accepted.length === 1 ? '' : 's') + '...');

        const items = await Promise.all(accepted.map(async function (file) {
            try {
                const buffer = await file.arrayBuffer();
                return {
                    file: file,
                    sourceBuffer: buffer,
                    data: parserApi.parseDemoBuffer(buffer, {
                        name: file.name,
                        size: file.size,
                        lastModified: file.lastModified
                    })
                };
            } catch (error) {
                return {
                    file: file,
                    error: error && error.message ? error.message : String(error)
                };
            }
        }));

        parsedFiles = items;
        renderResults(parsedFiles);

        const successes = items.filter(function (item) { return !!item.data; }).length;
        const failures = items.length - successes;
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
        fileInput.value = '';
        setWarnings([]);
        setStatus('No demos loaded.');
        renderResults([]);
    }

    function bindDropZone() {
        const setActive = function (active) {
            dropZone.classList.toggle('active', active);
        };

        dropZone.addEventListener('click', function () {
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
            if (event.dataTransfer && event.dataTransfer.files) {
                handleFiles(event.dataTransfer.files);
            }
        });
    }

    clearButton.addEventListener('click', reset);
    fileInput.addEventListener('change', function (event) {
        handleFiles(event.target.files);
    });

    if (!parserApi || typeof parserApi.parseDemoBuffer !== 'function' || typeof parserApi.trimDemoBuffer !== 'function') {
        setWarnings(['The demo parser failed to load.']);
        setStatus('The demo parser is unavailable.', 'error');
        return;
    }

    bindDropZone();
    reset();
}());
