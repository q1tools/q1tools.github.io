(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.QuakeDemoParser = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MAX_MSGLEN = 64000;
    const MAX_MODELS = 4096;
    const MAX_SOUNDS = 2048;
    const MAX_STATS = 256;
    const MAX_LIGHTSTYLES = 64;

    const PROTOCOL_NETQUAKE = 15;
    const PROTOCOL_FITZQUAKE = 666;
    const PROTOCOL_RMQ = 999;
    const PROTOCOL_VERSION_DP7 = 3504;
    const PROTOCOL_VERSION_BJP3 = 10002;
    const PROTOCOL_FTE_PEXT1 = 0x58455446;
    const PROTOCOL_FTE_PEXT2 = 0x32455446;

    const CAMERA_SMOOTH_SIZE = 60;
    const MOTION_SMOOTH_SIZE = 30;
    const MOTION_SMOOTH_RESTART_LIMIT = 200;
    const MOVEMENT_DISCONTINUITY_DISTANCE = 128;
    const MOVEMENT_DISCONTINUITY_SPEED = 1000;
    const ROLL_TARGET = 10;
    const ROLL_TRIGGER_ANGLE = 0.3;
    const ROLL_SPEED = 0.2;

    const PRFL_SHORTANGLE = 1 << 1;
    const PRFL_FLOATANGLE = 1 << 2;
    const PRFL_24BITCOORD = 1 << 3;
    const PRFL_FLOATCOORD = 1 << 4;
    const PRFL_EDICTSCALE = 1 << 5;
    const PRFL_INT32COORD = 1 << 7;

    const PEXT1_CSQC = 0x40000000;

    const PEXT2_PRYDONCURSOR = 0x00000001;
    const PEXT2_VOICECHAT = 0x00000002;
    const PEXT2_SETANGLEDELTA = 0x00000004;
    const PEXT2_REPLACEMENTDELTAS = 0x00000008;
    const PEXT2_MAXPLAYERS = 0x00000010;
    const PEXT2_PREDINFO = 0x00000020;
    const PEXT2_NEWSIZEENCODING = 0x00000040;
    const PEXT2_INFOBLOBS = 0x00000080;
    const SMOOTH_SUPPORTED_PEXT2 = (
        PEXT2_PRYDONCURSOR |
        PEXT2_VOICECHAT |
        PEXT2_REPLACEMENTDELTAS |
        PEXT2_MAXPLAYERS |
        PEXT2_PREDINFO |
        PEXT2_NEWSIZEENCODING |
        PEXT2_INFOBLOBS
    ) >>> 0;

    const U_MOREBITS = 1 << 0;
    const U_ORIGIN1 = 1 << 1;
    const U_ORIGIN2 = 1 << 2;
    const U_ORIGIN3 = 1 << 3;
    const U_ANGLE2 = 1 << 4;
    const U_STEP = 1 << 5;
    const U_FRAME = 1 << 6;
    const U_SIGNAL = 1 << 7;
    const U_ANGLE1 = 1 << 8;
    const U_ANGLE3 = 1 << 9;
    const U_MODEL = 1 << 10;
    const U_COLORMAP = 1 << 11;
    const U_SKIN = 1 << 12;
    const U_EFFECTS = 1 << 13;
    const U_LONGENTITY = 1 << 14;
    const U_EXTEND1 = 1 << 15;
    const U_ALPHA = 1 << 16;
    const U_FRAME2 = 1 << 17;
    const U_MODEL2 = 1 << 18;
    const U_LERPFINISH = 1 << 19;
    const U_SCALE = 1 << 20;
    const U_EXTEND2 = 1 << 23;
    const U_TRANS = 1 << 15;

    const UF_FRAME = 1 << 0;
    const UF_ORIGINXY = 1 << 1;
    const UF_ORIGINZ = 1 << 2;
    const UF_ANGLESXZ = 1 << 3;
    const UF_ANGLESY = 1 << 4;
    const UF_EFFECTS = 1 << 5;
    const UF_PREDINFO = 1 << 6;
    const UF_EXTEND1 = 1 << 7;
    const UF_RESET = 1 << 8;
    const UF_16BIT = 1 << 9;
    const UF_MODEL = 1 << 10;
    const UF_SKIN = 1 << 11;
    const UF_COLORMAP = 1 << 12;
    const UF_SOLID = 1 << 13;
    const UF_FLAGS = 1 << 14;
    const UF_EXTEND2 = 1 << 15;
    const UF_ALPHA = 1 << 16;
    const UF_SCALE = 1 << 17;
    const UF_BONEDATA = 1 << 18;
    const UF_DRAWFLAGS = 1 << 19;
    const UF_TAGINFO = 1 << 20;
    const UF_LIGHT = 1 << 21;
    const UF_TRAILEFFECT = 1 << 22;
    const UF_EXTEND3 = 1 << 23;
    const UF_COLORMOD = 1 << 24;
    const UF_GLOW = 1 << 25;
    const UF_FATNESS = 1 << 26;
    const UF_MODELINDEX2 = 1 << 27;
    const UF_GRAVITYDIR = 1 << 28;
    const UF_EFFECTS2 = 1 << 29;
    const UF_UNUSED2 = 1 << 30;
    const UF_UNUSED1 = 0x80000000 >>> 0;

    const UFP_FORWARD = 1 << 0;
    const UFP_SIDE = 1 << 1;
    const UFP_UP = 1 << 2;
    const UFP_MOVETYPE = 1 << 3;
    const UFP_VELOCITYXY = 1 << 4;
    const UFP_VELOCITYZ = 1 << 5;
    const UFP_MSEC = 1 << 6;
    const UFP_VIEWANGLE = 1 << 7;
    const UFP_WEAPONFRAME_OLD = 1 << 7;

    const SU_VIEWHEIGHT = 1 << 0;
    const SU_IDEALPITCH = 1 << 1;
    const SU_PUNCH1 = 1 << 2;
    const SU_PUNCH2 = 1 << 3;
    const SU_PUNCH3 = 1 << 4;
    const SU_VELOCITY1 = 1 << 5;
    const SU_VELOCITY2 = 1 << 6;
    const SU_VELOCITY3 = 1 << 7;
    const SU_ITEMS = 1 << 9;
    const SU_ONGROUND = 1 << 10;
    const SU_INWATER = 1 << 11;
    const SU_WEAPONFRAME = 1 << 12;
    const SU_ARMOR = 1 << 13;
    const SU_WEAPON = 1 << 14;
    const SU_EXTEND1 = 1 << 15;
    const SU_WEAPON2 = 1 << 16;
    const SU_ARMOR2 = 1 << 17;
    const SU_AMMO2 = 1 << 18;
    const SU_SHELLS2 = 1 << 19;
    const SU_NAILS2 = 1 << 20;
    const SU_ROCKETS2 = 1 << 21;
    const SU_CELLS2 = 1 << 22;
    const SU_EXTEND2 = 1 << 23;
    const SU_WEAPONFRAME2 = 1 << 24;
    const SU_WEAPONALPHA = 1 << 25;

    const DPSU_PUNCHVEC1 = 1 << 16;

    const B_LARGEMODEL = 1 << 0;
    const B_LARGEFRAME = 1 << 1;
    const B_ALPHA = 1 << 2;
    const B_SCALE = 1 << 3;

    const SND_VOLUME = 1n << 0n;
    const SND_ATTENUATION = 1n << 1n;
    const SND_FTE_MOREFLAGS = 1n << 2n;
    const SND_LARGEENTITY = 1n << 3n;
    const SND_LARGESOUND = 1n << 4n;
    const SND_DP_PITCH = 1n << 5n;
    const SND_FTE_TIMEOFS = 1n << 6n;
    const SND_FTE_PITCHADJ = 1n << 7n;
    const SND_FTE_VELOCITY = 1n << 8n;
    const SND_FTE_FORCELOOP = 1n << 9n;
    const SND_FTE_NOSPACIALISE = 1n << 10n;
    const SND_FTE_NOREVERB = 1n << 13n;
    const SND_FTE_FOLLOW = 1n << 14n;
    const SND_FTE_NOREPLACE = 1n << 15n;

    const EF_FULLBRIGHT = 1 << 9;

    const DEFAULT_SOUND_PACKET_VOLUME = 255;
    const DEFAULT_SOUND_PACKET_ATTENUATION = 1.0;

    const SVC = {
        BAD: 0,
        NOP: 1,
        DISCONNECT: 2,
        UPDATESTAT: 3,
        VERSION: 4,
        SETVIEW: 5,
        SOUND: 6,
        TIME: 7,
        PRINT: 8,
        STUFFTEXT: 9,
        SETANGLE: 10,
        SERVERINFO: 11,
        LIGHTSTYLE: 12,
        UPDATENAME: 13,
        UPDATEFRAGS: 14,
        CLIENTDATA: 15,
        STOPSOUND: 16,
        UPDATECOLORS: 17,
        PARTICLE: 18,
        DAMAGE: 19,
        SPAWNSTATIC: 20,
        FTE_SPAWNSTATIC2_ALIAS: 21,
        SPAWNBASELINE: 22,
        TEMP_ENTITY: 23,
        SETPAUSE: 24,
        SIGNONNUM: 25,
        CENTERPRINT: 26,
        KILLEDMONSTER: 27,
        FOUNDSECRET: 28,
        SPAWNSTATICSOUND: 29,
        INTERMISSION: 30,
        FINALE: 31,
        CDTRACK: 32,
        SELLSCREEN: 33,
        CUTSCENE: 34,
        DP_SHOWPIC: 35,
        DP_HIDEPIC: 36,
        SKYBOX: 37,
        BF: 40,
        FOG: 41,
        SPAWNBASELINE2: 42,
        SPAWNSTATIC2: 43,
        SPAWNSTATICSOUND2: 44,
        DP_DOWNLOADDATA: 50,
        DP_UPDATESTATBYTE: 51,
        DP_EFFECT: 52,
        DP_EFFECT2: 53,
        DP_PRECACHE: 54,
        DP_SPAWNBASELINE2: 55,
        DP_SPAWNSTATIC2: 56,
        DP_ENTITIES: 57,
        DP_CSQCENTITIES: 58,
        DP_SPAWNSTATICSOUND2: 59,
        DP_TRAILPARTICLES: 60,
        DP_POINTPARTICLES: 61,
        DP_POINTPARTICLES1: 62,
        FTE_SPAWNBASELINE2: 66,
        FTE_UPDATESTATSTRING: 78,
        FTE_UPDATESTATFLOAT: 79,
        FTE_CGAMEPACKET: 83,
        FTE_VOICECHAT: 84,
        FTE_SETANGLEDELTA: 85,
        FTE_UPDATEENTITIES: 86
    };

    const TEMP_ENTITY = {
        SPIKE: 0,
        SUPERSPIKE: 1,
        GUNSHOT: 2,
        EXPLOSION: 3,
        TAREXPLOSION: 4,
        LIGHTNING1: 5,
        LIGHTNING2: 6,
        WIZSPIKE: 7,
        KNIGHTSPIKE: 8,
        LIGHTNING3: 9,
        LAVASPLASH: 10,
        TELEPORT: 11,
        EXPLOSION2: 12,
        BEAM: 13,
        NEH_EXPLOSION3: 16,
        NEH_LIGHTNING4: 17,
        FTE_EXPLOSION_SPRITE: 20,
        FTE_GUNSHOT_COUNT: 21,
        DP_BLOOD: 50,
        DP_SPARK: 51,
        DP_BLOODSHOWER: 52,
        DP_EXPLOSIONRGB: 53,
        DP_PARTICLECUBE: 54,
        DP_PARTICLERAIN: 55,
        DP_PARTICLESNOW: 56,
        DP_GUNSHOTQUAD: 57,
        DP_SPIKEQUAD: 58,
        DP_SUPERSPIKEQUAD: 59,
        DP_EXPLOSIONQUAD: 70,
        DP_SMALLFLASH: 72,
        DP_CUSTOMFLASH: 73,
        DP_FLAMEJET: 74,
        DP_PLASMABURN: 75,
        DP_TEI_G3: 76,
        DP_SMOKE: 77,
        DP_TEI_BIGEXPLOSION: 78,
        DP_TEI_PLASMAHIT: 79
    };

    const STAT = {
        HEALTH: 0,
        WEAPON: 2,
        AMMO: 3,
        ARMOR: 4,
        WEAPONFRAME: 5,
        SHELLS: 6,
        NAILS: 7,
        ROCKETS: 8,
        CELLS: 9,
        ACTIVEWEAPON: 10,
        TOTALSECRETS: 11,
        TOTALMONSTERS: 12,
        SECRETS: 13,
        MONSTERS: 14,
        ITEMS: 15,
        VIEWHEIGHT: 16,
        VIEWZOOM: 21,
        IDEALPITCH: 25,
        PUNCHANGLE_X: 26,
        PUNCHANGLE_Y: 27,
        PUNCHANGLE_Z: 28
    };

    const ITEM_FLAGS = [
        { mask: 4096, label: 'Axe', group: 'weapons' },
        { mask: 1, label: 'Shotgun', group: 'weapons' },
        { mask: 2, label: 'Super Shotgun', group: 'weapons' },
        { mask: 4, label: 'Nailgun', group: 'weapons' },
        { mask: 8, label: 'Super Nailgun', group: 'weapons' },
        { mask: 16, label: 'Grenade Launcher', group: 'weapons' },
        { mask: 32, label: 'Rocket Launcher', group: 'weapons' },
        { mask: 64, label: 'Lightning Gun', group: 'weapons' },
        { mask: 128, label: 'Lightning Gun', group: 'weapons' },
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

    const WEAPON_NAMES = new Map([
        [4096, 'Axe'],
        [1, 'Shotgun'],
        [2, 'Super Shotgun'],
        [4, 'Nailgun'],
        [8, 'Super Nailgun'],
        [16, 'Grenade Launcher'],
        [32, 'Rocket Launcher'],
        [64, 'Lightning Gun'],
        [128, 'Lightning Gun']
    ]);

    const WEAPON_AMMO = new Map([
        [1, { stat: STAT.SHELLS, cost: 1, unit: 'shells' }],
        [2, { stat: STAT.SHELLS, cost: 2, unit: 'shells' }],
        [4, { stat: STAT.NAILS, cost: 1, unit: 'nails' }],
        [8, { stat: STAT.NAILS, cost: 2, unit: 'nails' }],
        [16, { stat: STAT.ROCKETS, cost: 1, unit: 'rockets' }],
        [32, { stat: STAT.ROCKETS, cost: 1, unit: 'rockets' }],
        [64, { stat: STAT.CELLS, cost: 1, unit: 'cells' }],
        [128, { stat: STAT.CELLS, cost: 1, unit: 'cells' }]
    ]);

    const DEQUAKE_MAP = buildDequakeMap();
    const SCOREBOARD_DISPLAY_MAP = buildScoreboardDisplayMap();

    function buildDequakeMap() {
        const map = new Array(256).fill(0);

        for (let index = 1; index < 12; index += 1) {
            map[index] = '#'.charCodeAt(0);
        }

        map[9] = 9;
        map[10] = 10;
        map[12] = ' '.charCodeAt(0);
        map[13] = 13;
        map[1] = '.'.charCodeAt(0);
        map[5] = '.'.charCodeAt(0);
        map[14] = '.'.charCodeAt(0);
        map[15] = '.'.charCodeAt(0);
        map[16] = '['.charCodeAt(0);
        map[17] = ']'.charCodeAt(0);
        map[28] = '.'.charCodeAt(0);
        map[29] = '<'.charCodeAt(0);
        map[30] = '-'.charCodeAt(0);
        map[31] = '>'.charCodeAt(0);

        for (let index = 0; index < 10; index += 1) {
            map[18 + index] = '0'.charCodeAt(0) + index;
        }

        for (let index = 32; index < 128; index += 1) {
            map[index] = index;
        }

        for (let index = 0; index < 128; index += 1) {
            map[index + 128] = map[index];
        }

        map[128] = '('.charCodeAt(0);
        map[129] = '='.charCodeAt(0);
        map[130] = ')'.charCodeAt(0);
        map[131] = '*'.charCodeAt(0);
        map[141] = '>'.charCodeAt(0);

        return map;
    }

    function buildScoreboardDisplayMap() {
        const map = new Array(128).fill('');

        map[9] = '\t';
        map[10] = '\n';
        map[12] = ' ';
        map[13] = '\r';
        map[1] = '·';
        map[5] = '·';
        map[14] = '·';
        map[15] = '·';
        map[16] = '[';
        map[17] = ']';
        map[28] = '·';
        map[29] = '<';
        map[30] = '-';
        map[31] = '>';

        for (let index = 0; index < 10; index += 1) {
            map[18 + index] = String(index);
        }

        for (let index = 32; index < 127; index += 1) {
            map[index] = String.fromCharCode(index);
        }

        for (let index = 97; index <= 121; index += 1) {
            map[index] = String.fromCharCode(index - 32);
        }
        map[122] = '2';
        map[127] = '<';

        return map;
    }

    function normalizeBuffer(input) {
        if (input instanceof Uint8Array) {
            return input;
        }
        if (input instanceof ArrayBuffer) {
            return new Uint8Array(input);
        }
        if (ArrayBuffer.isView(input)) {
            return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
        throw new TypeError('parseDemoBuffer expects an ArrayBuffer or Uint8Array.');
    }

    function decodeBytes(bytes) {
        if (!bytes.length) {
            return '';
        }
        let text = '';
        for (let index = 0; index < bytes.length; index += 4096) {
            const chunk = bytes.subarray(index, index + 4096);
            text += String.fromCharCode.apply(null, Array.from(chunk));
        }
        return text;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function round(value, places) {
        if (!Number.isFinite(value)) {
            return null;
        }
        const factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }

    function quakeBytesFromString(value) {
        const text = String(value || '');
        const bytes = new Array(text.length);
        for (let index = 0; index < text.length; index += 1) {
            bytes[index] = text.charCodeAt(index) & 0xff;
        }
        return bytes;
    }

    function dequakeBytes(bytes) {
        let text = '';
        for (let index = 0; index < bytes.length; index += 1) {
            const code = DEQUAKE_MAP[bytes[index] & 0xff];
            if (code) {
                text += String.fromCharCode(code);
            }
        }
        return text;
    }

    function dequakeName(value) {
        return dequakeBytes(quakeBytesFromString(value));
    }

    function decodeScoreboardBytes(bytes) {
        let text = '';
        for (let index = 0; index < bytes.length; index += 1) {
            const code = bytes[index] & 0x7f;
            const glyph = SCOREBOARD_DISPLAY_MAP[code];
            if (glyph) {
                text += glyph;
            }
        }
        return text;
    }

    function stripQuakeFormatting(value) {
        let text = String(value || '');
        while (text && (text.charCodeAt(0) === 1 || text.charCodeAt(0) === 2)) {
            text = text.slice(1);
        }
        return dequakeName(text);
    }

    function isFogStuffText(value) {
        return /^\s*fog\b/i.test(stripQuakeFormatting(value).trim());
    }

    function stripPathExtension(path) {
        const normalized = String(path || '').replace(/\\/g, '/');
        const leaf = normalized.split('/').pop() || '';
        return leaf.replace(/\.[^/.]+$/, '');
    }

    function encodeEntityAlpha(value) {
        const alpha = Number(value);
        if (!Number.isFinite(alpha) || alpha === 0) {
            return 0;
        }
        return Math.round(clamp(alpha * 254 + 1, 1, 255));
    }

    function cloneStringMap(source) {
        return Object.assign({}, source || {});
    }

    function parseInfoString(value) {
        const info = Object.create(null);
        const parts = String(value || '').split('\\');
        for (let index = 1; index + 1 < parts.length; index += 2) {
            info[parts[index]] = parts[index + 1];
        }
        return info;
    }

    function tokenizeStuffTextCommand(value) {
        const text = String(value || '');
        const tokens = [];
        let index = 0;
        while (index < text.length) {
            while (index < text.length && /\s/.test(text.charAt(index))) {
                index += 1;
            }
            if (index >= text.length) {
                break;
            }
            if (text.charAt(index) === '"') {
                index += 1;
                const start = index;
                while (index < text.length && text.charAt(index) !== '"') {
                    index += 1;
                }
                tokens.push(text.slice(start, index));
                if (index < text.length && text.charAt(index) === '"') {
                    index += 1;
                }
                continue;
            }
            const start = index;
            while (index < text.length && !/\s/.test(text.charAt(index))) {
                index += 1;
            }
            tokens.push(text.slice(start, index));
        }
        return tokens;
    }

    function ensureRuntimePlayer(parser, slot) {
        if (!Number.isInteger(slot) || slot < 0) {
            return null;
        }
        while (parser.runtime.players.length <= slot) {
            parser.runtime.players.push(null);
        }
        if (!parser.runtime.players[slot]) {
            parser.runtime.players[slot] = {
                name: '',
                shirt: null,
                pants: null,
                frags: 0
            };
        }
        return parser.runtime.players[slot];
    }

    function parseLegacyColorValue(value) {
        const text = String(value || '').trim();
        if (!/^-?\d+$/.test(text)) {
            return null;
        }
        return (Number(text) | 0) & 15;
    }

    function activeTeamColor(player) {
        if (!player || !player.name || !Number.isInteger(player.pants) || player.pants === 0 || player.frags === -99) {
            return null;
        }
        return player.pants & 0x0f;
    }

    function calculateTeamScoreSnapshot(parser) {
        const teamsByColor = new Map();

        parser.runtime.players.forEach(function (player) {
            const color = activeTeamColor(player);
            let entry;
            if (color === null) {
                return;
            }
            entry = teamsByColor.get(color);
            if (!entry) {
                entry = {
                    color: color,
                    score: 0,
                    players: 0
                };
                teamsByColor.set(color, entry);
            }
            entry.score += Number.isFinite(player.frags) ? player.frags : 0;
            entry.players += 1;
        });

        return {
            time: round(parser.runtime.time, 3) || 0,
            teams: Array.from(teamsByColor.values()).sort(function (left, right) {
                if (left.score !== right.score) {
                    return right.score - left.score;
                }
                return left.color - right.color;
            })
        };
    }

    function sameTeamScoreSnapshot(left, right) {
        if (!left || !right || left.teams.length !== right.teams.length) {
            return false;
        }
        for (let index = 0; index < left.teams.length; index += 1) {
            if (left.teams[index].color !== right.teams[index].color ||
                left.teams[index].score !== right.teams[index].score ||
                left.teams[index].players !== right.teams[index].players) {
                return false;
            }
        }
        return true;
    }

    function recordTeamScoreSnapshot(parser) {
        const snapshot = calculateTeamScoreSnapshot(parser);
        const previous = parser.teamScoreTimeline[parser.teamScoreTimeline.length - 1];

        if (snapshot.teams.length < 2 || sameTeamScoreSnapshot(previous, snapshot)) {
            return;
        }
        parser.teamScoreTimeline.push(snapshot);
    }

    function syncPlayerUserInfo(parser, slot) {
        const info = parser.runtime.playerUserInfo[slot];
        if (!info) {
            return;
        }
        const runtimePlayer = ensureRuntimePlayer(parser, slot);
        if (!runtimePlayer) {
            return;
        }
        const record = ensurePlayerRecord(parser, slot);
        if (Object.prototype.hasOwnProperty.call(info, 'name')) {
            runtimePlayer.name = info.name;
            addAlias(record, info.name);
        }
        const shirt = parseLegacyColorValue(info.topcolor);
        if (shirt !== null) {
            runtimePlayer.shirt = shirt;
            record.shirt = shirt;
        }
        const pants = parseLegacyColorValue(info.bottomcolor);
        if (pants !== null) {
            runtimePlayer.pants = pants;
            record.pants = pants;
        }
        recordTeamScoreSnapshot(parser);
    }

    function applyStuffTextCommand(parser, rawText) {
        String(rawText || '').split(/[\r\n]+/).forEach(function (line) {
            const text = line.trim();
            if (!text.startsWith('//')) {
                return;
            }
            const tokens = tokenizeStuffTextCommand(text);
            if (!tokens.length) {
                return;
            }
            const command = tokens[0].slice(2).toLowerCase();
            if (command === 'fullserverinfo') {
                parser.runtime.serverInfo = parseInfoString(tokens[1] || '');
                return;
            }
            if (command === 'svi') {
                if (tokens.length >= 3) {
                    parser.runtime.serverInfo[tokens[1]] = tokens[2];
                }
                return;
            }
            if (command === 'fui') {
                const slot = Number.parseInt(tokens[1], 10);
                if (Number.isInteger(slot) && slot >= 0) {
                    parser.runtime.playerUserInfo[slot] = parseInfoString(tokens[2] || '');
                    syncPlayerUserInfo(parser, slot);
                }
                return;
            }
            if (command === 'ui') {
                const slot = Number.parseInt(tokens[1], 10);
                if (Number.isInteger(slot) && slot >= 0 && tokens.length >= 3) {
                    if (!parser.runtime.playerUserInfo[slot]) {
                        parser.runtime.playerUserInfo[slot] = Object.create(null);
                    }
                    parser.runtime.playerUserInfo[slot][tokens[2]] = tokens.length >= 4 ? tokens[3] : '';
                    syncPlayerUserInfo(parser, slot);
                }
            }
        });
    }

    function normalizeAngle(angle) {
        if (!Number.isFinite(angle)) {
            return 0;
        }
        let value = angle % 360;
        if (value < 0) {
            value += 360;
        }
        return value;
    }

    function isPowerOfTwo(value) {
        return value > 0 && (value & (value - 1)) === 0;
    }

    function normalizeWeaponValue(rawValue) {
        const value = Number(rawValue) || 0;
        if (!value) {
            return 0;
        }
        if (WEAPON_NAMES.has(value) || isPowerOfTwo(value)) {
            return value;
        }
        if (value >= 0 && value <= 31) {
            return (1 << value) >>> 0;
        }
        return value >>> 0;
    }

    function weaponName(value) {
        return WEAPON_NAMES.get(value) || (value ? 'Raw ' + value : 'Unknown');
    }

    function entityState() {
        return {
            origin: [0, 0, 0],
            angles: [0, 0, 0],
            modelindex: 0,
            frame: 0,
            effects: 0,
            colormap: 0,
            skin: 0,
            scale: 16,
            pmovetype: 0,
            traileffectnum: 0,
            emiteffectnum: 0,
            velocity: [0, 0, 0],
            eflags: 0,
            tagindex: 0,
            tagentity: 0,
            colormod: [0, 0, 0],
            glowmod: [0, 0, 0],
            alpha: 0,
            solidsize: 0
        };
    }

    function cloneEntityState(source) {
        return {
            origin: source.origin.slice(),
            angles: source.angles.slice(),
            modelindex: source.modelindex,
            frame: source.frame,
            effects: source.effects,
            colormap: source.colormap,
            skin: source.skin,
            scale: source.scale,
            pmovetype: source.pmovetype,
            traileffectnum: source.traileffectnum,
            emiteffectnum: source.emiteffectnum,
            velocity: source.velocity.slice(),
            eflags: source.eflags,
            tagindex: source.tagindex,
            tagentity: source.tagentity,
            colormod: source.colormod.slice(),
            glowmod: source.glowmod.slice(),
            alpha: source.alpha,
            solidsize: source.solidsize
        };
    }

    function ByteReader(bytes) {
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        this.offset = 0;
    }

    ByteReader.prototype.remaining = function () {
        return this.bytes.length - this.offset;
    };

    ByteReader.prototype.ensure = function (count, label) {
        if (this.offset + count > this.bytes.length) {
            throw new Error('Unexpected end of message while reading ' + label + '.');
        }
    };

    ByteReader.prototype.readUint8 = function () {
        this.ensure(1, 'byte');
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    };

    ByteReader.prototype.readInt8 = function () {
        this.ensure(1, 'signed byte');
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    };

    ByteReader.prototype.readUint16 = function () {
        this.ensure(2, 'short');
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    };

    ByteReader.prototype.readInt16 = function () {
        this.ensure(2, 'signed short');
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    };

    ByteReader.prototype.readUint32 = function () {
        this.ensure(4, 'long');
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value >>> 0;
    };

    ByteReader.prototype.readInt32 = function () {
        this.ensure(4, 'signed long');
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    };

    ByteReader.prototype.readFloat32 = function () {
        this.ensure(4, 'float');
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    };

    ByteReader.prototype.readBigUint64 = function () {
        this.ensure(8, 'uint64');
        let value;
        if (typeof this.view.getBigUint64 === 'function') {
            value = this.view.getBigUint64(this.offset, true);
        } else {
            const low = BigInt(this.view.getUint32(this.offset, true));
            const high = BigInt(this.view.getUint32(this.offset + 4, true));
            value = low | (high << 32n);
        }
        this.offset += 8;
        return value;
    };

    ByteReader.prototype.readVarUint64 = function () {
        let value = this.readUint8();
        let mask = 0x80;
        let extraBytes = 0;
        while ((value & mask) !== 0 && mask !== 0) {
            value -= mask;
            extraBytes += 1;
            mask >>= 1;
        }
        let result = BigInt(value) << BigInt(extraBytes * 8);
        while (extraBytes > 0) {
            extraBytes -= 1;
            result |= BigInt(this.readUint8()) << BigInt(extraBytes * 8);
        }
        return result;
    };

    ByteReader.prototype.readBytes = function (count) {
        this.ensure(count, 'byte array');
        const slice = this.bytes.subarray(this.offset, this.offset + count);
        this.offset += count;
        return slice;
    };

    ByteReader.prototype.readString = function () {
        const start = this.offset;
        while (this.offset < this.bytes.length && this.bytes[this.offset] !== 0) {
            this.offset += 1;
        }
        if (this.offset >= this.bytes.length) {
            throw new Error('Unexpected end of message while reading string.');
        }
        const text = decodeBytes(this.bytes.subarray(start, this.offset));
        this.offset += 1;
        return text;
    };

    function readHeaderLine(reader) {
        const start = reader.offset;
        while (reader.offset < reader.bytes.length && reader.bytes[reader.offset] !== 10) {
            reader.offset += 1;
        }
        const end = reader.offset;
        if (reader.offset < reader.bytes.length && reader.bytes[reader.offset] === 10) {
            reader.offset += 1;
        }
        return decodeBytes(reader.bytes.subarray(start, end)).replace(/\r$/, '');
    }

    function ByteWriter() {
        this.bytes = [];
    }

    Object.defineProperty(ByteWriter.prototype, 'length', {
        get: function () {
            return this.bytes.length;
        }
    });

    ByteWriter.prototype.byte = function (value) {
        this.bytes.push(value & 0xff);
    };

    ByteWriter.prototype.short = function (value) {
        const normalized = value & 0xffff;
        this.bytes.push(normalized & 0xff, (normalized >>> 8) & 0xff);
    };

    ByteWriter.prototype.long = function (value) {
        const normalized = value >>> 0;
        this.bytes.push(
            normalized & 0xff,
            (normalized >>> 8) & 0xff,
            (normalized >>> 16) & 0xff,
            (normalized >>> 24) & 0xff
        );
    };

    ByteWriter.prototype.float = function (value) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, Number.isFinite(value) ? value : 0, true);
        for (let index = 0; index < 4; index += 1) {
            this.bytes.push(view.getUint8(index));
        }
    };

    ByteWriter.prototype.string = function (value) {
        const text = String(value || '');
        for (let index = 0; index < text.length; index += 1) {
            this.bytes.push(text.charCodeAt(index) & 0xff);
        }
        this.bytes.push(0);
    };

    ByteWriter.prototype.raw = function (bytes) {
        for (let index = 0; index < bytes.length; index += 1) {
            this.bytes.push(bytes[index] & 0xff);
        }
    };

    ByteWriter.prototype.finish = function () {
        return Uint8Array.from(this.bytes);
    };

    function concatByteChunks(chunks) {
        let totalLength = 0;
        chunks.forEach(function (chunk) {
            totalLength += chunk.length;
        });
        const output = new Uint8Array(totalLength);
        let offset = 0;
        chunks.forEach(function (chunk) {
            output.set(chunk, offset);
            offset += chunk.length;
        });
        return output;
    }

    function encodeDemoMessage(payloadBytes, viewAngles) {
        const writer = new ByteWriter();
        writer.long(payloadBytes.length);
        writer.float(viewAngles[0] || 0);
        writer.float(viewAngles[1] || 0);
        writer.float(viewAngles[2] || 0);
        writer.raw(payloadBytes);
        return writer.finish();
    }

    function scanDemoFrames(bytes) {
        const reader = new ByteReader(bytes);
        const trackLine = readHeaderLine(reader);
        const headerEnd = reader.offset;
        const frames = [];
        let trailingBytes = 0;

        while (reader.remaining() > 0) {
            if (reader.remaining() < 16) {
                trailingBytes = reader.remaining();
                break;
            }

            const messageOffset = reader.offset;
            const messageLength = reader.readInt32();
            const viewAngles = [
                reader.readFloat32(),
                reader.readFloat32(),
                reader.readFloat32()
            ];

            if (messageLength < 0) {
                throw new Error('Encountered a negative demo message length.');
            }
            if (messageLength > MAX_MSGLEN) {
                throw new Error('Demo message length exceeded MAX_MSGLEN.');
            }
            if (reader.remaining() < messageLength) {
                throw new Error('Demo frame payload was truncated.');
            }

            const payloadOffset = reader.offset;
            reader.offset += messageLength;

            frames.push({
                index: frames.length + 1,
                messageOffset: messageOffset,
                payloadOffset: payloadOffset,
                endOffset: reader.offset,
                payloadLength: messageLength,
                viewAngles: viewAngles,
                payload: bytes.subarray(payloadOffset, payloadOffset + messageLength)
            });
        }

        return {
            trackLine: trackLine,
            headerBytes: bytes.subarray(0, headerEnd),
            frames: frames,
            trailingBytes: trailingBytes
        };
    }

    function hasFlag(mask, flag) {
        return (mask & flag) === flag;
    }

    function hasBigFlag(mask, flag) {
        return (mask & flag) === flag;
    }

    function readCoord16(reader) {
        return reader.readInt16() * (1 / 8);
    }

    function readCoord24(reader) {
        return reader.readInt16() + reader.readUint8() * (1 / 255);
    }

    function readCoord(reader, protocolFlags) {
        if (hasFlag(protocolFlags, PRFL_FLOATCOORD)) {
            return reader.readFloat32();
        }
        if (hasFlag(protocolFlags, PRFL_INT32COORD)) {
            return reader.readInt32() * (1 / 16);
        }
        if (hasFlag(protocolFlags, PRFL_24BITCOORD)) {
            return readCoord24(reader);
        }
        return readCoord16(reader);
    }

    function readAngle(reader, protocolFlags) {
        if (hasFlag(protocolFlags, PRFL_FLOATANGLE)) {
            return normalizeAngle(reader.readFloat32());
        }
        if (hasFlag(protocolFlags, PRFL_SHORTANGLE)) {
            return normalizeAngle(reader.readInt16() * (360 / 65536));
        }
        return normalizeAngle(reader.readInt8() * (360 / 256));
    }

    function readAngle16(reader, protocolFlags) {
        if (hasFlag(protocolFlags, PRFL_FLOATANGLE)) {
            return normalizeAngle(reader.readFloat32());
        }
        return normalizeAngle(reader.readInt16() * (360 / 65536));
    }

    function readEntityIndex(reader, pext2) {
        let value = reader.readUint16();
        if ((pext2 & PEXT2_REPLACEMENTDELTAS) && (value & 0x8000)) {
            value = ((value & 0x7fff) << 8) | reader.readUint8();
        }
        return value >>> 0;
    }

    function readSize16(reader) {
        const ssolid = reader.readUint16();
        if (ssolid === 31) {
            return ssolid;
        }
        let solid = ((((ssolid >> 7) & 0x1f8) - 32 + 32768) << 16) >>> 0;
        solid |= ((ssolid & 0x1f) << 3);
        solid |= ((ssolid & 0x3e0) << 6);
        return solid >>> 0;
    }

    function ensureEntity(parser, entityNumber) {
        if (!parser.runtime.entities[entityNumber]) {
            parser.runtime.entities[entityNumber] = {
                baseline: entityState(),
                state: entityState(),
                active: false,
                lastTime: null
            };
        }
        return parser.runtime.entities[entityNumber];
    }

    function ensurePlayerRecord(parser, slot) {
        const key = 'slot:' + slot;
        if (!parser.playersByKey.has(key)) {
            parser.playersByKey.set(key, {
                key: key,
                slot: slot,
                entityNumber: slot + 1,
                names: [],
                name: '',
                nameCodes: [],
                shirt: null,
                pants: null,
                frags: 0,
                maxFrags: 0,
                minFrags: 0,
                chatCount: 0,
                chats: [],
                samples: [],
                isPov: false,
                seen: false
            });
        }
        return parser.playersByKey.get(key);
    }

    function findSpeakerRecord(parser, speakerName) {
        const cleanName = dequakeName(speakerName).trim();
        const normalized = cleanName.toLowerCase();
        for (let slot = 0; slot < parser.runtime.players.length; slot += 1) {
            const runtimePlayer = parser.runtime.players[slot];
            if (!runtimePlayer || !runtimePlayer.name) {
                continue;
            }
            if (dequakeName(runtimePlayer.name).trim().toLowerCase() === normalized) {
                return ensurePlayerRecord(parser, slot);
            }
        }
        const key = 'name:' + normalized;
        return parser.playersByKey.get(key) || null;
    }

    function ensureSpeakerRecord(parser, speakerName) {
        const cleanName = dequakeName(speakerName).trim();
        const normalized = cleanName.toLowerCase();
        const existing = findSpeakerRecord(parser, speakerName);
        if (existing) {
            return existing;
        }

        const key = 'name:' + normalized;
        if (!parser.playersByKey.has(key)) {
            parser.playersByKey.set(key, {
                key: key,
                slot: null,
                entityNumber: null,
                names: cleanName ? [cleanName] : [],
                name: cleanName,
                nameCodes: quakeBytesFromString(speakerName),
                shirt: null,
                pants: null,
                frags: 0,
                maxFrags: 0,
                minFrags: 0,
                chatCount: 0,
                chats: [],
                samples: [],
                isPov: false,
                seen: false
            });
        }
        return parser.playersByKey.get(key);
    }

    function addAlias(record, name) {
        const cleanName = dequakeName(name).trim();
        const nameCodes = quakeBytesFromString(name);
        if (!cleanName) {
            return;
        }
        if (!record.names.includes(cleanName)) {
            record.names.push(cleanName);
        }
        record.name = cleanName;
        record.nameCodes = nameCodes;
        record.seen = true;
    }

    function beginSegment(parser, protocolLabel, levelName, mapName) {
        if (parser.currentSegment) {
            finalizeSegment(parser);
        }
        parser.currentSegment = {
            index: parser.mapSegments.length,
            protocol: protocolLabel,
            levelName: levelName || '',
            mapName: mapName || '',
            startFrame: parser.frameCount + 1,
            startTime: null,
            endFrame: null,
            endTime: null,
            povStats: null
        };
        parser.mapSegments.push(parser.currentSegment);
    }

    function currentPovStats(parser) {
        return {
            kills: parser.runtime.statsInt[STAT.MONSTERS] || 0,
            totalMonsters: parser.runtime.statsInt[STAT.TOTALMONSTERS] || 0,
            secrets: parser.runtime.statsInt[STAT.SECRETS] || 0,
            totalSecrets: parser.runtime.statsInt[STAT.TOTALSECRETS] || 0,
            health: parser.runtime.statsInt[STAT.HEALTH] || 0,
            armor: parser.runtime.statsInt[STAT.ARMOR] || 0
        };
    }

    function finalizeSegment(parser) {
        if (!parser.currentSegment) {
            return;
        }
        parser.currentSegment.endFrame = parser.frameCount;
        if (parser.currentSegment.startTime !== null && parser.currentSegment.endTime === null) {
            parser.currentSegment.endTime = parser.runtime.time;
        }
        parser.currentSegment.povStats = currentPovStats(parser);
        parser.currentSegment = null;
    }

    function protocolName(protocol, pext2) {
        let base;
        switch (protocol) {
        case PROTOCOL_NETQUAKE:
            base = '15';
            break;
        case PROTOCOL_FITZQUAKE:
            base = '666';
            break;
        case PROTOCOL_RMQ:
            base = '999';
            break;
        case PROTOCOL_VERSION_DP7:
            base = '3504';
            break;
        case PROTOCOL_VERSION_BJP3:
            base = '10002';
            break;
        default:
            base = String(protocol);
            break;
        }
        if (pext2) {
            return base + '+fte';
        }
        return base;
    }

    function updatePlayerMovement(parser, entityNumber, state, discontinuous) {
        const slot = entityNumber - 1;
        if (slot < 0 || slot >= parser.runtime.players.length) {
            return;
        }
        const player = ensurePlayerRecord(parser, slot);
        player.seen = true;
        const sample = {
            time: parser.runtime.time,
            origin: state.origin.slice(),
            angles: state.angles.slice(),
            discontinuous: !!discontinuous
        };
        const lastSample = player.samples[player.samples.length - 1];
        if (lastSample &&
            Math.abs(lastSample.time - sample.time) < 1e-6 &&
            lastSample.origin[0] === sample.origin[0] &&
            lastSample.origin[1] === sample.origin[1] &&
            lastSample.origin[2] === sample.origin[2]) {
            return;
        }
        player.samples.push(sample);
    }

    function segmentDistance3d(previous, current) {
        const dx = current.origin[0] - previous.origin[0];
        const dy = current.origin[1] - previous.origin[1];
        const dz = current.origin[2] - previous.origin[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function segmentDistance2d(previous, current) {
        const dx = current.origin[0] - previous.origin[0];
        const dy = current.origin[1] - previous.origin[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function shouldIgnoreMovementSegment(previous, current, segmentDistance, dt) {
        if (!previous || !current) {
            return true;
        }
        if (current.discontinuous) {
            return true;
        }
        if (!(dt > 0)) {
            return false;
        }
        return segmentDistance >= MOVEMENT_DISCONTINUITY_DISTANCE &&
            (segmentDistance / dt) >= MOVEMENT_DISCONTINUITY_SPEED;
    }

    function recordChat(parser, rawText, source) {
        const original = String(rawText || '');
        const hadChatPrefix = /^[\u0001\u0002]/.test(original);
        const clean = stripQuakeFormatting(original).trim();
        if (!clean) {
            return false;
        }

        const patterns = [
            { regex: /^dm\s+\[(.+?)\]:\s*(.*)$/i, team: false },
            { regex: /^\((.+?)\):\s*(.*)$/, team: true },
            { regex: /^(.+?):\s*(.*)$/, team: false }
        ];

        for (let index = 0; index < patterns.length; index += 1) {
            const pattern = patterns[index];
            const match = pattern.regex.exec(clean);
            if (!match) {
                continue;
            }
            const speaker = stripQuakeFormatting(match[1]).trim();
            const message = match[2].trim();
            if (!speaker || !message) {
                continue;
            }
            if (!hadChatPrefix && /^-?\d+(?::-?\d+)+$/.test(message)) {
                continue;
            }
            let record = findSpeakerRecord(parser, speaker);
            if (!hadChatPrefix && (!record || record.slot === null)) {
                return false;
            }
            if (!record) {
                record = ensureSpeakerRecord(parser, speaker);
            }
            const entry = {
                time: parser.runtime.time,
                frame: parser.frameCount + 1,
                speaker: record.name || speaker,
                speakerKey: record.key,
                team: pattern.team,
                message: message,
                source: source
            };
            parser.chatLog.push(entry);
            record.chatCount += 1;
            record.chats.push(entry);
            return true;
        }

        return false;
    }

    function flushPrintBuffer(parser, source) {
        const buffer = parser.printBuffer[source];
        if (!buffer || !buffer.text) {
            return;
        }

        const text = buffer.text;
        const clean = stripQuakeFormatting(text);
        if (!clean.trim()) {
            buffer.text = '';
            buffer.time = parser.runtime.time;
            buffer.frame = parser.frameCount + 1;
            return;
        }

        if (!recordChat(parser, text, source)) {
            parser.printLog.push({
                time: buffer.time,
                frame: buffer.frame,
                source: source,
                text: clean.trimEnd()
            });
        }
        buffer.text = '';
        buffer.time = parser.runtime.time;
        buffer.frame = parser.frameCount + 1;
    }

    function recordPrint(parser, text, source) {
        const fragment = String(text || '');
        let buffer = parser.printBuffer[source];
        if (!buffer) {
            buffer = {
                text: '',
                time: parser.runtime.time,
                frame: parser.frameCount + 1
            };
            parser.printBuffer[source] = buffer;
        }

        if (!buffer.text) {
            buffer.time = parser.runtime.time;
            buffer.frame = parser.frameCount + 1;
        }
        if (buffer.text && (buffer.time !== parser.runtime.time || buffer.frame !== parser.frameCount + 1)) {
            flushPrintBuffer(parser, source);
            buffer.time = parser.runtime.time;
            buffer.frame = parser.frameCount + 1;
        }

        fragment.split(/(\r\n|\n|\r)/).forEach(function (part) {
            if (!part) {
                return;
            }

            if (part === '\r' || part === '\n' || part === '\r\n') {
                flushPrintBuffer(parser, source);
                return;
            }

            buffer.text += part;
        });
    }

    function appendWarning(parser, warning) {
        if (!parser.warnings.includes(warning)) {
            parser.warnings.push(warning);
        }
    }

    function markSmoothingUnsupported(parser, reason) {
        if (!parser || !reason) {
            return;
        }
        if (parser.smoothingSupport && !parser.smoothingSupport.unsupportedReason) {
            parser.smoothingSupport.unsupportedReason = reason;
        }
        if (parser.smoothing && !parser.smoothing.unsupportedReason) {
            parser.smoothing.unsupportedReason = reason;
        }
    }

    function superimposeUnsupportedReason(protocol, protocolFlags, pext1, pext2) {
        if (pext1 || pext2) {
            return 'Demsuperimpose export currently supports classic protocol 15, 666, and 999 demos without FTE extensions.';
        }
        if (!trimProtocolSupported(protocol)) {
            return 'Demsuperimpose export currently supports classic protocol 15, 666, and 999 demos only.';
        }
        if ((protocolFlags & (PRFL_FLOATCOORD | PRFL_INT32COORD | PRFL_24BITCOORD)) !== 0) {
            return 'Demsuperimpose export currently supports classic short-coordinate demos only.';
        }
        return '';
    }

    function smoothingUnsupportedReason(protocol, protocolFlags, pext1, pext2) {
        if (!trimProtocolSupported(protocol)) {
            return 'Demsmooth export currently supports protocol 15, 666, and 999 demos only.';
        }
        if (pext2 & PEXT2_SETANGLEDELTA) {
            return 'Demsmooth export does not currently support FTE setangle-delta demos.';
        }
        if ((pext2 & ~SMOOTH_SUPPORTED_PEXT2) !== 0) {
            return 'Demsmooth export does not currently support one or more FTE PEXT2 extensions used by this demo.';
        }
        return '';
    }

    function recordSuperimposeMaxEntity(parser, entityNumber) {
        if (!parser || !parser.superimpose || !Number.isFinite(entityNumber) || entityNumber < 0) {
            return;
        }
        parser.superimpose.maxEntityId = Math.max(parser.superimpose.maxEntityId, entityNumber);
    }

    function beginSuperimposeSegment(parser) {
        if (!parser || !parser.superimpose) {
            return;
        }

        const segment = {
            index: parser.superimpose.segments.length,
            protocol: parser.runtime.protocol,
            protocolLabel: protocolName(parser.runtime.protocol, parser.runtime.protocolPext2),
            protocolFlags: parser.runtime.protocolFlags >>> 0,
            protocolPext1: parser.runtime.protocolPext1 >>> 0,
            protocolPext2: parser.runtime.protocolPext2 >>> 0,
            levelName: parser.runtime.levelName || '',
            mapName: stripPathExtension(parser.runtime.modelPrecache[1] || ''),
            worldModel: parser.runtime.modelPrecache[1] || '',
            models: parser.runtime.modelPrecache.slice(),
            maxClients: parser.runtime.maxClients || 0,
            viewEntity: parser.runtime.viewEntity || 1,
            name: '',
            color: 0,
            baseline: null,
            updates: [],
            unsupportedReason: superimposeUnsupportedReason(
                parser.runtime.protocol,
                parser.runtime.protocolFlags,
                parser.runtime.protocolPext1,
                parser.runtime.protocolPext2
            )
        };

        parser.superimpose.currentSegment = segment;
        parser.superimpose.segments.push(segment);
    }

    function captureSuperimposeName(parser, slot, name) {
        if (!parser || !parser.superimpose || !parser.superimpose.currentSegment) {
            return;
        }
        if (parser.superimpose.currentSegment.viewEntity === slot + 1) {
            parser.superimpose.currentSegment.name = name || '';
        }
    }

    function captureSuperimposeColor(parser, slot, colors) {
        if (!parser || !parser.superimpose || !parser.superimpose.currentSegment) {
            return;
        }
        if (parser.superimpose.currentSegment.viewEntity === slot + 1) {
            parser.superimpose.currentSegment.color = colors & 0xff;
        }
    }

    function captureSuperimposeBaseline(parser, entityNumber, baseline) {
        if (!parser || !parser.superimpose || !parser.superimpose.currentSegment || !baseline) {
            return;
        }
        recordSuperimposeMaxEntity(parser, entityNumber);
        if (parser.superimpose.currentSegment.viewEntity === entityNumber) {
            parser.superimpose.currentSegment.baseline = cloneEntityState(baseline);
        }
    }

    function captureSuperimposeUpdate(parser, entityNumber, state) {
        if (!parser || !parser.superimpose || !parser.superimpose.currentSegment || !state) {
            return;
        }
        recordSuperimposeMaxEntity(parser, entityNumber);
        if (parser.superimpose.currentSegment.unsupportedReason) {
            return;
        }
        if (parser.superimpose.currentSegment.viewEntity !== entityNumber) {
            return;
        }
        if (!parser.frameContext || !parser.frameContext.payload.length || parser.frameContext.payload[0] !== SVC.TIME) {
            return;
        }
        parser.superimpose.currentSegment.updates.push({
            time: parser.runtime.time,
            state: cloneEntityState(state)
        });
    }

    function setLocalFlagSample(parser, onground, inwater) {
        const local = parser.localState;
        const time = parser.runtime.time;
        const sample = {
            time: time,
            onground: !!onground,
            inwater: !!inwater
        };
        const previous = local.movementFlags[local.movementFlags.length - 1];
        if (previous &&
            Math.abs(previous.time - sample.time) < 1e-6 &&
            previous.onground === sample.onground &&
            previous.inwater === sample.inwater) {
            return;
        }
        if (previous && previous.onground && !sample.onground) {
            local.estimatedJumps += 1;
        }
        local.movementFlags.push(sample);
    }

    function registerTimestamp(parser, time) {
        parser.runtime.time = time;
        parser.lastTimestamp = time;
        if (parser.smoothing && parser.smoothing.currentFrame) {
            parser.smoothing.currentFrame.timed = true;
        }
        if (parser.firstTimestamp === null) {
            parser.firstTimestamp = time;
        }
        if (parser.currentSegment) {
            if (parser.currentSegment.startTime === null) {
                parser.currentSegment.startTime = time;
            }
            parser.currentSegment.endTime = time;
        }
    }

    function accumulateWeaponTime(local, time) {
        if (!local.currentWeapon || !Number.isFinite(local.currentWeaponStart) || !Number.isFinite(time) || time < local.currentWeaponStart) {
            return;
        }
        const stats = local.weaponUsage.get(local.currentWeapon) || {
            weapon: local.currentWeapon,
            weaponName: weaponName(local.currentWeapon),
            switches: 0,
            activeTime: 0,
            ammoSpent: 0,
            estimatedShots: 0,
            unit: null
        };
        stats.activeTime += Math.max(0, time - local.currentWeaponStart);
        local.weaponUsage.set(local.currentWeapon, stats);
        local.currentWeaponStart = time;
    }

    function handleActiveWeaponChange(parser, rawValue) {
        const local = parser.localState;
        const value = normalizeWeaponValue(rawValue);
        const previous = local.currentWeapon;
        const time = parser.runtime.time;
        if (previous === value) {
            return;
        }
        if (previous) {
            accumulateWeaponTime(local, time);
        }
        local.currentWeapon = value;
        local.currentWeaponStart = time;
        if (!value) {
            return;
        }
        const stats = local.weaponUsage.get(value) || {
            weapon: value,
            weaponName: weaponName(value),
            switches: 0,
            activeTime: 0,
            ammoSpent: 0,
            estimatedShots: 0,
            unit: null
        };
        stats.switches += 1;
        const ammoInfo = WEAPON_AMMO.get(value);
        if (ammoInfo) {
            stats.unit = ammoInfo.unit;
        }
        local.weaponUsage.set(value, stats);
        local.weaponTimeline.push({
            time: time,
            weapon: value,
            weaponName: stats.weaponName
        });
    }

    function handleItemBits(parser, value) {
        const local = parser.localState;
        const next = value >>> 0;
        const previous = local.itemBits;
        local.itemBits = next;
        if (previous === null) {
            return;
        }

        const added = (next & (~previous >>> 0)) >>> 0;
        const removed = (previous & (~next >>> 0)) >>> 0;
        for (let index = 0; index < ITEM_FLAGS.length; index += 1) {
            const item = ITEM_FLAGS[index];
            const mask = item.mask >>> 0;
            if ((added & mask) === mask) {
                local.itemEvents.push({
                    time: parser.runtime.time,
                    type: 'acquired',
                    item: item.label,
                    group: item.group
                });
            }
            if ((removed & mask) === mask) {
                local.itemEvents.push({
                    time: parser.runtime.time,
                    type: 'lost',
                    item: item.label,
                    group: item.group
                });
            }
        }
    }

    function updateResourceEvent(local, stat, previous, value, time) {
        if (!Number.isFinite(previous)) {
            return;
        }
        const delta = value - previous;
        if (delta === 0) {
            return;
        }
        const labels = new Map([
            [STAT.HEALTH, 'Health'],
            [STAT.ARMOR, 'Armor'],
            [STAT.AMMO, 'Ammo'],
            [STAT.SHELLS, 'Shells'],
            [STAT.NAILS, 'Nails'],
            [STAT.ROCKETS, 'Rockets'],
            [STAT.CELLS, 'Cells']
        ]);
        if (!labels.has(stat)) {
            return;
        }
        local.resourceEvents.push({
            time: time,
            stat: stat,
            label: labels.get(stat),
            delta: delta,
            value: value
        });
    }

    function handleAmmoSpend(parser, stat, previous, value) {
        const local = parser.localState;
        if (!local.currentWeapon || !Number.isFinite(previous) || value >= previous) {
            return;
        }
        const ammoInfo = WEAPON_AMMO.get(local.currentWeapon);
        if (!ammoInfo || ammoInfo.stat !== stat) {
            return;
        }
        const spent = previous - value;
        const stats = local.weaponUsage.get(local.currentWeapon);
        if (!stats) {
            return;
        }
        stats.ammoSpent += spent;
        if (ammoInfo.cost > 0) {
            stats.estimatedShots += spent / ammoInfo.cost;
        }
    }

    function setStatInt(parser, stat, value) {
        if (stat < 0 || stat >= MAX_STATS) {
            appendWarning(parser, 'Encountered out-of-range stat ' + stat + '.');
            return;
        }
        const local = parser.localState;
        const previous = parser.runtime.statsInt[stat];
        const hadPrevious = local.statSeen[stat];
        parser.runtime.statsInt[stat] = value;
        parser.runtime.statsFloat[stat] = value;
        local.statSeen[stat] = true;

        if (stat === STAT.ITEMS) {
            handleItemBits(parser, value);
        } else if (stat === STAT.ACTIVEWEAPON) {
            handleActiveWeaponChange(parser, value);
        } else if (stat === STAT.HEALTH || stat === STAT.ARMOR || stat === STAT.AMMO || stat === STAT.SHELLS || stat === STAT.NAILS || stat === STAT.ROCKETS || stat === STAT.CELLS) {
            if (hadPrevious) {
                updateResourceEvent(local, stat, previous, value, parser.runtime.time);
            }
            if (stat !== STAT.HEALTH && stat !== STAT.ARMOR && hadPrevious) {
                handleAmmoSpend(parser, stat, previous, value);
            }
        }
    }

    function setStatFloat(parser, stat, value) {
        if (stat < 0 || stat >= MAX_STATS) {
            appendWarning(parser, 'Encountered out-of-range float stat ' + stat + '.');
            return;
        }
        parser.runtime.statsFloat[stat] = value;
    }

    function setStatString(parser, stat, value) {
        if (stat < 0 || stat >= MAX_STATS) {
            appendWarning(parser, 'Encountered out-of-range string stat ' + stat + '.');
            return;
        }
        parser.runtime.statsStrings[stat] = value;
    }

    function parseServerInfo(parser, reader) {
        if (parser.localState.currentWeapon) {
            accumulateWeaponTime(parser.localState, parser.runtime.time);
        }
        parser.runtime.protocolPext1 = 0;
        parser.runtime.protocolPext2 = 0;
        parser.runtime.protocolFlags = 0;
        parser.runtime.serverInfo = Object.create(null);
        parser.runtime.playerUserInfo = [];
        parser.runtime.entities = [];
        parser.runtime.players = [];
        parser.runtime.maxClients = 0;
        parser.runtime.viewEntity = 1;
        parser.runtime.serverGameDir = '';
        parser.runtime.skybox = '';
        parser.runtime.fogCommand = '';
        parser.runtime.lightstyles = new Array(MAX_LIGHTSTYLES).fill('');
        parser.runtime.staticEntities = [];
        parser.runtime.staticSounds = [];
        parser.localState.itemBits = null;
        parser.localState.currentWeapon = 0;
        parser.localState.currentWeaponStart = parser.runtime.time;
        parser.runtime.statsInt = new Array(MAX_STATS).fill(0);
        parser.runtime.statsFloat = new Array(MAX_STATS).fill(0);
        parser.runtime.statsStrings = new Array(MAX_STATS).fill(null);
        parser.localState.statSeen.fill(false);

        let protocol = null;
        while (true) {
            const value = reader.readInt32();
            if (value === PROTOCOL_FTE_PEXT1) {
                parser.runtime.protocolPext1 = reader.readUint32();
                continue;
            }
            if (value === PROTOCOL_FTE_PEXT2) {
                parser.runtime.protocolPext2 = reader.readUint32();
                continue;
            }
            protocol = value;
            break;
        }

        parser.runtime.protocol = protocol;
        if (protocol === PROTOCOL_RMQ) {
            parser.runtime.protocolFlags = reader.readUint32();
        } else if (protocol === PROTOCOL_VERSION_DP7) {
            parser.runtime.protocolFlags = (PRFL_SHORTANGLE | PRFL_FLOATCOORD) >>> 0;
        } else {
            parser.runtime.protocolFlags = 0;
        }

        if ((parser.runtime.protocolPext2 & PEXT2_PREDINFO) !== 0) {
            parser.runtime.serverGameDir = reader.readString();
        } else {
            parser.runtime.serverGameDir = '';
        }

        {
            const reason = smoothingUnsupportedReason(
                protocol,
                parser.runtime.protocolFlags,
                parser.runtime.protocolPext1,
                parser.runtime.protocolPext2
            );
            if (reason) {
                markSmoothingUnsupported(parser, reason);
            }
        }

        parser.runtime.maxClients = reader.readUint8();
        parser.runtime.gameType = reader.readUint8();
        parser.runtime.levelName = dequakeName(reader.readString()).trim();

        parser.runtime.modelPrecache = [null];
        while (true) {
            const modelName = reader.readString();
            if (!modelName) {
                break;
            }
            parser.runtime.modelPrecache.push(modelName);
            if (parser.runtime.modelPrecache.length > MAX_MODELS) {
                throw new Error('Server sent too many model precaches.');
            }
        }

        parser.runtime.soundPrecache = [null];
        while (true) {
            const soundName = reader.readString();
            if (!soundName) {
                break;
            }
            parser.runtime.soundPrecache.push(soundName);
            if (parser.runtime.soundPrecache.length > MAX_SOUNDS) {
                throw new Error('Server sent too many sound precaches.');
            }
        }

        for (let slot = 0; slot < parser.runtime.maxClients; slot += 1) {
            parser.runtime.players[slot] = {
                name: '',
                shirt: null,
                pants: null,
                frags: 0
            };
            ensurePlayerRecord(parser, slot);
        }

        const mapName = stripPathExtension(parser.runtime.modelPrecache[1] || '');
        beginSegment(
            parser,
            protocolName(parser.runtime.protocol, parser.runtime.protocolPext2),
            parser.runtime.levelName,
            mapName
        );
        parser.protocolsSeen.add(protocolName(parser.runtime.protocol, parser.runtime.protocolPext2));
        parser.mapsSeen.add(mapName || parser.runtime.levelName || 'unknown');
        beginSuperimposeSegment(parser);
    }

    function parseClassicBaseline(parser, reader, target, entityNumber, version) {
        if (version === 6) {
            target.baseline = cloneEntityState(readFteBaseline(parser, reader));
            captureSuperimposeBaseline(parser, entityNumber, target.baseline);
            return;
        }

        let bits;
        if (parser.runtime.protocol === PROTOCOL_VERSION_BJP3 && version === 1) {
            bits = B_LARGEMODEL;
        } else if (version === 7) {
            bits = B_LARGEMODEL | B_LARGEFRAME;
        } else if (version === 2) {
            bits = reader.readUint8();
        } else {
            bits = 0;
        }

        const baseline = entityState();
        baseline.modelindex = (bits & B_LARGEMODEL) ? reader.readUint16() : reader.readUint8();
        baseline.frame = (bits & B_LARGEFRAME) ? reader.readUint16() : reader.readUint8();
        baseline.colormap = reader.readUint8();
        baseline.skin = reader.readUint8();
        for (let axis = 0; axis < 3; axis += 1) {
            baseline.origin[axis] = readCoord(reader, parser.runtime.protocolFlags);
            baseline.angles[axis] = readAngle(reader, parser.runtime.protocolFlags);
        }
        if (bits & B_ALPHA) {
            baseline.alpha = reader.readUint8();
        }
        if (bits & B_SCALE) {
            baseline.scale = reader.readUint8();
        }
        target.baseline = baseline;
        captureSuperimposeBaseline(parser, entityNumber, target.baseline);
    }

    function parseClassicUpdate(parser, reader, firstBits) {
        let bits = firstBits;
        if (bits & U_MOREBITS) {
            bits |= reader.readUint8() << 8;
        }
        if (parser.runtime.protocol === PROTOCOL_FITZQUAKE || parser.runtime.protocol === PROTOCOL_RMQ) {
            if (bits & U_EXTEND1) {
                bits |= reader.readUint8() << 16;
            }
            if (bits & U_EXTEND2) {
                bits |= reader.readUint8() << 24;
            }
        }

        const entityNumber = (bits & U_LONGENTITY) ? reader.readUint16() : reader.readUint8();
        const target = ensureEntity(parser, entityNumber);
        const baseline = target.baseline || entityState();
        const state = cloneEntityState(baseline);
        const smoothingTrackEntity = !!(parser.smoothing && !parser.smoothing.unsupportedReason && entityNumber === parser.runtime.viewEntity);
        const smoothingLocation = smoothingTrackEntity ? {
            xOffset: null,
            yOffset: null,
            zOffset: null
        } : null;

        let modelindex;
        if (bits & U_MODEL) {
            modelindex = (parser.runtime.protocol === PROTOCOL_VERSION_BJP3) ? reader.readUint16() : reader.readUint8();
        } else {
            modelindex = baseline.modelindex;
        }
        state.modelindex = modelindex;

        if (bits & U_FRAME) {
            state.frame = reader.readUint8();
        }
        if (bits & U_COLORMAP) {
            state.colormap = reader.readUint8();
        }
        if (bits & U_SKIN) {
            state.skin = reader.readUint8();
        }
        if (bits & U_EFFECTS) {
            state.effects = reader.readUint8();
        }

        if (bits & U_ORIGIN1) {
            if (smoothingLocation) {
                smoothingLocation.xOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            state.origin[0] = readCoord(reader, parser.runtime.protocolFlags);
        }
        if (bits & U_ANGLE1) {
            state.angles[0] = readAngle(reader, parser.runtime.protocolFlags);
        }
        if (bits & U_ORIGIN2) {
            if (smoothingLocation) {
                smoothingLocation.yOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            state.origin[1] = readCoord(reader, parser.runtime.protocolFlags);
        }
        if (bits & U_ANGLE2) {
            state.angles[1] = readAngle(reader, parser.runtime.protocolFlags);
        }
        if (bits & U_ORIGIN3) {
            if (smoothingLocation) {
                smoothingLocation.zOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            state.origin[2] = readCoord(reader, parser.runtime.protocolFlags);
        }
        if (bits & U_ANGLE3) {
            state.angles[2] = readAngle(reader, parser.runtime.protocolFlags);
        }

        if (parser.runtime.protocol === PROTOCOL_FITZQUAKE || parser.runtime.protocol === PROTOCOL_RMQ) {
            if (bits & U_ALPHA) {
                state.alpha = reader.readUint8();
            }
            if (bits & U_SCALE) {
                state.scale = reader.readUint8();
            }
            if (bits & U_FRAME2) {
                state.frame = (state.frame & 0x00ff) | (reader.readUint8() << 8);
            }
            if (bits & U_MODEL2) {
                state.modelindex = (state.modelindex & 0x00ff) | (reader.readUint8() << 8);
            }
            if (bits & U_LERPFINISH) {
                reader.readUint8();
            }
        } else if (parser.runtime.protocol === PROTOCOL_NETQUAKE || parser.runtime.protocol === PROTOCOL_VERSION_BJP3) {
            if (bits & U_TRANS) {
                const transparencyMode = reader.readFloat32();
                state.alpha = encodeEntityAlpha(reader.readFloat32());
                if (transparencyMode === 2 && reader.readFloat32() >= 0.5) {
                    state.effects |= EF_FULLBRIGHT;
                }
                if (parser.runtime.protocol === PROTOCOL_NETQUAKE) {
                    appendWarning(parser, 'Encountered Nehahra-style transparency bits in a protocol 15 stream.');
                }
            }
        }

        const wasActive = target.active;
        target.state = state;
        target.active = true;
        target.lastTime = parser.runtime.time;
        updatePlayerMovement(parser, entityNumber, state, !wasActive);
        captureSuperimposeUpdate(parser, entityNumber, state);

        if (smoothingLocation && !parser.smoothing.unsupportedReason) {
            parser.smoothing.locations.push({
                x: state.origin[0],
                y: state.origin[1],
                z: state.origin[2],
                xOffset: smoothingLocation.xOffset,
                yOffset: smoothingLocation.yOffset,
                zOffset: smoothingLocation.zOffset,
                protocolFlags: parser.runtime.protocolFlags >>> 0
            });
        }
    }

    function readFteBaseline(parser, reader) {
        const baseline = entityState();
        readFteDelta(parser, reader, 0, baseline, baseline, entityState(), null);
        return baseline;
    }

    function readFteDelta(parser, reader, entityNumber, targetState, oldState, baselineState, smoothingLocation) {
        let bits = reader.readUint8();
        if (bits & UF_EXTEND1) {
            bits |= reader.readUint8() << 8;
        }
        if (bits & UF_EXTEND2) {
            bits |= reader.readUint8() << 16;
        }
        if (bits & UF_EXTEND3) {
            bits |= reader.readUint8() << 24;
        }

        if (bits & UF_RESET) {
            Object.assign(targetState, cloneEntityState(baselineState));
        } else if (oldState) {
            Object.assign(targetState, cloneEntityState(oldState));
        } else {
            Object.assign(targetState, entityState());
        }

        if (bits & UF_FRAME) {
            targetState.frame = (bits & UF_16BIT) ? reader.readUint16() : reader.readUint8();
        }
        if (bits & UF_ORIGINXY) {
            if (smoothingLocation) {
                smoothingLocation.xOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            targetState.origin[0] = readCoord(reader, parser.runtime.protocolFlags);
            if (smoothingLocation) {
                smoothingLocation.yOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            targetState.origin[1] = readCoord(reader, parser.runtime.protocolFlags);
        }
        if (bits & UF_ORIGINZ) {
            if (smoothingLocation) {
                smoothingLocation.zOffset = (parser.frameContext ? parser.frameContext.payloadOffset : 0) + reader.offset;
            }
            targetState.origin[2] = readCoord(reader, parser.runtime.protocolFlags);
        }
        if ((bits & UF_PREDINFO) && !(parser.runtime.protocolPext2 & PEXT2_PREDINFO)) {
            if (bits & UF_ANGLESXZ) {
                targetState.angles[0] = readAngle16(reader, parser.runtime.protocolFlags);
                targetState.angles[2] = readAngle16(reader, parser.runtime.protocolFlags);
            }
            if (bits & UF_ANGLESY) {
                targetState.angles[1] = readAngle16(reader, parser.runtime.protocolFlags);
            }
        } else {
            if (bits & UF_ANGLESXZ) {
                targetState.angles[0] = readAngle(reader, parser.runtime.protocolFlags);
                targetState.angles[2] = readAngle(reader, parser.runtime.protocolFlags);
            }
            if (bits & UF_ANGLESY) {
                targetState.angles[1] = readAngle(reader, parser.runtime.protocolFlags);
            }
        }

        if ((bits & (UF_EFFECTS | UF_EFFECTS2)) === (UF_EFFECTS | UF_EFFECTS2)) {
            targetState.effects = reader.readUint32();
        } else if (bits & UF_EFFECTS2) {
            targetState.effects = reader.readUint16();
        } else if (bits & UF_EFFECTS) {
            targetState.effects = reader.readUint8();
        }

        targetState.velocity[0] = 0;
        targetState.velocity[1] = 0;
        targetState.velocity[2] = 0;

        if (bits & UF_PREDINFO) {
            const predBits = reader.readUint8();
            if (predBits & UFP_FORWARD) {
                reader.readInt16();
            }
            if (predBits & UFP_SIDE) {
                reader.readInt16();
            }
            if (predBits & UFP_UP) {
                reader.readInt16();
            }
            if (predBits & UFP_MOVETYPE) {
                targetState.pmovetype = reader.readUint8();
            }
            if (predBits & UFP_VELOCITYXY) {
                targetState.velocity[0] = reader.readInt16();
                targetState.velocity[1] = reader.readInt16();
            }
            if (predBits & UFP_VELOCITYZ) {
                targetState.velocity[2] = reader.readInt16();
            }
            if (predBits & UFP_MSEC) {
                reader.readUint8();
            }
            if ((parser.runtime.protocolPext2 & PEXT2_PREDINFO) !== 0) {
                if (predBits & UFP_VIEWANGLE) {
                    if (bits & UF_ANGLESXZ) {
                        reader.readInt16();
                        reader.readInt16();
                    }
                    if (bits & UF_ANGLESY) {
                        reader.readInt16();
                    }
                }
            } else if (predBits & UFP_WEAPONFRAME_OLD) {
                let weaponFrame = reader.readUint8();
                if (weaponFrame & 0x80) {
                    weaponFrame = (weaponFrame & 0x7f) | (reader.readUint8() << 7);
                }
            }
        }

        if (bits & UF_MODEL) {
            targetState.modelindex = (bits & UF_16BIT) ? reader.readUint16() : reader.readUint8();
        }
        if (bits & UF_SKIN) {
            targetState.skin = (bits & UF_16BIT) ? reader.readUint16() : reader.readUint8();
        }
        if (bits & UF_COLORMAP) {
            targetState.colormap = reader.readUint8();
        }
        if (bits & UF_SOLID) {
            if (parser.runtime.protocolPext2 & PEXT2_NEWSIZEENCODING) {
                const encoding = reader.readUint8();
                if (encoding === 0) {
                    targetState.solidsize = 0;
                } else if (encoding === 1) {
                    targetState.solidsize = 31;
                } else if (encoding === 2) {
                    targetState.solidsize = 0x80201810;
                } else if (encoding === 3) {
                    targetState.solidsize = 0x80401820;
                } else if (encoding === 16) {
                    targetState.solidsize = readSize16(reader);
                } else if (encoding === 32) {
                    targetState.solidsize = reader.readUint32();
                } else {
                    throw new Error('Unknown FTE solid encoding ' + encoding + '.');
                }
            } else {
                targetState.solidsize = readSize16(reader);
            }
        }
        if (bits & UF_FLAGS) {
            targetState.eflags = reader.readUint8();
        }
        if (bits & UF_ALPHA) {
            targetState.alpha = (reader.readUint8() + 1) & 0xff;
        }
        if (bits & UF_SCALE) {
            targetState.scale = reader.readUint8();
        }
        if (bits & UF_BONEDATA) {
            const flags = reader.readUint8();
            if (flags & 0x80) {
                const boneCount = reader.readUint8();
                for (let index = 0; index < boneCount * 7; index += 1) {
                    reader.readInt16();
                }
            }
            if (flags & 0x40) {
                reader.readUint8();
                reader.readUint16();
            }
            if (flags & 0x3f) {
                throw new Error('Unsupported FTE bone delta flags in entity ' + entityNumber + '.');
            }
        }
        if (bits & UF_DRAWFLAGS) {
            const drawFlags = reader.readUint8();
            if ((drawFlags & 7) === 7) {
                reader.readUint8();
            }
        }
        if (bits & UF_TAGINFO) {
            targetState.tagentity = readEntityIndex(reader, parser.runtime.protocolPext2);
            targetState.tagindex = reader.readUint8();
        }
        if (bits & UF_LIGHT) {
            reader.readInt16();
            reader.readInt16();
            reader.readInt16();
            reader.readInt16();
            reader.readUint8();
            reader.readUint8();
        }
        if (bits & UF_TRAILEFFECT) {
            const effectValue = reader.readUint16();
            targetState.emiteffectnum = 0;
            targetState.traileffectnum = effectValue & 0x3fff;
            if (effectValue & 0x8000) {
                targetState.emiteffectnum = reader.readUint16() & 0x3fff;
            }
        }
        if (bits & UF_COLORMOD) {
            targetState.colormod[0] = reader.readUint8();
            targetState.colormod[1] = reader.readUint8();
            targetState.colormod[2] = reader.readUint8();
        }
        if (bits & UF_GLOW) {
            reader.readUint8();
            reader.readUint8();
            targetState.glowmod[0] = reader.readUint8();
            targetState.glowmod[1] = reader.readUint8();
            targetState.glowmod[2] = reader.readUint8();
        }
        if (bits & UF_FATNESS) {
            reader.readUint8();
        }
        if (bits & UF_MODELINDEX2) {
            if (bits & UF_16BIT) {
                reader.readUint16();
            } else {
                reader.readUint8();
            }
        }
        if (bits & UF_GRAVITYDIR) {
            reader.readUint8();
            reader.readUint8();
        }
        if (bits & UF_UNUSED2) {
            throw new Error('Encountered UF_UNUSED2 in entity delta ' + entityNumber + '.');
        }
        if (bits & UF_UNUSED1) {
            throw new Error('Encountered UF_UNUSED1 in entity delta ' + entityNumber + '.');
        }
    }

    function parseFteUpdateEntities(parser, reader) {
        if (parser.runtime.protocolPext2 & PEXT2_PREDINFO) {
            reader.readUint16();
        }
        registerTimestamp(parser, reader.readFloat32());

        while (reader.remaining() > 0) {
            let entityValue = reader.readUint16();
            const removeFlag = !!(entityValue & 0x8000);
            if (entityValue & 0x4000) {
                entityValue = (entityValue & 0x3fff) | (reader.readUint8() << 14);
            } else {
                entityValue &= ~0x8000;
            }
            if (!entityValue && !removeFlag) {
                break;
            }
            if (removeFlag) {
                if (entityValue === 0) {
                    parser.runtime.entities = [];
                    continue;
                }
                const target = ensureEntity(parser, entityValue);
                target.active = false;
                continue;
            }
            const target = ensureEntity(parser, entityValue);
            const wasActive = target.active;
            const nextState = entityState();
            const smoothingLocation = (parser.smoothing && !parser.smoothing.unsupportedReason && entityValue === parser.runtime.viewEntity) ? {
                xOffset: null,
                yOffset: null,
                zOffset: null
            } : null;
            readFteDelta(parser, reader, entityValue, nextState, target.active ? target.state : null, target.baseline || entityState(), smoothingLocation);
            target.state = nextState;
            target.active = true;
            target.lastTime = parser.runtime.time;
            updatePlayerMovement(parser, entityValue, nextState, !wasActive);
            if (smoothingLocation && !parser.smoothing.unsupportedReason) {
                parser.smoothing.locations.push({
                    x: nextState.origin[0],
                    y: nextState.origin[1],
                    z: nextState.origin[2],
                    xOffset: smoothingLocation.xOffset,
                    yOffset: smoothingLocation.yOffset,
                    zOffset: smoothingLocation.zOffset,
                    protocolFlags: parser.runtime.protocolFlags >>> 0
                });
            }
        }

        if ((parser.runtime.protocolPext2 & PEXT2_PREDINFO) && parser.runtime.viewEntity > 0) {
            const viewEntity = ensureEntity(parser, parser.runtime.viewEntity);
            if (viewEntity.active) {
                setLocalFlagSample(parser, !!(viewEntity.state.eflags & 128), false);
            }
        }
    }

    function parseClientData(parser, reader) {
        let bits = reader.readUint16();
        if (bits & SU_EXTEND1) {
            bits |= reader.readUint8() << 16;
        }
        if (bits & SU_EXTEND2) {
            bits |= reader.readUint8() << 24;
        }
        if (parser.runtime.protocol !== PROTOCOL_VERSION_DP7) {
            bits |= SU_ITEMS;
        }

        if (bits & SU_VIEWHEIGHT) {
            setStatInt(parser, STAT.VIEWHEIGHT, reader.readInt8());
        } else if (parser.runtime.protocol !== PROTOCOL_VERSION_DP7) {
            setStatInt(parser, STAT.VIEWHEIGHT, 22);
        }
        if (bits & SU_IDEALPITCH) {
            setStatInt(parser, STAT.IDEALPITCH, reader.readInt8());
        } else {
            setStatInt(parser, STAT.IDEALPITCH, 0);
        }

        for (let axis = 0; axis < 3; axis += 1) {
            if (bits & (SU_PUNCH1 << axis)) {
                if (parser.runtime.protocol === PROTOCOL_VERSION_DP7) {
                    readAngle(reader, PRFL_SHORTANGLE);
                } else {
                    reader.readInt8();
                }
            }
            if (parser.runtime.protocol === PROTOCOL_VERSION_DP7 && (bits & (DPSU_PUNCHVEC1 << axis))) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            if (bits & (SU_VELOCITY1 << axis)) {
                if (parser.runtime.protocol === PROTOCOL_VERSION_DP7) {
                    reader.readFloat32();
                } else {
                    reader.readInt8();
                }
            }
        }

        if (bits & SU_ITEMS) {
            setStatInt(parser, STAT.ITEMS, reader.readInt32());
        }

        parser.runtime.onground = (bits & SU_ONGROUND) !== 0;
        parser.runtime.inwater = (bits & SU_INWATER) !== 0;
        setLocalFlagSample(parser, parser.runtime.onground, parser.runtime.inwater);

        if (parser.runtime.protocol === PROTOCOL_VERSION_DP7) {
            return;
        }

        let weaponFrame = 0;
        let armorValue = 0;
        let weaponModel = 0;
        if (bits & SU_WEAPONFRAME) {
            weaponFrame = reader.readUint8();
        }
        if (bits & SU_ARMOR) {
            armorValue = reader.readUint8();
        }
        if (bits & SU_WEAPON) {
            weaponModel = (parser.runtime.protocol === PROTOCOL_VERSION_BJP3) ? reader.readUint16() : reader.readUint8();
        }

        const health = reader.readInt16();
        let ammo = reader.readUint8();
        const ammoValues = [
            reader.readUint8(),
            reader.readUint8(),
            reader.readUint8(),
            reader.readUint8()
        ];
        let activeWeapon = reader.readUint8();

        if (bits & SU_WEAPON2) {
            weaponModel |= reader.readUint8() << 8;
        }
        if (bits & SU_ARMOR2) {
            armorValue |= reader.readUint8() << 8;
        }
        if (bits & SU_AMMO2) {
            ammo |= reader.readUint8() << 8;
        }
        if (bits & SU_SHELLS2) {
            ammoValues[0] |= reader.readUint8() << 8;
        }
        if (bits & SU_NAILS2) {
            ammoValues[1] |= reader.readUint8() << 8;
        }
        if (bits & SU_ROCKETS2) {
            ammoValues[2] |= reader.readUint8() << 8;
        }
        if (bits & SU_CELLS2) {
            ammoValues[3] |= reader.readUint8() << 8;
        }
        if (bits & SU_WEAPONFRAME2) {
            weaponFrame |= reader.readUint8() << 8;
        }
        if (bits & SU_WEAPONALPHA) {
            reader.readUint8();
        }

        activeWeapon = normalizeWeaponValue(activeWeapon);

        setStatInt(parser, STAT.WEAPONFRAME, weaponFrame);
        setStatInt(parser, STAT.ARMOR, armorValue);
        setStatInt(parser, STAT.WEAPON, weaponModel);
        setStatInt(parser, STAT.ACTIVEWEAPON, activeWeapon);
        setStatInt(parser, STAT.HEALTH, health);
        setStatInt(parser, STAT.AMMO, ammo);
        setStatInt(parser, STAT.SHELLS, ammoValues[0]);
        setStatInt(parser, STAT.NAILS, ammoValues[1]);
        setStatInt(parser, STAT.ROCKETS, ammoValues[2]);
        setStatInt(parser, STAT.CELLS, ammoValues[3]);
    }

    function parseParticleEffect(parser, reader) {
        for (let axis = 0; axis < 3; axis += 1) {
            readCoord(reader, parser.runtime.protocolFlags);
        }
        for (let axis = 0; axis < 3; axis += 1) {
            reader.readInt8();
        }
        reader.readUint8();
        reader.readUint8();
    }

    function parseDamage(parser, reader) {
        reader.readUint8();
        reader.readUint8();
        for (let axis = 0; axis < 3; axis += 1) {
            readCoord(reader, parser.runtime.protocolFlags);
        }
    }

    function parseStartSoundPacket(parser, reader) {
        let fieldMask = BigInt(reader.readUint8());
        if (parser.runtime.protocol === PROTOCOL_VERSION_BJP3) {
            fieldMask |= SND_LARGESOUND;
        }
        if (hasBigFlag(fieldMask, SND_FTE_MOREFLAGS)) {
            fieldMask |= reader.readVarUint64() << 8n;
        }
        if (hasBigFlag(fieldMask, SND_VOLUME)) {
            reader.readUint8();
        } else {
            void DEFAULT_SOUND_PACKET_VOLUME;
        }
        if (hasBigFlag(fieldMask, SND_ATTENUATION)) {
            reader.readUint8();
        } else {
            void DEFAULT_SOUND_PACKET_ATTENUATION;
        }
        if (parser.runtime.protocolPext2 & PEXT2_REPLACEMENTDELTAS) {
            if (hasBigFlag(fieldMask, SND_FTE_PITCHADJ)) {
                reader.readUint8();
            }
            if (hasBigFlag(fieldMask, SND_FTE_TIMEOFS)) {
                reader.readInt16();
            }
            if (hasBigFlag(fieldMask, SND_FTE_VELOCITY)) {
                reader.readInt16();
                reader.readInt16();
                reader.readInt16();
            }
        }
        if (parser.runtime.protocol === PROTOCOL_VERSION_DP7 || (parser.runtime.protocolPext2 & PEXT2_REPLACEMENTDELTAS)) {
            if (hasBigFlag(fieldMask, SND_DP_PITCH)) {
                reader.readInt16();
            }
        }
        if (hasBigFlag(fieldMask, SND_LARGEENTITY)) {
            reader.readUint16();
            reader.readUint8();
        } else {
            reader.readUint16();
        }
        if (hasBigFlag(fieldMask, SND_LARGESOUND)) {
            reader.readUint16();
        } else {
            reader.readUint8();
        }
        for (let axis = 0; axis < 3; axis += 1) {
            readCoord(reader, parser.runtime.protocolFlags);
        }
    }

    function parseStaticSound(parser, reader, version) {
        const origin = [0, 0, 0];
        for (let axis = 0; axis < 3; axis += 1) {
            origin[axis] = readCoord(reader, parser.runtime.protocolFlags);
        }
        let soundIndex;
        if (version === 2) {
            soundIndex = reader.readUint16();
        } else {
            soundIndex = reader.readUint8();
        }
        const volume = reader.readUint8();
        const attenuation = reader.readUint8();
        parser.runtime.staticSounds.push({
            origin: origin,
            soundIndex: soundIndex,
            volume: volume,
            attenuation: attenuation
        });
    }

    function parseStaticEntity(parser, reader, version) {
        const target = { baseline: entityState() };
        parseClassicBaseline(parser, reader, target, -1, version);
        parser.runtime.staticEntities.push({
            baseline: cloneEntityState(target.baseline)
        });
    }

    function parseFteVoiceChat(parser, reader) {
        reader.readUint8();
        reader.readUint8();
        reader.readUint8();
        reader.readBytes(reader.readUint16());
        appendWarning(parser, 'Encountered FTE voice chat packets; ignored their payloads.');
    }

    function parseTempEntity(parser, reader) {
        const type = reader.readUint8();
        switch (type) {
        case TEMP_ENTITY.WIZSPIKE:
        case TEMP_ENTITY.KNIGHTSPIKE:
        case TEMP_ENTITY.SPIKE:
        case TEMP_ENTITY.SUPERSPIKE:
        case TEMP_ENTITY.GUNSHOT:
        case TEMP_ENTITY.EXPLOSION:
        case TEMP_ENTITY.TAREXPLOSION:
        case TEMP_ENTITY.LAVASPLASH:
        case TEMP_ENTITY.TELEPORT:
        case TEMP_ENTITY.DP_GUNSHOTQUAD:
        case TEMP_ENTITY.DP_SPIKEQUAD:
        case TEMP_ENTITY.DP_SUPERSPIKEQUAD:
        case TEMP_ENTITY.DP_EXPLOSIONQUAD:
        case TEMP_ENTITY.DP_SMALLFLASH:
        case TEMP_ENTITY.DP_PLASMABURN:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            break;

        case TEMP_ENTITY.FTE_GUNSHOT_COUNT:
            reader.readUint8();
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            break;

        case TEMP_ENTITY.EXPLOSION2:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint8();
            reader.readUint8();
            break;

        case TEMP_ENTITY.NEH_EXPLOSION3:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            readCoord(reader, parser.runtime.protocolFlags);
            readCoord(reader, parser.runtime.protocolFlags);
            readCoord(reader, parser.runtime.protocolFlags);
            break;

        case TEMP_ENTITY.LIGHTNING1:
        case TEMP_ENTITY.LIGHTNING2:
        case TEMP_ENTITY.LIGHTNING3:
        case TEMP_ENTITY.BEAM:
            readEntityIndex(reader, parser.runtime.protocolPext2);
            for (let axis = 0; axis < 6; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            break;

        case TEMP_ENTITY.NEH_LIGHTNING4:
            reader.readString();
            readEntityIndex(reader, parser.runtime.protocolPext2);
            for (let axis = 0; axis < 6; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            break;

        case TEMP_ENTITY.FTE_EXPLOSION_SPRITE:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            break;

        case TEMP_ENTITY.DP_CUSTOMFLASH:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint8();
            reader.readUint8();
            reader.readUint8();
            reader.readUint8();
            reader.readUint8();
            break;

        case TEMP_ENTITY.DP_PARTICLERAIN:
        case TEMP_ENTITY.DP_PARTICLESNOW:
            for (let axis = 0; axis < 9; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint16();
            reader.readUint8();
            break;

        case TEMP_ENTITY.DP_BLOOD:
        case TEMP_ENTITY.DP_SPARK:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readInt8();
            reader.readInt8();
            reader.readInt8();
            reader.readUint8();
            break;

        case TEMP_ENTITY.DP_BLOODSHOWER:
            for (let axis = 0; axis < 7; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint16();
            break;

        case TEMP_ENTITY.DP_EXPLOSIONRGB:
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint8();
            reader.readUint8();
            reader.readUint8();
            break;

        case TEMP_ENTITY.DP_PARTICLECUBE:
            for (let axis = 0; axis < 10; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint16();
            reader.readUint8();
            reader.readUint8();
            break;

        case TEMP_ENTITY.DP_FLAMEJET:
            for (let axis = 0; axis < 6; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint8();
            break;

        default:
            throw new Error('Unsupported temp entity type ' + type + '.');
        }
    }

    function parseEffect(parser, reader, big) {
        for (let axis = 0; axis < 3; axis += 1) {
            readCoord(reader, parser.runtime.protocolFlags);
        }
        if (big) {
            reader.readUint16();
            reader.readUint16();
        } else {
            reader.readUint8();
            reader.readUint8();
        }
        reader.readUint8();
        reader.readUint8();
    }

    function parsePrecache(parser, reader) {
        const code = reader.readUint16();
        const index = code & 0x3fff;
        const kind = (code >> 14) & 0x3;
        const name = reader.readString();
        if (kind === 0) {
            parser.runtime.modelPrecache[index] = name;
        } else if (kind === 2) {
            parser.runtime.soundPrecache[index] = name;
        }
    }

    function parseDpDownloadData(reader) {
        const start = reader.readInt32();
        const size = reader.readUint16();
        if (start < 0) {
            throw new Error('Encountered negative download offset in demo.');
        }
        reader.readBytes(size);
    }

    function parseParticles(parser, reader, type) {
        if (type < 0) {
            reader.readUint16();
            reader.readUint16();
            for (let axis = 0; axis < 6; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            return;
        }
        reader.readUint16();
        for (let axis = 0; axis < 3; axis += 1) {
            readCoord(reader, parser.runtime.protocolFlags);
        }
        if (type === 0) {
            for (let axis = 0; axis < 3; axis += 1) {
                readCoord(reader, parser.runtime.protocolFlags);
            }
            reader.readUint16();
        }
    }

    function parseFrame(parser, bytes, viewAngles) {
        const reader = new ByteReader(bytes);
        parser.runtime.frameViewAngles = viewAngles.slice();

        while (reader.remaining() > 0) {
            const command = reader.readUint8();
            if (command & U_SIGNAL) {
                parseClassicUpdate(parser, reader, command & 127);
                continue;
            }

            switch (command) {
            case SVC.NOP:
            case SVC.DISCONNECT:
            case SVC.SETPAUSE:
            case SVC.INTERMISSION:
            case SVC.SELLSCREEN:
            case SVC.BF:
            case SVC.KILLEDMONSTER:
            case SVC.FOUNDSECRET:
                if (command === SVC.SETPAUSE) {
                    reader.readUint8();
                } else if (command === SVC.KILLEDMONSTER) {
                    setStatInt(parser, STAT.MONSTERS, (parser.runtime.statsInt[STAT.MONSTERS] || 0) + 1);
                } else if (command === SVC.FOUNDSECRET) {
                    setStatInt(parser, STAT.SECRETS, (parser.runtime.statsInt[STAT.SECRETS] || 0) + 1);
                }
                break;

            case SVC.UPDATESTAT:
                setStatInt(parser, reader.readUint8(), reader.readInt32());
                break;

            case SVC.VERSION:
                parser.runtime.protocol = reader.readInt32();
                parser.protocolsSeen.add(protocolName(parser.runtime.protocol, parser.runtime.protocolPext2));
                break;

            case SVC.SETVIEW:
                parser.runtime.viewEntity = reader.readUint16();
                if (parser.runtime.viewEntity > 0 && parser.runtime.viewEntity - 1 < parser.runtime.players.length) {
                    ensurePlayerRecord(parser, parser.runtime.viewEntity - 1).isPov = true;
                }
                if (parser.superimpose && parser.superimpose.currentSegment) {
                    parser.superimpose.currentSegment.viewEntity = parser.runtime.viewEntity;
                }
                break;

            case SVC.SOUND:
                parseStartSoundPacket(parser, reader);
                break;

            case SVC.TIME:
                registerTimestamp(parser, reader.readFloat32());
                if (parser.runtime.protocolPext2 & PEXT2_PREDINFO) {
                    reader.readUint16();
                }
                break;

            case SVC.PRINT:
                recordPrint(parser, reader.readString(), 'print');
                break;

            case SVC.STUFFTEXT:
                {
                    const rawText = reader.readString();
                    parser.stuffTextLog.push({
                    time: parser.runtime.time,
                    frame: parser.frameCount + 1,
                    text: stripQuakeFormatting(rawText).trim()
                    });
                    applyStuffTextCommand(parser, rawText);
                    if (isFogStuffText(rawText)) {
                        parser.runtime.fogCommand = rawText;
                    }
                }
                break;

            case SVC.SETANGLE:
                readAngle(reader, parser.runtime.protocolFlags);
                readAngle(reader, parser.runtime.protocolFlags);
                readAngle(reader, parser.runtime.protocolFlags);
                break;

            case SVC.SERVERINFO:
                parseServerInfo(parser, reader);
                break;

            case SVC.LIGHTSTYLE:
                {
                    const styleIndex = reader.readUint8();
                    const styleValue = reader.readString();
                    if (styleIndex >= 0 && styleIndex < MAX_LIGHTSTYLES) {
                        parser.runtime.lightstyles[styleIndex] = styleValue;
                    }
                }
                break;

            case SVC.UPDATENAME: {
                const slot = reader.readUint8();
                const name = reader.readString();
                if (slot < parser.runtime.players.length) {
                    parser.runtime.players[slot].name = name;
                    addAlias(ensurePlayerRecord(parser, slot), name);
                    captureSuperimposeName(parser, slot, name);
                    recordTeamScoreSnapshot(parser);
                }
                break;
            }

            case SVC.UPDATEFRAGS: {
                const slot = reader.readUint8();
                const frags = reader.readInt16();
                if (slot < parser.runtime.players.length) {
                    parser.runtime.players[slot].frags = frags;
                    const record = ensurePlayerRecord(parser, slot);
                    record.frags = frags;
                    record.maxFrags = Math.max(record.maxFrags, frags);
                    record.minFrags = Math.min(record.minFrags, frags);
                    recordTeamScoreSnapshot(parser);
                }
                break;
            }

            case SVC.CLIENTDATA:
                parseClientData(parser, reader);
                break;

            case SVC.STOPSOUND:
                reader.readUint16();
                break;

            case SVC.UPDATECOLORS: {
                const slot = reader.readUint8();
                const colors = reader.readUint8();
                if (slot < parser.runtime.players.length) {
                    parser.runtime.players[slot].shirt = (colors >> 4) & 0x0f;
                    parser.runtime.players[slot].pants = colors & 0x0f;
                    const record = ensurePlayerRecord(parser, slot);
                    record.shirt = parser.runtime.players[slot].shirt;
                    record.pants = parser.runtime.players[slot].pants;
                    captureSuperimposeColor(parser, slot, colors);
                    recordTeamScoreSnapshot(parser);
                }
                break;
            }

            case SVC.PARTICLE:
                parseParticleEffect(parser, reader);
                break;

            case SVC.DAMAGE:
                parseDamage(parser, reader);
                break;

            case SVC.SPAWNSTATIC:
                parseStaticEntity(parser, reader, 1);
                break;

            case SVC.FTE_SPAWNSTATIC2_ALIAS:
                parseStaticEntity(parser, reader, 6);
                break;

            case SVC.SPAWNBASELINE: {
                const entityNumber = reader.readUint16();
                parseClassicBaseline(parser, reader, ensureEntity(parser, entityNumber), entityNumber, 1);
                break;
            }

            case SVC.TEMP_ENTITY:
                parseTempEntity(parser, reader);
                break;

            case SVC.SIGNONNUM:
                parser.runtime.signon = reader.readUint8();
                break;

            case SVC.CENTERPRINT:
                recordPrint(parser, reader.readString(), 'centerprint');
                break;

            case SVC.SPAWNSTATICSOUND:
                parseStaticSound(parser, reader, 1);
                break;

            case SVC.FINALE:
            case SVC.CUTSCENE:
                recordPrint(parser, reader.readString(), 'centerprint');
                break;

            case SVC.CDTRACK:
                reader.readUint8();
                reader.readUint8();
                break;

            case SVC.DP_SHOWPIC:
                reader.readString();
                reader.readString();
                reader.readUint8();
                reader.readUint8();
                break;

            case SVC.DP_HIDEPIC:
                reader.readString();
                break;

            case SVC.SKYBOX:
                parser.runtime.skybox = reader.readString();
                break;

            case SVC.FOG:
                reader.readUint8();
                reader.readUint8();
                reader.readUint8();
                reader.readUint8();
                reader.readInt16();
                break;

            case SVC.SPAWNBASELINE2: {
                const entityNumber = reader.readUint16();
                parseClassicBaseline(parser, reader, ensureEntity(parser, entityNumber), entityNumber, 2);
                break;
            }

            case SVC.SPAWNSTATIC2:
                parseStaticEntity(parser, reader, 2);
                break;

            case SVC.SPAWNSTATICSOUND2:
                parseStaticSound(parser, reader, 2);
                break;

            case SVC.DP_DOWNLOADDATA:
                parseDpDownloadData(reader);
                break;

            case SVC.DP_UPDATESTATBYTE:
                setStatInt(parser, reader.readUint8(), reader.readUint8());
                break;

            case SVC.DP_EFFECT:
                if (parser.runtime.protocol === PROTOCOL_VERSION_DP7) {
                    parseEffect(parser, reader, false);
                } else {
                    reader.readString();
                }
                break;

            case SVC.DP_EFFECT2:
                if (parser.runtime.protocol === PROTOCOL_VERSION_DP7) {
                    parseEffect(parser, reader, true);
                } else {
                    throw new Error('Encountered DP/QE message 53 in a non-DP7 demo; payload is ambiguous.');
                }
                break;

            case SVC.DP_PRECACHE:
                parsePrecache(parser, reader);
                break;

            case SVC.DP_SPAWNBASELINE2: {
                const entityNumber = reader.readUint16();
                parseClassicBaseline(parser, reader, ensureEntity(parser, entityNumber), entityNumber, 7);
                break;
            }

            case SVC.DP_SPAWNSTATIC2:
                parseStaticEntity(parser, reader, 7);
                break;

            case SVC.DP_ENTITIES:
                throw new Error('DP7 entity batches are not supported by this parser yet.');

            case SVC.DP_CSQCENTITIES:
                markSmoothingUnsupported(parser, 'Demsmooth export does not currently support CSQC entity payloads.');
                throw new Error('CSQC entity payloads are not supported in browser parsing.');

            case SVC.DP_SPAWNSTATICSOUND2:
                parseStaticSound(parser, reader, 2);
                break;

            case SVC.DP_TRAILPARTICLES:
                parseParticles(parser, reader, -1);
                break;

            case SVC.DP_POINTPARTICLES:
                parseParticles(parser, reader, 0);
                break;

            case SVC.DP_POINTPARTICLES1:
                parseParticles(parser, reader, 1);
                break;

            case SVC.FTE_SPAWNBASELINE2: {
                const entityNumber = readEntityIndex(reader, parser.runtime.protocolPext2);
                parseClassicBaseline(parser, reader, ensureEntity(parser, entityNumber), entityNumber, 6);
                break;
            }

            case SVC.FTE_UPDATESTATSTRING:
                setStatString(parser, reader.readUint8(), reader.readString());
                break;

            case SVC.FTE_UPDATESTATFLOAT:
                setStatFloat(parser, reader.readUint8(), reader.readFloat32());
                break;

            case SVC.FTE_CGAMEPACKET:
                markSmoothingUnsupported(parser, 'Demsmooth export does not currently support CSQC game packets.');
                if (parser.runtime.protocolPext1 & PEXT1_CSQC) {
                    throw new Error('CSQC game packets are not supported by this browser parser.');
                }
                throw new Error('Encountered unsupported FTE cgame packet.');

            case SVC.FTE_VOICECHAT:
                parseFteVoiceChat(parser, reader);
                break;

            case SVC.FTE_SETANGLEDELTA:
                markSmoothingUnsupported(parser, 'Demsmooth export does not currently support FTE setangle-delta packets.');
                readAngle16(reader, parser.runtime.protocolFlags);
                readAngle16(reader, parser.runtime.protocolFlags);
                readAngle16(reader, parser.runtime.protocolFlags);
                break;

            case SVC.FTE_UPDATEENTITIES:
                parseFteUpdateEntities(parser, reader);
                break;

            default:
                throw new Error('Unsupported server message ' + command + '.');
            }
        }
    }

    function summariseMovement(samples) {
        if (!samples.length) {
            return {
                trackedTime: 0,
                distance: 0,
                horizontalDistance: 0,
                maxSpeed: 0,
                averageSpeed: 0,
                minZ: null,
                maxZ: null,
                sampleCount: 0,
                filteredSegments: 0
            };
        }

        let distance = 0;
        let horizontalDistance = 0;
        let maxSpeed = 0;
        let minZ = samples[0].origin[2];
        let maxZ = samples[0].origin[2];
        let trackedTime = 0;
        let filteredSegments = 0;

        for (let index = 1; index < samples.length; index += 1) {
            const previous = samples[index - 1];
            const current = samples[index];
            const segmentDistance = segmentDistance3d(previous, current);
            const segmentHorizontal = segmentDistance2d(previous, current);
            const dt = current.time - previous.time;
            if (shouldIgnoreMovementSegment(previous, current, segmentDistance, dt)) {
                filteredSegments += 1;
                minZ = Math.min(minZ, current.origin[2]);
                maxZ = Math.max(maxZ, current.origin[2]);
                continue;
            }
            distance += segmentDistance;
            horizontalDistance += segmentHorizontal;
            minZ = Math.min(minZ, current.origin[2]);
            maxZ = Math.max(maxZ, current.origin[2]);
            if (dt > 0) {
                trackedTime += dt;
                maxSpeed = Math.max(maxSpeed, segmentDistance / dt);
            }
        }

        return {
            trackedTime: round(trackedTime, 3),
            distance: round(distance, 2),
            horizontalDistance: round(horizontalDistance, 2),
            maxSpeed: round(maxSpeed, 2),
            averageSpeed: round(trackedTime > 0 ? distance / trackedTime : 0, 2),
            minZ: round(minZ, 2),
            maxZ: round(maxZ, 2),
            sampleCount: samples.length,
            filteredSegments: filteredSegments
        };
    }

    function summariseLocalMovement(local) {
        const summary = {
            estimatedJumps: local.estimatedJumps,
            groundTime: 0,
            airTime: 0,
            waterTime: 0
        };
        for (let index = 1; index < local.movementFlags.length; index += 1) {
            const previous = local.movementFlags[index - 1];
            const current = local.movementFlags[index];
            const dt = Math.max(0, current.time - previous.time);
            if (previous.inwater) {
                summary.waterTime += dt;
            } else if (previous.onground) {
                summary.groundTime += dt;
            } else {
                summary.airTime += dt;
            }
        }
        summary.groundTime = round(summary.groundTime, 3);
        summary.airTime = round(summary.airTime, 3);
        summary.waterTime = round(summary.waterTime, 3);
        return summary;
    }

    function finaliseLocalState(parser) {
        if (parser.localState.currentWeapon) {
            accumulateWeaponTime(parser.localState, parser.runtime.time);
        }
        const usage = Array.from(parser.localState.weaponUsage.values())
            .sort(function (left, right) {
                return right.activeTime - left.activeTime;
            })
            .map(function (entry) {
                return {
                    weapon: entry.weapon,
                    weaponName: entry.weaponName,
                    switches: entry.switches,
                    activeTime: round(entry.activeTime, 3),
                    ammoSpent: round(entry.ammoSpent, 2),
                    estimatedShots: round(entry.estimatedShots, 2),
                    unit: entry.unit
                };
            });
        return {
            weaponUsage: usage,
            weaponTimeline: parser.localState.weaponTimeline.slice(),
            itemEvents: parser.localState.itemEvents.slice(),
            resourceEvents: parser.localState.resourceEvents.slice(),
            movement: summariseLocalMovement(parser.localState),
            finalStats: currentPovStats(parser)
        };
    }

    function normalizePlayerMergeName(name) {
        return String(name || '').trim().toLowerCase();
    }

    function mergePlayerRecord(target, source) {
        if (!target.name && source.name) {
            target.name = source.name;
        }
        if (!target.nameCodes.length && source.nameCodes.length) {
            target.nameCodes = source.nameCodes.slice();
        }
        source.names.forEach(function (name) {
            if (!target.names.includes(name)) {
                target.names.push(name);
            }
        });
        target.chatCount += source.chatCount;
        target.chats = target.chats.concat(source.chats);
        target.seen = target.seen || source.seen;
        target.isPov = target.isPov || source.isPov;
        target.maxFrags = Math.max(target.maxFrags, source.maxFrags);
        target.minFrags = Math.min(target.minFrags, source.minFrags);
    }

    function collectFinalPlayerRecords(parser) {
        const filtered = Array.from(parser.playersByKey.values()).filter(function (player) {
            return player.seen || player.chatCount > 0 || player.samples.length > 0 || player.frags !== 0;
        });
        const slottedByName = new Map();
        const output = [];

        filtered.forEach(function (player) {
            if (player.slot === null || player.slot === undefined) {
                return;
            }
            const normalized = normalizePlayerMergeName(player.name);
            if (!normalized) {
                return;
            }
            if (!slottedByName.has(normalized)) {
                slottedByName.set(normalized, []);
            }
            slottedByName.get(normalized).push(player);
        });

        filtered.forEach(function (player) {
            if (player.slot !== null && player.slot !== undefined) {
                output.push(player);
                return;
            }

            const normalized = normalizePlayerMergeName(player.name);
            const candidates = normalized ? (slottedByName.get(normalized) || []) : [];
            if (candidates.length === 1) {
                mergePlayerRecord(candidates[0], player);
                return;
            }

            output.push(player);
        });

        return output;
    }

    function finalisePlayers(parser) {
        const records = collectFinalPlayerRecords(parser);
        const likelyMultiplayer = parser.runtime.gameType === 1 ||
            records.length > 1 ||
            parser.chatLog.length > 0 ||
            records.some(function (player) {
                return player.frags !== 0;
            });

        return records
            .map(function (player) {
                const disconnected = likelyMultiplayer && player.frags === -99;
                return {
                    key: player.key,
                    slot: player.slot,
                    entityNumber: player.entityNumber,
                    name: player.name,
                    nameCodes: player.nameCodes.slice(),
                    displayName: decodeScoreboardBytes(player.nameCodes).trim() || decodeScoreboardBytes(quakeBytesFromString(player.name)).trim() || player.name,
                    aliases: player.names.slice(),
                    shirt: disconnected ? 0 : player.shirt,
                    pants: disconnected ? 0 : player.pants,
                    frags: player.frags,
                    maxFrags: player.maxFrags,
                    minFrags: player.minFrags,
                    chatCount: player.chatCount,
                    isPov: player.isPov,
                    disconnected: disconnected,
                    movement: summariseMovement(player.samples)
                };
            })
            .sort(function (left, right) {
                if (left.disconnected !== right.disconnected) {
                    return left.disconnected ? 1 : -1;
                }
                const leftHasSlot = left.slot !== null && left.slot !== undefined;
                const rightHasSlot = right.slot !== null && right.slot !== undefined;
                const leftHasColors = left.shirt !== null && left.shirt !== undefined && left.pants !== null && left.pants !== undefined;
                const rightHasColors = right.shirt !== null && right.shirt !== undefined && right.pants !== null && right.pants !== undefined;
                const leftNoMetadata = !leftHasSlot && !leftHasColors;
                const rightNoMetadata = !rightHasSlot && !rightHasColors;
                const leftZeroZero = left.shirt === 0 && left.pants === 0;
                const rightZeroZero = right.shirt === 0 && right.pants === 0;

                if (leftNoMetadata !== rightNoMetadata) {
                    return leftNoMetadata ? 1 : -1;
                }
                if (leftZeroZero !== rightZeroZero) {
                    return leftZeroZero ? 1 : -1;
                }
                if (left.frags !== right.frags) {
                    return right.frags - left.frags;
                }
                if (left.isPov && !right.isPov) {
                    return -1;
                }
                if (right.isPov && !left.isPov) {
                    return 1;
                }
                if (left.slot !== null && right.slot !== null) {
                    return left.slot - right.slot;
                }
                if (left.slot !== null) {
                    return -1;
                }
                if (right.slot !== null) {
                    return 1;
                }
                return String(left.name || '').localeCompare(String(right.name || ''));
            });
    }

    function createParserContext(fileMeta, forcetrack, options) {
        const config = options || {};
        return {
            fileMeta: fileMeta || {},
            forcetrack: forcetrack,
            frameCount: 0,
            messageCount: 0,
            warnings: [],
            chatLog: [],
            printLog: [],
            printBuffer: Object.create(null),
            stuffTextLog: [],
            teamScoreTimeline: [],
            playersByKey: new Map(),
            protocolsSeen: new Set(),
            mapsSeen: new Set(),
            mapSegments: [],
            currentSegment: null,
            firstTimestamp: null,
            lastTimestamp: null,
            smoothingSupport: {
                unsupportedReason: ''
            },
            runtime: {
                protocol: null,
                protocolFlags: 0,
                protocolPext1: 0,
                protocolPext2: 0,
                signon: 0,
                time: 0,
                frameViewAngles: [0, 0, 0],
                viewEntity: 1,
                maxClients: 0,
                gameType: 0,
                levelName: '',
                serverGameDir: '',
                serverInfo: Object.create(null),
                playerUserInfo: [],
                skybox: '',
                fogCommand: '',
                modelPrecache: [null],
                soundPrecache: [null],
                lightstyles: new Array(MAX_LIGHTSTYLES).fill(''),
                players: [],
                entities: [],
                staticEntities: [],
                staticSounds: [],
                statsInt: new Array(MAX_STATS).fill(0),
                statsFloat: new Array(MAX_STATS).fill(0),
                statsStrings: new Array(MAX_STATS).fill(null),
                onground: false,
                inwater: false
            },
            localState: {
                statSeen: new Array(MAX_STATS).fill(false),
                itemBits: null,
                currentWeapon: 0,
                currentWeaponStart: 0,
                weaponUsage: new Map(),
                weaponTimeline: [],
                itemEvents: [],
                resourceEvents: [],
                movementFlags: [],
                estimatedJumps: 0
            },
            frameContext: null,
            smoothing: config.enableSmoothing ? {
                frames: [],
                locations: [],
                unsupportedReason: '',
                currentFrame: null
            } : null,
            superimpose: config.enableSuperimpose ? {
                segments: [],
                currentSegment: null,
                maxEntityId: 0
            } : null
        };
    }

    function runParserFrames(parser, frames, frameTimes, stopAfterFrame) {
        const maxFrame = Number.isFinite(stopAfterFrame) ? stopAfterFrame : frames.length;

        for (let index = 0; index < frames.length && index < maxFrame; index += 1) {
            const frame = frames[index];
            if (parser.smoothing) {
                const smoothingFrame = {
                    frameIndex: frame.index,
                    timed: false,
                    angles: frame.viewAngles.slice(),
                    sourceAngles: frame.viewAngles.slice(),
                    angleOffsets: [
                        frame.messageOffset + 4,
                        frame.messageOffset + 8,
                        frame.messageOffset + 12
                    ],
                    smoothedXY: false,
                    smoothedZ: false
                };
                parser.smoothing.frames.push(smoothingFrame);
                parser.smoothing.currentFrame = smoothingFrame;
            }
            parser.frameContext = frame;
            try {
                parseFrame(parser, frame.payload, frame.viewAngles);
            } finally {
                parser.frameContext = null;
                if (parser.smoothing) {
                    parser.smoothing.currentFrame = null;
                }
            }
            if (frameTimes) {
                frameTimes.push(round(parser.runtime.time, 3) || 0);
            }
            parser.frameCount += 1;
            parser.messageCount += 1;
        }
    }

    function cloneTrimEntity(entity) {
        if (!entity) {
            return null;
        }
        return {
            baseline: cloneEntityState(entity.baseline || entityState()),
            state: cloneEntityState(entity.state || entityState()),
            active: !!entity.active,
            lastTime: entity.lastTime
        };
    }

    function buildTrimSnapshot(parser) {
        return {
            time: Number.isFinite(parser.runtime.time) ? parser.runtime.time : 0,
            protocol: parser.runtime.protocol,
            protocolFlags: parser.runtime.protocolFlags >>> 0,
            protocolPext2: parser.runtime.protocolPext2 >>> 0,
            serverGameDir: parser.runtime.serverGameDir || '',
            maxClients: parser.runtime.maxClients || 0,
            gameType: parser.runtime.gameType || 0,
            levelName: parser.runtime.levelName || '',
            modelPrecache: parser.runtime.modelPrecache.slice(),
            soundPrecache: parser.runtime.soundPrecache.slice(),
            lightstyles: parser.runtime.lightstyles.slice(),
            staticEntities: parser.runtime.staticEntities.map(function (entry) {
                return {
                    baseline: cloneEntityState(entry.baseline)
                };
            }),
            staticSounds: parser.runtime.staticSounds.map(function (entry) {
                return {
                    origin: entry.origin.slice(),
                    soundIndex: entry.soundIndex,
                    volume: entry.volume,
                    attenuation: entry.attenuation
                };
            }),
            players: parser.runtime.players.map(function (player) {
                return {
                    name: player.name || '',
                    shirt: player.shirt,
                    pants: player.pants,
                    frags: player.frags || 0
                };
            }),
            entities: parser.runtime.entities.map(cloneTrimEntity),
            statsInt: parser.runtime.statsInt.slice(),
            statsFloat: parser.runtime.statsFloat.slice(),
            statsStrings: parser.runtime.statsStrings.slice(),
            viewEntity: parser.runtime.viewEntity || 1,
            fogCommand: parser.runtime.fogCommand || ''
        };
    }

    function trimProtocolSupported(protocol) {
        return protocol === PROTOCOL_NETQUAKE ||
            protocol === PROTOCOL_FITZQUAKE ||
            protocol === PROTOCOL_RMQ;
    }

    function truncateTowardZero(value) {
        return value < 0 ? Math.ceil(value) : Math.floor(value);
    }

    function propagateSmoothedAngles(frames, timedIndices, flagName, axes) {
        for (let timedIndex = 0; timedIndex < timedIndices.length; timedIndex += 1) {
            const frameIndex = timedIndices[timedIndex];
            const frame = frames[frameIndex];
            if (!frame[flagName]) {
                continue;
            }
            const nextTimedFrame = timedIndex + 1 < timedIndices.length ? timedIndices[timedIndex + 1] : frames.length;
            for (let index = frameIndex + 1; index < nextTimedFrame; index += 1) {
                axes.forEach(function (axis) {
                    frames[index].angles[axis] = frame.angles[axis];
                });
            }
        }
    }

    function smoothCameraAnglesXY(frames) {
        const timedIndices = [];
        frames.forEach(function (frame, index) {
            if (frame.timed) {
                timedIndices.push(index);
            }
        });

        for (let center = CAMERA_SMOOTH_SIZE; center < timedIndices.length; center += 1) {
            const start = center - CAMERA_SMOOTH_SIZE;
            const end = Math.min(timedIndices.length - 1, center + CAMERA_SMOOTH_SIZE);
            const count = end - start + 1;
            let pitchSum = 0;
            let yawCos = 0;
            let yawSin = 0;

            for (let index = start; index <= end; index += 1) {
                const source = frames[timedIndices[index]].sourceAngles;
                pitchSum += source[0];
                const radians = (source[1] - 180) * Math.PI / 180;
                yawCos += Math.cos(radians);
                yawSin += Math.sin(radians);
            }

            const target = frames[timedIndices[center]];
            target.angles[0] = pitchSum / count;
            target.angles[1] = normalizeAngle((Math.atan2(yawSin, yawCos) * 180 / Math.PI) + 180);
            target.smoothedXY = true;
        }

        propagateSmoothedAngles(frames, timedIndices, 'smoothedXY', [0, 1]);
    }

    function addCameraRoll(frames) {
        if (!frames.length) {
            return;
        }

        let previousYaw = frames[0].angles[1];
        let roll = 0;

        frames.forEach(function (frame) {
            const currentYaw = frame.angles[1];
            const deltaYaw = previousYaw - currentYaw;

            if (deltaYaw > ROLL_TRIGGER_ANGLE) {
                roll = Math.min(ROLL_TARGET, roll + ROLL_SPEED);
            } else if (deltaYaw < (-1 * ROLL_TRIGGER_ANGLE)) {
                roll = Math.max(-ROLL_TARGET, roll - ROLL_SPEED);
            } else if (roll < (-1 * ROLL_SPEED)) {
                roll += ROLL_SPEED;
            } else if (roll > ROLL_SPEED) {
                roll -= ROLL_SPEED;
            } else {
                roll = 0;
            }

            frame.angles[2] = roll;
            previousYaw = currentYaw;
        });
    }

    function smoothCameraAngleZ(frames) {
        const timedIndices = [];
        frames.forEach(function (frame, index) {
            if (frame.timed) {
                timedIndices.push(index);
            }
        });

        const sourceRolls = timedIndices.map(function (frameIndex) {
            return frames[frameIndex].angles[2];
        });

        for (let center = CAMERA_SMOOTH_SIZE; center < timedIndices.length; center += 1) {
            const start = center - CAMERA_SMOOTH_SIZE;
            const end = Math.min(timedIndices.length - 1, center + CAMERA_SMOOTH_SIZE);
            const count = end - start + 1;
            let rollSum = 0;

            for (let index = start; index <= end; index += 1) {
                rollSum += sourceRolls[index];
            }

            const target = frames[timedIndices[center]];
            target.angles[2] = rollSum / count;
            target.smoothedZ = true;
        }

        propagateSmoothedAngles(frames, timedIndices, 'smoothedZ', [2]);
    }

    function locationDistance(left, right) {
        const dx = left.x - right.x;
        const dy = left.y - right.y;
        const dz = left.z - right.z;
        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
    }

    function smoothMotionPath(outputView, locations) {
        if (!locations.length) {
            return;
        }

        let segmentStart = 0;
        const processSegment = function (start, end) {
            for (let center = start + MOTION_SMOOTH_SIZE; center <= end; center += 1) {
                const windowStart = center - MOTION_SMOOTH_SIZE;
                const windowEnd = Math.min(end, center + MOTION_SMOOTH_SIZE);
                const count = windowEnd - windowStart + 1;
                let sumX = 0;
                let sumY = 0;
                let sumZ = 0;

                for (let index = windowStart; index <= windowEnd; index += 1) {
                    sumX += locations[index].x;
                    sumY += locations[index].y;
                    sumZ += locations[index].z;
                }

                const target = locations[center];
                const smoothX = sumX / count;
                const smoothY = sumY / count;
                const smoothZ = sumZ / count;

                if (target.xOffset !== null) {
                    writeSmoothedCoordAtOffset(outputView, target.xOffset, smoothX, target.protocolFlags);
                }
                if (target.yOffset !== null) {
                    writeSmoothedCoordAtOffset(outputView, target.yOffset, smoothY, target.protocolFlags);
                }
                if (target.zOffset !== null) {
                    writeSmoothedCoordAtOffset(outputView, target.zOffset, smoothZ, target.protocolFlags);
                }
            }
        };

        for (let index = 1; index < locations.length; index += 1) {
            if (locationDistance(locations[index - 1], locations[index]) >= MOTION_SMOOTH_RESTART_LIMIT) {
                processSegment(segmentStart, index - 1);
                segmentStart = index;
            }
        }
        processSegment(segmentStart, locations.length - 1);
    }

    function writeSmoothedFrameAngles(outputView, frames) {
        frames.forEach(function (frame) {
            frame.angleOffsets.forEach(function (offset, axis) {
                outputView.setFloat32(offset, frame.angles[axis], true);
            });
        });
    }

    function writeSmoothedCoordAtOffset(outputView, offset, value, protocolFlags) {
        if (hasFlag(protocolFlags, PRFL_FLOATCOORD)) {
            outputView.setFloat32(offset, value, true);
            return;
        }
        if (hasFlag(protocolFlags, PRFL_INT32COORD)) {
            outputView.setInt32(offset, truncateTowardZero(value * 16), true);
            return;
        }
        if (hasFlag(protocolFlags, PRFL_24BITCOORD)) {
            outputView.setInt16(offset, Math.trunc(value), true);
            outputView.setUint8(offset + 2, ((((Math.trunc(value * 255) % 255) + 255) % 255) & 0xff));
            return;
        }
        outputView.setInt16(offset, truncateTowardZero(value * 8), true);
    }

    function isDefaultEntityState(state) {
        return state.origin[0] === 0 &&
            state.origin[1] === 0 &&
            state.origin[2] === 0 &&
            state.angles[0] === 0 &&
            state.angles[1] === 0 &&
            state.angles[2] === 0 &&
            state.modelindex === 0 &&
            state.frame === 0 &&
            state.effects === 0 &&
            state.colormap === 0 &&
            state.skin === 0 &&
            state.scale === 16 &&
            state.pmovetype === 0 &&
            state.traileffectnum === 0 &&
            state.emiteffectnum === 0 &&
            state.velocity[0] === 0 &&
            state.velocity[1] === 0 &&
            state.velocity[2] === 0 &&
            state.eflags === 0 &&
            state.tagindex === 0 &&
            state.tagentity === 0 &&
            state.colormod[0] === 0 &&
            state.colormod[1] === 0 &&
            state.colormod[2] === 0 &&
            state.glowmod[0] === 0 &&
            state.glowmod[1] === 0 &&
            state.glowmod[2] === 0 &&
            state.alpha === 0 &&
            state.solidsize === 0;
    }

    function writeCoord24(writer, value) {
        writer.short(Math.trunc(value));
        writer.byte((((Math.trunc(value * 255) % 255) + 255) % 255) & 0xff);
    }

    function writeCoord(writer, value, protocolFlags) {
        if (hasFlag(protocolFlags, PRFL_FLOATCOORD)) {
            writer.float(value);
        } else if (hasFlag(protocolFlags, PRFL_INT32COORD)) {
            writer.long(Math.round(value * 16));
        } else if (hasFlag(protocolFlags, PRFL_24BITCOORD)) {
            writeCoord24(writer, value);
        } else {
            writer.short(Math.round(value * 8));
        }
    }

    function writeAngle(writer, value, protocolFlags) {
        const angle = normalizeAngle(value);
        if (hasFlag(protocolFlags, PRFL_FLOATANGLE)) {
            writer.float(angle);
        } else if (hasFlag(protocolFlags, PRFL_SHORTANGLE)) {
            writer.short(Math.round(angle * 65536 / 360) & 0xffff);
        } else {
            writer.byte(Math.round(angle * 256 / 360) & 0xff);
        }
    }

    function writeAngle16(writer, value, protocolFlags) {
        const angle = normalizeAngle(value);
        if (hasFlag(protocolFlags, PRFL_FLOATANGLE)) {
            writer.float(angle);
        } else {
            writer.short(Math.round(angle * 65536 / 360) & 0xffff);
        }
    }

    function writeEntityNumber(writer, entityNumber, pext2) {
        if (entityNumber > 0x7fff && (pext2 & PEXT2_REPLACEMENTDELTAS)) {
            writer.short(0x8000 | (entityNumber >>> 8));
            writer.byte(entityNumber & 0xff);
        } else {
            writer.short(entityNumber);
        }
    }

    function writeFtePacketEntityNumber(writer, entityNumber, removeFlag) {
        const flags = removeFlag ? 0x8000 : 0;
        if (entityNumber > 0x3fff) {
            writer.short(flags | 0x4000 | (entityNumber & 0x3fff));
            writer.byte((entityNumber >>> 14) & 0xff);
        } else {
            writer.short(flags | entityNumber);
        }
    }

    function writeSize16(writer, value) {
        if (value === 31) {
            writer.short(31);
            return;
        }
        if (!value) {
            writer.short(0);
            return;
        }
        const x = value & 255;
        const zd = (value >>> 8) & 255;
        const zu = ((value >>> 16) & 65535) - 32768;
        writer.short(
            (((x >>> 3) & 0x1f) << 0) |
            (((zd >>> 3) & 0x1f) << 5) |
            ((((zu + 32) >>> 3) & 0x3f) << 10)
        );
    }

    function calcFtePredBits(state) {
        let bits = 0;
        if (state.pmovetype) {
            bits |= UFP_MOVETYPE;
        }
        if (state.velocity[0] || state.velocity[1]) {
            bits |= UFP_VELOCITYXY;
        }
        if (state.velocity[2]) {
            bits |= UFP_VELOCITYZ;
        }
        return bits >>> 0;
    }

    function calcFteDeltaBits(fromState, toState) {
        let bits = 0;
        const predBits = calcFtePredBits(toState);

        if (toState.origin[0] !== fromState.origin[0] || toState.origin[1] !== fromState.origin[1]) {
            bits |= UF_ORIGINXY;
        }
        if (toState.origin[2] !== fromState.origin[2]) {
            bits |= UF_ORIGINZ;
        }
        if (toState.angles[0] !== fromState.angles[0] || toState.angles[2] !== fromState.angles[2]) {
            bits |= UF_ANGLESXZ;
        }
        if (toState.angles[1] !== fromState.angles[1]) {
            bits |= UF_ANGLESY;
        }
        if (toState.modelindex !== fromState.modelindex) {
            bits |= UF_MODEL;
        }
        if (toState.frame !== fromState.frame) {
            bits |= UF_FRAME;
        }
        if (toState.skin !== fromState.skin) {
            bits |= UF_SKIN;
        }
        if (toState.colormap !== fromState.colormap) {
            bits |= UF_COLORMAP;
        }
        if (toState.effects !== fromState.effects) {
            bits |= UF_EFFECTS;
        }
        if (toState.eflags !== fromState.eflags) {
            bits |= UF_FLAGS;
        }
        if (toState.solidsize !== fromState.solidsize) {
            bits |= UF_SOLID;
        }
        if (toState.scale !== fromState.scale) {
            bits |= UF_SCALE;
        }
        if (toState.alpha !== fromState.alpha) {
            bits |= UF_ALPHA;
        }
        if (toState.colormod[0] !== fromState.colormod[0] ||
            toState.colormod[1] !== fromState.colormod[1] ||
            toState.colormod[2] !== fromState.colormod[2]) {
            bits |= UF_COLORMOD;
        }
        if (toState.tagentity !== fromState.tagentity || toState.tagindex !== fromState.tagindex) {
            bits |= UF_TAGINFO;
        }
        if (toState.traileffectnum !== fromState.traileffectnum || toState.emiteffectnum !== fromState.emiteffectnum) {
            bits |= UF_TRAILEFFECT;
        }
        if (predBits) {
            bits |= UF_PREDINFO;
        }

        return bits >>> 0;
    }

    function writeFteEntityDelta(writer, bits, state, pext2, protocolFlags) {
        let flags = bits >>> 0;
        let predBits = 0;

        if (flags & UF_PREDINFO) {
            predBits = calcFtePredBits(state);
            if (!predBits) {
                flags &= ~UF_PREDINFO;
            }
        }

        if ((flags & UF_MODEL) && state.modelindex > 255) {
            flags |= UF_16BIT;
        }
        if ((flags & UF_FRAME) && state.frame > 255) {
            flags |= UF_16BIT;
        }
        if (flags & UF_EFFECTS) {
            if (state.effects & 0xffff0000) {
                flags |= UF_EFFECTS | UF_EFFECTS2;
            } else if (state.effects & 0x0000ff00) {
                flags = (flags & ~UF_EFFECTS) | UF_EFFECTS2;
            }
        }
        if (flags & 0xff000000) {
            flags |= UF_EXTEND3;
        }
        if (flags & 0x00ff0000) {
            flags |= UF_EXTEND2;
        }
        if (flags & 0x0000ff00) {
            flags |= UF_EXTEND1;
        }

        writer.byte((flags >>> 0) & 0xff);
        if (flags & UF_EXTEND1) {
            writer.byte((flags >>> 8) & 0xff);
        }
        if (flags & UF_EXTEND2) {
            writer.byte((flags >>> 16) & 0xff);
        }
        if (flags & UF_EXTEND3) {
            writer.byte((flags >>> 24) & 0xff);
        }

        if (flags & UF_FRAME) {
            if (flags & UF_16BIT) {
                writer.short(state.frame);
            } else {
                writer.byte(state.frame);
            }
        }
        if (flags & UF_ORIGINXY) {
            writeCoord(writer, state.origin[0], protocolFlags);
            writeCoord(writer, state.origin[1], protocolFlags);
        }
        if (flags & UF_ORIGINZ) {
            writeCoord(writer, state.origin[2], protocolFlags);
        }

        if ((flags & UF_PREDINFO) && !(pext2 & PEXT2_PREDINFO)) {
            if (flags & UF_ANGLESXZ) {
                writeAngle16(writer, state.angles[0], protocolFlags);
                writeAngle16(writer, state.angles[2], protocolFlags);
            }
            if (flags & UF_ANGLESY) {
                writeAngle16(writer, state.angles[1], protocolFlags);
            }
        } else {
            if (flags & UF_ANGLESXZ) {
                writeAngle(writer, state.angles[0], protocolFlags);
                writeAngle(writer, state.angles[2], protocolFlags);
            }
            if (flags & UF_ANGLESY) {
                writeAngle(writer, state.angles[1], protocolFlags);
            }
        }

        if ((flags & (UF_EFFECTS | UF_EFFECTS2)) === (UF_EFFECTS | UF_EFFECTS2)) {
            writer.long(state.effects);
        } else if (flags & UF_EFFECTS2) {
            writer.short(state.effects);
        } else if (flags & UF_EFFECTS) {
            writer.byte(state.effects);
        }

        if (flags & UF_PREDINFO) {
            writer.byte(predBits);
            if (predBits & UFP_MOVETYPE) {
                writer.byte(state.pmovetype);
            }
            if (predBits & UFP_VELOCITYXY) {
                writer.short(state.velocity[0]);
                writer.short(state.velocity[1]);
            }
            if (predBits & UFP_VELOCITYZ) {
                writer.short(state.velocity[2]);
            }
        }

        if (flags & UF_MODEL) {
            if (flags & UF_16BIT) {
                writer.short(state.modelindex);
            } else {
                writer.byte(state.modelindex);
            }
        }
        if (flags & UF_SKIN) {
            if (flags & UF_16BIT) {
                writer.short(state.skin);
            } else {
                writer.byte(state.skin);
            }
        }
        if (flags & UF_COLORMAP) {
            writer.byte(state.colormap);
        }
        if (flags & UF_SOLID) {
            if (pext2 & PEXT2_NEWSIZEENCODING) {
                if (!state.solidsize) {
                    writer.byte(0);
                } else if (state.solidsize === 31) {
                    writer.byte(1);
                } else {
                    writer.byte(16);
                    writeSize16(writer, state.solidsize);
                }
            } else {
                writeSize16(writer, state.solidsize);
            }
        }
        if (flags & UF_FLAGS) {
            writer.byte(state.eflags);
        }
        if (flags & UF_ALPHA) {
            writer.byte((state.alpha - 1) & 0xff);
        }
        if (flags & UF_SCALE) {
            writer.byte(state.scale);
        }
        if (flags & UF_TAGINFO) {
            writeEntityNumber(writer, state.tagentity, pext2);
            writer.byte(state.tagindex);
        }
        if (flags & UF_TRAILEFFECT) {
            if (state.emiteffectnum) {
                writer.short((state.traileffectnum & 0x3fff) | 0x8000);
                writer.short(state.emiteffectnum & 0x3fff);
            } else {
                writer.short(state.traileffectnum & 0x3fff);
            }
        }
        if (flags & UF_COLORMOD) {
            writer.byte(state.colormod[0]);
            writer.byte(state.colormod[1]);
            writer.byte(state.colormod[2]);
        }
    }

    function writeClassicEntityUpdate(writer, entityNumber, baseline, state, protocol, protocolFlags) {
        let bits = 0;

        if (entityNumber > 255) {
            bits |= U_LONGENTITY;
        }
        if (state.modelindex !== baseline.modelindex) {
            bits |= U_MODEL;
        }
        if (state.frame !== baseline.frame) {
            bits |= U_FRAME;
        }
        if (state.colormap !== baseline.colormap) {
            bits |= U_COLORMAP;
        }
        if (state.skin !== baseline.skin) {
            bits |= U_SKIN;
        }
        if ((state.effects & 0xff) !== (baseline.effects & 0xff)) {
            bits |= U_EFFECTS;
        }
        if (state.origin[0] !== baseline.origin[0]) {
            bits |= U_ORIGIN1;
        }
        if (state.angles[0] !== baseline.angles[0]) {
            bits |= U_ANGLE1;
        }
        if (state.origin[1] !== baseline.origin[1]) {
            bits |= U_ORIGIN2;
        }
        if (state.angles[1] !== baseline.angles[1]) {
            bits |= U_ANGLE2;
        }
        if (state.origin[2] !== baseline.origin[2]) {
            bits |= U_ORIGIN3;
        }
        if (state.angles[2] !== baseline.angles[2]) {
            bits |= U_ANGLE3;
        }

        if (protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) {
            if ((state.frame >>> 8) !== (baseline.frame >>> 8) || state.frame > 255) {
                bits |= U_FRAME | U_FRAME2;
            }
            if ((state.modelindex >>> 8) !== (baseline.modelindex >>> 8) || state.modelindex > 255) {
                bits |= U_MODEL | U_MODEL2;
            }
            if (state.alpha !== baseline.alpha) {
                bits |= U_ALPHA;
            }
            if (protocol === PROTOCOL_RMQ && state.scale !== baseline.scale) {
                bits |= U_SCALE;
            }
        }

        if (!bits) {
            bits |= U_MODEL;
            if ((protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) && state.modelindex > 255) {
                bits |= U_MODEL2;
            }
        }

        if (bits & 0xffffff00) {
            bits |= U_MOREBITS;
        }
        if ((protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) && (bits & 0xffff0000)) {
            bits |= U_EXTEND1;
        }
        if ((protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) && (bits & 0xff000000)) {
            bits |= U_EXTEND2;
        }

        writer.byte((bits & 0x7f) | U_SIGNAL);
        if (bits & U_MOREBITS) {
            writer.byte((bits >>> 8) & 0xff);
        }
        if ((protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) && (bits & U_EXTEND1)) {
            writer.byte((bits >>> 16) & 0xff);
        }
        if ((protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) && (bits & U_EXTEND2)) {
            writer.byte((bits >>> 24) & 0xff);
        }

        if (bits & U_LONGENTITY) {
            writer.short(entityNumber);
        } else {
            writer.byte(entityNumber);
        }

        if (bits & U_MODEL) {
            writer.byte(state.modelindex & 0xff);
        }
        if (bits & U_FRAME) {
            writer.byte(state.frame & 0xff);
        }
        if (bits & U_COLORMAP) {
            writer.byte(state.colormap);
        }
        if (bits & U_SKIN) {
            writer.byte(state.skin);
        }
        if (bits & U_EFFECTS) {
            writer.byte(state.effects & 0xff);
        }
        if (bits & U_ORIGIN1) {
            writeCoord(writer, state.origin[0], protocolFlags);
        }
        if (bits & U_ANGLE1) {
            writeAngle(writer, state.angles[0], protocolFlags);
        }
        if (bits & U_ORIGIN2) {
            writeCoord(writer, state.origin[1], protocolFlags);
        }
        if (bits & U_ANGLE2) {
            writeAngle(writer, state.angles[1], protocolFlags);
        }
        if (bits & U_ORIGIN3) {
            writeCoord(writer, state.origin[2], protocolFlags);
        }
        if (bits & U_ANGLE3) {
            writeAngle(writer, state.angles[2], protocolFlags);
        }

        if (protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) {
            if (bits & U_ALPHA) {
                writer.byte(state.alpha);
            }
            if (bits & U_SCALE) {
                writer.byte(state.scale);
            }
            if (bits & U_FRAME2) {
                writer.byte((state.frame >>> 8) & 0xff);
            }
            if (bits & U_MODEL2) {
                writer.byte((state.modelindex >>> 8) & 0xff);
            }
        }
    }

    function writeStaticOrBaseline(writer, entityNumber, state, snapshot) {
        const protocol = snapshot.protocol;
        const protocolFlags = snapshot.protocolFlags;
        const pext2 = snapshot.protocolPext2;

        if (pext2 & PEXT2_REPLACEMENTDELTAS) {
            if (entityNumber >= 0) {
                writer.byte(SVC.FTE_SPAWNBASELINE2);
                writeEntityNumber(writer, entityNumber, pext2);
            } else {
                writer.byte(SVC.FTE_SPAWNSTATIC2_ALIAS);
            }
            writeFteEntityDelta(writer, calcFteDeltaBits(entityState(), state), state, pext2, protocolFlags);
            return;
        }

        let bits = 0;
        if (protocol === PROTOCOL_FITZQUAKE || protocol === PROTOCOL_RMQ) {
            if (state.modelindex & 0xff00) {
                bits |= B_LARGEMODEL;
            }
            if (state.frame & 0xff00) {
                bits |= B_LARGEFRAME;
            }
            if (state.alpha !== 0) {
                bits |= B_ALPHA;
            }
            if (protocol === PROTOCOL_RMQ && state.scale !== 16) {
                bits |= B_SCALE;
            }
        }

        if (entityNumber >= 0) {
            writer.byte(bits ? SVC.SPAWNBASELINE2 : SVC.SPAWNBASELINE);
            writer.short(entityNumber);
        } else {
            writer.byte(bits ? SVC.SPAWNSTATIC2 : SVC.SPAWNSTATIC);
        }
        if (bits) {
            writer.byte(bits);
        }

        if (bits & B_LARGEMODEL) {
            writer.short(state.modelindex);
        } else {
            writer.byte(state.modelindex);
        }
        if (bits & B_LARGEFRAME) {
            writer.short(state.frame);
        } else {
            writer.byte(state.frame);
        }
        writer.byte(state.colormap);
        writer.byte(state.skin);
        for (let axis = 0; axis < 3; axis += 1) {
            writeCoord(writer, state.origin[axis], protocolFlags);
            writeAngle(writer, state.angles[axis], protocolFlags);
        }
        if (bits & B_ALPHA) {
            writer.byte(state.alpha);
        }
        if (bits & B_SCALE) {
            writer.byte(state.scale);
        }
    }

    function flushSyntheticMessage(chunks, message, viewAngles) {
        if (!message.length) {
            return new ByteWriter();
        }
        chunks.push(encodeDemoMessage(message.finish(), viewAngles));
        return new ByteWriter();
    }

    function buildSyntheticTrimIntro(snapshot, viewAngles) {
        const chunks = [];
        let message = new ByteWriter();
        const flush = function () {
            message = flushSyntheticMessage(chunks, message, viewAngles);
        };

        message.byte(SVC.SERVERINFO);
        if (snapshot.protocolPext2) {
            message.long(PROTOCOL_FTE_PEXT2);
            message.long(snapshot.protocolPext2);
        }
        message.long(snapshot.protocol);
        if (snapshot.protocol === PROTOCOL_RMQ) {
            message.long(snapshot.protocolFlags);
        }
        if (snapshot.protocolPext2 & PEXT2_PREDINFO) {
            message.string(snapshot.serverGameDir || '');
        }
        message.byte(snapshot.maxClients);
        message.byte(snapshot.gameType);
        message.string(snapshot.levelName || '');
        for (let index = 1; index < snapshot.modelPrecache.length; index += 1) {
            if (snapshot.modelPrecache[index]) {
                message.string(snapshot.modelPrecache[index]);
            }
        }
        message.byte(0);
        for (let index = 1; index < snapshot.soundPrecache.length; index += 1) {
            if (snapshot.soundPrecache[index]) {
                message.string(snapshot.soundPrecache[index]);
            }
        }
        message.byte(0);
        message.byte(SVC.SIGNONNUM);
        message.byte(1);
        flush();

        snapshot.entities.forEach(function (entity, entityNumber) {
            if (!entity || isDefaultEntityState(entity.baseline)) {
                return;
            }
            writeStaticOrBaseline(message, entityNumber, entity.baseline, snapshot);
            if (message.length > 4096) {
                flush();
            }
        });
        snapshot.staticEntities.forEach(function (entry) {
            writeStaticOrBaseline(message, -1, entry.baseline, snapshot);
            if (message.length > 4096) {
                flush();
            }
        });
        snapshot.staticSounds.forEach(function (sound) {
            message.byte(sound.soundIndex > 255 ? SVC.SPAWNSTATICSOUND2 : SVC.SPAWNSTATICSOUND);
            for (let axis = 0; axis < 3; axis += 1) {
                writeCoord(message, sound.origin[axis], snapshot.protocolFlags);
            }
            if (sound.soundIndex > 255) {
                message.short(sound.soundIndex);
            } else {
                message.byte(sound.soundIndex);
            }
            message.byte(sound.volume);
            message.byte(sound.attenuation);
            if (message.length > 4096) {
                flush();
            }
        });
        message.byte(SVC.SIGNONNUM);
        message.byte(2);
        flush();

        for (let slot = 0; slot < snapshot.maxClients; slot += 1) {
            const player = snapshot.players[slot] || { name: '', shirt: null, pants: null, frags: 0 };
            let colors = 0;
            if (Number.isInteger(player.shirt) && Number.isInteger(player.pants)) {
                colors = ((player.shirt & 0x0f) << 4) | (player.pants & 0x0f);
            }
            message.byte(SVC.UPDATENAME);
            message.byte(slot);
            message.string(player.name || '');
            message.byte(SVC.UPDATEFRAGS);
            message.byte(slot);
            message.short(player.frags || 0);
            message.byte(SVC.UPDATECOLORS);
            message.byte(slot);
            message.byte(colors);
            if (message.length > 4096) {
                flush();
            }
        }

        snapshot.lightstyles.forEach(function (style, styleIndex) {
            if (!style) {
                return;
            }
            message.byte(SVC.LIGHTSTYLE);
            message.byte(styleIndex);
            message.string(style);
            if (message.length > 4096) {
                flush();
            }
        });

        if (snapshot.fogCommand) {
            message.byte(SVC.STUFFTEXT);
            message.string(snapshot.fogCommand);
        }

        for (let statIndex = 0; statIndex < MAX_STATS; statIndex += 1) {
            if (snapshot.statsStrings[statIndex] && snapshot.protocolPext2) {
                message.byte(SVC.FTE_UPDATESTATSTRING);
                message.byte(statIndex);
                message.string(snapshot.statsStrings[statIndex]);
            }

            const statValue = snapshot.statsInt[statIndex];
            const statFloat = snapshot.statsFloat[statIndex];
            if (!statValue && !statFloat) {
                continue;
            }

            if ((Number(statValue) !== Number(statFloat)) &&
                Number.isFinite(statFloat) &&
                statValue >= 0 &&
                statValue <= 0x00ffffff &&
                snapshot.protocolPext2) {
                message.byte(SVC.FTE_UPDATESTATFLOAT);
                message.byte(statIndex);
                message.float(statFloat);
            } else if (statValue >= 0 && statValue <= 255 && (snapshot.protocolPext2 & PEXT2_PREDINFO)) {
                message.byte(SVC.DP_UPDATESTATBYTE);
                message.byte(statIndex);
                message.byte(statValue);
            } else {
                message.byte(SVC.UPDATESTAT);
                message.byte(statIndex);
                message.long(statValue);
            }

            if (message.length > 4096) {
                flush();
            }
        }

        message.byte(SVC.SETVIEW);
        message.short(snapshot.viewEntity);
        message.byte(SVC.SIGNONNUM);
        message.byte(3);
        flush();

        if (snapshot.protocolPext2) {
            message = new ByteWriter();
            const beginBatch = function () {
                message.byte(SVC.FTE_UPDATEENTITIES);
                if (snapshot.protocolPext2 & PEXT2_PREDINFO) {
                    message.short(0);
                }
                message.float(snapshot.time);
            };
            beginBatch();
            snapshot.entities.forEach(function (entity, entityNumber) {
                if (!entity || !entity.active || entityNumber <= 0) {
                    return;
                }
                writeFtePacketEntityNumber(message, entityNumber, false);
                writeFteEntityDelta(
                    message,
                    UF_RESET | calcFteDeltaBits(entity.baseline || entityState(), entity.state || entityState()),
                    entity.state || entityState(),
                    snapshot.protocolPext2,
                    snapshot.protocolFlags
                );
                if (message.length > 4096) {
                    message.short(0);
                    flush();
                    beginBatch();
                }
            });
            message.short(0);
            flush();
        } else {
            message = new ByteWriter();
            const beginSeedFrame = function () {
                message.byte(SVC.TIME);
                message.float(snapshot.time);
            };
            beginSeedFrame();
            snapshot.entities.forEach(function (entity, entityNumber) {
                if (!entity || !entity.active || entityNumber <= 0) {
                    return;
                }
                writeClassicEntityUpdate(
                    message,
                    entityNumber,
                    entity.baseline || entityState(),
                    entity.state || entityState(),
                    snapshot.protocol,
                    snapshot.protocolFlags
                );
                if (message.length > 4096) {
                    flush();
                    beginSeedFrame();
                }
            });
            flush();
        }

        return chunks;
    }

    function buildDisconnectFrame(viewAngles) {
        const message = new ByteWriter();
        message.byte(SVC.DISCONNECT);
        return encodeDemoMessage(message.finish(), viewAngles || [0, 0, 0]);
    }

    function trimDemoBuffer(input, options) {
        const bytes = normalizeBuffer(input);
        const config = options || {};
        const demo = scanDemoFrames(bytes);
        const frameTotal = demo.frames.length;

        if (!frameTotal) {
            return new Uint8Array(demo.headerBytes);
        }

        let startFrame = clamp(Math.round(Number(config.startFrame) || 1), 1, frameTotal);
        let endFrame = clamp(Math.round(Number(config.endFrame) || frameTotal), startFrame, frameTotal);
        const outputChunks = [new Uint8Array(demo.headerBytes)];
        const allowSyntheticStart = config.syntheticStart !== false;

        if (startFrame > 1 && allowSyntheticStart) {
            const forcetrack = /^-?\d+$/.test(demo.trackLine.trim()) ? Number(demo.trackLine.trim()) : null;
            const parser = createParserContext({}, forcetrack);
            runParserFrames(parser, demo.frames, null, startFrame - 1);

            if (!trimProtocolSupported(parser.runtime.protocol)) {
                throw new Error('Trim export currently supports protocol 15, 666, and 999 demos.');
            }
            if (!parser.runtime.protocol) {
                throw new Error('Cannot start a synthetic trim before any serverinfo message has been decoded.');
            }

            const snapshot = buildTrimSnapshot(parser);
            const introFrames = buildSyntheticTrimIntro(snapshot, demo.frames[startFrame - 1].viewAngles);
            introFrames.forEach(function (frameBytes) {
                outputChunks.push(frameBytes);
            });
        }

        for (let index = startFrame - 1; index < endFrame; index += 1) {
            outputChunks.push(bytes.subarray(demo.frames[index].messageOffset, demo.frames[index].endOffset));
        }

        if (endFrame < frameTotal) {
            outputChunks.push(buildDisconnectFrame(demo.frames[endFrame - 1].viewAngles));
        }

        return concatByteChunks(outputChunks);
    }

    function combineDemoBuffers(inputs) {
        const list = Array.from(inputs || []);
        if (!list.length) {
            throw new TypeError('combineDemoBuffers expects at least one demo buffer.');
        }

        const scans = list.map(function (input) {
            const bytes = normalizeBuffer(input);
            const demo = scanDemoFrames(bytes);
            return {
                bytes: bytes,
                demo: demo
            };
        });

        const chunks = [new Uint8Array(scans[0].demo.headerBytes)];
        scans.forEach(function (entry) {
            entry.demo.frames.forEach(function (frame) {
                chunks.push(entry.bytes.subarray(frame.messageOffset, frame.endOffset));
            });
        });

        return concatByteChunks(chunks);
    }

    function extractSuperimposeInfo(input) {
        const bytes = normalizeBuffer(input);
        const demo = scanDemoFrames(bytes);
        const trackLine = demo.trackLine.trim();
        const forcetrack = /^-?\d+$/.test(trackLine) ? Number(trackLine) : null;
        const parser = createParserContext({}, forcetrack, { enableSuperimpose: true });
        const frameTimes = [];
        runParserFrames(parser, demo.frames, frameTimes);

        return {
            bytes: bytes,
            demo: demo,
            frameTimes: frameTimes,
            maxEntityId: parser.superimpose ? parser.superimpose.maxEntityId : 0,
            segments: parser.superimpose ? parser.superimpose.segments.slice() : []
        };
    }

    function chooseBaseSuperimposeSegment(info) {
        if (!info.segments.length) {
            throw new Error('The base demo did not contain a decodable serverinfo block.');
        }
        if (info.segments.length !== 1) {
            throw new Error('Demsuperimpose export currently requires the base demo to contain exactly one map.');
        }
        const segment = info.segments[0];
        if (segment.unsupportedReason) {
            throw new Error(segment.unsupportedReason);
        }
        return segment;
    }

    function chooseGhostSuperimposeSegment(info, baseSegment, ignoreMapName) {
        const candidates = info.segments.filter(function (segment) {
            if (segment.unsupportedReason) {
                return false;
            }
            if (ignoreMapName) {
                return true;
            }
            return segment.worldModel === baseSegment.worldModel;
        });

        if (!candidates.length) {
            if (ignoreMapName) {
                throw new Error('One of the ghost demos did not contain a compatible classic segment.');
            }
            throw new Error('One of the ghost demos does not match the base demo map.');
        }

        return candidates.reduce(function (best, segment) {
            if (!best || segment.updates.length > best.updates.length) {
                return segment;
            }
            return best;
        }, null);
    }

    function cloneSuperimposeState(state) {
        return cloneEntityState(state || entityState());
    }

    function remapSuperimposeModelIndex(modelindex, sourceModels, baseModelMap, baseProtocol) {
        if (!modelindex) {
            return modelindex;
        }
        const modelName = sourceModels[modelindex] || null;
        if (!modelName || !baseModelMap.has(modelName)) {
            throw new Error('Demsuperimpose export requires all ghost models to exist in the base demo precache.');
        }
        const mapped = baseModelMap.get(modelName);
        if (baseProtocol === PROTOCOL_NETQUAKE && mapped > 255) {
            throw new Error('Protocol 15 base demos cannot address the remapped ghost model index needed for this export.');
        }
        return mapped;
    }

    function remapSuperimposeState(state, sourceModels, baseModelMap, baseProtocol) {
        const mapped = cloneSuperimposeState(state);
        mapped.modelindex = remapSuperimposeModelIndex(mapped.modelindex, sourceModels, baseModelMap, baseProtocol);
        return mapped;
    }

    function classicStateEquals(left, right) {
        return left.origin[0] === right.origin[0] &&
            left.origin[1] === right.origin[1] &&
            left.origin[2] === right.origin[2] &&
            left.angles[0] === right.angles[0] &&
            left.angles[1] === right.angles[1] &&
            left.angles[2] === right.angles[2] &&
            left.modelindex === right.modelindex &&
            left.frame === right.frame &&
            left.colormap === right.colormap &&
            left.skin === right.skin &&
            left.effects === right.effects &&
            left.alpha === right.alpha &&
            left.scale === right.scale;
    }

    function findSuperimposeUpdateIndex(updates, time) {
        const tolerance = 1e-6;
        let low = 0;
        let high = updates.length - 1;
        let answer = -1;

        while (low <= high) {
            const mid = (low + high) >> 1;
            if (updates[mid].time <= time + tolerance) {
                answer = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return answer;
    }

    function buildSuperimposeBaselineFrame(baseFrame, ghosts, baseSegment) {
        const payload = new ByteWriter();
        ghosts.forEach(function (ghost) {
            writeStaticOrBaseline(payload, ghost.entityNumber, ghost.baseline, {
                protocol: baseSegment.protocol,
                protocolFlags: baseSegment.protocolFlags,
                protocolPext2: 0
            });
        });
        return encodeDemoMessage(payload.finish(), baseFrame.viewAngles);
    }

    function buildSuperimposedFrame(frame, frameTime, ghosts, baseSegment) {
        const payload = new ByteWriter();
        payload.raw(frame.payload);

        ghosts.forEach(function (ghost) {
            const updateIndex = findSuperimposeUpdateIndex(ghost.updates, frameTime);
            if (updateIndex < 0) {
                return;
            }

            const nextState = ghost.updates[updateIndex].state;
            if (classicStateEquals(ghost.lastState, nextState)) {
                return;
            }

            writeClassicEntityUpdate(
                payload,
                ghost.entityNumber,
                ghost.lastState,
                nextState,
                baseSegment.protocol,
                baseSegment.protocolFlags
            );
            ghost.lastState = cloneSuperimposeState(nextState);
        });

        return encodeDemoMessage(payload.finish(), frame.viewAngles);
    }

    function superimposeDemoBuffers(inputs, options) {
        const list = Array.from(inputs || []);
        if (list.length < 2) {
            throw new TypeError('superimposeDemoBuffers expects a base demo and at least one ghost demo.');
        }

        const config = options || {};
        const scans = list.map(extractSuperimposeInfo);
        const baseInfo = scans[0];
        const ghostInfos = scans.slice(1);
        const baseSegment = chooseBaseSuperimposeSegment(baseInfo);
        const ghosts = [];
        const baseModelMap = new Map();

        baseSegment.models.forEach(function (modelName, index) {
            if (index > 0 && modelName && !baseModelMap.has(modelName)) {
                baseModelMap.set(modelName, index);
            }
        });

        ghostInfos.forEach(function (info, index) {
            const segment = chooseGhostSuperimposeSegment(info, baseSegment, !!config.ignoreMapName);
            if (!segment.baseline) {
                throw new Error('Ghost demo ' + (index + 2) + ' did not expose a decodable POV baseline.');
            }

            ghosts.push({
                entityNumber: baseInfo.maxEntityId + 1 + index,
                baseline: remapSuperimposeState(segment.baseline, segment.models, baseModelMap, baseSegment.protocol),
                updates: segment.updates.map(function (entry) {
                    return {
                        time: entry.time,
                        state: remapSuperimposeState(entry.state, segment.models, baseModelMap, baseSegment.protocol)
                    };
                }),
                lastState: remapSuperimposeState(segment.baseline, segment.models, baseModelMap, baseSegment.protocol)
            });
        });

        if (!ghosts.length) {
            throw new Error('No compatible ghost demos were available to superimpose.');
        }

        const outputChunks = [new Uint8Array(baseInfo.demo.headerBytes)];
        const frames = baseInfo.demo.frames;

        if (!frames.length) {
            return concatByteChunks(outputChunks);
        }

        outputChunks.push(baseInfo.bytes.subarray(frames[0].messageOffset, frames[0].endOffset));
        outputChunks.push(buildSuperimposeBaselineFrame(frames[0], ghosts, baseSegment));

        for (let index = 1; index < frames.length; index += 1) {
            const frame = frames[index];
            const frameTime = Number.isFinite(baseInfo.frameTimes[index]) ? baseInfo.frameTimes[index] : 0;
            if (frame.payload.length && frame.payload[0] === SVC.TIME) {
                outputChunks.push(buildSuperimposedFrame(frame, frameTime, ghosts, baseSegment));
            } else {
                outputChunks.push(baseInfo.bytes.subarray(frame.messageOffset, frame.endOffset));
            }
        }

        return concatByteChunks(outputChunks);
    }

    function smoothDemoBuffer(input) {
        const bytes = normalizeBuffer(input);
        const demo = scanDemoFrames(bytes);
        const output = new Uint8Array(bytes);

        if (!demo.frames.length) {
            return output;
        }

        const trackLine = demo.trackLine.trim();
        const forcetrack = /^-?\d+$/.test(trackLine) ? Number(trackLine) : null;
        const parser = createParserContext({}, forcetrack, { enableSmoothing: true });
        runParserFrames(parser, demo.frames, null);

        if (!parser.runtime.protocol) {
            throw new Error('Cannot smooth a demo before any serverinfo message has been decoded.');
        }
        if (parser.smoothing && parser.smoothing.unsupportedReason) {
            throw new Error(parser.smoothing.unsupportedReason);
        }

        const outputView = new DataView(output.buffer, output.byteOffset, output.byteLength);
        smoothCameraAnglesXY(parser.smoothing.frames);
        addCameraRoll(parser.smoothing.frames);
        smoothCameraAngleZ(parser.smoothing.frames);
        writeSmoothedFrameAngles(outputView, parser.smoothing.frames);
        smoothMotionPath(outputView, parser.smoothing.locations);

        return output;
    }

    function parseDemoBuffer(input, fileMeta) {
        const bytes = normalizeBuffer(input);
        const demo = scanDemoFrames(bytes);
        const trackLine = demo.trackLine.trim();
        const forcetrack = /^-?\d+$/.test(trackLine) ? Number(trackLine) : null;
        const parser = createParserContext(fileMeta, forcetrack);
        const frameTimes = [];

        if (demo.trailingBytes > 0) {
            appendWarning(parser, 'Ignored ' + demo.trailingBytes + ' trailing byte(s) after the last complete frame.');
        }

        if (bytes.length <= demo.headerBytes.length) {
            appendWarning(parser, 'The demo only contained a header line.');
        }

        runParserFrames(parser, demo.frames, frameTimes);

        finalizeSegment(parser);
        flushPrintBuffer(parser, 'print');
        flushPrintBuffer(parser, 'centerprint');
        recordTeamScoreSnapshot(parser);

        const protocols = Array.from(parser.protocolsSeen);
        if (protocols.length === 0) {
            appendWarning(parser, 'No svc_serverinfo packet was found; analytics may be incomplete.');
        }

        const totalDuration = parser.mapSegments.reduce(function (sum, segment) {
            if (!Number.isFinite(segment.startTime) || !Number.isFinite(segment.endTime)) {
                return sum;
            }
            return sum + Math.max(0, segment.endTime - segment.startTime);
        }, 0);
        const teamScoreTimeOrigin = parser.firstTimestamp === null ? 0 : parser.firstTimestamp;

        return {
            fileName: parser.fileMeta.name || 'demo.dem',
            fileSize: Number.isFinite(parser.fileMeta.size) ? parser.fileMeta.size : bytes.length,
            lastModified: parser.fileMeta.lastModified || null,
            forcetrack: parser.forcetrack,
            gameType: parser.runtime.gameType,
            frameCount: parser.frameCount,
            messageCount: parser.messageCount,
            duration: totalDuration > 0 ? round(totalDuration, 3) : (parser.firstTimestamp !== null && parser.lastTimestamp !== null ? round(Math.max(0, parser.lastTimestamp - parser.firstTimestamp), 3) : null),
            protocols: protocols,
            maps: parser.mapSegments.map(function (segment) {
                return {
                    index: segment.index,
                    protocol: segment.protocol,
                    levelName: segment.levelName,
                    mapName: segment.mapName,
                    startFrame: segment.startFrame,
                    endFrame: segment.endFrame,
                    startTime: round(segment.startTime, 3),
                    endTime: round(segment.endTime, 3),
                    duration: Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime) ? round(Math.max(0, segment.endTime - segment.startTime), 3) : null,
                    povStats: segment.povStats
                };
            }),
            players: finalisePlayers(parser),
            teamScores: parser.teamScoreTimeline.map(function (snapshot) {
                return {
                    time: round(Math.max(0, snapshot.time - teamScoreTimeOrigin), 3),
                    teams: snapshot.teams.map(function (team) {
                        return {
                            color: team.color,
                            score: team.score,
                            players: team.players
                        };
                    })
                };
            }),
            serverInfo: cloneStringMap(parser.runtime.serverInfo),
            playerUserInfo: parser.runtime.playerUserInfo.map(function (info) {
                return info ? cloneStringMap(info) : null;
            }),
            chatLog: parser.chatLog.slice(),
            prints: parser.printLog.slice(),
            stuffText: parser.stuffTextLog.slice(),
            timeline: {
                startTime: parser.firstTimestamp === null ? 0 : round(parser.firstTimestamp, 3),
                endTime: parser.lastTimestamp === null ? (frameTimes.length ? frameTimes[frameTimes.length - 1] : 0) : round(parser.lastTimestamp, 3),
                frameTimes: frameTimes
            },
            smoothSupported: protocols.length > 0 && !parser.smoothingSupport.unsupportedReason,
            smoothUnsupportedReason: parser.smoothingSupport.unsupportedReason || (protocols.length ? '' : 'Demsmooth export requires a demo with a decodable serverinfo message.'),
            local: finaliseLocalState(parser),
            warnings: parser.warnings.slice()
        };
    }

    return {
        parseDemoBuffer: parseDemoBuffer,
        trimDemoBuffer: trimDemoBuffer,
        combineDemoBuffers: combineDemoBuffers,
        superimposeDemoBuffers: superimposeDemoBuffers,
        smoothDemoBuffer: smoothDemoBuffer,
        decodeQuakeBytes: dequakeBytes,
        decodeScoreboardBytes: decodeScoreboardBytes,
        constants: {
            protocols: {
                PROTOCOL_NETQUAKE: PROTOCOL_NETQUAKE,
                PROTOCOL_FITZQUAKE: PROTOCOL_FITZQUAKE,
                PROTOCOL_RMQ: PROTOCOL_RMQ,
                PROTOCOL_FTE_PEXT2: PROTOCOL_FTE_PEXT2
            },
            svc: SVC,
            stat: STAT
        }
    };
}));
