(function () {
    'use strict';

    const SAVEGAME_VERSION = 5;
    const REMASTER_SAVEGAME_VERSION = 6;
    const SAVEGAME_COMMENT_LENGTH = 39;
    const SAVEGAME_KILLS_COLUMN = 22;
    const BASIC_SPAWN_PARM_COUNT = 16;
    const VANILLA_LIGHTSTYLE_COUNT = 64;

    const SKILL_NAMES = {
        0: 'Easy',
        1: 'Normal',
        2: 'Hard',
        3: 'Nightmare'
    };

    const WEAPON_NAMES = new Map([
        [1, 'Shotgun'],
        [2, 'Super Shotgun'],
        [4, 'Nailgun'],
        [8, 'Super Nailgun'],
        [16, 'Grenade Launcher'],
        [32, 'Rocket Launcher'],
        [64, 'Thunderbolt'],
        [128, 'Super Lightning'],
        [4096, 'Axe']
    ]);

    const ITEM_FLAGS = [
        { mask: 4096, label: 'Axe', group: 'weapons' },
        { mask: 1, label: 'Shotgun', group: 'weapons' },
        { mask: 2, label: 'Super Shotgun', group: 'weapons' },
        { mask: 4, label: 'Nailgun', group: 'weapons' },
        { mask: 8, label: 'Super Nailgun', group: 'weapons' },
        { mask: 16, label: 'Grenade Launcher', group: 'weapons' },
        { mask: 32, label: 'Rocket Launcher', group: 'weapons' },
        { mask: 64, label: 'Thunderbolt', group: 'weapons' },
        { mask: 8192, label: 'Green Armor', group: 'inventory' },
        { mask: 16384, label: 'Yellow Armor', group: 'inventory' },
        { mask: 32768, label: 'Red Armor', group: 'inventory' },
        { mask: 65536, label: 'Megahealth', group: 'inventory' },
        { mask: 131072, label: 'Silver Key', group: 'keys' },
        { mask: 262144, label: 'Gold Key', group: 'keys' },
        { mask: 524288, label: 'Ring', group: 'powerups' },
        { mask: 1048576, label: 'Pent', group: 'powerups' },
        { mask: 2097152, label: 'Biosuit', group: 'powerups' },
        { mask: 4194304, label: 'Quad', group: 'powerups' },
        { mask: 268435456, label: 'Sigil 1', group: 'sigils' },
        { mask: 536870912, label: 'Sigil 2', group: 'sigils' },
        { mask: 1073741824, label: 'Sigil 3', group: 'sigils' },
        { mask: 2147483648, label: 'Sigil 4', group: 'sigils' }
    ];

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const clearButton = document.getElementById('clearButton');
    const statusEl = document.getElementById('status');
    const warningsEl = document.getElementById('warnings');
    const summaryPanel = document.getElementById('summaryPanel');
    const summaryGrid = document.getElementById('summaryGrid');
    const resultsPanel = document.getElementById('resultsPanel');

    let parsedFiles = [];

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        warningsEl.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) {
            return 'Unknown';
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const units = ['KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = -1;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }
        return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
    }

    function formatDuration(seconds) {
        if (!Number.isFinite(seconds)) {
            return 'Unknown';
        }

        const totalSeconds = Math.max(0, Math.floor(seconds));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainder = totalSeconds % 60;

        const parts = [];
        if (hours) {
            parts.push(`${hours}h`);
        }
        if (minutes || hours) {
            parts.push(`${minutes}m`);
        }
        parts.push(`${remainder}s`);
        return parts.join(' ');
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

    function parseNumber(value) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function parseInteger(value) {
        const parsed = parseNumber(value);
        return parsed === null ? null : Math.trunc(parsed);
    }

    function parseVector(value) {
        if (!value) {
            return null;
        }

        const parts = String(value).trim().split(/\s+/).map(Number);
        if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
            return null;
        }

        return parts.map((part) => part.toFixed(1)).join(', ');
    }

    function decodeSaveComment(comment) {
        return String(comment || '').replace(/_/g, ' ').trim();
    }

    function normalizeClassicSaveComment(comment) {
        const text = String(comment || '').replace(/_/g, ' ');
        const display = new Array(SAVEGAME_COMMENT_LENGTH).fill(' ');
        const killsIndex = text.indexOf('kills:');

        if (killsIndex === -1) {
            text.slice(0, SAVEGAME_COMMENT_LENGTH).split('').forEach((character, index) => {
                display[index] = character;
            });
            return display.join('').replace(/ /g, '_');
        }

        const title = text.slice(0, killsIndex).trimEnd().slice(0, SAVEGAME_KILLS_COLUMN);
        const kills = text.slice(killsIndex).trimEnd().slice(0, SAVEGAME_COMMENT_LENGTH - SAVEGAME_KILLS_COLUMN);

        title.split('').forEach((character, index) => {
            display[index] = character;
        });
        kills.split('').forEach((character, index) => {
            display[SAVEGAME_KILLS_COLUMN + index] = character;
        });

        return display.join('').replace(/ /g, '_');
    }

    function createClassicSaveText(lines) {
        const convertedLines = lines.slice();
        convertedLines[0] = String(SAVEGAME_VERSION);
        convertedLines.splice(1, 1);
        convertedLines[1] = normalizeClassicSaveComment(convertedLines[1]);
        return convertedLines.join('\n');
    }

    function extractKills(comment) {
        const match = /kills:\s*(\d+)\s*\/\s*(\d+)/i.exec(comment);
        if (!match) {
            return null;
        }

        return {
            current: Number(match[1]),
            total: Number(match[2])
        };
    }

    function formatProgress(current, total) {
        if (!Number.isFinite(current) || !Number.isFinite(total)) {
            return 'Unknown';
        }
        return `${current} / ${total}`;
    }

    function getSkillName(skill) {
        if (!Number.isFinite(skill)) {
            return 'Unknown';
        }
        return SKILL_NAMES[skill] || `Skill ${skill}`;
    }

    function getWeaponName(value, weaponModel) {
        if (Number.isFinite(value) && WEAPON_NAMES.has(value)) {
            return WEAPON_NAMES.get(value);
        }

        if (weaponModel) {
            return weaponModel.split('/').pop();
        }

        if (Number.isFinite(value)) {
            return `Raw ${value}`;
        }

        return 'Unknown';
    }

    function toUnsigned32(value) {
        return (Math.trunc(value) >>> 0);
    }

    function hasBit(flags, mask) {
        return (flags & mask) !== 0;
    }

    function decodeItems(value) {
        if (!Number.isFinite(value)) {
            return {
                raw: null,
                hex: 'Unknown',
                groups: {
                    weapons: [],
                    inventory: [],
                    keys: [],
                    powerups: [],
                    sigils: []
                }
            };
        }

        const flags = toUnsigned32(value);
        const grouped = {
            weapons: [],
            inventory: [],
            keys: [],
            powerups: [],
            sigils: []
        };

        ITEM_FLAGS.forEach((item) => {
            if (hasBit(flags, item.mask)) {
                grouped[item.group].push(item.label);
            }
        });

        return {
            raw: flags,
            hex: `0x${flags.toString(16).padStart(8, '0')}`,
            groups: grouped
        };
    }

    function describeArmor(armorValue, armorType) {
        if (!Number.isFinite(armorValue) || armorValue <= 0) {
            return 'No armor';
        }

        const typePercent = Number.isFinite(armorType) ? Math.round(armorType * 100) : null;
        let tier = 'Armor';
        if (armorType !== null) {
            if (armorType >= 0.79) {
                tier = 'Red armor';
            } else if (armorType >= 0.59) {
                tier = 'Yellow armor';
            } else if (armorType > 0) {
                tier = 'Green armor';
            }
        }

        return typePercent === null ? `${tier} (${armorValue})` : `${tier} (${armorValue}, ${typePercent}%)`;
    }

    function parseExtendedBlock(rawBlock) {
        if (!rawBlock) {
            return {
                present: false,
                header: null,
                lightstyles: [],
                modelPrecache: [],
                soundPrecache: [],
                particlePrecache: [],
                extraSpawnParms: [],
                serverflags: null
            };
        }

        const lines = rawBlock
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const info = {
            present: true,
            header: null,
            lightstyles: [],
            modelPrecache: [],
            soundPrecache: [],
            particlePrecache: [],
            extraSpawnParms: [],
            serverflags: null
        };

        lines.forEach((line) => {
            if (line.startsWith('//')) {
                if (!info.header && /extended savegame/i.test(line)) {
                    info.header = line.replace(/^\/\/\s*/, '');
                }
                return;
            }

            const match = /^([^\s]+)\s+(\d+)\s+"(.*)"$/.exec(line);
            if (match) {
                const key = match[1];
                const index = Number(match[2]);
                const value = match[3];

                if (key === 'sv.lightstyles') {
                    info.lightstyles.push({ index, value });
                } else if (key === 'sv.model_precache') {
                    info.modelPrecache.push({ index, value });
                } else if (key === 'sv.sound_precache') {
                    info.soundPrecache.push({ index, value });
                } else if (key === 'sv.particle_precache') {
                    info.particlePrecache.push({ index, value });
                } else if (key === 'spawnparm') {
                    info.extraSpawnParms.push({ index, value });
                }
                return;
            }

            const serverflagsMatch = /^svs?\.serverflags\s+(-?\d+)$/.exec(line);
            if (serverflagsMatch) {
                info.serverflags = Number(serverflagsMatch[1]);
            }
        });

        return info;
    }

    class TokenStream {
        constructor(text) {
            this.text = text;
            this.index = 0;
        }

        skipWhitespace() {
            while (this.index < this.text.length && /\s/.test(this.text[this.index])) {
                this.index += 1;
            }
        }

        next() {
            this.skipWhitespace();

            if (this.index >= this.text.length) {
                return null;
            }

            const current = this.text[this.index];

            if (current === '{' || current === '}') {
                this.index += 1;
                return {
                    type: current,
                    value: current
                };
            }

            if (current === '"') {
                this.index += 1;
                let output = '';
                while (this.index < this.text.length) {
                    const character = this.text[this.index];

                    if (character === '\\' && this.index + 1 < this.text.length) {
                        output += this.text[this.index + 1];
                        this.index += 2;
                        continue;
                    }

                    if (character === '"') {
                        this.index += 1;
                        break;
                    }

                    output += character;
                    this.index += 1;
                }

                return {
                    type: 'string',
                    value: output
                };
            }

            let output = '';
            while (this.index < this.text.length) {
                const character = this.text[this.index];
                if (/\s/.test(character) || character === '{' || character === '}') {
                    break;
                }
                output += character;
                this.index += 1;
            }

            return {
                type: 'word',
                value: output
            };
        }
    }

    function parseBlocks(text) {
        const stream = new TokenStream(text);
        const blocks = [];

        while (true) {
            const token = stream.next();
            if (!token) {
                break;
            }

            if (token.type !== '{') {
                throw new Error(`Expected "{", found "${token.value}"`);
            }

            const entries = [];
            while (true) {
                const keyToken = stream.next();
                if (!keyToken) {
                    throw new Error('Unexpected end of file while reading a block');
                }

                if (keyToken.type === '}') {
                    break;
                }

                const valueToken = stream.next();
                if (!valueToken) {
                    throw new Error(`Missing value for key "${keyToken.value}"`);
                }

                if (valueToken.type === '}') {
                    throw new Error(`Missing value for key "${keyToken.value}"`);
                }

                entries.push({
                    key: keyToken.value,
                    value: valueToken.value
                });
            }

            blocks.push(entries);
        }

        return blocks;
    }

    function entriesToObject(entries) {
        return entries.reduce((result, entry) => {
            result[entry.key] = entry.value;
            return result;
        }, {});
    }

    function getFirstNumericValue(object, keys) {
        for (const key of keys) {
            const value = parseNumber(object[key]);
            if (value !== null) {
                return value;
            }
        }
        return null;
    }

    function collectClassCounts(entities) {
        const counts = new Map();

        entities.forEach((entity) => {
            if (entity.free) {
                return;
            }

            const name = entity.fields.classname || '(no classname)';
            counts.set(name, (counts.get(name) || 0) + 1);
        });

        return Array.from(counts.entries())
            .sort((left, right) => {
                if (right[1] !== left[1]) {
                    return right[1] - left[1];
                }
                return left[0].localeCompare(right[0]);
            })
            .map(([name, count]) => ({ name, count }));
    }

    function extractPlayer(entity) {
        if (!entity || entity.free) {
            return null;
        }

        const fields = entity.fields;
        const itemsRaw = parseNumber(fields.items);
        const items = decodeItems(itemsRaw);
        const weaponValue = parseInteger(fields.weapon);

        return {
            name: fields.netname || 'player',
            health: parseNumber(fields.health),
            armorValue: parseNumber(fields.armorvalue),
            armorType: parseNumber(fields.armortype),
            currentAmmo: parseNumber(fields.currentammo),
            ammoShells: parseNumber(fields.ammo_shells),
            ammoNails: parseNumber(fields.ammo_nails),
            ammoRockets: parseNumber(fields.ammo_rockets),
            ammoCells: parseNumber(fields.ammo_cells),
            activeWeapon: getWeaponName(weaponValue, fields.weaponmodel),
            weaponModel: fields.weaponmodel || null,
            origin: parseVector(fields.origin),
            angles: parseVector(fields.angles),
            items,
            rawItems: itemsRaw,
            viewOfs: parseVector(fields.view_ofs)
        };
    }

    function parseSaveFileText(text, file) {
        const warnings = [];
        const normalized = String(text || '')
            .replace(/^\uFEFF/, '')
            .replace(/\r\n?/g, '\n');

        if (!normalized.trim()) {
            throw new Error('The file is empty.');
        }

        let mainText = normalized;
        let extendedBlock = null;
        const extendedMatch = normalized.match(/\/\*\n([\s\S]*?)\*\/\s*$/);
        if (extendedMatch && typeof extendedMatch.index === 'number') {
            mainText = normalized.slice(0, extendedMatch.index).trimEnd();
            extendedBlock = extendedMatch[1];
        }

        const lines = mainText.split('\n');
        let cursor = 0;

        function readLine(label) {
            if (cursor >= lines.length) {
                throw new Error(`Unexpected end of file while reading ${label}.`);
            }
            const line = lines[cursor];
            cursor += 1;
            return line;
        }

        const versionLine = readLine('savegame version');
        const version = parseInteger(versionLine);
        if (version === null) {
            throw new Error(`Invalid savegame version "${versionLine}".`);
        }
        if (version !== SAVEGAME_VERSION && version !== REMASTER_SAVEGAME_VERSION) {
            warnings.push(`Savegame version is ${version}; known QSS-M save versions are ${SAVEGAME_VERSION} and remaster ${REMASTER_SAVEGAME_VERSION}.`);
        }

        const isRemasterSave = version === REMASTER_SAVEGAME_VERSION;
        const savedGameDir = isRemasterSave ? readLine('saved gamedir').trim() : null;
        const rawComment = readLine('save comment');
        const saveComment = decodeSaveComment(rawComment);

        const spawnParms = [];
        for (let index = 0; index < BASIC_SPAWN_PARM_COUNT; index += 1) {
            const value = parseNumber(readLine(`spawn parm ${index + 1}`));
            spawnParms.push(value);
        }

        const skill = parseInteger(readLine('skill'));
        const mapName = readLine('map name').trim();
        const elapsedTime = parseNumber(readLine('elapsed time'));

        const lightstyles = [];
        for (let index = 0; index < VANILLA_LIGHTSTYLE_COUNT; index += 1) {
            lightstyles.push(readLine(`lightstyle ${index}`));
        }

        const remainingText = lines.slice(cursor).join('\n').trim();
        const blocks = parseBlocks(remainingText);
        if (!blocks.length) {
            throw new Error('No globals or entity blocks were found after the header.');
        }

        const globals = entriesToObject(blocks[0]);
        const entities = blocks.slice(1).map((entries, index) => ({
            index,
            free: entries.length === 0,
            entries,
            fields: entriesToObject(entries)
        }));

        const playerEntity = ((entities[1] && !entities[1].free) ? entities[1] : null) ||
            entities.find((entity) => !entity.free && entity.fields.netname);
        const worldspawn = entities[0] && !entities[0].free ? entities[0] : null;
        const classCounts = collectClassCounts(entities);
        const extended = parseExtendedBlock(extendedBlock);
        const activeEntities = entities.filter((entity) => !entity.free).length;
        const freeEntities = entities.length - activeEntities;
        const monsterProgress = {
            current: getFirstNumericValue(globals, ['killed_monsters']),
            total: getFirstNumericValue(globals, ['total_monsters'])
        };
        const commentKills = extractKills(saveComment);
        if (monsterProgress.current === null || monsterProgress.total === null) {
            if (commentKills) {
                monsterProgress.current = commentKills.current;
                monsterProgress.total = commentKills.total;
            }
        }

        const secretProgress = {
            current: getFirstNumericValue(globals, ['found_secrets']),
            total: getFirstNumericValue(globals, ['total_secrets'])
        };

        return {
            fileName: file.name,
            fileSize: file.size,
            lastModified: file.lastModified,
            version,
            format: isRemasterSave ? 'Remaster' : 'Classic',
            savedGameDir,
            canConvert: isRemasterSave,
            classicSaveText: isRemasterSave ? createClassicSaveText(lines) : null,
            saveComment,
            rawComment,
            mapName,
            elapsedTime,
            skill,
            skillLabel: getSkillName(skill),
            spawnParms,
            lightstyles,
            globals,
            entities,
            activeEntities,
            freeEntities,
            classCounts,
            player: extractPlayer(playerEntity),
            worldspawn: worldspawn ? worldspawn.fields : null,
            monsterProgress,
            secretProgress,
            extended,
            warnings
        };
    }

    function createSummaryStats(items) {
        const valid = items.filter((item) => item.ok);
        const totalEntities = valid.reduce((sum, item) => sum + item.data.entities.length, 0);
        const extendedCount = valid.filter((item) => item.data.extended.present).length;
        const remasterCount = valid.filter((item) => item.data.version === REMASTER_SAVEGAME_VERSION).length;
        const maps = new Set(valid.map((item) => item.data.mapName).filter(Boolean));

        return [
            { label: 'Files loaded', value: items.length },
            { label: 'Parsed successfully', value: valid.length },
            { label: 'Distinct maps', value: maps.size },
            { label: 'Total edicts', value: totalEntities },
            { label: 'Remaster saves', value: remasterCount },
            { label: 'Extended saves', value: extendedCount }
        ];
    }

    function renderSummary(items) {
        if (!items.length) {
            summaryPanel.hidden = true;
            summaryGrid.innerHTML = '';
            return;
        }

        summaryPanel.hidden = false;
        const stats = createSummaryStats(items);
        summaryGrid.innerHTML = stats.map((stat) => `
            <article class="stat-card">
                <div class="stat-label">${escapeHtml(stat.label)}</div>
                <div class="stat-value">${escapeHtml(stat.value)}</div>
            </article>
        `).join('');
    }

    function renderChipRow(items, emptyLabel) {
        if (!items.length) {
            return `<span class="chip empty">${escapeHtml(emptyLabel)}</span>`;
        }

        return items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('');
    }

    function renderClassTable(classCounts) {
        if (!classCounts.length) {
            return '<span class="chip empty">No active entities</span>';
        }

        const rows = classCounts.slice(0, 10).map((item) => `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.count)}</td>
            </tr>
        `).join('');

        return `
            <table class="list-table">
                <thead>
                    <tr>
                        <th>Classname</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    function renderGlobals(globals) {
        const entries = Object.entries(globals).sort((left, right) => left[0].localeCompare(right[0]));
        if (!entries.length) {
            return '<span class="chip empty">No saved globals</span>';
        }

        const preview = entries.slice(0, 16).map(([key, value]) => `${key}: ${value}`).join('\n');
        return `<pre class="code-block">${escapeHtml(preview)}</pre>`;
    }

    function renderWarningsForCard(warnings) {
        if (!warnings.length) {
            return '';
        }

        return warnings.map((warning) => `<span class="pill warn"><i class="fa-solid fa-triangle-exclamation"></i>${escapeHtml(warning)}</span>`).join('');
    }

    function renderSaveCard(item, index) {
        if (!item.ok) {
            return `
                <article class="save-card">
                    <div class="save-header">
                        <div class="save-headline">
                            <div>
                                <h2 class="save-title">${escapeHtml(item.file.name)}</h2>
                                <div class="save-subtitle">${escapeHtml(formatBytes(item.file.size))} · ${escapeHtml(formatDate(item.file.lastModified))}</div>
                            </div>
                            <div class="save-meta">
                                <span class="pill bad"><i class="fa-solid fa-circle-xmark"></i>Parse failed</span>
                            </div>
                        </div>
                    </div>
                    <div class="save-error">
                        <p>${escapeHtml(item.error)}</p>
                    </div>
                </article>
            `;
        }

        const data = item.data;
        const player = data.player;
        const worldTitle = data.worldspawn && data.worldspawn.message ? data.worldspawn.message : 'Unknown';
        const headerWarnings = renderWarningsForCard(data.warnings);
        const pills = [
            `<span class="pill"><i class="fa-solid fa-file"></i>${escapeHtml(formatBytes(data.fileSize))}</span>`,
            `<span class="pill"><i class="fa-solid fa-map-location-dot"></i>${escapeHtml(data.mapName || 'Unknown map')}</span>`,
            `<span class="pill"><i class="fa-solid fa-gauge"></i>${escapeHtml(data.skillLabel)}</span>`,
            `<span class="pill"><i class="fa-solid fa-clock"></i>${escapeHtml(formatDuration(data.elapsedTime))}</span>`,
            `<span class="pill"><i class="fa-solid fa-floppy-disk"></i>${escapeHtml(data.format)}</span>`,
            data.savedGameDir ? `<span class="pill"><i class="fa-solid fa-folder"></i>${escapeHtml(data.savedGameDir)}</span>` : '',
            data.extended.present ? `<span class="pill"><i class="fa-solid fa-layer-group"></i>${escapeHtml(data.extended.header || 'Extended save')}</span>` : '',
            (data.version === SAVEGAME_VERSION || data.version === REMASTER_SAVEGAME_VERSION) ? `<span class="pill"><i class="fa-solid fa-check"></i>Version ${escapeHtml(data.version)}</span>` : `<span class="pill warn"><i class="fa-solid fa-triangle-exclamation"></i>Version ${escapeHtml(data.version)}</span>`,
            headerWarnings
        ].filter(Boolean).join('');

        const inventoryGroups = player ? player.items.groups : {
            weapons: [],
            inventory: [],
            keys: [],
            powerups: [],
            sigils: []
        };
        const conversionPanel = data.canConvert ? `
                    <section class="convert-panel">
                        <div>
                            <h3>Classic save</h3>
                            <p>Version ${escapeHtml(SAVEGAME_VERSION)} · ${escapeHtml(SAVEGAME_COMMENT_LENGTH)} character comment</p>
                        </div>
                        <button class="download-button" type="button" data-convert-index="${escapeHtml(index)}">
                            <i class="fa-solid fa-download"></i>
                            Download .sav
                        </button>
                    </section>
        ` : '';

        return `
            <article class="save-card">
                <div class="save-header">
                    <div class="save-headline">
                        <div>
                            <h2 class="save-title">${escapeHtml(data.fileName)}</h2>
                            <div class="save-subtitle">${escapeHtml(data.saveComment || '(no save comment)')} · ${escapeHtml(formatDate(data.lastModified))}</div>
                        </div>
                        <div class="save-meta">${pills}</div>
                    </div>
                </div>
                <div class="save-body">
                    ${conversionPanel}

                    <section class="metrics">
                        <article class="metric">
                            <div class="metric-label">Level title</div>
                            <div class="metric-value">${escapeHtml(worldTitle)}</div>
                            <div class="metric-sub">Map entity message</div>
                        </article>
                        <article class="metric">
                            <div class="metric-label">Monsters</div>
                            <div class="metric-value">${escapeHtml(formatProgress(data.monsterProgress.current, data.monsterProgress.total))}</div>
                            <div class="metric-sub">Killed / total</div>
                        </article>
                        <article class="metric">
                            <div class="metric-label">Secrets</div>
                            <div class="metric-value">${escapeHtml(formatProgress(data.secretProgress.current, data.secretProgress.total))}</div>
                            <div class="metric-sub">Found / total</div>
                        </article>
                        <article class="metric">
                            <div class="metric-label">Edicts</div>
                            <div class="metric-value">${escapeHtml(data.entities.length)}</div>
                            <div class="metric-sub">${escapeHtml(data.activeEntities)} active · ${escapeHtml(data.freeEntities)} free</div>
                        </article>
                    </section>

                    <section class="split-grid">
                        <article class="box">
                            <h3>Player state</h3>
                            <dl class="kv-grid">
                                <dt>Name</dt>
                                <dd>${escapeHtml(player ? player.name : 'Unknown')}</dd>
                                <dt>Health</dt>
                                <dd>${escapeHtml(player && player.health !== null ? player.health : 'Unknown')}</dd>
                                <dt>Armor</dt>
                                <dd>${escapeHtml(player ? describeArmor(player.armorValue, player.armorType) : 'Unknown')}</dd>
                                <dt>Weapon</dt>
                                <dd>${escapeHtml(player ? player.activeWeapon : 'Unknown')}</dd>
                                <dt>Current ammo</dt>
                                <dd>${escapeHtml(player && player.currentAmmo !== null ? player.currentAmmo : 'Unknown')}</dd>
                                <dt>Origin</dt>
                                <dd>${escapeHtml(player && player.origin ? player.origin : 'Unknown')}</dd>
                                <dt>Angles</dt>
                                <dd>${escapeHtml(player && player.angles ? player.angles : 'Unknown')}</dd>
                            </dl>
                        </article>

                        <article class="box">
                            <h3>Ammo</h3>
                            <dl class="kv-grid">
                                <dt>Shells</dt>
                                <dd>${escapeHtml(player && player.ammoShells !== null ? player.ammoShells : 'Unknown')}</dd>
                                <dt>Nails</dt>
                                <dd>${escapeHtml(player && player.ammoNails !== null ? player.ammoNails : 'Unknown')}</dd>
                                <dt>Rockets</dt>
                                <dd>${escapeHtml(player && player.ammoRockets !== null ? player.ammoRockets : 'Unknown')}</dd>
                                <dt>Cells</dt>
                                <dd>${escapeHtml(player && player.ammoCells !== null ? player.ammoCells : 'Unknown')}</dd>
                                <dt>Items raw</dt>
                                <dd>${escapeHtml(player ? player.items.hex : 'Unknown')}</dd>
                                <dt>Weapon model</dt>
                                <dd>${escapeHtml(player && player.weaponModel ? player.weaponModel : 'Unknown')}</dd>
                                <dt>View offset</dt>
                                <dd>${escapeHtml(player && player.viewOfs ? player.viewOfs : 'Unknown')}</dd>
                            </dl>
                        </article>
                    </section>

                    <section class="split-grid">
                        <article class="box">
                            <h3>Inventory flags</h3>
                            <p class="box-note">Decoded from standard Quake item bits. The raw item mask is shown in the ammo panel.</p>
                            <div class="chip-row">${renderChipRow(inventoryGroups.weapons, 'No known weapon flags')}</div>
                            <h3 style="margin-top:16px;">Keys and powerups</h3>
                            <div class="chip-row">${renderChipRow(inventoryGroups.keys.concat(inventoryGroups.powerups).concat(inventoryGroups.sigils), 'No keys or powerups')}</div>
                            <h3 style="margin-top:16px;">Other flags</h3>
                            <div class="chip-row">${renderChipRow(inventoryGroups.inventory, 'No other known flags')}</div>
                        </article>

                        <article class="box">
                            <h3>Entity breakdown</h3>
                            ${renderClassTable(data.classCounts)}
                        </article>
                    </section>

                    <details class="details">
                        <summary>Technical details</summary>
                        <div class="details-content raw-grid">
                            <article class="box">
                                <h3>Header</h3>
                                <dl class="kv-grid">
                                    <dt>Raw comment</dt>
                                    <dd>${escapeHtml(data.rawComment || 'Unknown')}</dd>
                                    <dt>Format</dt>
                                    <dd>${escapeHtml(data.format)}${data.savedGameDir ? ` · ${escapeHtml(data.savedGameDir)}` : ''}</dd>
                                    <dt>Spawn parms</dt>
                                    <dd>${escapeHtml(data.spawnParms.filter((value) => value !== null && value !== 0).length)} non-zero of ${escapeHtml(data.spawnParms.length)}</dd>
                                    <dt>Vanilla lightstyles</dt>
                                    <dd>${escapeHtml(data.lightstyles.length)}</dd>
                                    <dt>Serverflags</dt>
                                    <dd>${escapeHtml(data.extended.serverflags !== null ? data.extended.serverflags : globalsValue(data.globals, 'serverflags'))}</dd>
                                </dl>
                            </article>

                            <article class="box">
                                <h3>Extended block</h3>
                                <dl class="kv-grid">
                                    <dt>Status</dt>
                                    <dd>${escapeHtml(data.extended.present ? (data.extended.header || 'Present') : 'Not present')}</dd>
                                    <dt>Extra lightstyles</dt>
                                    <dd>${escapeHtml(data.extended.lightstyles.length)}</dd>
                                    <dt>Models</dt>
                                    <dd>${escapeHtml(data.extended.modelPrecache.length)}</dd>
                                    <dt>Sounds</dt>
                                    <dd>${escapeHtml(data.extended.soundPrecache.length)}</dd>
                                    <dt>Particles</dt>
                                    <dd>${escapeHtml(data.extended.particlePrecache.length)}</dd>
                                    <dt>Extra spawn parms</dt>
                                    <dd>${escapeHtml(data.extended.extraSpawnParms.length)}</dd>
                                </dl>
                            </article>

                            <article class="box">
                                <h3>Saved globals</h3>
                                ${renderGlobals(data.globals)}
                            </article>
                        </div>
                    </details>
                </div>
            </article>
        `;
    }

    function globalsValue(globals, key) {
        if (!globals || !Object.prototype.hasOwnProperty.call(globals, key)) {
            return 'Unknown';
        }
        return globals[key];
    }

    function renderResults(items) {
        if (!items.length) {
            resultsPanel.hidden = true;
            resultsPanel.innerHTML = '';
            return;
        }

        resultsPanel.hidden = false;
        resultsPanel.innerHTML = items.map((item, index) => renderSaveCard(item, index)).join('');
    }

    function refresh() {
        renderSummary(parsedFiles);
        renderResults(parsedFiles);
        clearButton.disabled = parsedFiles.length === 0;
    }

    async function parseFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) {
            return;
        }

        const accepted = [];
        const warnings = [];

        files.forEach((file) => {
            if (/\.sav$/i.test(file.name)) {
                accepted.push(file);
            } else {
                warnings.push(`Skipped "${file.name}" because it does not end in .sav.`);
            }
        });

        if (!accepted.length) {
            setWarnings(warnings.length ? warnings : ['No .sav files were provided.']);
            setStatus('No supported savegames were loaded.', 'error');
            return;
        }

        setStatus(`Reading ${accepted.length} savegame${accepted.length === 1 ? '' : 's'}...`);
        setWarnings(warnings);

        const nextResults = [];
        for (const file of accepted) {
            try {
                const text = await file.text();
                nextResults.push({
                    ok: true,
                    file,
                    data: parseSaveFileText(text, file)
                });
            } catch (error) {
                nextResults.push({
                    ok: false,
                    file,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        parsedFiles = nextResults;
        const successful = nextResults.filter((item) => item.ok).length;
        const failures = nextResults.length - successful;

        if (successful && !failures) {
            setStatus(`Parsed ${successful} savegame${successful === 1 ? '' : 's'}.`, 'success');
        } else if (successful) {
            setStatus(`Parsed ${successful} savegame${successful === 1 ? '' : 's'} with ${failures} failure${failures === 1 ? '' : 's'}.`, 'success');
        } else {
            setStatus('Unable to parse the selected savegames.', 'error');
        }

        const aggregatedWarnings = warnings.slice();
        nextResults.forEach((item) => {
            if (item.ok) {
                item.data.warnings.forEach((warning) => aggregatedWarnings.push(`${item.file.name}: ${warning}`));
            } else {
                aggregatedWarnings.push(`${item.file.name}: ${item.error}`);
            }
        });
        setWarnings(aggregatedWarnings);

        refresh();
    }

    function clearAll() {
        parsedFiles = [];
        fileInput.value = '';
        setWarnings([]);
        setStatus('No savegames loaded.');
        refresh();
    }

    function convertedSaveName(fileName) {
        return String(fileName || 'save.sav').replace(/(\.sav)?$/i, '_classic.sav');
    }

    function downloadTextFile(fileName, text) {
        const blob = new Blob([text], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function handleResultsClick(event) {
        const button = event.target.closest('[data-convert-index]');
        if (!button) {
            return;
        }

        const item = parsedFiles[Number(button.dataset.convertIndex)];
        if (!item || !item.ok || !item.data.classicSaveText) {
            setStatus('No converted save is available for that file.', 'error');
            return;
        }

        downloadTextFile(convertedSaveName(item.data.fileName), item.data.classicSaveText);
        setStatus(`Prepared ${convertedSaveName(item.data.fileName)}.`, 'success');
    }

    function bindDropZone() {
        function activate(active) {
            dropZone.classList.toggle('active', active);
        }

        dropZone.addEventListener('click', function () {
            fileInput.click();
        });

        dropZone.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                activate(true);
            });
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            dropZone.addEventListener(eventName, function (event) {
                event.preventDefault();
                activate(false);
            });
        });

        dropZone.addEventListener('drop', function (event) {
            parseFiles(event.dataTransfer.files);
        });
    }

    fileInput.addEventListener('change', function () {
        parseFiles(fileInput.files);
    });

    clearButton.addEventListener('click', clearAll);
    resultsPanel.addEventListener('click', handleResultsClick);

    bindDropZone();
    refresh();
})();
