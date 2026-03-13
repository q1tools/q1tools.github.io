(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.QuakeDemoDzip = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MAJOR_VERSION = 3;
    const MINOR_VERSION = 2;
    const MAX_ENT = 32768;
    const MAX_ENT_OLD = 1024;

    const TYPE_NORMAL = 0;
    const TYPE_DEMV1 = 1;
    const TYPE_TXT = 2;
    const TYPE_PAK = 3;
    const TYPE_DZ = 4;
    const TYPE_DEM = 5;
    const TYPE_NEHAHRA = 6;
    const TYPE_DIR = 7;
    const TYPE_STORE = 8;
    const TYPE_LAST = 9;

    const PROTOCOL_NETQUAKE = 15;
    const PROTOCOL_FITZQUAKE = 666;
    const PROTOCOL_RMQ = 999;

    const DEM_BAD = 0;
    const DEM_NOP = 1;
    const DEM_DISCONNECT = 2;
    const DEM_UPDATESTAT = 3;
    const DEM_VERSION = 4;
    const DEM_SETVIEW = 5;
    const DEM_SOUND = 6;
    const DEM_TIME = 7;
    const DEM_PRINT = 8;
    const DEM_STUFFTEXT = 9;
    const DEM_SETANGLE = 10;
    const DEM_SERVERINFO = 11;
    const DEM_LIGHTSTYLE = 12;
    const DEM_UPDATENAME = 13;
    const DEM_UPDATEFRAGS = 14;
    const DEM_CLIENTDATA = 15;
    const DEM_STOPSOUND = 16;
    const DEM_UPDATECOLORS = 17;
    const DEM_PARTICLE = 18;
    const DEM_DAMAGE = 19;
    const DEM_SPAWNSTATIC = 20;
    const DEM_SPAWNBINARY = 21;
    const DEM_SPAWNBASELINE = 22;
    const DEM_TEMP_ENTITY = 23;
    const DEM_SETPAUSE = 24;
    const DEM_SIGNONNUM = 25;
    const DEM_CENTERPRINT = 26;
    const DEM_KILLEDMONSTER = 27;
    const DEM_FOUNDSECRET = 28;
    const DEM_SPAWNSTATICSOUND = 29;
    const DEM_INTERMISSION = 30;
    const DEM_FINALE = 31;
    const DEM_CDTRACK = 32;
    const DEM_SELLSCREEN = 33;
    const DEM_CUTSCENE = 34;
    const DZ_LONGTIME = 35;
    const DEM_SHOWLMP = 35;
    const DEM_HIDELMP = 36;
    const DEM_SKYBOX = 37;
    const DZ_SHOWLMP = 38;
    const DEM_BF = 40;
    const DEM_FOG = 41;
    const DEM_SPAWNBASELINE2 = 42;
    const DEM_SPAWNSTATIC2 = 43;
    const DEM_SPAWNSTATICSOUND2 = 44;

    const DZ_IDENTIFIER_CLIENTDATA_FORCE = 0x50;
    const DZ_IDENTIFIER_CLIENTDATA_DIFF = 0x40;
    const DZ_IDENTIFIER_UPDATEENTITY_FORCE = 0x31;
    const DZ_IDENTIFIER_UPDATEENTITY_DIFF = 0x30;
    const DZ_IDENTIFIER_SOUND = 0x38;
    const DZ_IDENTIFIER_UPDATEENTITY2_FORCE = 0x32;
    const DZ_IDENTIFIER_SOUND_MOREBITS = 0x60;

    const SND_VOLUME = 0x01;
    const SND_ATTENUATION = 0x02;
    const SND_LOOPING = 0x04;
    const SND_LARGEENTITY = 0x08;
    const SND_LARGESOUND = 0x10;

    const SU_VIEWHEIGHT = 0x00000001;
    const SU_IDEALPITCH = 0x00000002;
    const SU_PUNCH0 = 0x00000004;
    const SU_PUNCH1 = 0x00000008;
    const SU_PUNCH2 = 0x00000010;
    const SU_VELOCITY0 = 0x00000020;
    const SU_VELOCITY1 = 0x00000040;
    const SU_VELOCITY2 = 0x00000080;
    const SU_AIMENT = 0x00000100;
    const SU_ITEMS = 0x00000200;
    const SU_ONGROUND = 0x00000400;
    const SU_INWATER = 0x00000800;
    const SU_WEAPONFRAME = 0x00001000;
    const SU_ARMOR = 0x00002000;
    const SU_WEAPON = 0x00004000;
    const SU_EXTEND1 = 0x00008000;
    const SU_WEAPON2 = 0x00010000;
    const SU_ARMOR2 = 0x00020000;
    const SU_AMMO2 = 0x00040000;
    const SU_SHELLS2 = 0x00080000;
    const SU_NAILS2 = 0x00100000;
    const SU_ROCKETS2 = 0x00200000;
    const SU_CELLS2 = 0x00400000;
    const SU_EXTEND2 = 0x00800000;
    const SU_WEAPONFRAME2 = 0x01000000;
    const SU_WEAPONALPHA = 0x02000000;

    const DZ_CD_VELOCITY0_FORCE = 0x0001;
    const DZ_CD_VELOCITY1_FORCE = 0x0002;
    const DZ_CD_VELOCITY2_FORCE = 0x0004;
    const DZ_CD_MOREBITS_FORCE = 0x0008;
    const DZ_CD_PUNCH0_FORCE = 0x0100;
    const DZ_CD_PUNCH1_FORCE = 0x0200;
    const DZ_CD_PUNCH2_FORCE = 0x0400;
    const DZ_CD_VIEWHEIGHT_FORCE = 0x0800;
    const DZ_CD_IDEALPITCH_FORCE = 0x1000;
    const DZ_CD_WEAPONFRAME_FORCE = 0x2000;
    const DZ_CD_ARMOR_FORCE = 0x4000;
    const DZ_CD_WEAPON_FORCE = 0x8000;

    const DZ_CD_VELOCITY2_DIFF = 0x0000000001;
    const DZ_CD_VELOCITY0_DIFF = 0x0000000002;
    const DZ_CD_VELOCITY1_DIFF = 0x0000000004;
    const DZ_CD_MOREBITS_DIFF = 0x0000000008;
    const DZ_CD_WEAPONFRAME_DIFF = 0x0000000100;
    const DZ_CD_ONGROUND_DIFF = 0x0000000200;
    const DZ_CD_PUNCH0_DIFF = 0x0000000400;
    const DZ_CD_AMMO_DIFF = 0x0000000800;
    const DZ_CD_HEALTH_DIFF = 0x0000001000;
    const DZ_CD_ITEMS_DIFF = 0x0000002000;
    const DZ_CD_ARMOR_DIFF = 0x0000004000;
    const DZ_CD_MOREBITS1_DIFF = 0x0000008000;
    const DZ_CD_IDEALPITCH_DIFF = 0x0000010000;
    const DZ_CD_SHELLS_DIFF = 0x0000020000;
    const DZ_CD_NAILS_DIFF = 0x0000040000;
    const DZ_CD_ROCKETS_DIFF = 0x0000080000;
    const DZ_CD_WEAPON_DIFF = 0x0000100000;
    const DZ_CD_WEAPONINDEX_DIFF = 0x0000200000;
    const DZ_CD_INWATER_DIFF = 0x0000400000;
    const DZ_CD_MOREBITS2_DIFF = 0x0000800000;
    const DZ_CD_VIEWHEIGHT_DIFF = 0x0001000000;
    const DZ_CD_CELLS_DIFF = 0x0002000000;
    const DZ_CD_PUNCH1_DIFF = 0x0004000000;
    const DZ_CD_PUNCH2_DIFF = 0x0008000000;
    const DZ_CD_INVBIT_DIFF = 0x0010000000;
    const DZ_CD_WEAPONFRAME2_DIFF = 0x0020000000;
    const DZ_CD_AMMO2_DIFF = 0x0040000000;
    const DZ_CD_MOREBITS3_DIFF = 0x0080000000;
    const DZ_CD_ARMOR2_DIFF = 0x0100000000;
    const DZ_CD_SHELLS2_DIFF = 0x0200000000;
    const DZ_CD_NAILS2_DIFF = 0x0400000000;
    const DZ_CD_ROCKETS2_DIFF = 0x0800000000;
    const DZ_CD_WEAPON2_DIFF = 0x1000000000;
    const DZ_CD_CELLS2_DIFF = 0x2000000000;
    const DZ_CD_WEAPONALPHA_DIFF = 0x4000000000;

    const B_LARGEMODEL = 0x01;
    const B_LARGEFRAME = 0x02;
    const B_ALPHA = 0x04;

    const DZ_SB_MOREBITS = 0x0001;
    const DZ_SB_FRAME = 0x0004;
    const DZ_SB_COLORMAP = 0x0008;
    const DZ_SB_SKIN = 0x0010;
    const DZ_SB_ORIGIN = 0x0020;
    const DZ_SB_ANGLE1 = 0x0040;
    const DZ_SB_ANGLE0AND2 = 0x0080;
    const DZ_SB_LARGEENTITY = 0x0100;
    const DZ_SB_LARGEMODEL = 0x0200;
    const DZ_SB_LARGEFRAME = 0x0400;
    const DZ_SB_ALPHA = 0x0800;

    const U_MOREBITS = 0x000001;
    const U_ORIGIN0 = 0x000002;
    const U_ORIGIN1 = 0x000004;
    const U_ORIGIN2 = 0x000008;
    const U_ANGLE1 = 0x000010;
    const U_NOLERP = 0x000020;
    const U_FRAME = 0x000040;
    const U_SIGNAL = 0x000080;
    const U_ANGLE0 = 0x000100;
    const U_ANGLE2 = 0x000200;
    const U_MODEL = 0x000400;
    const U_COLORMAP = 0x000800;
    const U_SKIN = 0x001000;
    const U_EFFECTS = 0x002000;
    const U_LONGENTITY = 0x004000;
    const U_TRANS = 0x008000;
    const U_EXTEND1 = 0x008000;
    const U_ALPHA = 0x010000;
    const U_FRAME2 = 0x020000;
    const U_MODEL2 = 0x040000;
    const U_LERPFINISH = 0x080000;
    const U_SCALE = 0x100000;
    const U_EXTEND2 = 0x800000;

    const DZ_UE_ORIGIN1_FORCE = 0x00000400;
    const DZ_UE_ANGLE0_FORCE = 0x00000800;
    const DZ_UE_ANGLE1_FORCE = 0x00001000;
    const DZ_UE_ANGLE2_FORCE = 0x00002000;
    const DZ_UE_FRAME_FORCE = 0x00004000;
    const DZ_UE_MOREBITS_FORCE = 0x00008000;
    const DZ_UE_ORIGIN0_FORCE = 0x00010000;
    const DZ_UE_ORIGIN2_FORCE = 0x00020000;
    const DZ_UE_MODEL_FORCE = 0x00040000;
    const DZ_UE_COLORMAP_FORCE = 0x00080000;
    const DZ_UE_SKIN_FORCE = 0x00100000;
    const DZ_UE_EFFECTS_FORCE = 0x00200000;
    const DZ_UE_LONGENTITY_FORCE = 0x00400000;
    const DZ_UE_TRANS_FORCE = 0x00800000;
    const DZ_UE_MOREBITS2_FORCE = 0x00800000;
    const DZ_UE_ALPHA_FORCE = 0x01000000;
    const DZ_UE_SCALE_FORCE = 0x02000000;
    const DZ_UE_LERPFINISH_FORCE = 0x04000000;
    const DZ_UE_MODEL2_FORCE = 0x08000000;
    const DZ_UE_FRAME2_FORCE = 0x10000000;

    const DZ_UE_ORIGIN2_DIFF = 0x000001;
    const DZ_UE_ORIGIN1_DIFF = 0x000002;
    const DZ_UE_ORIGIN0_DIFF = 0x000004;
    const DZ_UE_ANGLE0_DIFF = 0x000008;
    const DZ_UE_ANGLE1_DIFF = 0x000010;
    const DZ_UE_ANGLE2_DIFF = 0x000020;
    const DZ_UE_FRAME_SINGLE_DIFF = 0x000040;
    const DZ_UE_MOREBITS_DIFF = 0x000080;
    const DZ_UE_FRAME_NORMAL_DIFF = 0x000100;
    const DZ_UE_ORIGIN0_MOREBITS_DIFF = 0x000200;
    const DZ_UE_ORIGIN1_MOREBITS_DIFF = 0x000400;
    const DZ_UE_ORIGIN2_MOREBITS_DIFF = 0x000800;
    const DZ_UE_EFFECTS_DIFF = 0x001000;
    const DZ_UE_MODEL_DIFF = 0x002000;
    const DZ_UE_NOLERP_DIFF = 0x004000;
    const DZ_UE_MOREBITS2_DIFF = 0x008000;
    const DZ_UE_COLORMAP_DIFF = 0x010000;
    const DZ_UE_SKIN_DIFF = 0x020000;
    const DZ_UE_NEHAHRA_ALPHA_DIFF = 0x040000;
    const DZ_UE_NEHAHRA_FULLBRIGHT_DIFF = 0x080000;
    const DZ_UE_ALPHA_DIFF = 0x040000;
    const DZ_UE_SCALE_DIFF = 0x080000;
    const DZ_UE_LERPFINISH_DIFF = 0x100000;
    const DZ_UE_MODEL2_DIFF = 0x200000;
    const DZ_UE_FRAME2_DIFF = 0x400000;

    const TE_SIZE = [8, 8, 8, 8, 8, 16, 16, 8, 8, 16, 8, 8, 10, 16, 8, 8, 14];
    const EMPTY_ENTITY = Object.freeze({
        modelindex: 0,
        frame: 0,
        colormap: 0,
        skin: 0,
        effects: 0,
        ang0: 0,
        ang1: 0,
        ang2: 0,
        newbit: 0,
        present: 0,
        active: 0,
        fullbright: 0,
        org0: 0,
        org1: 0,
        org2: 0,
        od0: 0,
        od1: 0,
        od2: 0,
        force: 0,
        alpha: 0,
        transparency: 0,
        scale: 0,
        lerpfinish: 0
    });

    const nodeZlib = (typeof require === 'function' && typeof process !== 'undefined' && process.versions && process.versions.node)
        ? require('node:zlib')
        : null;
    const browserPako = (typeof globalThis !== 'undefined' && globalThis.pako) ? globalThis.pako : null;

    class ByteWriter {
        constructor(initialSize) {
            this.bytes = new Uint8Array(initialSize || 128);
            this.length = 0;
        }

        ensure(extra) {
            const needed = this.length + extra;
            if (needed <= this.bytes.length) {
                return;
            }
            let size = this.bytes.length;
            while (size < needed) {
                size *= 2;
            }
            const next = new Uint8Array(size);
            next.set(this.bytes.subarray(0, this.length));
            this.bytes = next;
        }

        writeByte(value) {
            this.ensure(1);
            this.bytes[this.length] = value & 0xff;
            this.length += 1;
        }

        writeBytes(values) {
            const bytes = toUint8Array(values);
            this.ensure(bytes.length);
            this.bytes.set(bytes, this.length);
            this.length += bytes.length;
        }

        writeUInt16LE(value) {
            this.ensure(2);
            this.bytes[this.length] = value & 0xff;
            this.bytes[this.length + 1] = (value >>> 8) & 0xff;
            this.length += 2;
        }

        writeInt16LE(value) {
            this.writeUInt16LE(value & 0xffff);
        }

        writeUInt32LE(value) {
            const normalized = value >>> 0;
            this.ensure(4);
            this.bytes[this.length] = normalized & 0xff;
            this.bytes[this.length + 1] = (normalized >>> 8) & 0xff;
            this.bytes[this.length + 2] = (normalized >>> 16) & 0xff;
            this.bytes[this.length + 3] = (normalized >>> 24) & 0xff;
            this.length += 4;
        }

        writeInt32LE(value) {
            this.writeUInt32LE(value >>> 0);
        }

        patchUInt32LE(offset, value) {
            const normalized = value >>> 0;
            this.bytes[offset] = normalized & 0xff;
            this.bytes[offset + 1] = (normalized >>> 8) & 0xff;
            this.bytes[offset + 2] = (normalized >>> 16) & 0xff;
            this.bytes[offset + 3] = (normalized >>> 24) & 0xff;
        }

        toUint8Array() {
            return this.bytes.slice(0, this.length);
        }
    }

    function toUint8Array(input) {
        if (input instanceof Uint8Array) {
            return input;
        }
        if (input instanceof ArrayBuffer) {
            return new Uint8Array(input);
        }
        if (ArrayBuffer.isView(input)) {
            return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
        if (Array.isArray(input)) {
            return Uint8Array.from(input);
        }
        throw new TypeError('Expected binary input.');
    }

    function readInt16LE(bytes, offset) {
        const value = bytes[offset] | (bytes[offset + 1] << 8);
        return value & 0x8000 ? value - 0x10000 : value;
    }

    function readUInt16LE(bytes, offset) {
        return bytes[offset] | (bytes[offset + 1] << 8);
    }

    function readInt32LE(bytes, offset) {
        return (bytes[offset]) |
            (bytes[offset + 1] << 8) |
            (bytes[offset + 2] << 16) |
            (bytes[offset + 3] << 24);
    }

    function readUInt32LE(bytes, offset) {
        return readInt32LE(bytes, offset) >>> 0;
    }

    function readFloat32LE(bytes, offset) {
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
        return view.getFloat32(0, true);
    }

    function encodeLatin1(value) {
        const text = String(value || '');
        const bytes = new Uint8Array(text.length);
        for (let index = 0; index < text.length; index += 1) {
            bytes[index] = text.charCodeAt(index) & 0xff;
        }
        return bytes;
    }

    function decodeLatin1(bytes) {
        let result = '';
        for (let index = 0; index < bytes.length; index += 1) {
            result += String.fromCharCode(bytes[index]);
        }
        return result;
    }

    function trimDzipName(bytes) {
        let end = bytes.length;
        while (end > 0 && bytes[end - 1] === 0) {
            end -= 1;
        }
        return decodeLatin1(bytes.subarray(0, end)).replace(/\\/g, '/');
    }

    function normalizeDemoFileName(fileName) {
        const text = String(fileName || 'demo.dem').replace(/\\/g, '/');
        return /\.dem$/i.test(text) ? text : (text.replace(/\.dz$/i, '') + '.dem');
    }

    async function inflateZlib(bytes) {
        const input = toUint8Array(bytes);
        if (nodeZlib) {
            return Uint8Array.from(nodeZlib.inflateSync(Buffer.from(input)));
        }
        if (browserPako && typeof browserPako.inflate === 'function') {
            return toUint8Array(browserPako.inflate(input));
        }
        if (typeof DecompressionStream === 'function') {
            const stream = new DecompressionStream('deflate');
            const writer = stream.writable.getWriter();
            await writer.write(input);
            await writer.close();
            return new Uint8Array(await new Response(stream.readable).arrayBuffer());
        }
        throw new Error('DZip inflate support is unavailable in this environment.');
    }

    async function deflateZlib(bytes) {
        const input = toUint8Array(bytes);
        if (nodeZlib) {
            return Uint8Array.from(nodeZlib.deflateSync(Buffer.from(input)));
        }
        if (browserPako && typeof browserPako.deflate === 'function') {
            return toUint8Array(browserPako.deflate(input));
        }
        if (typeof CompressionStream === 'function') {
            const stream = new CompressionStream('deflate');
            const writer = stream.writable.getWriter();
            await writer.write(input);
            await writer.close();
            return new Uint8Array(await new Response(stream.readable).arrayBuffer());
        }
        throw new Error('DZip deflate support is unavailable in this environment.');
    }

    const CRC_TABLE = (function buildCrcTable() {
        const table = new Uint32Array(256);
        for (let index = 0; index < 256; index += 1) {
            let value = index;
            for (let bit = 0; bit < 8; bit += 1) {
                value = (value & 1) ? ((value >>> 1) ^ 0xedb88320) : (value >>> 1);
            }
            table[index] = value >>> 0;
        }
        return table;
    }());

    function computeDzipCrc(bytes) {
        const input = toUint8Array(bytes);
        let crc = 0xffffffff;
        for (let index = 0; index < input.length; index += 1) {
            crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ input[index]) & 0xff];
        }
        return crc >>> 0;
    }

    function encodeDzipDate(timestamp) {
        const date = new Date(timestamp || Date.now());
        const year = Math.max(1980, date.getFullYear());
        return (((year - 1980) & 0x7f) << 25) |
            ((date.getMonth() & 0x0f) << 21) |
            ((date.getDate() & 0x1f) << 16) |
            ((date.getHours() & 0x1f) << 11) |
            ((date.getMinutes() & 0x3f) << 5) |
            (((date.getSeconds() / 2) | 0) & 0x1f);
    }

    function decodeDzipDate(value) {
        if (!value) {
            return null;
        }
        const year = ((value >>> 25) & 0x7f) + 1980;
        const month = (value >>> 21) & 0x0f;
        const day = (value >>> 16) & 0x1f;
        const hour = (value >>> 11) & 0x1f;
        const minute = (value >>> 5) & 0x3f;
        const second = (value & 0x1f) << 1;
        return new Date(year, month, day, hour, minute, second).getTime();
    }

    function isDzipBuffer(input) {
        const bytes = toUint8Array(input);
        return bytes.length >= 4 && bytes[0] === 0x44 && bytes[1] === 0x5a;
    }

    function createEntity() {
        return {
            modelindex: 0,
            frame: 0,
            colormap: 0,
            skin: 0,
            effects: 0,
            ang0: 0,
            ang1: 0,
            ang2: 0,
            newbit: 0,
            present: 0,
            active: 0,
            fullbright: 0,
            org0: 0,
            org1: 0,
            org2: 0,
            od0: 0,
            od1: 0,
            od2: 0,
            force: 0,
            alpha: 0,
            transparency: 0,
            scale: 0,
            lerpfinish: 0
        };
    }

    function cloneEntity(entity) {
        return entity ? {
            modelindex: entity.modelindex,
            frame: entity.frame,
            colormap: entity.colormap,
            skin: entity.skin,
            effects: entity.effects,
            ang0: entity.ang0,
            ang1: entity.ang1,
            ang2: entity.ang2,
            newbit: entity.newbit,
            present: entity.present,
            active: entity.active,
            fullbright: entity.fullbright,
            org0: entity.org0,
            org1: entity.org1,
            org2: entity.org2,
            od0: entity.od0,
            od1: entity.od1,
            od2: entity.od2,
            force: entity.force,
            alpha: entity.alpha,
            transparency: entity.transparency,
            scale: entity.scale,
            lerpfinish: entity.lerpfinish
        } : undefined;
    }

    function getEntity(list, index) {
        return list[index] || EMPTY_ENTITY;
    }

    function ensureEntity(list, index) {
        if (!list[index]) {
            list[index] = createEntity();
        }
        return list[index];
    }

    function copyEntityState(target, source, index) {
        const entity = source[index];
        if (entity) {
            target[index] = cloneEntity(entity);
        } else {
            delete target[index];
        }
    }

    function createClientData() {
        return {
            voz: 22,
            pax: 0,
            ang0: 0,
            ang1: 0,
            ang2: 0,
            vel0: 0,
            vel1: 0,
            vel2: 0,
            items: 0x4001,
            uk10: 0,
            uk11: 0,
            invbit: 0,
            wpf: 0,
            av: 0,
            wpm: 0,
            health: 0,
            am: 0,
            sh: 0,
            nl: 0,
            rk: 0,
            ce: 0,
            wp: 0,
            force: 0,
            weaponalpha: 0
        };
    }

    function cloneClientData(value) {
        return {
            voz: value.voz,
            pax: value.pax,
            ang0: value.ang0,
            ang1: value.ang1,
            ang2: value.ang2,
            vel0: value.vel0,
            vel1: value.vel1,
            vel2: value.vel2,
            items: value.items,
            uk10: value.uk10,
            uk11: value.uk11,
            invbit: value.invbit,
            wpf: value.wpf,
            av: value.av,
            wpm: value.wpm,
            health: value.health,
            am: value.am,
            sh: value.sh,
            nl: value.nl,
            rk: value.rk,
            ce: value.ce,
            wp: value.wp,
            force: value.force,
            weaponalpha: value.weaponalpha
        };
    }

    function bplus(x, y) {
        let value = x;
        if (value >= 128) {
            value -= 256;
        }
        return y + value;
    }

    function bplusByte(x, y) {
        return bplus(x, y) & 0xff;
    }

    function readCStringEnd(bytes, offset) {
        let cursor = offset;
        while (cursor < bytes.length && bytes[cursor] !== 0) {
            cursor += 1;
        }
        if (cursor >= bytes.length) {
            throw new Error('Encountered unterminated DZip string.');
        }
        return cursor + 1;
    }

    function sliceBytes(bytes, start, end) {
        return bytes.subarray(start, end);
    }

    function createDecodeContext(intermediate, outputSize, decodeType) {
        const output = new Uint8Array(outputSize);
        return {
            input: intermediate,
            offset: 0,
            output: output,
            outputOffset: 0,
            blockWriter: null,
            base: [],
            oldEnt: [],
            newEnt: [],
            baseIndices: new Set(),
            entlink: new Int32Array(MAX_ENT).fill(MAX_ENT),
            oldcd: createClientData(),
            newcd: createClientData(),
            protocol: PROTOCOL_NETQUAKE,
            copybaseline: 0,
            demGameTime: 0,
            demUpdateFrame: 0,
            sble: 0,
            lastent: 0,
            maxent: 0,
            cam0: 0,
            cam1: 0,
            cam2: 0,
            demDecodeType: decodeType
        };
    }

    function copyToOutput(ctx, bytes) {
        const data = toUint8Array(bytes);
        if (ctx.outputOffset + data.length > ctx.output.length) {
            throw new Error('Decoded DZip data exceeded the expected output size.');
        }
        ctx.output.set(data, ctx.outputOffset);
        ctx.outputOffset += data.length;
    }

    function copyMsg(ctx, length) {
        ctx.blockWriter.writeBytes(sliceBytes(ctx.input, ctx.offset, ctx.offset + length));
        ctx.offset += length;
    }

    function insertMsg(ctx, bytes) {
        ctx.blockWriter.writeBytes(bytes);
    }

    function discardMsg(ctx, length) {
        ctx.offset += length;
    }

    function writeCString(writer, bytes, start) {
        const end = readCStringEnd(bytes, start);
        writer.writeBytes(sliceBytes(bytes, start, end));
        return end;
    }

    function createClientdataMsg(ctx) {
        let mask = ctx.newcd.invbit ? 0 : SU_ITEMS;
        const payload = new ByteWriter(64);

        function addByte(field, defaultValue, bit, forceBit) {
            const value = ctx.newcd[field];
            if ((value & 0xff) !== defaultValue || (ctx.newcd.force & forceBit)) {
                mask |= bit;
                payload.writeByte(value & 0xff);
            }
        }

        function addHighByte(field, defaultValue, bit) {
            const value = ctx.newcd[field] >> 8;
            if (value !== defaultValue) {
                mask |= bit;
                payload.writeByte(value & 0xff);
            }
        }

        addByte('voz', 22, SU_VIEWHEIGHT, DZ_CD_VIEWHEIGHT_FORCE);
        addByte('pax', 0, SU_IDEALPITCH, DZ_CD_IDEALPITCH_FORCE);
        addByte('ang0', 0, SU_PUNCH0, DZ_CD_PUNCH0_FORCE);
        addByte('vel0', 0, SU_VELOCITY0, DZ_CD_VELOCITY0_FORCE);
        addByte('ang1', 0, SU_PUNCH1, DZ_CD_PUNCH1_FORCE);
        addByte('vel1', 0, SU_VELOCITY1, DZ_CD_VELOCITY1_FORCE);
        addByte('ang2', 0, SU_PUNCH2, DZ_CD_PUNCH2_FORCE);
        addByte('vel2', 0, SU_VELOCITY2, DZ_CD_VELOCITY2_FORCE);
        payload.writeInt32LE(ctx.newcd.items);
        if (ctx.newcd.uk10) {
            mask |= SU_ONGROUND;
        }
        if (ctx.newcd.uk11) {
            mask |= SU_INWATER;
        }
        addByte('wpf', 0, SU_WEAPONFRAME, DZ_CD_WEAPONFRAME_FORCE);
        addByte('av', 0, SU_ARMOR, DZ_CD_ARMOR_FORCE);
        addByte('wpm', 0, SU_WEAPON, DZ_CD_WEAPON_FORCE);
        payload.writeInt16LE(ctx.newcd.health);
        payload.writeByte(ctx.newcd.am);
        payload.writeByte(ctx.newcd.sh);
        payload.writeByte(ctx.newcd.nl);
        payload.writeByte(ctx.newcd.rk);
        payload.writeByte(ctx.newcd.ce);
        payload.writeByte(ctx.newcd.wp);
        addHighByte('wpm', 0, SU_WEAPON2);
        addHighByte('av', 0, SU_ARMOR2);
        addHighByte('am', 0, SU_AMMO2);
        addHighByte('sh', 0, SU_SHELLS2);
        addHighByte('nl', 0, SU_NAILS2);
        addHighByte('rk', 0, SU_ROCKETS2);
        addHighByte('ce', 0, SU_CELLS2);
        addHighByte('wpf', 0, SU_WEAPONFRAME2);
        if (ctx.newcd.weaponalpha !== ctx.oldcd.weaponalpha) {
            mask |= SU_WEAPONALPHA;
            payload.writeByte(ctx.newcd.weaponalpha & 0xff);
        }

        const extensionBytes = [];
        if (mask & 0xff000000) {
            extensionBytes.push((mask >>> 16) & 0xff, (mask >>> 24) & 0xff);
            mask |= SU_EXTEND1;
            mask |= SU_EXTEND2;
        } else if (mask & 0xffff0000) {
            extensionBytes.push((mask >>> 16) & 0xff);
            mask |= SU_EXTEND1;
        }

        const writer = new ByteWriter(64);
        writer.writeByte(DEM_CLIENTDATA);
        writer.writeUInt16LE(mask & 0xffff);
        writer.writeBytes(extensionBytes);
        writer.writeBytes(payload.toUint8Array());
        insertMsg(ctx, writer.toUint8Array());
        ctx.oldcd = cloneClientData(ctx.newcd);
    }

    function demxNop(ctx) {
        copyMsg(ctx, 1);
    }

    function demxDisconnect(ctx) {
        copyMsg(ctx, 1);
    }

    function demxUpdatestat(ctx) {
        copyMsg(ctx, 6);
    }

    function demxVersion(ctx) {
        copyMsg(ctx, 5);
    }

    function demxSetview(ctx) {
        copyMsg(ctx, 3);
    }

    function demxSound(ctx) {
        const start = ctx.offset;
        let ptr = start + 1;
        let len;
        let mask;
        if (ctx.input[start] > DEM_SOUND) {
            len = 10;
            mask = ctx.input[start] & 0x07;
            if (!(ctx.input[start] & SND_LARGEENTITY)) {
                mask |= SND_LARGEENTITY;
            }
            if (!(ctx.input[start] & SND_LARGESOUND)) {
                mask |= SND_LARGESOUND;
            }
        } else {
            len = 11;
            mask = ctx.input[ptr++];
        }
        if (mask & SND_VOLUME) {
            len += 1;
        }
        if (mask & SND_ATTENUATION) {
            len += 1;
        }

        const writer = new ByteWriter(16);
        writer.writeByte(DEM_SOUND);
        writer.writeByte(mask);

        if (mask & SND_VOLUME) {
            writer.writeByte(ctx.input[ptr++]);
        }
        if (mask & SND_ATTENUATION) {
            writer.writeByte(ctx.input[ptr++]);
        }

        let entity;
        if (mask & SND_LARGEENTITY) {
            entity = readUInt16LE(ctx.input, ptr);
            writer.writeUInt16LE(entity);
            ptr += 2;
            writer.writeByte(ctx.input[ptr++]);
        } else {
            let chanent = readUInt16LE(ctx.input, ptr);
            const channel = chanent & 7;
            entity = chanent >>> 3;
            chanent = ((entity << 3) | ((2 - channel) & 7)) & 0xffff;
            writer.writeUInt16LE(chanent);
            ptr += 2;
        }

        if (mask & SND_LARGESOUND) {
            writer.writeUInt16LE(readUInt16LE(ctx.input, ptr));
            ptr += 2;
        } else {
            writer.writeByte(ctx.input[ptr++]);
        }

        const ent = getEntity(ctx.newEnt, entity);
        writer.writeInt16LE(readInt16LE(ctx.input, ptr) + ent.org0);
        ptr += 2;
        writer.writeInt16LE(readInt16LE(ctx.input, ptr) + ent.org1);
        ptr += 2;
        writer.writeInt16LE(readInt16LE(ctx.input, ptr) + ent.org2);
        ptr += 2;

        insertMsg(ctx, writer.toUint8Array());
        ctx.offset = start + len;
    }

    function demxLongtime(ctx) {
        ctx.demGameTime += readInt32LE(ctx.input, ctx.offset + 1);
        const writer = new ByteWriter(5);
        writer.writeByte(DEM_TIME);
        writer.writeInt32LE(ctx.demGameTime);
        insertMsg(ctx, writer.toUint8Array());
        ctx.offset += 5;
    }

    function demxTime(ctx) {
        ctx.demGameTime += readUInt16LE(ctx.input, ctx.offset + 1);
        const writer = new ByteWriter(5);
        writer.writeByte(DEM_TIME);
        writer.writeInt32LE(ctx.demGameTime);
        insertMsg(ctx, writer.toUint8Array());
        ctx.offset += 3;
    }

    function demxString(ctx) {
        const end = readCStringEnd(ctx.input, ctx.offset + 1);
        copyMsg(ctx, end - ctx.offset);
    }

    function demxSetangle(ctx) {
        copyMsg(ctx, 4);
    }

    function demxServerinfo(ctx) {
        let ptr = ctx.offset + 1;
        ctx.protocol = readUInt32LE(ctx.input, ptr);
        ptr += 4;
        if (ctx.protocol === PROTOCOL_RMQ) {
            throw new Error('DZip PROTOCOL_RMQ demos are not supported.');
        }
        if (ctx.protocol !== PROTOCOL_NETQUAKE && ctx.protocol !== PROTOCOL_FITZQUAKE) {
            throw new Error('Encountered an unknown DZip protocol ' + ctx.protocol + '.');
        }
        ptr += 2;
        ptr = readCStringEnd(ctx.input, ptr);
        do {
            const start = ptr;
            ptr = readCStringEnd(ctx.input, ptr);
            if (ptr - start <= 1) {
                break;
            }
        } while (true);
        do {
            const start = ptr;
            ptr = readCStringEnd(ctx.input, ptr);
            if (ptr - start <= 1) {
                break;
            }
        } while (true);
        copyMsg(ctx, ptr - ctx.offset);
        ctx.sble = 0;
    }

    function demxLightstyle(ctx) {
        const end = readCStringEnd(ctx.input, ctx.offset + 2);
        copyMsg(ctx, end - ctx.offset);
    }

    function demxUpdatename(ctx) {
        const end = readCStringEnd(ctx.input, ctx.offset + 2);
        copyMsg(ctx, end - ctx.offset);
    }

    function demxUpdatefrags(ctx) {
        copyMsg(ctx, 4);
    }

    function demxClientdata(ctx) {
        let ptr = ctx.offset;
        let mask = ctx.input[ptr++];
        ctx.newcd = cloneClientData(ctx.oldcd);
        if (mask & DZ_CD_MOREBITS_DIFF) {
            mask += ctx.input[ptr++] << 8;
        }
        if (mask & DZ_CD_MOREBITS1_DIFF) {
            mask += ctx.input[ptr++] << 16;
        }
        if (mask & DZ_CD_MOREBITS2_DIFF) {
            mask += ctx.input[ptr++] << 24;
        }
        if (mask & DZ_CD_MOREBITS3_DIFF) {
            mask += ctx.input[ptr++] * 0x100000000;
        }

        function cplus(field, bit) {
            if (mask & bit) {
                ctx.newcd[field] = bplusByte(ctx.input[ptr++], ctx.oldcd[field]);
            }
        }

        function cplus2(field, bit, bit2) {
            if (mask & bit2) {
                ctx.newcd[field] = readInt16LE(ctx.input, ptr);
                ptr += 2;
            } else if (mask & bit) {
                if (ctx.oldcd[field] & 0xff00) {
                    ctx.newcd[field] = bplus(ctx.input[ptr++], ctx.oldcd[field]);
                } else {
                    ctx.newcd[field] = bplus(ctx.input[ptr++], ctx.oldcd[field]) & 0xff;
                }
            }
        }

        cplus('vel2', DZ_CD_VELOCITY2_DIFF);
        cplus('vel0', DZ_CD_VELOCITY0_DIFF);
        cplus('vel1', DZ_CD_VELOCITY1_DIFF);
        cplus2('wpf', DZ_CD_WEAPONFRAME_DIFF, DZ_CD_WEAPONFRAME2_DIFF);
        if (mask & DZ_CD_ONGROUND_DIFF) {
            ctx.newcd.uk10 = ctx.oldcd.uk10 ? 0 : 1;
        }
        cplus('ang0', DZ_CD_PUNCH0_DIFF);
        cplus2('am', DZ_CD_AMMO_DIFF, DZ_CD_AMMO2_DIFF);
        if (mask & DZ_CD_HEALTH_DIFF) {
            ctx.newcd.health += readInt16LE(ctx.input, ptr);
            ptr += 2;
        }
        if (mask & DZ_CD_ITEMS_DIFF) {
            ctx.newcd.items ^= readInt32LE(ctx.input, ptr);
            ptr += 4;
        }
        cplus2('av', DZ_CD_ARMOR_DIFF, DZ_CD_ARMOR2_DIFF);
        cplus('pax', DZ_CD_IDEALPITCH_DIFF);
        cplus2('sh', DZ_CD_SHELLS_DIFF, DZ_CD_SHELLS2_DIFF);
        cplus2('nl', DZ_CD_NAILS_DIFF, DZ_CD_NAILS2_DIFF);
        cplus2('rk', DZ_CD_ROCKETS_DIFF, DZ_CD_ROCKETS2_DIFF);
        cplus2('wpm', DZ_CD_WEAPON_DIFF, DZ_CD_WEAPON2_DIFF);
        cplus('wp', DZ_CD_WEAPONINDEX_DIFF);
        if (mask & DZ_CD_INWATER_DIFF) {
            ctx.newcd.uk11 = ctx.oldcd.uk11 ? 0 : 1;
        }
        cplus('voz', DZ_CD_VIEWHEIGHT_DIFF);
        cplus2('ce', DZ_CD_CELLS_DIFF, DZ_CD_CELLS2_DIFF);
        cplus('ang1', DZ_CD_PUNCH1_DIFF);
        cplus('ang2', DZ_CD_PUNCH2_DIFF);
        if (mask & DZ_CD_INVBIT_DIFF) {
            ctx.newcd.invbit = ctx.oldcd.invbit ? 0 : 1;
        }
        cplus('weaponalpha', DZ_CD_WEAPONALPHA_DIFF);

        ctx.offset = ptr;
        if ((ctx.input[ctx.offset] & 0xf0) === DZ_IDENTIFIER_CLIENTDATA_FORCE) {
            mask = ctx.input[ctx.offset++];
            if (mask & DZ_CD_MOREBITS_FORCE) {
                mask |= ctx.input[ctx.offset++] << 8;
            }
            ctx.newcd.force ^= mask & 0xff07;
        }

        createClientdataMsg(ctx);
    }

    function demxStopsound(ctx) {
        copyMsg(ctx, 3);
    }

    function demxUpdatecolors(ctx) {
        copyMsg(ctx, 3);
    }

    function demxParticle(ctx) {
        copyMsg(ctx, 12);
    }

    function demxDamage(ctx) {
        copyMsg(ctx, 9);
    }

    function demxSpawnstatic(ctx) {
        copyMsg(ctx, 14);
    }

    function demxSpawnbinary(ctx) {
        copyMsg(ctx, 1);
    }

    function demxSpawnbaseline(ctx) {
        let ptr = ctx.offset + 3;
        let mask;
        let bits = 0;
        let version = ctx.input[ctx.offset];
        let index;
        if (version === DEM_SPAWNBASELINE2) {
            index = readInt16LE(ctx.input, ctx.offset + 1);
            mask = ctx.input[ptr++];
            if (mask & DZ_SB_MOREBITS) {
                mask |= ctx.input[ptr++] << 8;
            }
            if (mask & DZ_SB_LARGEMODEL) {
                bits |= B_LARGEMODEL;
            }
            if (mask & DZ_SB_LARGEFRAME) {
                bits |= B_LARGEFRAME;
            }
            if (mask & DZ_SB_ALPHA) {
                bits |= B_ALPHA;
            }
        } else {
            mask = readUInt16LE(ctx.input, ctx.offset + 1);
            ctx.sble = (ctx.sble + (mask & (MAX_ENT_OLD - 1))) % MAX_ENT_OLD;
            index = ctx.sble;
            mask >>>= 8;
        }

        const ent = createEntity();
        if (bits & B_LARGEMODEL) {
            ent.modelindex = readInt16LE(ctx.input, ptr);
            ptr += 2;
        } else {
            ent.modelindex = ctx.input[ptr++];
        }
        if (mask & DZ_SB_FRAME) {
            if (bits & B_LARGEFRAME) {
                ent.frame = readInt16LE(ctx.input, ptr);
                ptr += 2;
            } else {
                ent.frame = ctx.input[ptr++];
            }
        }
        if (mask & DZ_SB_COLORMAP) {
            ent.colormap = ctx.input[ptr++];
        }
        if (mask & DZ_SB_SKIN) {
            ent.skin = ctx.input[ptr++];
        }
        if (mask & DZ_SB_ORIGIN) {
            ent.org0 = readInt16LE(ctx.input, ptr);
            ent.org1 = readInt16LE(ctx.input, ptr + 2);
            ent.org2 = readInt16LE(ctx.input, ptr + 4);
            ptr += 6;
        }
        if (mask & DZ_SB_ANGLE1) {
            ent.ang1 = ctx.input[ptr++];
        }
        if (mask & DZ_SB_ANGLE0AND2) {
            ent.ang0 = ctx.input[ptr++];
            ent.ang2 = ctx.input[ptr++];
        }
        if (bits & B_ALPHA) {
            ent.transparency = ctx.input[ptr++];
        }
        ctx.offset = ptr;

        if (mask & DZ_SB_LARGEENTITY) {
            version = DEM_SPAWNBASELINE;
        }
        const writer = new ByteWriter(32);
        writer.writeByte(version);
        writer.writeUInt16LE(index);
        if (version === DEM_SPAWNBASELINE2) {
            writer.writeByte(bits);
        }
        if (bits & B_LARGEMODEL) {
            writer.writeInt16LE(ent.modelindex);
        } else {
            writer.writeByte(ent.modelindex);
        }
        if (bits & B_LARGEFRAME) {
            writer.writeInt16LE(ent.frame);
        } else {
            writer.writeByte(ent.frame);
        }
        writer.writeByte(ent.colormap);
        writer.writeByte(ent.skin);
        writer.writeInt16LE(ent.org0);
        writer.writeByte(ent.ang0);
        writer.writeInt16LE(ent.org1);
        writer.writeByte(ent.ang1);
        writer.writeInt16LE(ent.org2);
        writer.writeByte(ent.ang2);
        if (bits & B_ALPHA) {
            writer.writeByte(ent.transparency);
        }
        insertMsg(ctx, writer.toUint8Array());
        ctx.base[index] = ent;
        ctx.baseIndices.add(index);
        ctx.copybaseline = 1;
    }

    function demxTempEntity(ctx) {
        const entityType = ctx.input[ctx.offset + 1];
        if (entityType === 17) {
            const end = readCStringEnd(ctx.input, ctx.offset + 2);
            copyMsg(ctx, (end - (ctx.offset + 2)) + 17);
            return;
        }
        if (entityType <= 0 || entityType >= TE_SIZE.length) {
            throw new Error('Encountered unsupported DZip temp entity ' + entityType + '.');
        }
        copyMsg(ctx, TE_SIZE[entityType]);
    }

    function demxSetpause(ctx) {
        copyMsg(ctx, 2);
    }

    function demxSignonnum(ctx) {
        copyMsg(ctx, 2);
    }

    function demxKilledmonster(ctx) {
        copyMsg(ctx, 1);
    }

    function demxFoundsecret(ctx) {
        copyMsg(ctx, 1);
    }

    function demxSpawnstaticsound(ctx) {
        copyMsg(ctx, 10);
    }

    function demxIntermission(ctx) {
        copyMsg(ctx, 1);
    }

    function demxCdtrack(ctx) {
        copyMsg(ctx, 3);
    }

    function demxSellscreen(ctx) {
        copyMsg(ctx, 1);
    }

    function demxShowlmp(ctx) {
        let ptr = readCStringEnd(ctx.input, ctx.offset + 1);
        ptr = readCStringEnd(ctx.input, ptr);
        ptr += 2;
        const bytes = ctx.input.slice(ctx.offset, ptr);
        bytes[0] = DEM_SHOWLMP;
        insertMsg(ctx, bytes);
        ctx.offset = ptr;
    }

    function demxFog(ctx) {
        copyMsg(ctx, 6);
    }

    function demxSpawnstatic2(ctx) {
        const bits = ctx.input[ctx.offset + 1];
        let size = 15;
        if (bits & B_LARGEMODEL) {
            size += 1;
        }
        if (bits & B_LARGEFRAME) {
            size += 1;
        }
        if (bits & B_ALPHA) {
            size += 1;
        }
        copyMsg(ctx, size);
    }

    function demxSpawnstaticsound2(ctx) {
        copyMsg(ctx, 11);
    }

    function demCopyUE(ctx) {
        let mask = ctx.input[ctx.offset] & 0x7f;
        let length = 1;
        if (mask & U_MOREBITS) {
            mask |= ctx.input[ctx.offset + length] << 8;
            length += 1;
            if (ctx.protocol === PROTOCOL_NETQUAKE && (mask & U_TRANS)) {
                return false;
            }
        }
        if (ctx.protocol !== PROTOCOL_NETQUAKE && (mask & U_EXTEND1)) {
            mask |= ctx.input[ctx.offset + length] << 16;
            length += 1;
        }
        if (mask & U_EXTEND2) {
            return false;
        }
        if (mask & U_LONGENTITY) {
            length += 1;
        }
        if (mask & U_MODEL) {
            length += 1;
        }
        if (mask & U_FRAME) {
            length += 1;
        }
        if (mask & U_COLORMAP) {
            length += 1;
        }
        if (mask & U_SKIN) {
            length += 1;
        }
        if (mask & U_EFFECTS) {
            length += 1;
        }
        if (mask & U_ORIGIN0) {
            length += 2;
        }
        if (mask & U_ANGLE0) {
            length += 1;
        }
        if (mask & U_ORIGIN1) {
            length += 2;
        }
        if (mask & U_ANGLE1) {
            length += 1;
        }
        if (mask & U_ORIGIN2) {
            length += 2;
        }
        if (mask & U_ANGLE2) {
            length += 1;
        }
        if (mask & U_ALPHA) {
            length += 1;
        }
        if (mask & U_SCALE) {
            length += 1;
        }
        if (mask & U_FRAME2) {
            length += 1;
        }
        if (mask & U_MODEL2) {
            length += 1;
        }
        if (mask & U_LERPFINISH) {
            length += 1;
        }
        copyMsg(ctx, length + 1);
        return true;
    }

    function demxUpdateentity(ctx) {
        let ptr = ctx.offset + 1;
        let baseval = 0;
        ctx.lastent = 0;

        while (ctx.input[ptr]) {
            if (ctx.input[ptr] === 0xff) {
                baseval += 0xfe;
                ptr += 1;
                continue;
            }

            const entity = baseval + ctx.input[ptr++];
            ensureEntity(ctx.newEnt, entity).active = 1;
            while (ctx.entlink[ctx.lastent] <= entity) {
                ctx.lastent = ctx.entlink[ctx.lastent];
            }
            if (ctx.lastent < entity) {
                ctx.entlink[entity] = ctx.entlink[ctx.lastent];
                ctx.entlink[ctx.lastent] = entity;
            }
        }

        ptr += 1;
        for (let prev = 0, index = ctx.entlink[0]; index < MAX_ENT; index = ctx.entlink[index]) {
            const current = ensureEntity(ctx.newEnt, index);
            current.org0 += current.od0;
            current.org1 += current.od1;
            current.org2 += current.od2;

            if (!current.active) {
                prev = index;
                continue;
            }

            let mask = ctx.input[ptr++];
            if (mask === DZ_UE_MOREBITS_DIFF) {
                copyEntityState(ctx.oldEnt, ctx.base, index);
                copyEntityState(ctx.newEnt, ctx.base, index);
                ctx.entlink[prev] = ctx.entlink[index];
                continue;
            }

            if (mask === 0x00) {
                prev = index;
                current.active = 0;
                continue;
            }

            prev = index;
            if (mask & DZ_UE_MOREBITS_DIFF) {
                mask += ctx.input[ptr++] << 8;
            }
            if (mask & DZ_UE_MOREBITS2_DIFF) {
                mask += ctx.input[ptr++] << 16;
            }

            const next = cloneEntity(current);
            const old = getEntity(ctx.oldEnt, index);

            if (mask & DZ_UE_ORIGIN2_DIFF) {
                next.od2 = bplus(ctx.input[ptr++], old.od2);
                next.org2 = old.org2 + next.od2;
            }
            if (mask & DZ_UE_ORIGIN2_MOREBITS_DIFF) {
                next.org2 = readInt16LE(ctx.input, ptr);
                ptr += 2;
                next.od2 = next.org2 - old.org2;
            }
            if (mask & DZ_UE_ORIGIN1_DIFF) {
                next.od1 = bplus(ctx.input[ptr++], old.od1);
                next.org1 = old.org1 + next.od1;
            }
            if (mask & DZ_UE_ORIGIN1_MOREBITS_DIFF) {
                next.org1 = readInt16LE(ctx.input, ptr);
                ptr += 2;
                next.od1 = next.org1 - old.org1;
            }
            if (mask & DZ_UE_ORIGIN0_DIFF) {
                next.od0 = bplus(ctx.input[ptr++], old.od0);
                next.org0 = old.org0 + next.od0;
            }
            if (mask & DZ_UE_ORIGIN0_MOREBITS_DIFF) {
                next.org0 = readInt16LE(ctx.input, ptr);
                ptr += 2;
                next.od0 = next.org0 - old.org0;
            }
            if (mask & DZ_UE_ANGLE0_DIFF) {
                next.ang0 = bplusByte(ctx.input[ptr++], old.ang0);
            }
            if (mask & DZ_UE_ANGLE1_DIFF) {
                next.ang1 = bplusByte(ctx.input[ptr++], old.ang1);
            }
            if (mask & DZ_UE_ANGLE2_DIFF) {
                next.ang2 = bplusByte(ctx.input[ptr++], old.ang2);
            }
            if (mask & DZ_UE_FRAME_SINGLE_DIFF) {
                next.frame = old.frame + 1;
            }
            if (mask & DZ_UE_FRAME_NORMAL_DIFF) {
                if (old.frame & 0xff00) {
                    next.frame = bplus(ctx.input[ptr++], old.frame);
                } else {
                    next.frame = bplus(ctx.input[ptr++], old.frame) & 0xff;
                }
            }
            if (mask & DZ_UE_FRAME2_DIFF) {
                next.frame = readInt16LE(ctx.input, ptr);
                ptr += 2;
            }
            if (mask & DZ_UE_EFFECTS_DIFF) {
                next.effects = ctx.input[ptr++];
            }
            if (mask & DZ_UE_MODEL_DIFF) {
                next.modelindex &= 0xff00;
                next.modelindex |= ctx.input[ptr++];
            }
            if (mask & DZ_UE_MODEL2_DIFF) {
                next.modelindex &= 0x00ff;
                next.modelindex |= ctx.input[ptr++] << 8;
            }
            if (mask & DZ_UE_NOLERP_DIFF) {
                next.newbit = old.newbit ? 0 : 1;
            }
            if (mask & DZ_UE_COLORMAP_DIFF) {
                next.colormap = ctx.input[ptr++];
            }
            if (mask & DZ_UE_SKIN_DIFF) {
                next.skin = ctx.input[ptr++];
            }
            if ((mask & DZ_UE_NEHAHRA_ALPHA_DIFF) && ctx.protocol === PROTOCOL_NETQUAKE) {
                next.alpha = readFloat32LE(ctx.input, ptr);
                ptr += 4;
            }
            if ((mask & DZ_UE_NEHAHRA_FULLBRIGHT_DIFF) && ctx.protocol === PROTOCOL_NETQUAKE) {
                next.fullbright = ctx.input[ptr++];
            }
            if ((mask & DZ_UE_ALPHA_DIFF) && ctx.protocol !== PROTOCOL_NETQUAKE) {
                next.transparency = ctx.input[ptr++];
            }
            if ((mask & DZ_UE_SCALE_DIFF) && ctx.protocol !== PROTOCOL_NETQUAKE) {
                next.scale = ctx.input[ptr++];
            }
            if (mask & DZ_UE_LERPFINISH_DIFF) {
                next.lerpfinish = ctx.input[ptr++];
            }

            ctx.newEnt[index] = next;
        }

        if (ctx.input[ptr] === DZ_IDENTIFIER_UPDATEENTITY_FORCE) {
            ptr += 1;
            while (readUInt16LE(ctx.input, ptr)) {
                let mask = readUInt16LE(ctx.input, ptr);
                ptr += 2;
                if (mask & DZ_UE_MOREBITS_FORCE) {
                    mask |= ctx.input[ptr++] << 16;
                }
                if (ctx.protocol !== PROTOCOL_NETQUAKE && (mask & DZ_UE_MOREBITS2_FORCE)) {
                    mask += ctx.input[ptr++] * 0x1000000;
                }
                const entity = mask & 0x03ff;
                ensureEntity(ctx.newEnt, entity).force ^= mask & 0xfffffc00;
            }
            ptr += 2;
        }

        if (ctx.input[ptr] === DZ_IDENTIFIER_UPDATEENTITY2_FORCE) {
            ptr += 1;
            while (readUInt16LE(ctx.input, ptr)) {
                let mask = readUInt16LE(ctx.input, ptr);
                ptr += 2;
                mask += ctx.input[ptr++] * 0x10000;
                if (mask & (DZ_UE_MOREBITS_FORCE << 8)) {
                    mask += ctx.input[ptr++] * 0x1000000;
                }
                if (ctx.protocol !== PROTOCOL_NETQUAKE && (mask & (DZ_UE_MOREBITS2_FORCE << 8))) {
                    mask += ctx.input[ptr++] * 0x100000000;
                }
                const entity = mask & (MAX_ENT - 1);
                ensureEntity(ctx.newEnt, entity).force ^= Math.floor((mask & ~(MAX_ENT - 1)) / 0x100);
            }
            ptr += 2;
        }

        ctx.offset = ptr;

        for (let index = ctx.entlink[0]; index < MAX_ENT; index = ctx.entlink[index]) {
            const next = getEntity(ctx.newEnt, index);
            const base = getEntity(ctx.base, index);
            const writer = new ByteWriter(32);
            let mask = U_SIGNAL;

            if (index > 0xff || (next.force & DZ_UE_LONGENTITY_FORCE)) {
                mask |= U_LONGENTITY;
                writer.writeUInt16LE(index);
            } else {
                writer.writeByte(index);
            }

            function bdiff(value, baseValue, bit, forceBit) {
                if (value !== baseValue || (next.force & forceBit)) {
                    mask |= bit;
                    writer.writeByte(value & 0xff);
                }
            }

            function bdiffDefault(value, baseValue, defaultValue, bit, forceBit) {
                if ((value !== baseValue && value !== defaultValue) || (next.force & forceBit)) {
                    mask |= bit;
                    writer.writeByte(value & 0xff);
                }
            }

            bdiff(next.modelindex & 0x00ff, base.modelindex & 0x00ff, U_MODEL, DZ_UE_MODEL_FORCE);
            bdiff(next.frame & 0x00ff, base.frame & 0x00ff, U_FRAME, DZ_UE_FRAME_FORCE);
            bdiff(next.colormap, base.colormap, U_COLORMAP, DZ_UE_COLORMAP_FORCE);
            bdiff(next.skin, base.skin, U_SKIN, DZ_UE_SKIN_FORCE);
            bdiff(next.effects, base.effects, U_EFFECTS, DZ_UE_EFFECTS_FORCE);
            if (next.org0 !== base.org0 || (next.force & DZ_UE_ORIGIN0_FORCE)) {
                mask |= U_ORIGIN0;
                writer.writeInt16LE(next.org0);
            }
            bdiff(next.ang0, base.ang0, U_ANGLE0, DZ_UE_ANGLE0_FORCE);
            if (next.org1 !== base.org1 || (next.force & DZ_UE_ORIGIN1_FORCE)) {
                mask |= U_ORIGIN1;
                writer.writeInt16LE(next.org1);
            }
            bdiff(next.ang1, base.ang1, U_ANGLE1, DZ_UE_ANGLE1_FORCE);
            if (next.org2 !== base.org2 || (next.force & DZ_UE_ORIGIN2_FORCE)) {
                mask |= U_ORIGIN2;
                writer.writeInt16LE(next.org2);
            }
            bdiff(next.ang2, base.ang2, U_ANGLE2, DZ_UE_ANGLE2_FORCE);

            if (ctx.protocol === PROTOCOL_NETQUAKE && (next.force & DZ_UE_TRANS_FORCE)) {
                mask |= U_TRANS;
                const floatBuffer = new ArrayBuffer(4);
                const floatView = new DataView(floatBuffer);
                floatView.setFloat32(0, next.fullbright ? 2 : 1, true);
                writer.writeBytes(new Uint8Array(floatBuffer));
                floatView.setFloat32(0, next.alpha || 0, true);
                writer.writeBytes(new Uint8Array(floatBuffer));
                if (next.fullbright) {
                    floatView.setFloat32(0, next.fullbright - 1, true);
                    writer.writeBytes(new Uint8Array(floatBuffer));
                }
            }

            if (ctx.protocol !== PROTOCOL_NETQUAKE) {
                bdiff(next.transparency, base.transparency, U_ALPHA, DZ_UE_ALPHA_FORCE);
            }
            bdiff(next.scale, base.scale, U_SCALE, DZ_UE_SCALE_FORCE);
            bdiffDefault(next.frame >> 8, base.frame >> 8, 0, U_FRAME2, DZ_UE_FRAME2_FORCE);
            bdiffDefault(next.modelindex >> 8, base.modelindex >> 8, 0, U_MODEL2, DZ_UE_MODEL2_FORCE);
            bdiff(next.lerpfinish, base.lerpfinish, U_LERPFINISH, DZ_UE_LERPFINISH_FORCE);

            if (next.newbit) {
                mask |= U_NOLERP;
            }

            const header = new ByteWriter(3);
            let maskSize = 1;
            if (mask & 0xffff00) {
                mask |= U_MOREBITS;
                maskSize = 2;
            }
            if (mask & 0xff0000) {
                mask |= U_EXTEND1;
                maskSize = 3;
            }
            header.writeByte(mask & 0xff);
            if (maskSize >= 2) {
                header.writeByte((mask >>> 8) & 0xff);
            }
            if (maskSize >= 3) {
                header.writeByte((mask >>> 16) & 0xff);
            }
            insertMsg(ctx, header.toUint8Array());
            insertMsg(ctx, writer.toUint8Array());
            copyEntityState(ctx.oldEnt, ctx.newEnt, index);
        }
    }

    const DEM_MESSAGE_HANDLERS = [];
    DEM_MESSAGE_HANDLERS[DEM_NOP - 1] = demxNop;
    DEM_MESSAGE_HANDLERS[DEM_DISCONNECT - 1] = demxDisconnect;
    DEM_MESSAGE_HANDLERS[DEM_UPDATESTAT - 1] = demxUpdatestat;
    DEM_MESSAGE_HANDLERS[DEM_VERSION - 1] = demxVersion;
    DEM_MESSAGE_HANDLERS[DEM_SETVIEW - 1] = demxSetview;
    DEM_MESSAGE_HANDLERS[DEM_TIME - 1] = demxTime;
    DEM_MESSAGE_HANDLERS[DEM_PRINT - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DEM_STUFFTEXT - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DEM_SETANGLE - 1] = demxSetangle;
    DEM_MESSAGE_HANDLERS[DEM_SERVERINFO - 1] = demxServerinfo;
    DEM_MESSAGE_HANDLERS[DEM_LIGHTSTYLE - 1] = demxLightstyle;
    DEM_MESSAGE_HANDLERS[DEM_UPDATENAME - 1] = demxUpdatename;
    DEM_MESSAGE_HANDLERS[DEM_UPDATEFRAGS - 1] = demxUpdatefrags;
    DEM_MESSAGE_HANDLERS[DEM_CLIENTDATA - 1] = demxClientdata;
    DEM_MESSAGE_HANDLERS[DEM_STOPSOUND - 1] = demxStopsound;
    DEM_MESSAGE_HANDLERS[DEM_UPDATECOLORS - 1] = demxUpdatecolors;
    DEM_MESSAGE_HANDLERS[DEM_PARTICLE - 1] = demxParticle;
    DEM_MESSAGE_HANDLERS[DEM_DAMAGE - 1] = demxDamage;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNSTATIC - 1] = demxSpawnstatic;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNBINARY - 1] = demxSpawnbinary;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNBASELINE - 1] = demxSpawnbaseline;
    DEM_MESSAGE_HANDLERS[DEM_TEMP_ENTITY - 1] = demxTempEntity;
    DEM_MESSAGE_HANDLERS[DEM_SETPAUSE - 1] = demxSetpause;
    DEM_MESSAGE_HANDLERS[DEM_SIGNONNUM - 1] = demxSignonnum;
    DEM_MESSAGE_HANDLERS[DEM_CENTERPRINT - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DEM_KILLEDMONSTER - 1] = demxKilledmonster;
    DEM_MESSAGE_HANDLERS[DEM_FOUNDSECRET - 1] = demxFoundsecret;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNSTATICSOUND - 1] = demxSpawnstaticsound;
    DEM_MESSAGE_HANDLERS[DEM_INTERMISSION - 1] = demxIntermission;
    DEM_MESSAGE_HANDLERS[DEM_FINALE - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DEM_CDTRACK - 1] = demxCdtrack;
    DEM_MESSAGE_HANDLERS[DEM_SELLSCREEN - 1] = demxSellscreen;
    DEM_MESSAGE_HANDLERS[DEM_CUTSCENE - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DZ_LONGTIME - 1] = demxLongtime;
    DEM_MESSAGE_HANDLERS[DEM_HIDELMP - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DEM_SKYBOX - 1] = demxString;
    DEM_MESSAGE_HANDLERS[DZ_SHOWLMP - 1] = demxShowlmp;
    DEM_MESSAGE_HANDLERS[DEM_FOG - 1] = demxFog;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNBASELINE2 - 1] = demxSpawnbaseline;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNSTATIC2 - 1] = demxSpawnstatic2;
    DEM_MESSAGE_HANDLERS[DEM_SPAWNSTATICSOUND2 - 1] = demxSpawnstaticsound2;

    function demUncompressBlock(ctx) {
        const cfields = ctx.input[ctx.offset++];
        if (cfields & 1) {
            ctx.cam0 += readInt32LE(ctx.input, ctx.offset);
            ctx.offset += 4;
        }
        if (cfields & 2) {
            ctx.cam1 += readInt32LE(ctx.input, ctx.offset);
            ctx.offset += 4;
        }
        if (cfields & 4) {
            ctx.cam2 += readInt32LE(ctx.input, ctx.offset);
            ctx.offset += 4;
        }

        ctx.blockWriter = new ByteWriter(256);
        ctx.blockWriter.writeUInt32LE(0);
        ctx.blockWriter.writeInt32LE(ctx.cam0);
        ctx.blockWriter.writeInt32LE(ctx.cam1);
        ctx.blockWriter.writeInt32LE(ctx.cam2);
        ctx.demUpdateFrame = 0;

        while (ctx.input[ctx.offset] !== 0) {
            const code = ctx.input[ctx.offset];
            if ((code & 0xf8) === DZ_IDENTIFIER_UPDATEENTITY_DIFF) {
                demxUpdateentity(ctx);
            } else if (code && code <= DEM_SPAWNSTATICSOUND2) {
                const handler = DEM_MESSAGE_HANDLERS[code - 1];
                if (!handler) {
                    throw new Error('Encountered unsupported DZip message ' + code + '.');
                }
                handler(ctx);
            } else if ((code & 0xf0) === DZ_IDENTIFIER_CLIENTDATA_DIFF) {
                demxClientdata(ctx);
            } else if ((code & 0xf8) === DZ_IDENTIFIER_SOUND || (code & 0xe0) === DZ_IDENTIFIER_SOUND_MOREBITS) {
                demxSound(ctx);
            } else if (code >= 0x80) {
                if (!demCopyUE(ctx)) {
                    throw new Error('Encountered unsupported DZip entity update payload.');
                }
            } else {
                throw new Error('Encountered corrupt DZip block data.');
            }
        }

        ctx.offset += 1;
        const messageLength = ctx.blockWriter.length - 16;
        ctx.blockWriter.patchUInt32LE(0, messageLength);
        copyToOutput(ctx, ctx.blockWriter.toUint8Array());

        if (ctx.copybaseline) {
            ctx.oldEnt = [];
            ctx.newEnt = [];
            ctx.entlink.fill(MAX_ENT);
            ctx.entlink[0] = MAX_ENT;
            ctx.baseIndices.forEach(function (index) {
                copyEntityState(ctx.oldEnt, ctx.base, index);
                copyEntityState(ctx.newEnt, ctx.base, index);
            });
            ctx.copybaseline = 0;
        }
    }

    function decodeDemoPayload(intermediate, outputSize, type) {
        const bytes = toUint8Array(intermediate);
        const ctx = createDecodeContext(bytes, outputSize, type);
        let newline = 0;
        while (newline < bytes.length && bytes[newline] !== 10 && newline < 12) {
            newline += 1;
        }
        if (newline >= bytes.length || newline >= 12 || bytes[newline] !== 10) {
            throw new Error('Encountered a corrupt DZip demo header.');
        }
        copyToOutput(ctx, bytes.subarray(0, newline + 1));
        ctx.offset = newline + 1;

        while (ctx.offset < bytes.length) {
            if (bytes[ctx.offset] === 0xff) {
                const rawLength = readUInt32LE(bytes, ctx.offset + 1);
                copyToOutput(ctx, bytes.subarray(ctx.offset + 5, ctx.offset + 5 + rawLength));
                ctx.offset += 5 + rawLength;
            } else {
                demUncompressBlock(ctx);
            }
        }

        if (ctx.outputOffset !== outputSize) {
            throw new Error('Decoded DZip demo size mismatch.');
        }
        return ctx.output;
    }

    function parseArchiveHeader(bytes) {
        const input = toUint8Array(bytes);
        if (input.length < 12 || input[0] !== 0x44 || input[1] !== 0x5a) {
            throw new Error('File is not a DZip archive.');
        }
        const major = input[2];
        const minor = input[3];
        if (major < 2) {
            throw new Error('DZip version ' + major + '.' + minor + ' is too old.');
        }
        if (major > MAJOR_VERSION) {
            throw new Error('DZip version ' + major + '.' + minor + ' is newer than this decoder supports.');
        }
        const directoryOffset = readUInt32LE(input, 4);
        const entryCount = readUInt32LE(input, 8);
        if (directoryOffset >= input.length) {
            throw new Error('DZip directory offset is out of range.');
        }
        return {
            bytes: input,
            major: major,
            minor: minor,
            directoryOffset: directoryOffset,
            entryCount: entryCount
        };
    }

    function parseArchiveEntries(header) {
        const entries = [];
        let offset = header.directoryOffset;
        for (let index = 0; index < header.entryCount; index += 1) {
            if (offset + 32 > header.bytes.length) {
                throw new Error('DZip directory is truncated.');
            }
            const nameLength = readUInt16LE(header.bytes, offset + 12);
            const entry = {
                index: index,
                offset: readUInt32LE(header.bytes, offset),
                compressedSize: readUInt32LE(header.bytes, offset + 4),
                realSize: readUInt32LE(header.bytes, offset + 8),
                nameLength: nameLength,
                pak: readUInt16LE(header.bytes, offset + 14),
                crc: readUInt32LE(header.bytes, offset + 16),
                type: readUInt32LE(header.bytes, offset + 20),
                date: readUInt32LE(header.bytes, offset + 24),
                intermediateSize: readUInt32LE(header.bytes, offset + 28)
            };
            offset += 32;
            if (offset + nameLength > header.bytes.length) {
                throw new Error('DZip entry name is truncated.');
            }
            entry.name = trimDzipName(header.bytes.subarray(offset, offset + nameLength));
            entry.lastModified = decodeDzipDate(entry.date);
            offset += nameLength;
            entries.push(entry);
        }
        return entries;
    }

    async function extractEntryBytes(archiveBytes, entry) {
        const bytes = toUint8Array(archiveBytes);
        if (entry.type === TYPE_DIR) {
            return new Uint8Array(0);
        }
        if (entry.type === TYPE_PAK) {
            throw new Error('Embedded PAK extraction from DZip archives is not supported here.');
        }
        if (entry.type === TYPE_DEMV1) {
            throw new Error('Legacy DZip v1 demo entries are not supported.');
        }

        if (entry.offset + entry.compressedSize > bytes.length) {
            throw new Error('DZip entry data is truncated.');
        }

        let output;
        if (entry.type === TYPE_STORE) {
            output = bytes.slice(entry.offset, entry.offset + entry.realSize);
        } else {
            const inflated = await inflateZlib(bytes.subarray(entry.offset, entry.offset + entry.compressedSize));
            if (entry.type === TYPE_DEM || entry.type === TYPE_NEHAHRA) {
                if (inflated.length !== entry.intermediateSize) {
                    throw new Error('DZip demo intermediate size mismatch.');
                }
                output = decodeDemoPayload(inflated, entry.realSize, entry.type);
            } else if (entry.type < TYPE_LAST) {
                output = inflated;
            } else {
                throw new Error('Encountered unsupported DZip entry type ' + entry.type + '.');
            }
        }

        if (computeDzipCrc(output) !== entry.crc) {
            throw new Error('DZip CRC check failed for "' + entry.name + '".');
        }
        return output;
    }

    async function extractDzipArchive(input, options) {
        const opts = options || {};
        const header = parseArchiveHeader(input);
        const entries = parseArchiveEntries(header);
        const results = [];

        for (const entry of entries) {
            const shouldExtract = !opts.entryFilter || opts.entryFilter(entry);
            if (!shouldExtract) {
                results.push(Object.assign({}, entry));
                continue;
            }
            if (entry.type === TYPE_DIR) {
                results.push(Object.assign({}, entry, { bytes: new Uint8Array(0) }));
                continue;
            }
            const entryBytes = await extractEntryBytes(header.bytes, entry);
            results.push(Object.assign({}, entry, { bytes: entryBytes }));
        }

        return {
            major: header.major,
            minor: header.minor,
            entries: results
        };
    }

    async function extractDemoEntries(input) {
        const archive = await extractDzipArchive(input, {
            entryFilter: function (entry) {
                return entry.type !== TYPE_DIR && /\.dem$/i.test(entry.name);
            }
        });
        return archive.entries.filter(function (entry) {
            return /\.dem$/i.test(entry.name) && entry.bytes instanceof Uint8Array;
        });
    }

    async function createDzipBuffer(entries, options) {
        const opts = options || {};
        const major = Number.isInteger(opts.majorVersion) ? opts.majorVersion : MAJOR_VERSION;
        const minor = Number.isInteger(opts.minorVersion) ? opts.minorVersion : MINOR_VERSION;
        if (major !== 3 || minor < 0 || minor > 255) {
            throw new Error('This DZip writer currently emits version 3.x archives only.');
        }

        const prepared = [];
        for (const entry of entries || []) {
            const name = String(entry && entry.name ? entry.name : '').trim();
            if (!name) {
                throw new Error('DZip entries must have a name.');
            }
            const fileBytes = toUint8Array(entry.bytes);
            const compressed = await deflateZlib(fileBytes);
            const store = compressed.length > fileBytes.length;
            const nameBytes = encodeLatin1(name + '\0');
            prepared.push({
                name: name,
                nameBytes: nameBytes,
                payload: store ? fileBytes : compressed,
                type: store ? TYPE_STORE : (Number.isInteger(entry.type) ? entry.type : TYPE_NORMAL),
                realSize: fileBytes.length,
                intermediateSize: fileBytes.length,
                crc: computeDzipCrc(fileBytes),
                date: encodeDzipDate(entry.lastModified || Date.now())
            });
        }

        let payloadOffset = 12;
        for (const entry of prepared) {
            entry.offset = payloadOffset;
            entry.compressedSize = entry.payload.length;
            payloadOffset += entry.payload.length;
        }

        let directorySize = 0;
        for (const entry of prepared) {
            directorySize += 32 + entry.nameBytes.length;
        }

        const output = new Uint8Array(payloadOffset + directorySize);
        output[0] = 0x44;
        output[1] = 0x5a;
        output[2] = major & 0xff;
        output[3] = minor & 0xff;

        for (const entry of prepared) {
            output.set(entry.payload, entry.offset);
        }

        const directoryOffset = payloadOffset;
        writeUInt32LE(output, 4, directoryOffset);
        writeUInt32LE(output, 8, prepared.length);

        let cursor = directoryOffset;
        for (const entry of prepared) {
            writeUInt32LE(output, cursor, entry.offset);
            writeUInt32LE(output, cursor + 4, entry.compressedSize);
            writeUInt32LE(output, cursor + 8, entry.realSize);
            writeUInt16LE(output, cursor + 12, entry.nameBytes.length);
            writeUInt16LE(output, cursor + 14, 0);
            writeUInt32LE(output, cursor + 16, entry.crc);
            writeUInt32LE(output, cursor + 20, entry.type);
            writeUInt32LE(output, cursor + 24, entry.date);
            writeUInt32LE(output, cursor + 28, entry.intermediateSize);
            output.set(entry.nameBytes, cursor + 32);
            cursor += 32 + entry.nameBytes.length;
        }

        return output;
    }

    function writeUInt16LE(bytes, offset, value) {
        bytes[offset] = value & 0xff;
        bytes[offset + 1] = (value >>> 8) & 0xff;
    }

    function writeUInt32LE(bytes, offset, value) {
        const normalized = value >>> 0;
        bytes[offset] = normalized & 0xff;
        bytes[offset + 1] = (normalized >>> 8) & 0xff;
        bytes[offset + 2] = (normalized >>> 16) & 0xff;
        bytes[offset + 3] = (normalized >>> 24) & 0xff;
    }

    async function createDzipFromDemoBuffer(input, fileName, options) {
        const bytes = toUint8Array(input);
        return createDzipBuffer([{
            name: normalizeDemoFileName(fileName),
            bytes: bytes,
            type: TYPE_NORMAL,
            lastModified: options && options.lastModified
        }], options);
    }

    return {
        isDzipBuffer: isDzipBuffer,
        extractArchive: extractDzipArchive,
        extractDemoEntries: extractDemoEntries,
        createDzipBuffer: createDzipBuffer,
        createDzipFromDemoBuffer: createDzipFromDemoBuffer,
        constants: {
            TYPE_NORMAL: TYPE_NORMAL,
            TYPE_DEMV1: TYPE_DEMV1,
            TYPE_TXT: TYPE_TXT,
            TYPE_PAK: TYPE_PAK,
            TYPE_DZ: TYPE_DZ,
            TYPE_DEM: TYPE_DEM,
            TYPE_NEHAHRA: TYPE_NEHAHRA,
            TYPE_DIR: TYPE_DIR,
            TYPE_STORE: TYPE_STORE,
            MAJOR_VERSION: MAJOR_VERSION,
            MINOR_VERSION: MINOR_VERSION
        }
    };
}));
