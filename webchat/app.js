(function () {
  "use strict";

  const NET_HEADERSIZE = 8;
  const NETFLAG_LENGTH_MASK = 0x0000ffff;
  const NETFLAG_DATA = 0x00010000;
  const NETFLAG_ACK = 0x00020000;
  const NETFLAG_EOM = 0x00080000;
  const NETFLAG_UNRELIABLE = 0x00100000;
  const NETFLAG_CTL = 0x80000000;
  const NET_PROTOCOL_VERSION = 3;

  const CCREQ_CONNECT = 0x01;
  const CCREP_ACCEPT = 0x81;
  const CCREP_REJECT = 0x82;

  const clc_nop = 1;
  const clc_disconnect = 2;
  const clc_move = 3;
  const clc_stringcmd = 4;

  const PROTOCOL_NETQUAKE = 15;
  const PROTOCOL_FITZQUAKE = 666;
  const PROTOCOL_RMQ = 999;
  const PROTOCOL_VERSION_BJP3 = 10002;
  const PROTOCOL_VERSION_DP7 = 7;
  const PROTOCOL_FTE_PEXT1 = 0x46544558;
  const PROTOCOL_FTE_PEXT2 = 0x32455446;
  const QUAKE_CHAR_IMAGE_BASE = "./assets/quake-chars";
  const CENTERPRINT_PREFERENCE_KEY = "qssm-webchat-centerprint-v1";
  const DEBUG_PREFERENCE_KEY = "qssm-webchat-debug-v2";
  const VERSION_STAMP = "webchat 0.0.1";
  const LAST_SERVER_COOKIE_NAME = "qssm_webchat_last_server";
  const LAST_NAME_COOKIE_NAME = "qssm_webchat_last_name";
  const PEXT2_REPLACEMENTDELTAS = 0x00000008;
  const CIF_CHAT = 1 << 0;
  const CIF_AFK = 1 << 1;
  const CHAT_INFO_RESET_DELAY = 3000;

  const PRFL_SHORTANGLE = 1 << 1;
  const PRFL_FLOATANGLE = 1 << 2;
  const PRFL_24BITCOORD = 1 << 3;
  const PRFL_FLOATCOORD = 1 << 4;
  const PRFL_INT32COORD = 1 << 7;

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
  const DPSU_PUNCHVEC2 = 1 << 17;
  const DPSU_PUNCHVEC3 = 1 << 18;
  const SND_VOLUME = 1 << 0;
  const SND_ATTENUATION = 1 << 1;
  const SND_FTE_MOREFLAGS = 1 << 2;
  const SND_LARGEENTITY = 1 << 3;
  const SND_LARGESOUND = 1 << 4;
  const SND_DP_PITCH = 1 << 5;
  const SND_FTE_TIMEOFS = 1 << 6;
  const SND_FTE_PITCHADJ = 1 << 7;
  const SND_FTE_VELOCITY = 1 << 8;

  const B_LARGEMODEL = 1 << 0;
  const B_LARGEFRAME = 1 << 1;
  const B_ALPHA = 1 << 2;
  const B_SCALE = 1 << 3;

  const svc_nop = 1;
  const svc_disconnect = 2;
  const svc_updatestat = 3;
  const svc_version = 4;
  const svc_setview = 5;
  const svc_sound = 6;
  const svc_time = 7;
  const svc_print = 8;
  const svc_stufftext = 9;
  const svc_setangle = 10;
  const svc_serverinfo = 11;
  const svc_lightstyle = 12;
  const svc_updatename = 13;
  const svc_updatefrags = 14;
  const svc_clientdata = 15;
  const svc_stopsound = 16;
  const svc_updatecolors = 17;
  const svc_particle = 18;
  const svc_damage = 19;
  const svc_spawnstatic = 20;
  const svc_spawnbaseline = 22;
  const svc_temp_entity = 23;
  const svc_setpause = 24;
  const svc_signonnum = 25;
  const svc_centerprint = 26;
  const svc_killedmonster = 27;
  const svc_foundsecret = 28;
  const svc_spawnstaticsound = 29;
  const svc_intermission = 30;
  const svc_finale = 31;
  const svc_cdtrack = 32;
  const svc_sellscreen = 33;
  const svc_cutscene = 34;
  const svc_skybox = 37;
  const svc_bf = 40;
  const svc_fog = 41;
  const svc_spawnbaseline2 = 42;
  const svc_spawnstatic2 = 43;
  const svc_spawnstaticsound2 = 44;
  const svcdp_precache = 54;
  const svcdp_effect = 52;
  const svcdp_effect2 = 53;

  const protocolNames = {
    [PROTOCOL_NETQUAKE]: "NetQuake",
    [PROTOCOL_FITZQUAKE]: "FitzQuake",
    [PROTOCOL_RMQ]: "RMQ",
    [PROTOCOL_VERSION_BJP3]: "BJP3",
    [PROTOCOL_VERSION_DP7]: "DP7"
  };

  class ByteWriter {
    constructor() {
      this.bytes = [];
    }

    writeByte(value) {
      this.bytes.push(value & 0xff);
    }

    writeShort(value) {
      const normalized = value & 0xffff;
      this.bytes.push(normalized & 0xff, (normalized >>> 8) & 0xff);
    }

    writeLong(value) {
      const normalized = value >>> 0;
      this.bytes.push(
        normalized & 0xff,
        (normalized >>> 8) & 0xff,
        (normalized >>> 16) & 0xff,
        (normalized >>> 24) & 0xff
      );
    }

    writeFloat(value) {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, value, true);
      const bytes = new Uint8Array(buffer);
      this.bytes.push(bytes[0], bytes[1], bytes[2], bytes[3]);
    }

    writeString(value) {
      const text = String(value ?? "");
      for (let index = 0; index < text.length; index += 1) {
        this.writeByte(text.charCodeAt(index) & 0xff);
      }
      this.writeByte(0);
    }

    finish() {
      return new Uint8Array(this.bytes);
    }
  }

  class ByteReader {
    constructor(buffer, offset = 0) {
      this.view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      this.offset = offset;
    }

    eof() {
      return this.offset >= this.view.length;
    }

    remaining() {
      return this.view.length - this.offset;
    }

    ensure(size) {
      if (this.offset + size > this.view.length) {
        throw new Error("Unexpected end of packet");
      }
    }

    readByte() {
      this.ensure(1);
      return this.view[this.offset++];
    }

    readChar() {
      const value = this.readByte();
      return value > 127 ? value - 256 : value;
    }

    readShort() {
      this.ensure(2);
      const value = this.view[this.offset] | (this.view[this.offset + 1] << 8);
      this.offset += 2;
      return value >= 0x8000 ? value - 0x10000 : value;
    }

    readUnsignedShort() {
      return this.readShort() & 0xffff;
    }

    readLong() {
      this.ensure(4);
      const value =
        this.view[this.offset] |
        (this.view[this.offset + 1] << 8) |
        (this.view[this.offset + 2] << 16) |
        (this.view[this.offset + 3] << 24);
      this.offset += 4;
      return value;
    }

    readUnsignedLong() {
      return this.readLong() >>> 0;
    }

    readFloat() {
      this.ensure(4);
      const view = new DataView(this.view.buffer, this.view.byteOffset + this.offset, 4);
      const value = view.getFloat32(0, true);
      this.offset += 4;
      return value;
    }

    readString() {
      let result = "";
      while (!this.eof()) {
        const value = this.readByte();
        if (value === 0) {
          break;
        }
        result += String.fromCharCode(value);
      }
      return result;
    }

    skip(size) {
      this.ensure(size);
      this.offset += size;
    }
  }

  class QuakeWebChatClient {
    constructor(ui) {
      this.ui = ui;
      this.logEntries = [];
      this.pendingServerPrint = "";
      this.keepAliveTimer = window.setInterval(() => this.onTick(), 100);
      this.resetRuntime();
      this.restoreSavedConnectionInputs();
      this.bindUi();
      this.renderVersionStamp();
      this.renderPlayers();
    }

    bindUi() {
      this.ui.connectButton.addEventListener("click", () => this.connect());
      this.ui.disconnectButton.addEventListener("click", () => this.disconnect("Disconnected"));
      this.ui.clearButton.addEventListener("click", () => {
        this.clearConsoleLog();
      });
      if (this.ui.copyLogButton) {
        this.ui.copyLogButton.addEventListener("click", () => {
          this.copyConsoleLog();
        });
      }
      document.addEventListener("copy", (event) => {
        this.handleConsoleCopy(event);
      });
      if (this.ui.debugToggle) {
        this.ui.debugToggle.addEventListener("change", () => {
          writeDebugPreference(this.ui.debugToggle.checked);
          this.renderConsoleLog();
          this.updateSessionMeta();
        });
      }
      if (this.ui.centerprintToggle) {
        this.ui.centerprintToggle.addEventListener("change", () => {
          writeCenterprintPreference(this.ui.centerprintToggle.checked);
          this.renderConsoleLog();
        });
      }
      this.ui.composer.addEventListener("submit", (event) => {
        event.preventDefault();
        this.sendFromInput();
      });
      this.ui.messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          this.sendFromInput();
        }
      });
      this.ui.messageInput.addEventListener("input", () => {
        this.handleChatInputActivity();
      });
      this.ui.messageInput.addEventListener("blur", () => {
        this.clearChatInfoStatus();
      });
      this.ui.serverUrl.addEventListener("change", () => {
        this.persistConnectionInputs();
      });
      this.ui.playerName.addEventListener("change", () => {
        this.persistConnectionInputs();
      });
      this.ui.serverUrl.addEventListener("blur", () => {
        this.persistConnectionInputs();
      });
      this.ui.playerName.addEventListener("blur", () => {
        this.persistConnectionInputs();
      });
    }

    resetRuntime() {
      this.ws = null;
      this.accepted = false;
      this.connectRequested = false;
      this.sendSequence = 0;
      this.receiveSequence = 0;
      this.unreliableSendSequence = 0;
      this.outgoingQueue = [];
      this.pendingReliable = null;
      this.pendingReliableSentAt = 0;
      this.reliableFragments = [];
      window.clearTimeout(this.chatInfoTimer);
      this.chatInfoTimer = 0;
      this.chatInfoFlags = 0;
      this.connectClockStart = 0;
      this.lastClientSendAt = 0;
      this.lastKeepAliveAt = 0;
      this.lastMoveSentAt = 0;
      this.lastIncomingAt = 0;
      this.serverTime = null;
      this.serverTimeReceivedAt = 0;
      this.wireQueue = [];
      this.wireDrainScheduled = false;
      this.scrollScheduled = false;
      this.packetStats = {
        txCtl: 0,
        txReliable: 0,
        txUnreliable: 0,
        txAck: 0,
        rxCtl: 0,
        rxReliable: 0,
        rxUnreliable: 0,
        rxAck: 0
      };
      this.protocol = 0;
      this.protocolPext1 = 0;
      this.protocolPext2 = 0;
      this.protocolFlags = 0;
      this.proQuakeAngleHack = false;
      this.signon = 0;
      this.maxClients = 0;
      this.levelName = "";
      this.players = new Map();
      this.viewAngles = [0, 0, 0];
      this.pendingImpulse = 0;
      this.impulseAliases = new Map();
      this.connectedName = "";
      this.currentUrl = "";
      this.waitingForPrespawn = false;
    }

    connect() {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const url = this.ui.serverUrl.value.trim();
      const name = sanitizePlayerName(this.ui.playerName.value);
      if (!url) {
        this.logLocal("Server URL is required.");
        return;
      }

      this.resetRuntime();
      this.connectedName = name;
      this.currentUrl = url;
      this.connectRequested = true;
      this.setStatus("connecting", "connecting", `Connecting to ${url}`);
      this.appendLog(`Connecting to ${formatConnectionTarget(url)}`);
      this.ui.playerName.value = name;
      this.ui.serverUrl.value = url;
      this.persistConnectionInputs();

      try {
        this.ws = new WebSocket(url, ["quake", "fteqw"]);
      } catch (error) {
        this.setStatus("offline", "offline", "Connection failed");
        this.logLocal(`WebSocket setup failed: ${error.message}`);
        return;
      }

      this.ws.binaryType = "arraybuffer";
      this.ws.addEventListener("open", () => this.onSocketOpen());
      this.ws.addEventListener("message", (event) => this.onSocketMessage(event));
      this.ws.addEventListener("close", (event) => this.onSocketClose(event));
      this.ws.addEventListener("error", () => this.onSocketError());

      this.logVerbose(`Opening ${url} as quake/fteqw WebSocket`);
      this.updateInputState();
    }

    disconnect(reason = "Disconnected") {
      if (this.pendingReliable) {
        this.pendingReliable = null;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.sendReliable(this.makeDisconnectCommand(), { immediate: true });
          this.wireFlush();
        } catch (error) {
          this.logLocal(`Disconnect packet failed: ${error.message}`);
        }
        this.ws.close();
      } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
      this.setStatus("offline", "offline", reason);
      this.updateInputState();
    }

    onSocketOpen() {
      this.logVerbose("WebSocket open, sending Quake connect request");
      this.sendConnectRequest();
    }

    onSocketClose(event) {
      const reasonBits = [];
      if (event && typeof event.code === "number") {
        reasonBits.push(`code ${event.code}`);
      }
      if (event && event.reason) {
        reasonBits.push(`reason "${sanitizeText(event.reason)}"`);
      }
      const detail = reasonBits.length ? ` (${reasonBits.join(", ")})` : "";
      const status = this.accepted ? `Connection closed${detail}` : `Connection closed before accept${detail}`;
      this.logLocal(status);
      this.logDebug(this.buildCloseSummary());
      this.setStatus("offline", "offline", status);
      this.updateInputState();
      this.ws = null;
      this.accepted = false;
      this.pendingReliable = null;
      this.wireQueue.length = 0;
    }

    onSocketError() {
      this.logLocal("WebSocket error");
      if (!this.accepted) {
        this.setStatus("offline", "offline", "Socket error");
      }
    }

    onSocketMessage(event) {
      if (!(event.data instanceof ArrayBuffer)) {
        this.logVerbose("Ignoring non-binary WebSocket message");
        return;
      }

      const bytes = new Uint8Array(event.data);
      this.lastIncomingAt = Date.now();

      try {
        this.handleWirePacket(bytes);
      } catch (error) {
        this.logLocal(`Packet error: ${error.message}`);
      }
    }

    onTick() {
      const now = Date.now();

      if (this.pendingReliable && now - this.pendingReliableSentAt > 1000) {
        this.transmitReliable(this.pendingReliable);
        return;
      }

      if (!this.accepted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      if (this.signon >= 3 && now - this.lastMoveSentAt > 100) {
        this.sendMove();
      }

      if (this.signon < 3 && !this.pendingReliable && now - this.lastClientSendAt > 5000) {
        this.sendReliable(this.makeNopCommand(), { quiet: true });
      }
    }

    handleWirePacket(bytes) {
      if (bytes.length < 4) {
        throw new Error("Runt packet");
      }

      const header = readUint32BE(bytes, 0);
      const packetLength = header & NETFLAG_LENGTH_MASK;
      if (packetLength !== bytes.length) {
        throw new Error(`Length mismatch (${packetLength} != ${bytes.length})`);
      }

      if (header & NETFLAG_CTL) {
        this.packetStats.rxCtl += 1;
        this.logTrace(`rx ctl len=${bytes.length}`);
        this.handleControlPacket(bytes);
        return;
      }

      if (bytes.length < NET_HEADERSIZE) {
        throw new Error("Game packet missing sequence");
      }

      const sequence = readUint32BE(bytes, 4);
      const payload = bytes.subarray(NET_HEADERSIZE);

      if (header & NETFLAG_ACK) {
        this.packetStats.rxAck += 1;
        this.logTrace(`rx ack seq=${sequence}`);
        this.handleAck(sequence);
        return;
      }

      if (header & NETFLAG_UNRELIABLE) {
        this.packetStats.rxUnreliable += 1;
        this.logTrace(`rx unreliable seq=${sequence} len=${payload.length}`);
        return;
      }

      if (!(header & NETFLAG_DATA)) {
        this.logDebug(`Ignored packet with unknown flags 0x${(header >>> 0).toString(16)}`);
        return;
      }

      this.packetStats.rxReliable += 1;
      this.logTrace(`rx reliable seq=${sequence} len=${payload.length} eom=${Boolean(header & NETFLAG_EOM)}`);
      this.sendAck(sequence);
      if (sequence !== this.receiveSequence) {
        if (sequence < this.receiveSequence) {
          this.logDebug(`Stale reliable packet ${sequence}`);
        } else {
          this.logLocal(`Dropped reliable packet(s): expected ${this.receiveSequence}, got ${sequence}`);
          this.receiveSequence = sequence + 1;
          this.reliableFragments.length = 0;
        }
        return;
      }

      this.receiveSequence += 1;
      this.reliableFragments.push(payload);

      if (header & NETFLAG_EOM) {
        const message = concatenate(this.reliableFragments);
        this.reliableFragments.length = 0;
        this.handleGameMessage(message);
      }
    }

    handleControlPacket(bytes) {
      const reader = new ByteReader(bytes, 4);
      const reply = reader.readByte();

      if (reply === CCREP_ACCEPT) {
        const port = reader.remaining() >= 4 ? reader.readLong() : 0;
        const mod = reader.remaining() >= 1 ? reader.readByte() : 0;
        const version = reader.remaining() >= 1 ? reader.readByte() : 0;
        const flags = reader.remaining() >= 1 ? reader.readByte() : 0;

        this.accepted = true;
        this.proQuakeAngleHack = mod === 1;
        this.sendSequence = 0;
        this.receiveSequence = 0;
        this.unreliableSendSequence = 0;
        this.reliableFragments.length = 0;
        this.outgoingQueue.length = 0;
        this.pendingReliable = null;
        this.pendingReliableSentAt = 0;
        this.connectClockStart = performance.now();
        this.lastKeepAliveAt = 0;
        this.lastMoveSentAt = 0;
        this.serverTime = null;
        this.serverTimeReceivedAt = 0;

        const acceptNote = mod === 1
          ? `accepted (proquake mod=${mod} ver=${version} flags=0x${flags.toString(16)} port=${port})`
          : "accepted";

        this.logConnectPhase("Connection accepted");
        this.logVerbose(`Server ${acceptNote}`);
        this.setStatus("online", "online", `Connected to ${this.currentUrl}`);
        this.updateInputState();
        this.sendReliable(this.makeNopCommand(), { quiet: true });
        this.logTrace("queued immediate reliable nop after accept");
        return;
      }

      if (reply === CCREP_REJECT) {
        const reason = reader.readString() || "Connection rejected";
        this.logLocal(reason);
        this.setStatus("offline", "offline", reason);
        this.updateInputState();
        if (this.ws) {
          this.ws.close();
        }
        return;
      }

      this.logLocal(`Unhandled control reply 0x${reply.toString(16)}`);
    }

    handleAck(sequence) {
      if (!this.pendingReliable) {
        this.logDebug(`Unexpected ACK ${sequence}`);
        return;
      }

      if (sequence !== this.sendSequence) {
        this.logDebug(`Stale ACK ${sequence}, waiting for ${this.sendSequence}`);
        return;
      }

      this.pendingReliable = null;
      this.pendingReliableSentAt = 0;
      this.sendSequence += 1;
      this.flushReliableQueue();
    }

    handleGameMessage(bytes) {
      const reader = new ByteReader(bytes);

      while (!reader.eof()) {
        const opcode = reader.readByte();

        if (opcode & 0x80) {
          this.logVerbose(`Fast entity update not parsed in text client (opcode 0x${opcode.toString(16)})`);
          return;
        }

        try {
          if (!this.parseServerOpcode(reader, opcode)) {
            return;
          }
        } catch (error) {
          this.logLocal(`Parse error for svc ${opcode}: ${error.message}`);
          return;
        }
      }
    }

    parseServerOpcode(reader, opcode) {
      switch (opcode) {
        case svc_nop:
        case svc_killedmonster:
        case svc_foundsecret:
        case svc_intermission:
        case svc_sellscreen:
        case svc_bf:
          return true;

        case svc_disconnect:
          this.logLocal("Server disconnected");
          if (this.ws) {
            this.ws.close();
          }
          return false;

        case svc_updatestat:
          reader.readByte();
          reader.readLong();
          return true;

        case svc_version:
          this.protocol = reader.readLong();
          this.updateSessionMeta();
          return true;

        case svc_setview:
          reader.readShort();
          return true;

        case svc_sound:
          this.skipSoundPacket(reader);
          return true;

        case svc_time: {
          this.serverTime = reader.readFloat();
          this.serverTimeReceivedAt = performance.now();
          this.logTrace(`svc_time ${this.serverTime.toFixed(3)}`);
          return true;
        }

        case svc_print: {
          const text = reader.readString();
          this.logServer(text);
          return true;
        }

        case svc_stufftext: {
          const text = reader.readString();
          this.handleStuffText(text);
          return true;
        }

        case svc_setangle:
          this.viewAngles[0] = this.readAngle(reader);
          this.viewAngles[1] = this.readAngle(reader);
          this.viewAngles[2] = this.readAngle(reader);
          this.logTrace(`svc_setangle ${this.viewAngles.map((value) => value.toFixed(2)).join(" ")}`);
          return true;

        case svc_serverinfo:
          this.parseServerInfo(reader);
          return true;

        case svc_lightstyle:
          reader.readByte();
          reader.readString();
          return true;

        case svc_updatename:
          this.updatePlayerName(reader.readByte(), reader.readString());
          return true;

        case svc_updatefrags:
          this.updatePlayerFrags(reader.readByte(), reader.readShort());
          return true;

        case svc_clientdata:
          this.skipClientData(reader);
          return true;

        case svc_stopsound:
          reader.readShort();
          return true;

        case svc_updatecolors:
          this.updatePlayerColors(reader.readByte(), reader.readByte());
          return true;

        case svc_particle:
          this.skipParticle(reader);
          return true;

        case svc_damage:
          reader.readByte();
          reader.readByte();
          this.readCoord(reader);
          this.readCoord(reader);
          this.readCoord(reader);
          return true;

        case svc_spawnstatic:
          this.skipBaseline(reader, 1);
          return true;

        case svc_spawnbaseline:
          reader.readUnsignedShort();
          this.skipBaseline(reader, 1);
          return true;

        case svc_temp_entity:
          this.logVerbose("Temp entity packet skipped");
          return false;

        case svc_setpause:
          reader.readByte();
          return true;

        case svc_signonnum:
          this.handleSignon(reader.readByte());
          return true;

        case svc_centerprint:
          this.logCenterprint(reader.readString());
          return true;

        case svc_spawnstaticsound:
          this.skipStaticSound(reader, false);
          return true;

        case svc_finale:
        case svc_cutscene:
          this.logCenterprint(reader.readString());
          return true;

        case svc_cdtrack:
          reader.readByte();
          reader.readByte();
          return true;

        case svc_skybox:
          this.logVerbose(`Skybox: ${reader.readString()}`);
          return true;

        case svc_fog:
          reader.skip(6);
          return true;

        case svc_spawnbaseline2:
          reader.readUnsignedShort();
          this.skipBaseline(reader, 2);
          return true;

        case svc_spawnstatic2:
          this.skipBaseline(reader, 2);
          return true;

        case svc_spawnstaticsound2:
          this.skipStaticSound(reader, true);
          return true;

        case svcdp_precache:
          reader.readUnsignedShort();
          reader.readString();
          return true;

        case svcdp_effect:
          this.readCoord(reader);
          this.readCoord(reader);
          this.readCoord(reader);
          reader.readByte();
          reader.readByte();
          reader.readByte();
          reader.readByte();
          return true;

        case svcdp_effect2:
          this.readCoord(reader);
          this.readCoord(reader);
          this.readCoord(reader);
          reader.readShort();
          reader.readShort();
          reader.readByte();
          reader.readByte();
          return true;

        default:
          this.logLocal(`Unsupported server opcode ${opcode}, dropping rest of packet`);
          return false;
      }
    }

    parseServerInfo(reader) {
      this.protocolPext1 = 0;
      this.protocolPext2 = 0;
      this.protocolFlags = 0;

      for (;;) {
        const value = reader.readLong();
        if (value === PROTOCOL_FTE_PEXT1 || value === PROTOCOL_FTE_PEXT2) {
          const extensionFlags = reader.readUnsignedLong();
          if (value === PROTOCOL_FTE_PEXT1) {
            this.protocolPext1 = extensionFlags;
          } else {
            this.protocolPext2 = extensionFlags;
          }
          continue;
        }

        this.protocol = value;
        break;
      }

      if (this.protocol === PROTOCOL_RMQ) {
        this.protocolFlags = reader.readUnsignedLong();
      } else if (this.protocol === PROTOCOL_VERSION_DP7) {
        this.protocolFlags = PRFL_SHORTANGLE | PRFL_FLOATCOORD;
      }

      this.maxClients = reader.readByte();
      reader.readByte(); // gametype
      this.levelName = reader.readString();
      let firstModelName = "";

      for (;;) {
        const modelName = reader.readString();
        if (!modelName) {
          break;
        }
        if (!firstModelName) {
          firstModelName = modelName;
        }
        // model precaches
      }

      while (reader.readString()) {
        // sound precaches
      }

      if (!this.levelName) {
        this.levelName = mapNameFromModelPath(firstModelName);
      }

      this.appendLog(`Using protocol ${nativeProtocolConsoleLabel(this.protocol, this.protocolPext2)}`);
      this.appendLog("");
      this.appendLog(buildQuakeBar(40));
      this.appendLog("");
      if (this.levelName) {
        this.appendLog(`\u0002${this.levelName}`);
      }

      this.logVerbose(
        `Server info: ${protocolLabel(this.protocol)} level="${sanitizeText(this.levelName)}" maxclients=${this.maxClients}`
      );
      this.updateSessionMeta();
    }

    handleStuffText(text) {
      const trimmed = text.trim();
      if (!trimmed) {
        this.logTrace("stufftext <blank>");
        return;
      }

      if (trimmed === "cmd pext") {
        this.logStuff(text);
        this.logVerbose("Server requested extension probe, replying without optional FTE extensions");
        this.sendCommand("pext 0 0 0 0\n", { raw: true });
        return;
      }

      if (trimmed === "cmd protocols") {
        this.logStuff(text);
        this.logVerbose("Server requested protocol list");
        this.sendCommand("protocols 999 666 10002 15\n", { raw: true });
        return;
      }

      const impulseMatch = trimmed.match(/^impulse\s+(\d+)/);
      if (impulseMatch) {
        this.pendingImpulse = parseInt(impulseMatch[1], 10);
        this.logTrace(`stufftext ${truncateLogText(trimmed, 140)}`);
        this.logStuff(text);
        return;
      }

      const aliasMatch = trimmed.match(/^alias\s+(\S+)\s+"?impulse\s+(\d+)/);
      if (aliasMatch) {
        this.impulseAliases.set(aliasMatch[1], parseInt(aliasMatch[2], 10));
      } else if (this.impulseAliases.has(trimmed)) {
        this.pendingImpulse = this.impulseAliases.get(trimmed);
      }

      this.logTrace(`stufftext ${truncateLogText(trimmed, 140)}`);
      this.logStuff(text);
    }

    handleSignon(stage) {
      if (stage <= this.signon) {
        this.logVerbose(`Ignoring stale signon ${stage}`);
        return;
      }

      this.signon = stage;
      this.updateSessionMeta();

      if (stage === 1) {
        this.logVerbose(`Signon ${stage}: sending initial userinfo, name, color, and prespawn`);
        this.sendCommand(`setinfo "*ver" "${VERSION_STAMP}"\n`, { raw: true });
        this.sendInitialUserinfo({ includeVersion: false });
        this.sendCommand(`name "${escapeQuakeQuoted(this.connectedName)}"\n`, { raw: true });
        this.sendCommand("color 0 0\n", { raw: true });
        this.sendCommand("prespawn", { raw: true });
        return;
      }

      if (stage === 2) {
        this.logVerbose(`Signon ${stage}: sending spawn`);
        this.sendCommand("spawn ", { raw: true });
        return;
      }

      if (stage === 3) {
        this.logVerbose(`Signon ${stage}: sending begin`);
        this.sendCommand("begin", { raw: true });
        this.updateInputState();
        return;
      }

      this.logVerbose(`Signon ${stage}`);
    }

    skipClientData(reader) {
      let bits = reader.readUnsignedShort();

      if (bits & SU_EXTEND1) {
        bits |= reader.readByte() << 16;
      }
      if (bits & SU_EXTEND2) {
        bits |= reader.readByte() << 24;
      }
      if (this.protocol !== PROTOCOL_VERSION_DP7) {
        bits |= SU_ITEMS;
      }

      if (bits & SU_VIEWHEIGHT) {
        reader.readChar();
      }
      if (bits & SU_IDEALPITCH) {
        reader.readChar();
      }

      const punchBits = [SU_PUNCH1, SU_PUNCH2, SU_PUNCH3];
      const velocityBits = [SU_VELOCITY1, SU_VELOCITY2, SU_VELOCITY3];
      const punchVecBits = [DPSU_PUNCHVEC1, DPSU_PUNCHVEC2, DPSU_PUNCHVEC3];

      for (let index = 0; index < 3; index += 1) {
        if (bits & punchBits[index]) {
          if (this.protocol === PROTOCOL_VERSION_DP7) {
            this.readAngle(reader);
          } else {
            reader.readChar();
          }
        }

        if (this.protocol === PROTOCOL_VERSION_DP7 && (bits & punchVecBits[index])) {
          this.readCoord(reader);
        }

        if (bits & velocityBits[index]) {
          if (this.protocol === PROTOCOL_VERSION_DP7) {
            reader.readFloat();
          } else {
            reader.readChar();
          }
        }
      }

      if (bits & SU_ITEMS) {
        reader.readLong();
      }

      if (this.protocol === PROTOCOL_VERSION_DP7) {
        return;
      }

      if (bits & SU_WEAPONFRAME) {
        reader.readByte();
      }
      if (bits & SU_ARMOR) {
        reader.readByte();
      }
      if (bits & SU_WEAPON) {
        if (this.protocol === PROTOCOL_VERSION_BJP3) {
          reader.readShort();
        } else {
          reader.readByte();
        }
      }

      reader.readShort();
      reader.readByte();
      reader.readByte();
      reader.readByte();
      reader.readByte();
      reader.readByte();
      reader.readByte();

      if (bits & SU_WEAPON2) {
        reader.readByte();
      }
      if (bits & SU_ARMOR2) {
        reader.readByte();
      }
      if (bits & SU_AMMO2) {
        reader.readByte();
      }
      if (bits & SU_SHELLS2) {
        reader.readByte();
      }
      if (bits & SU_NAILS2) {
        reader.readByte();
      }
      if (bits & SU_ROCKETS2) {
        reader.readByte();
      }
      if (bits & SU_CELLS2) {
        reader.readByte();
      }
      if (bits & SU_WEAPONFRAME2) {
        reader.readByte();
      }
      if (bits & SU_WEAPONALPHA) {
        reader.readByte();
      }
    }

    skipSoundPacket(reader) {
      let fieldMask = reader.readByte();

      if (this.protocol === PROTOCOL_VERSION_BJP3) {
        fieldMask |= SND_LARGESOUND;
      }

      if (fieldMask & SND_FTE_MOREFLAGS) {
        this.logVerbose("Sound extension flags not supported in web chat, dropping rest of packet");
        throw new Error("Unsupported extended sound flags");
      }

      if (fieldMask & SND_VOLUME) {
        reader.readByte();
      }
      if (fieldMask & SND_ATTENUATION) {
        reader.readByte();
      }
      if (fieldMask & SND_DP_PITCH) {
        if (this.protocol === PROTOCOL_VERSION_DP7) {
          reader.readShort();
        } else {
          throw new Error("Unexpected DP pitch field");
        }
      }
      if (fieldMask & SND_FTE_PITCHADJ) {
        throw new Error("Unexpected FTE pitch field");
      }
      if (fieldMask & SND_FTE_TIMEOFS) {
        throw new Error("Unexpected FTE time offset field");
      }
      if (fieldMask & SND_FTE_VELOCITY) {
        throw new Error("Unexpected FTE velocity field");
      }

      if (fieldMask & SND_LARGEENTITY) {
        reader.readUnsignedShort();
        reader.readByte();
      } else {
        reader.readUnsignedShort();
      }

      if (fieldMask & SND_LARGESOUND) {
        reader.readUnsignedShort();
      } else {
        reader.readByte();
      }

      this.readCoord(reader);
      this.readCoord(reader);
      this.readCoord(reader);
    }

    skipParticle(reader) {
      this.readCoord(reader);
      this.readCoord(reader);
      this.readCoord(reader);
      reader.readChar();
      reader.readChar();
      reader.readChar();
      reader.readByte();
      reader.readByte();
    }

    skipStaticSound(reader, largeSoundIndex) {
      this.readCoord(reader);
      this.readCoord(reader);
      this.readCoord(reader);
      if (largeSoundIndex) {
        reader.readUnsignedShort();
      } else {
        reader.readByte();
      }
      reader.readByte();
      reader.readByte();
    }

    skipBaseline(reader, version) {
      let bits = 0;
      if (this.protocol === PROTOCOL_VERSION_BJP3 && version === 1) {
        bits = B_LARGEMODEL;
      } else if (version === 2) {
        bits = reader.readByte();
      }

      if (bits & B_LARGEMODEL) {
        reader.readUnsignedShort();
      } else {
        reader.readByte();
      }

      if (bits & B_LARGEFRAME) {
        reader.readUnsignedShort();
      } else {
        reader.readByte();
      }

      reader.readByte();
      reader.readByte();

      for (let index = 0; index < 3; index += 1) {
        this.readCoord(reader);
        this.readAngle(reader);
      }

      if (bits & B_ALPHA) {
        reader.readByte();
      }
      if (bits & B_SCALE) {
        reader.readByte();
      }
    }

    readCoord(reader) {
      if (this.protocolFlags & PRFL_FLOATCOORD) {
        return reader.readFloat();
      }
      if (this.protocolFlags & PRFL_INT32COORD) {
        return reader.readLong() / 16;
      }
      if (this.protocolFlags & PRFL_24BITCOORD) {
        return reader.readShort() + reader.readByte() * (1 / 255);
      }
      return reader.readShort() / 8;
    }

    readAngle(reader) {
      if (this.protocolFlags & PRFL_FLOATANGLE) {
        return reader.readFloat();
      }
      if (this.protocolFlags & PRFL_SHORTANGLE) {
        return reader.readUnsignedShort() * (360 / 65536);
      }
      return reader.readChar() * (360 / 256);
    }

    updatePlayerName(slot, name) {
      const player = this.getPlayer(slot);
      player.name = name;
      this.renderPlayers();
    }

    updatePlayerFrags(slot, frags) {
      const player = this.getPlayer(slot);
      player.frags = frags;
      this.renderPlayers();
    }

    updatePlayerColors(slot, colors) {
      const player = this.getPlayer(slot);
      player.colors = colors;
      this.renderPlayers();
    }

    getPlayer(slot) {
      if (!this.players.has(slot)) {
        this.players.set(slot, {
          slot,
          name: "",
          frags: 0,
          colors: 0
        });
      }
      return this.players.get(slot);
    }

    renderPlayers() {
      const rows = Array.from(this.players.values())
        .filter((player) => player.name)
        .sort((left, right) => right.frags - left.frags || left.slot - right.slot);

      this.ui.playersBody.textContent = "";

      if (!rows.length) {
        return;
      }

      for (const player of rows) {
        const row = document.createElement("tr");
        const displayName = formatDisplayedPlayerName(player.name);
        if (displayName.slice(0, 15).toLowerCase() === this.connectedName.toLowerCase()) {
          row.classList.add("self");
        }

        const nameCell = document.createElement("td");
        nameCell.className = "name";
        nameCell.appendChild(buildQuakeNameElement(displayName));

        const fragsCell = document.createElement("td");
        fragsCell.className = "frags";
        fragsCell.appendChild(buildQuakeGlyphTextElement(String(player.frags), "span", "quake-run quake-frags"));

        row.appendChild(nameCell);
        row.appendChild(fragsCell);
        this.ui.playersBody.appendChild(row);
      }
    }

    makeDisconnectCommand() {
      const writer = new ByteWriter();
      writer.writeByte(clc_disconnect);
      return writer.finish();
    }

    makeNopCommand() {
      const writer = new ByteWriter();
      writer.writeByte(clc_nop);
      return writer.finish();
    }

    makeStringCommand(command) {
      const writer = new ByteWriter();
      writer.writeByte(clc_stringcmd);
      writer.writeString(command);
      return writer.finish();
    }

    makeMoveCommand(forward = 1, impulse = 0) {
      const writer = new ByteWriter();
      writer.writeByte(clc_move);
      writer.writeFloat(this.currentClientTime());

      this.writeMoveAngle(writer, this.viewAngles[0] || 0);
      this.writeMoveAngle(writer, this.viewAngles[1] || 0);
      this.writeMoveAngle(writer, this.viewAngles[2] || 0);

      writer.writeShort(forward);
      writer.writeShort(0);
      writer.writeShort(0);
      writer.writeByte(0);
      writer.writeByte(impulse & 0xff);
      return writer.finish();
    }

    sendInitialUserinfo(options = {}) {
      const includeVersion = options.includeVersion !== false;
      const entries = [
        ["topcolor", "0"],
        ["bottomcolor", "0"],
        ["w_switch", "0"],
        ["b_switch", "0"],
        ["f_status", "on"],
        ["chat", "0"],
        ["observing", "off"]
      ];

      if (includeVersion) {
        entries.push(["*ver", VERSION_STAMP]);
      }

      for (const [key, value] of entries) {
        this.sendCommand(`setinfo "${key}" "${value}"\n`, { raw: true });
      }
    }

    sendChatInfo(flags) {
      const chatValue = (flags & CIF_AFK) ? CIF_AFK : (flags & CIF_CHAT) ? CIF_CHAT : 0;
      if (chatValue === this.chatInfoFlags) {
        return;
      }

      this.chatInfoFlags = chatValue;
      if (!this.accepted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      this.sendCommand(`setinfo chat ${chatValue}\n`, { raw: true });
    }

    resetChatInfoIdleTimer() {
      window.clearTimeout(this.chatInfoTimer);
      this.chatInfoTimer = window.setTimeout(() => {
        this.chatInfoTimer = 0;
        this.sendChatInfo(0);
      }, CHAT_INFO_RESET_DELAY);
    }

    handleChatInputActivity() {
      if (!this.ui.messageInput || this.ui.messageInput.disabled) {
        return;
      }

      if (!this.ui.messageInput.value) {
        this.clearChatInfoStatus();
        return;
      }

      this.sendChatInfo(CIF_CHAT);
      this.resetChatInfoIdleTimer();
    }

    clearChatInfoStatus() {
      window.clearTimeout(this.chatInfoTimer);
      this.chatInfoTimer = 0;
      this.sendChatInfo(0);
    }

    currentClientTime() {
      if (this.serverTime !== null && this.serverTimeReceivedAt) {
        return this.serverTime + (performance.now() - this.serverTimeReceivedAt) / 1000;
      }

      if (!this.connectClockStart) {
        return 0;
      }

      return (performance.now() - this.connectClockStart) / 1000;
    }

    sendMove() {
      const impulse = this.pendingImpulse;
      this.pendingImpulse = 0;
      this.sendUnreliable(this.makeMoveCommand(1, impulse));
      this.lastMoveSentAt = Date.now();
    }

    writeMoveAngle(writer, degrees) {
      const normalized = Number.isFinite(degrees) ? degrees : 0;
      const useByteAngles =
        (this.protocol === PROTOCOL_NETQUAKE || this.protocol === PROTOCOL_VERSION_BJP3) &&
        !this.proQuakeAngleHack;

      if (useByteAngles) {
        writer.writeByte(Math.round((normalized * 256) / 360) & 0xff);
        return;
      }

      writer.writeShort(Math.round((normalized * 65536) / 360) & 0xffff);
    }

    wireSend(packet) {
      this.wireQueue.push(packet);
      if (!this.wireDrainScheduled) {
        this.wireDrainScheduled = true;
        setTimeout(() => this.wireDrain(), 0);
      }
    }

    wireDrain() {
      this.wireDrainScheduled = false;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.wireQueue.length = 0;
        return;
      }
      while (this.wireQueue.length > 0) {
        this.ws.send(this.wireQueue.shift());
      }
    }

    wireFlush() {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.wireQueue.length = 0;
        return;
      }
      while (this.wireQueue.length > 0) {
        this.ws.send(this.wireQueue.shift());
      }
    }

    sendConnectRequest() {
      const writer = new ByteWriter();
      writer.writeByte(CCREQ_CONNECT);
      writer.writeString("QUAKE");
      writer.writeByte(NET_PROTOCOL_VERSION);
      this.sendControl(writer.finish());
    }

    sendControl(body) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const packet = new Uint8Array(body.length + 4);
      writeUint32BE(packet, 0, (body.length + 4) | NETFLAG_CTL);
      packet.set(body, 4);
      this.ws.send(packet);
      this.packetStats.txCtl += 1;
      this.lastClientSendAt = Date.now();
      this.logTrace(`tx ctl len=${packet.length}`);
    }

    sendUnreliable(body) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const payload = body instanceof Uint8Array ? body : new Uint8Array(body);
      const sequence = this.unreliableSendSequence >>> 0;
      const packet = new Uint8Array(payload.length + NET_HEADERSIZE);
      writeUint32BE(packet, 0, (payload.length + NET_HEADERSIZE) | NETFLAG_UNRELIABLE);
      writeUint32BE(packet, 4, sequence);
      this.unreliableSendSequence = (this.unreliableSendSequence + 1) >>> 0;
      packet.set(payload, NET_HEADERSIZE);
      this.wireSend(packet);
      this.packetStats.txUnreliable += 1;
      this.lastClientSendAt = Date.now();
      this.logTrace(`tx unreliable seq=${sequence} len=${payload.length} ${this.describeClientPayload(payload)}`);
    }

    sendAck(sequence) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const packet = new Uint8Array(8);
      writeUint32BE(packet, 0, NET_HEADERSIZE | NETFLAG_ACK);
      writeUint32BE(packet, 4, sequence);
      this.wireSend(packet);
      this.packetStats.txAck += 1;
      this.lastClientSendAt = Date.now();
      this.logTrace(`tx ack seq=${sequence}`);
    }

    sendReliable(body, options = {}) {
      if (!this.accepted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const payload = body instanceof Uint8Array ? body : new Uint8Array(body);
      this.outgoingQueue.push({
        payload,
        quiet: Boolean(options.quiet),
        description: this.describeClientPayload(payload)
      });
      if (options.immediate && !this.pendingReliable) {
        this.flushReliableQueue();
        return;
      }
      this.flushReliableQueue();
    }

    flushReliableQueue() {
      if (this.pendingReliable || !this.outgoingQueue.length) {
        return;
      }

      const next = this.outgoingQueue.shift();
      this.pendingReliable = next;
      this.transmitReliable(next);
    }

    transmitReliable(entry) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const packet = new Uint8Array(entry.payload.length + NET_HEADERSIZE);
      writeUint32BE(packet, 0, (entry.payload.length + NET_HEADERSIZE) | NETFLAG_DATA | NETFLAG_EOM);
      writeUint32BE(packet, 4, this.sendSequence);
      packet.set(entry.payload, NET_HEADERSIZE);
      this.wireSend(packet);
      this.packetStats.txReliable += 1;
      this.lastClientSendAt = Date.now();
      this.pendingReliableSentAt = this.lastClientSendAt;
      this.logTrace(`tx reliable seq=${this.sendSequence} len=${entry.payload.length} ${entry.description}`);

      if (!entry.quiet) {
        this.logDebug(`Sent reliable seq=${this.sendSequence} size=${entry.payload.length}`);
      }
    }

    sendCommand(text, options = {}) {
      const raw = Boolean(options.raw);
      const command = raw ? text : buildChatCommand(text);
      if (!command) {
        return;
      }

      this.sendReliable(this.makeStringCommand(command));
    }

    sendFromInput() {
      const value = this.ui.messageInput.value.trim();
      if (!value) {
        return;
      }

      if (value.startsWith("/")) {
        const raw = value.slice(1).trim();
        if (raw) {
          this.sendCommand(raw.endsWith("\n") ? raw : `${raw}\n`, { raw: true });
          this.appendLog(raw);
        }
      } else {
        this.sendCommand(value);
      }

      this.ui.messageInput.value = "";
      this.clearChatInfoStatus();
    }

    async copyConsoleLog() {
      const text = this.getSelectedConsoleText() || this.getVisibleLogText();
      if (!text.trim()) {
        this.flashCopyButton("error", "Nothing to copy");
        return;
      }

      const copied = await copyTextToClipboard(text);
      if (copied) {
        this.flashCopyButton("copied", "Server output copied");
        return;
      }

      this.flashCopyButton("error", "Clipboard copy failed");
    }

    handleConsoleCopy(event) {
      const text = this.getSelectedConsoleText();
      if (!text) {
        return;
      }

      if (event.clipboardData) {
        event.preventDefault();
        event.clipboardData.setData("text/plain", text);
        this.flashCopyButton("copied", "Server output copied");
      }
    }

    flashCopyButton(state, title) {
      if (!this.ui.copyLogButton) {
        return;
      }

      const button = this.ui.copyLogButton;
      const defaultTitle = "Copy Server Output";
      button.dataset.state = state;
      button.title = title || defaultTitle;
      button.setAttribute("aria-label", title || defaultTitle);

      window.clearTimeout(this.copyButtonTimer);
      this.copyButtonTimer = window.setTimeout(() => {
        button.dataset.state = "";
        button.title = defaultTitle;
        button.setAttribute("aria-label", defaultTitle);
      }, 1400);
    }

    setStatus(kind, badge, meta) {
      this.ui.statusBadge.textContent = kind;
      this.ui.statusBadge.className = `badge badge-${badge}`;
      if (this.ui.sessionMeta) {
        this.ui.sessionMeta.textContent = meta;
      }
    }

    updateSessionMeta() {
      const parts = [];
      if (this.currentUrl) {
        parts.push(this.currentUrl);
      }
      if (this.protocol) {
        parts.push(`protocol ${protocolLabel(this.protocol)}`);
      }
      if (this.levelName) {
        parts.push(`level ${sanitizeText(this.levelName)}`);
      }
      if (this.signon && this.isDebugEnabled()) {
        parts.push(`signon ${this.signon}`);
      }

      if (!parts.length) {
        parts.push("No connection");
      }

      if (this.ui.sessionMeta) {
        this.ui.sessionMeta.textContent = parts.join(" | ");
      }
    }

    updateInputState() {
      const online = this.accepted && this.ws && this.ws.readyState === WebSocket.OPEN;
      const readyToChat = online && this.signon >= 3;

      this.ui.connectButton.disabled = online || (this.ws && this.ws.readyState === WebSocket.CONNECTING);
      this.ui.disconnectButton.disabled = !this.ws;
      this.ui.playerName.disabled = online;
      this.ui.serverUrl.disabled = online;
      this.ui.messageInput.disabled = !readyToChat;
      this.ui.sendButton.disabled = !readyToChat;

      if (!readyToChat) {
        this.clearChatInfoStatus();
      }
    }

    renderVersionStamp() {
      if (!this.ui.consoleVersion) {
        return;
      }

      const stamp = buildQuakeGlyphTextElement(VERSION_STAMP, "span", "quake-run console-version-glyphs");
      stamp.setAttribute("aria-label", VERSION_STAMP);
      this.ui.consoleVersion.replaceChildren(stamp);
    }

    restoreSavedConnectionInputs() {
      const savedServer = readCookiePreference(LAST_SERVER_COOKIE_NAME);
      if (savedServer) {
        this.ui.serverUrl.value = savedServer;
      }

      const savedName = readCookiePreference(LAST_NAME_COOKIE_NAME);
      if (savedName) {
        this.ui.playerName.value = sanitizePlayerName(savedName);
      }
    }

    persistConnectionInputs() {
      const serverUrl = String(this.ui.serverUrl.value || "").trim();
      const playerName = sanitizePlayerName(this.ui.playerName.value);
      this.ui.playerName.value = playerName;

      if (serverUrl) {
        writeCookiePreference(LAST_SERVER_COOKIE_NAME, serverUrl);
      }
      if (playerName) {
        writeCookiePreference(LAST_NAME_COOKIE_NAME, playerName);
      }
    }

    logServer(text) {
      this.appendServerLog(text);
    }

    logConnectPhase(text) {
      this.appendLog(`\u0002${text}`);
    }

    logLocal(text) {
      this.appendLog(`[local] ${text}`, { debug: true });
    }

    logVerbose(text) {
      this.appendLog(`[local] ${text}`, { debug: true });
    }

    logStuff(text) {
      this.appendLog(`[stuff] ${text}`, { debug: true });
    }

    logCenterprint(text) {
      this.appendLog(`[center] ${text}`, { centerprint: true });
    }

    logDebug(text) {
      this.appendLog(`[debug] ${text}`, { debug: true });
    }

    logTrace(text) {
      this.appendLog(`[trace] ${text}`, { debug: true });
    }

    isDebugEnabled() {
      return Boolean(this.ui.debugToggle && this.ui.debugToggle.checked);
    }

    isCenterprintEnabled() {
      return Boolean(this.ui.centerprintToggle && this.ui.centerprintToggle.checked);
    }

    shouldShowLogEntry(entry) {
      if (entry.debug && !this.isDebugEnabled()) {
        return false;
      }
      if (entry.centerprint && !this.isCenterprintEnabled()) {
        return false;
      }
      return true;
    }

    getVisibleLogEntries() {
      return this.logEntries.filter((entry) => this.shouldShowLogEntry(entry));
    }

    getVisibleLogText() {
      return this.getVisibleLogEntries().map((entry) => entry.text).join("\n");
    }

    getSelectedConsoleText() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount < 1) {
        return "";
      }

      const texts = [];
      const seenLines = new Set();
      for (let index = 0; index < selection.rangeCount; index += 1) {
        const range = selection.getRangeAt(index);
        if (!rangeIntersectsNode(range, this.ui.consoleLog)) {
          continue;
        }

        const lines = this.ui.consoleLog.querySelectorAll(".console-line");
        for (const line of lines) {
          if (seenLines.has(line) || !rangeIntersectsNode(range, line)) {
            continue;
          }

          texts.push(line.dataset.plainText || line.getAttribute("aria-label") || "");
          seenLines.add(line);
        }
      }

      return texts.join("\n");
    }

    clearConsoleLog() {
      this.logEntries.length = 0;
      this.pendingServerPrint = "";
      this.ui.consoleLog.replaceChildren();
    }

    renderConsoleLog() {
      const fragment = document.createDocumentFragment();
      for (const entry of this.getVisibleLogEntries()) {
        fragment.appendChild(buildQuakeConsoleLineElement(entry.rawText, entry.text));
      }

      this.ui.consoleLog.replaceChildren(fragment);
      this.scheduleLogScroll();
    }

    describeClientPayload(payload) {
      if (!payload || !payload.length) {
        return "payload=empty";
      }

      const opcode = payload[0];
      switch (opcode) {
        case clc_nop:
          return "clc_nop";
        case clc_disconnect:
          return "clc_disconnect";
        case clc_stringcmd: {
          try {
            const reader = new ByteReader(payload, 1);
            return `clc_stringcmd "${truncateLogText(reader.readString(), 90)}"`;
          } catch (error) {
            return `clc_stringcmd <parse-error ${error.message}>`;
          }
        }
        case clc_move:
          return `clc_move len=${payload.length}`;
        default:
          return `opcode=${opcode} len=${payload.length}`;
      }
    }

    buildCloseSummary() {
      const uptime = this.connectClockStart ? ((performance.now() - this.connectClockStart) / 1000).toFixed(1) : "0.0";
      const rxGap = this.lastIncomingAt ? ((Date.now() - this.lastIncomingAt) / 1000).toFixed(1) : "n/a";
      const txGap = this.lastClientSendAt ? ((Date.now() - this.lastClientSendAt) / 1000).toFixed(1) : "n/a";
      const pending = this.pendingReliable ? this.pendingReliable.payload.length : 0;
      return `Close summary: uptime=${uptime}s signon=${this.signon} rxGap=${rxGap}s txGap=${txGap}s pending=${pending} queue=${this.outgoingQueue.length} tx{ctl=${this.packetStats.txCtl},rel=${this.packetStats.txReliable},unrel=${this.packetStats.txUnreliable},ack=${this.packetStats.txAck}} rx{ctl=${this.packetStats.rxCtl},rel=${this.packetStats.rxReliable},unrel=${this.packetStats.rxUnreliable},ack=${this.packetStats.rxAck}}`;
    }

    appendServerLog(text, { debug = false, centerprint = false } = {}) {
      const parts = splitQuakeConsoleLines(text);

      if (parts.length === 1) {
        this.pendingServerPrint += parts[0];
        return;
      }

      parts[0] = this.pendingServerPrint + parts[0];
      this.pendingServerPrint = "";

      for (let index = 0; index < parts.length - 1; index += 1) {
        this.appendLogEntry(parts[index], { debug, centerprint });
      }

      this.pendingServerPrint = parts[parts.length - 1];
      if (isStyleOnlyQuakeText(this.pendingServerPrint)) {
        this.pendingServerPrint = "";
      }
    }

    appendLog(text, { debug = false, centerprint = false } = {}) {
      if (this.pendingServerPrint) {
        this.appendLogEntry(this.pendingServerPrint);
        this.pendingServerPrint = "";
      }

      const lines = splitQuakeConsoleLines(text);
      const lastIndex = lines.length - 1;
      for (let index = 0; index < lines.length; index += 1) {
        if (index === lastIndex && isStyleOnlyQuakeText(lines[index]) && lines.length > 1) {
          continue;
        }
        this.appendLogEntry(lines[index], { debug, centerprint });
      }
    }

    appendLogEntry(rawText, { debug = false, centerprint = false } = {}) {
      const line = normalizeQuakeConsoleText(rawText);
      const entry = { rawText: line, text: quakeConsoleTextToPlainText(line), debug, centerprint };
      this.logEntries.push(entry);
      if (!this.shouldShowLogEntry(entry)) {
        return;
      }

      this.ui.consoleLog.appendChild(buildQuakeConsoleLineElement(entry.rawText, entry.text));
      this.scheduleLogScroll();
    }

    scheduleLogScroll() {
      if (this.scrollScheduled) {
        return;
      }

      this.scrollScheduled = true;
      requestAnimationFrame(() => {
        this.scrollScheduled = false;
        this.ui.consoleLog.scrollTop = this.ui.consoleLog.scrollHeight;
      });
    }
  }

  function concatenate(chunks) {
    let size = 0;
    for (const chunk of chunks) {
      size += chunk.length;
    }

    const merged = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  function writeUint32BE(buffer, offset, value) {
    buffer[offset] = (value >>> 24) & 0xff;
    buffer[offset + 1] = (value >>> 16) & 0xff;
    buffer[offset + 2] = (value >>> 8) & 0xff;
    buffer[offset + 3] = value & 0xff;
  }

  function readUint32BE(buffer, offset) {
    return (
      ((buffer[offset] << 24) >>> 0) |
      (buffer[offset + 1] << 16) |
      (buffer[offset + 2] << 8) |
      buffer[offset + 3]
    ) >>> 0;
  }

  function protocolLabel(protocol) {
    return protocolNames[protocol] || String(protocol);
  }

  function formatConnectionTarget(value) {
    return String(value || "").replace(/^wss?:\/\//i, "");
  }

  function nativeProtocolConsoleLabel(protocol, protocolPext2) {
    if (protocolPext2 & PEXT2_REPLACEMENTDELTAS) {
      return `fte${protocol}`;
    }
    return String(protocol);
  }

  function buildQuakeBar(length) {
    const barLength = Math.max(2, Number.isFinite(length) ? Math.floor(length) : 40);
    return (
      String.fromCharCode(29) +
      String.fromCharCode(30).repeat(Math.max(0, barLength - 2)) +
      String.fromCharCode(31)
    );
  }

  function mapNameFromModelPath(value) {
    const text = String(value || "");
    const parts = text.split("/");
    const lastPart = parts[parts.length - 1] || "";
    return lastPart.replace(/\.[^.]*$/, "");
  }

  function buildChatCommand(value) {
    const text = value.replace(/[\r\n]+/g, " ").trim();
    if (!text) {
      return "";
    }
    return `say "${escapeQuakeQuoted(text)}"\n`;
  }

  function escapeQuakeQuoted(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/[\r\n]+/g, " ");
  }

  function sanitizePlayerName(value) {
    const fallback = "webchat";
    const trimmed = String(value || "")
      .replace(/["\\]/g, "")
      .replace(/[^\x20-\x7e]/g, "")
      .trim();

    return (trimmed || fallback).slice(0, 15);
  }

  function sanitizeText(value) {
    return value
      .replace(/\r/g, "")
      .replace(/[^\x09\x0a\x20-\x7e]/g, "");
  }

  function normalizeQuakeConsoleText(value) {
    return String(value ?? "").replace(/\r/g, "");
  }

  function splitQuakeConsoleLines(value) {
    const text = normalizeQuakeConsoleText(value);
    const lines = [];
    let current = "";
    let maskActive = false;
    let index = 0;

    const firstCode = text.charCodeAt(0);
    if (firstCode === 1 || firstCode === 2) {
      maskActive = true;
      current = "\u0002";
      index = 1;
    }

    while (index < text.length) {
      if (text.charCodeAt(index) === 10) {
        lines.push(current);
        current = maskActive ? "\u0002" : "";
        index += 1;
        continue;
      }

      if (text[index] === "^" && text[index + 1] === "m") {
        current += "^m";
        maskActive = !maskActive;
        index += 2;
        continue;
      }

      current += text[index];
      index += 1;
    }

    lines.push(current);
    return lines;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatQuakeGlyphCode(value) {
    return String(value & 0xff).padStart(3, "0");
  }

  function buildQuakeGlyphElement(value) {
    const glyph = document.createElement("img");
    glyph.className = "quake-glyph";
    glyph.src = `${QUAKE_CHAR_IMAGE_BASE}/${formatQuakeGlyphCode(value)}.gif`;
    glyph.alt = "";
    glyph.setAttribute("aria-hidden", "true");
    return glyph;
  }

  function buildQuakeGlyphTextElement(value, tagName, className) {
    const element = document.createElement(tagName);
    element.className = className;

    for (let index = 0; index < value.length; index += 1) {
      element.appendChild(buildQuakeGlyphElement(value.charCodeAt(index)));
    }

    return element;
  }

  function buildQuakeNameElement(value) {
    return buildQuakeGlyphTextElement(value, "span", "quake-run quake-name");
  }

  function buildQuakeConsoleLineElement(value, plainText = "") {
    const parsed = parseQuakeConsoleText(value);
    const line = document.createElement("div");
    line.className = "quake-run console-line";
    line.dataset.plainText = plainText || parsed.plainText;

    for (const glyphCode of parsed.glyphCodes) {
      line.appendChild(buildQuakeGlyphElement(glyphCode));
    }

    if (!parsed.glyphCodes.length) {
      const spacer = document.createElement("span");
      spacer.className = "console-line-spacer";
      line.appendChild(spacer);
    }
    line.setAttribute("aria-label", plainText || parsed.plainText);
    return line;
  }

  function formatDisplayedPlayerName(value) {
    const text = String(value || "");
    if (text.length <= 15) {
      return text.replace(/ +$/g, "");
    }

    const namePart = text.slice(0, 15).replace(/ +$/g, "");
    const statusPart = text.slice(15).replace(/^ +/g, "");
    if (!statusPart) {
      return namePart;
    }

    if (!namePart) {
      return statusPart;
    }

    return `${namePart} ${statusPart}`;
  }

  function truncateLogText(value, maxLength = 80) {
    const text = quakeConsoleTextToPlainText(String(value ?? ""));
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
  }

  function parseQuakeConsoleText(value) {
    const text = normalizeQuakeConsoleText(value);
    const glyphCodes = [];
    const plainChars = [];
    let mask = 0;
    let index = 0;

    const firstCode = text.charCodeAt(0);
    if (firstCode === 1 || firstCode === 2) {
      mask = 128;
      index = 1;
    }

    while (index < text.length) {
      let code = text.charCodeAt(index);

      if (code === 94 && index + 1 < text.length) {
        const next = text[index + 1];

        if (next === "^") {
          code = 94;
          index += 2;
        } else if (next === "m") {
          mask ^= 128;
          index += 2;
          continue;
        } else if ("0123456789hbdsr[]".includes(next)) {
          index += 2;
          continue;
        } else if (next === "&" && index + 3 < text.length) {
          index += 4;
          continue;
        } else if (
          next === "x" &&
          index + 4 < text.length &&
          isQuakeHexDigit(text[index + 2]) &&
          isQuakeHexDigit(text[index + 3]) &&
          isQuakeHexDigit(text[index + 4])
        ) {
          index += 5;
          continue;
        } else {
          code = 94;
          index += 1;
        }
      } else {
        index += 1;
      }

      if (code === 10) {
        continue;
      }

      glyphCodes.push((code & 0x7f) | mask);
      plainChars.push(quakeGlyphCodeToPlainText(code));
    }

    return {
      glyphCodes,
      plainText: plainChars.join("").trimEnd()
    };
  }

  function quakeConsoleTextToPlainText(value) {
    return parseQuakeConsoleText(value).plainText;
  }

  function isStyleOnlyQuakeText(value) {
    return parseQuakeConsoleText(value).glyphCodes.length === 0;
  }

  function quakeGlyphCodeToPlainText(value) {
    const code = value & 0x7f;
    if (code === 9) {
      return "\t";
    }
    if (code >= 32 && code <= 126) {
      return String.fromCharCode(code);
    }
    return " ";
  }

  function isQuakeHexDigit(value) {
    return /^[0-9a-f]$/i.test(value);
  }

  function rangeIntersectsNode(range, node) {
    try {
      return range.intersectsNode(node);
    } catch (error) {
      return false;
    }
  }

  function readDebugPreference() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("debug")) {
        return params.get("debug") !== "0";
      }
    } catch (error) {
      // ignore URL parse issues
    }

    try {
      return window.localStorage.getItem(DEBUG_PREFERENCE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function readCenterprintPreference() {
    try {
      return window.localStorage.getItem(CENTERPRINT_PREFERENCE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeDebugPreference(enabled) {
    try {
      window.localStorage.setItem(DEBUG_PREFERENCE_KEY, enabled ? "1" : "0");
    } catch (error) {
      // ignore storage issues
    }
  }

  function writeCenterprintPreference(enabled) {
    try {
      window.localStorage.setItem(CENTERPRINT_PREFERENCE_KEY, enabled ? "1" : "0");
    } catch (error) {
      // ignore storage issues
    }
  }

  function readCookiePreference(name) {
    try {
      const prefix = `${encodeURIComponent(name)}=`;
      const parts = document.cookie ? document.cookie.split(/;\s*/) : [];
      for (const part of parts) {
        if (!part.startsWith(prefix)) {
          continue;
        }
        return decodeURIComponent(part.slice(prefix.length));
      }
    } catch (error) {
      // ignore cookie parse issues
    }
    return "";
  }

  function writeCookiePreference(name, value) {
    try {
      document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch (error) {
      // ignore cookie write issues
    }
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // fall through to legacy copy path
      }
    }

    const scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "readonly");
    scratch.style.position = "fixed";
    scratch.style.top = "-1000px";
    scratch.style.left = "-1000px";
    document.body.appendChild(scratch);
    scratch.select();
    scratch.setSelectionRange(0, scratch.value.length);

    try {
      return document.execCommand("copy");
    } catch (error) {
      return false;
    } finally {
      document.body.removeChild(scratch);
    }
  }

  const ui = {
    serverUrl: document.getElementById("serverUrl"),
    playerName: document.getElementById("playerName"),
    connectButton: document.getElementById("connectButton"),
    disconnectButton: document.getElementById("disconnectButton"),
    clearButton: document.getElementById("clearButton"),
    copyLogButton: document.getElementById("copyLogButton"),
    statusBadge: document.getElementById("statusBadge"),
    sessionMeta: document.getElementById("sessionMeta"),
    centerprintToggle: document.getElementById("centerprintToggle"),
    debugToggle: document.getElementById("debugToggle"),
    consoleLog: document.getElementById("consoleLog"),
    consoleVersion: document.getElementById("consoleVersion"),
    composer: document.getElementById("composer"),
    messageInput: document.getElementById("messageInput"),
    sendButton: document.getElementById("sendButton"),
    playersBody: document.getElementById("playersBody"),
    playerSummary: document.getElementById("playerSummary")
  };

  if (ui.debugToggle) {
    ui.debugToggle.checked = readDebugPreference();
  }
  if (ui.centerprintToggle) {
    ui.centerprintToggle.checked = readCenterprintPreference();
  }

  window.qssmWebChat = new QuakeWebChatClient(ui);
}());
