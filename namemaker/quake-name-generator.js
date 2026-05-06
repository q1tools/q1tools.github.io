/*
 * quake-name-generator.js
 *
 * Random Quake 1 raw-name generator.
 *
 * Produces raw byte-string names as hex, using the same idea as QSS-M/id1/backups/names.json:
 * - ASCII bytes 0x20-0x7E for normal characters
 * - high bytes 0x80-0xFF for colored/gold Quake conchars
 * - wrapper bytes, separators, punctuation, colored letters, colored digits
 *
 * Works in browser or Node.
 *
 * Example:
 *   const name = QuakeNameGenerator.generateName();
 *   console.log(name.name_hex, name.preview_approx);
 *
 *   const list = QuakeNameGenerator.generateMany(100);
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.QuakeNameGenerator = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Byte helpers
  // ---------------------------------------------------------------------------

  function asciiBytes(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c > 0xff) throw new Error("Only byte-sized characters are supported.");
      out.push(c & 0xff);
    }
    return out;
  }

  function hexByte(n) {
    return (n & 0xff).toString(16).padStart(2, "0");
  }

  function bytesToHex(bytes) {
    return bytes.map(hexByte).join("");
  }

  function hexToBytes(hex) {
    if (hex.length % 2 !== 0) throw new Error("Hex string length must be even.");
    const out = [];
    for (let i = 0; i < hex.length; i += 2) {
      out.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return out;
  }

  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  function chance(p) {
    return Math.random() < p;
  }

  function pick(arr) {
    return arr[randInt(arr.length)];
  }

  function maybe(bytes, p) {
    return chance(p) ? bytes : [];
  }

  function concatParts(parts) {
    const out = [];
    for (const part of parts) out.push(...part);
    return out;
  }

  function trimToMax(bytes, maxBytes) {
    if (bytes.length <= maxBytes) return bytes;
    return bytes.slice(0, maxBytes);
  }

  // ---------------------------------------------------------------------------
  // Quake conchar-ish byte maps
  // ---------------------------------------------------------------------------

  const LOWER_HIGH = {
    a: 0xe1, b: 0xe2, c: 0xe3, d: 0xe4, e: 0xe5, f: 0xe6, g: 0xe7,
    h: 0xe8, i: 0xe9, j: 0xea, k: 0xeb, l: 0xec, m: 0xed, n: 0xee,
    o: 0xef, p: 0xf0, q: 0xf1, r: 0xf2, s: 0xf3, t: 0xf4, u: 0xf5,
    v: 0xf6, w: 0xf7, x: 0xf8, y: 0xf9, z: 0xfa
  };

  const UPPER_HIGH = {
    A: 0xc1, B: 0xc2, C: 0xc3, D: 0xc4, E: 0xc5, F: 0xc6, G: 0xc7,
    H: 0xc8, I: 0xc9, J: 0xca, K: 0xcb, L: 0xcc, M: 0xcd, N: 0xce,
    O: 0xcf, P: 0xd0, Q: 0xd1, R: 0xd2, S: 0xd3, T: 0xd4, U: 0xd5,
    V: 0xd6, W: 0xd7, X: 0xd8, Y: 0xd9, Z: 0xda
  };

  const DIGIT_HIGH = {
    "0": [0x92, 0x80, 0xb0],
    "1": [0x93, 0x81, 0xb1],
    "2": [0x94, 0x82, 0xb2],
    "3": [0x95, 0x83, 0xb3],
    "4": [0x96, 0x84, 0xb4],
    "5": [0x97, 0x85, 0xb5],
    "6": [0x98, 0x86, 0xb6],
    "7": [0x99, 0x87, 0xb7],
    "8": [0x9a, 0x88, 0xb8],
    "9": [0x9b, 0x89, 0xb9]
  };

  const PUNCT_HIGH = {
    ".": [0x85, 0x8e, 0x8f, 0x9c, 0xae, 0x0f, 0x1c],
    " ": [0x20, 0xa0],
    "[": [0x10, 0x90],
    "]": [0x11, 0x91],
    "<": [0x1d, 0x9d],
    ">": [0x1f, 0x9f],
    "{": [0x80, 0xfb],
    "}": [0x82, 0xfd],
    "(": [0xa8],
    ")": [0xa9],
    "-": [0xad, 0x2d],
    "=": [0xbd, 0x3d],
    "/": [0xaf, 0x2f],
    "\\": [0xdc, 0x5c],
    "_": [0xdf, 0x5f],
    ":": [0xba, 0x3a],
    ";": [0xbb, 0x3b],
    "+": [0xab, 0x2b],
    "*": [0xaa, 0x2a],
    "#": [0xa3, 0x23],
    "!": [0xa1, 0x21],
    "?": [0xbf, 0x3f],
    "@": [0xc0, 0x40],
    "$": [0xa4, 0x24],
    "&": [0xa6, 0x26],
    "|": [0xfc, 0x7c],
    "~": [0xfe, 0x7e],
    "^": [0xde, 0x5e],
    "`": [0x60]
  };

  const BYTE_PREVIEW = new Map();
  for (let i = 32; i <= 126; i++) BYTE_PREVIEW.set(i, String.fromCharCode(i));
  for (const [ch, b] of Object.entries(LOWER_HIGH)) BYTE_PREVIEW.set(b, ch);
  for (const [ch, b] of Object.entries(UPPER_HIGH)) BYTE_PREVIEW.set(b, ch);
  for (const [ch, list] of Object.entries(DIGIT_HIGH)) {
    for (const b of list) BYTE_PREVIEW.set(b, ch);
  }
  for (const [ch, list] of Object.entries(PUNCT_HIGH)) {
    for (const b of list) BYTE_PREVIEW.set(b, ch);
  }

  function previewFromBytes(bytes) {
    return bytes.map((b) => BYTE_PREVIEW.get(b) || "·").join("");
  }

  function stylizeChar(ch, opts) {
    const highLetterChance = opts.highLetterChance ?? 0.45;
    const highDigitChance = opts.highDigitChance ?? 0.75;
    const highPunctChance = opts.highPunctChance ?? 0.75;

    if (/[a-z]/.test(ch)) {
      return chance(highLetterChance) ? LOWER_HIGH[ch] : ch.charCodeAt(0);
    }

    if (/[A-Z]/.test(ch)) {
      return chance(highLetterChance) ? UPPER_HIGH[ch] : ch.charCodeAt(0);
    }

    if (/[0-9]/.test(ch)) {
      return chance(highDigitChance) ? pick(DIGIT_HIGH[ch]) : ch.charCodeAt(0);
    }

    if (PUNCT_HIGH[ch]) {
      return chance(highPunctChance) ? pick(PUNCT_HIGH[ch]) : ch.charCodeAt(0);
    }

    return ch.charCodeAt(0) & 0xff;
  }

  function stylizeText(str, opts = {}) {
    const out = [];
    for (let i = 0; i < str.length; i++) out.push(stylizeChar(str[i], opts));
    return out;
  }

  // ---------------------------------------------------------------------------
  // Name vocabulary
  // ---------------------------------------------------------------------------

  const LEFT_WORDS = [
    "ash", "mire", "nox", "wraith", "kite", "drift", "sable", "grim",
    "nyx", "rift", "cinder", "vex", "thorn", "pale", "rook", "dusk",
    "hex", "frost", "shade", "zen", "glow", "vapor", "quake", "ember",
    "static", "rune", "cloud", "bone", "mist", "ghost", "void", "scarlet",
    "iron", "nite", "acid", "lunar", "moss", "storm", "crypt", "radio",
    "opal", "feral", "wire", "terra", "snow", "amber", "crow", "velvet",
    "fable", "twin", "pixel", "sugar", "rogue", "solar", "neon", "oracle",
    "bitter", "fuse", "smoke", "wolf", "ion", "plasma", "dead", "spider",
    "zenith", "mango", "black", "silt", "cobalt", "ozone", "ragged", "murmur",
    "ashen", "crimson", "zero", "salt", "wicked", "anvil", "noir", "razor",
    "vile", "night", "gravel", "blitz", "arc", "hush", "druid", "seven",
    "frozen", "vant", "snake", "moth", "pulse", "jagged", "copper", "dizzy",
    "phantom", "ruin", "lost", "wolfish", "quartz", "brass", "cairn", "dreg",
    "eel", "fizz", "gloam", "husk", "ivory", "jank", "kettle", "lichen",
    "marrow", "noodle", "ochre", "prism", "quill", "ravel", "sickle", "tangle",
    "umber", "vandal", "wicker", "xeno", "yarrow", "zircon", "bristle", "flint",
    "gasket", "hazel"
  ];

  const RIGHT_WORDS = [
    "volt", "fox", "veil", "fang", "nova", "q", "moth", "pulse", "orb", "zero",
    "krow", "halo", "byte", "wire", "muse", "siren", "bloom", "rill", "fang",
    "skull", "mire", "rex", "moth", "vane", "owl", "crawl", "raze", "sable",
    "coil", "spur", "knell", "wisp", "lotus", "pylon", "drift", "grit",
    "ripper", "fig", "fawn", "hex", "doom", "tide", "bansh", "nix", "cobra",
    "node", "latch", "rpg", "riot", "rook", "thorn", "static", "moth", "mire",
    "wraith", "mud", "halo", "raven", "kite", "vell", "skewer", "imp", "bloom",
    "rift", "ox", "hex", "vane", "runner", "q", "fang", "star", "void", "comet",
    "pike", "talon", "oracle", "fern", "anvil", "signal", "fawn", "nimbus", "kappa",
    "moon", "sable", "dagger", "cinder", "spark", "mire", "gull", "tide", "lantern",
    "circuit", "yard", "nova", "wolf", "spect", "ax", "ruin", "cipher", "zen",
    "drip", "glint", "suture", "plunger", "gale", "gutter", "furnace", "socket",
    "wagon", "cradle", "tunnel", "cactus", "hammer", "bark", "hinge", "racket",
    "riddle", "knurl", "rasp", "widget", "meadow", "maw", "mender", "bevel",
    "tremor", "needle", "yonder", "molten", "gravel", "quiver"
  ];

  const QUAKE_WORDS = [
    "shambler", "zombie", "scrag", "fiend", "ogre", "enforcer", "grunt",
    "vore", "spawn", "tarbaby", "knight", "hellknight", "wizard", "fish",
    "rottweiler", "dog", "chthon", "shub", "shubniggurath",
    "axe", "shotgun", "supershotgun", "nailgun", "supernail", "grenade",
    "grenadelauncher", "rocket", "rocketlauncher", "thunderbolt", "shaft",
    "lightning", "quad", "pent", "ring", "biosuit", "armor", "megahealth",
    "cells", "nails", "shells", "rockets", "backpack", "gib", "telefrag",
    "rune", "sigil", "silverkey", "goldkey", "slipgate", "portal", "teleport",
    "teleporter", "episode", "nightmare", "skill", "frag", "deathmatch",
    "e1m1", "e1m2", "e1m3", "e1m4", "e1m5", "e1m6", "e1m7", "e1m8",
    "start", "end", "dm6", "aerowalk", "ztndm3", "base", "castle", "crypt",
    "dungeon", "sewer", "slime", "lava", "water", "bridge", "lift", "door",
    "secret", "trigger", "spawnpoint", "telepad", "altar", "tomb", "vault",
    "rune", "rust", "slip", "gloom", "gothic", "wizard", "metal", "blood",
    "bone", "skull", "flesh", "stone", "brick", "moss", "torch", "flame",
    "shadow", "rot", "quake", "id1", "pak0", "pak1", "progs", "bsp",
    "elder", "eldritch", "nether", "void", "abyss", "dread", "sorrow", "malice",
    "wrath", "hex", "curse", "omen", "relic", "fetid", "maggot", "corpse",
    "cadaver", "bonepit", "bloodpit", "gore", "viscera", "splatter", "rancid",
    "blight", "plague", "rotgut", "grave", "sepulcher", "ossuary", "catacomb",
    "cryptic", "unholy", "profane", "demon", "daemon", "nightgaunt", "lurker",
    "howler", "mauler", "reaver", "stalker", "butcher", "skinner", "ripper",
    "warlock", "necrotic", "doombringer", "bonegnaw", "gloomlord",
    "bunnyhop", "strafe", "airshot", "midair", "spawnkill", "spawnfrag", "telekill",
    "rocketjump", "grenjump", "shaftbeam", "lgbeam", "nailspam", "spam", "camp",
    "camper", "quadrun", "pentgrab", "mega", "redarmor", "yellowarmor", "greenarmor",
    "lowping", "lagged", "packetloss", "netsplit", "fraglimit", "timelimit",
    "matchclock", "warmup", "observer", "spectator", "demo", "demoman", "recam",
    "console", "cvar", "alias", "bind", "impulse", "edict", "model", "mdl", "skin",
    "wad", "vis", "lit", "ent", "map", "clip", "hull", "brush", "trigger",
    "funcdoor", "funclift", "teleport", "sound", "sfx", "miptex", "skybox",
    "skywind", "fullbright", "overbright", "lightmap", "r_speeds", "packet",
    "svc", "clc", "netquake", "qw", "qizmo", "qtv", "quakeworld",
    "rustbone", "slimefall", "bloodstone", "greenbrick", "bluebrick", "redbrick",
    "metalrun", "techbase", "wizardwall", "lavafall", "sludge", "grate",
    "pipe", "rivet", "chain", "spike", "torchlit", "sconce", "runestone",
    "blackstone", "brownstone", "slipfloor", "meatwall", "skullgate",
    "gibwizard", "quadghoul", "nailwraith", "scragbait", "ogremeat", "shambait",
    "vorekiss", "zombiefizz", "fiendmilk", "rocketmoss", "slimeangel",
    "bloodrouter", "lagmancer", "pingwraith", "demoslug", "fragbeast",
    "spawnmoth", "packetghoul", "bspghost", "cvarwitch", "aliasfiend"
  ];

  const POP_CULTURE_WORDS = [
    "batman", "robin", "nightwing", "joker", "harley", "riddler", "bane",
    "twoface", "penguin", "catwoman", "superman", "lex", "luthor", "zod",
    "wonderwoman", "flash", "aquaman", "cyborg", "greenlantern", "sinestro",
    "constantine", "spawn", "hellboy", "blade", "punisher", "daredevil",
    "elektra", "ghostrider", "wolverine", "cyclops", "storm", "magneto",
    "gambit", "rogue", "deadpool", "cable", "domino", "juggernaut",
    "sabretooth", "colossus", "phoenix", "iceman", "beast", "mystique",
    "venom", "carnage", "spiderman", "goblin", "octopus", "mysterio",
    "vulture", "sandman", "electro", "rhino", "kingpin", "moonknight",
    "ironman", "warmachine", "hulk", "thor", "loki", "odin", "hela",
    "valkyrie", "hawkeye", "blackwidow", "captain", "winter", "falcon",
    "vision", "scarletwitch", "thanos", "ultron", "kang", "doom", "galactus",
    "silverSurfer", "namor", "blackpanther", "killmonger", "starlord",
    "gamora", "drax", "groot", "rocket", "nebula", "ronan",
    "vader", "skywalker", "kenobi", "yoda", "maul", "sidious", "palpatine",
    "boba", "jango", "mandalore", "mando", "grogu", "solo", "chewie",
    "leia", "rey", "kylo", "ren", "fett", "sith", "jedi", "wookiee",
    "droid", "r2d2", "c3po", "deathstar", "bladerunner", "replicant",
    "deckard", "robocop", "ed209", "terminator", "skynet", "t800", "t1000",
    "matrix", "neo", "trinity", "morpheus", "agentSmith", "oracle", "zion",
    "predator", "alien", "xenomorph", "ripley", "bishop", "weyland",
    "madmax", "furiosa", "immortan", "tron", "sark", "hal9000",
    "indiana", "jones", "riddick", "conan", "redsonja", "highlander",
    "connor", "rambo", "rocky", "cobra", "maverick", "iceman", "goose",
    "bond", "goldfinger", "blofeld", "oddjob", "bourne", "wick", "neoTokyo",
    "godzilla", "kong", "mothra", "ghidorah", "rodan", "gamera",
    "freddy", "krueger", "jason", "voorhees", "michaelmyers", "pinhead",
    "leatherface", "chucky", "pennywise", "candyman", "dracula", "nosferatu",
    "frankenstein", "wolfman", "mummy", "creature", "phantom", "carrie",
    "hannibal", "lecter", "ghostface", "ashwilliams", "boomstick",
    "gandalf", "frodo", "aragorn", "legolas", "gimli", "sauron", "saruman",
    "gollum", "balrog", "nazgul", "ringwraith", "smaug", "conan", "merlin",
    "arthur", "excalibur", "medusa", "hercules", "ares", "zeus", "hades",
    "mario", "luigi", "bowser", "peach", "yoshi", "wario", "link", "zelda",
    "ganon", "samus", "ridley", "metroid", "pacman", "megaman", "protoman",
    "zero", "ryu", "ken", "akuma", "chunli", "bison", "subzero", "scorpion",
    "raiden", "reptile", "sonic", "tails", "knuckles", "sephiroth", "cloud",
    "squall", "doomslayer", "doomguy", "dukenukem", "lara", "kratos"
  ];

  const LEET = [
    ["o", "0"],
    ["i", "1"],
    ["e", "3"],
    ["a", "4"],
    ["s", "5"],
    ["t", "7"],
    ["z", "2"]
  ];

  function leetify(word, amount) {
    let out = word;
    for (const [from, to] of LEET) {
      if (chance(amount) && out.includes(from)) {
        out = out.replace(from, to);
      }
    }
    return out;
  }

  function randomCase(word) {
    let out = "";
    for (const ch of word) {
      if (/[a-z]/i.test(ch)) out += chance(0.35) ? ch.toUpperCase() : ch.toLowerCase();
      else out += ch;
    }
    return out;
  }

  function randomWord(list, opts = {}) {
    const leetChance = opts.leetChance ?? 0.35;
    return randomCase(leetify(pick(list), leetChance));
  }

  function randomThemedWord(fallbackList, opts = {}) {
    const quakeWordChance = opts.quakeWordChance ?? 0.28;
    const popCultureWordChance = opts.popCultureWordChance ?? 0.16;

    let list = fallbackList;
    const roll = Math.random();

    if (roll < popCultureWordChance) {
      list = POP_CULTURE_WORDS;
    } else if (roll < popCultureWordChance + quakeWordChance) {
      list = QUAKE_WORDS;
    }

    return randomWord(list, opts);
  }

  // ---------------------------------------------------------------------------
  // Pattern generators
  // ---------------------------------------------------------------------------

  function wrapperPair() {
    return pick([
      [stylizeText("<"), stylizeText(">")],
      [stylizeText("["), stylizeText("]")],
      [stylizeText("{"), stylizeText("}")],
      [stylizeText("("), stylizeText(")")],
      [stylizeText("]["), stylizeText("]")],
      [stylizeText("][·"), stylizeText("·][")],
      [stylizeText("-=", { highPunctChance: 0.95 }), stylizeText("=-", { highPunctChance: 0.95 })]
    ]);
  }

  function sepBytes() {
    return stylizeText(pick([
      ".", "..", "·", "*", "#", "!", "?", ":", "//", "/", "_", "+", "=", "@", "$", "|", "~", "^", "-"
    ]), {
      highPunctChance: 0.9,
      highLetterChance: 0.5,
      highDigitChance: 0.9
    });
  }

  function wordBytes(word, opts = {}) {
    return stylizeText(word, {
      highLetterChance: opts.highLetterChance ?? 0.45,
      highDigitChance: opts.highDigitChance ?? 0.85,
      highPunctChance: opts.highPunctChance ?? 0.85
    });
  }

  function patternWrapped(opts) {
    const [l, r] = wrapperPair();
    const a = randomThemedWord(LEFT_WORDS, opts);
    const b = randomThemedWord(RIGHT_WORDS, opts);
    return concatParts([l, wordBytes(a, opts), maybe(sepBytes(), 0.65), wordBytes(b, opts), r]);
  }

  function patternLoose(opts) {
    const a = randomThemedWord(LEFT_WORDS, opts);
    const b = randomThemedWord(RIGHT_WORDS, opts);
    const c = chance(0.3) ? randomThemedWord(RIGHT_WORDS, opts) : "";
    return concatParts([
      maybe(sepBytes(), 0.4),
      wordBytes(a, opts),
      sepBytes(),
      wordBytes(b, opts),
      c ? sepBytes() : [],
      c ? wordBytes(c, opts) : [],
      maybe(sepBytes(), 0.4)
    ]);
  }

  function patternOldSchoolPad(opts) {
    const a = randomThemedWord(LEFT_WORDS, opts);
    const b = randomThemedWord(RIGHT_WORDS, opts);
    const pad = stylizeText(chance(0.5) ? "   " : "···", { highPunctChance: 0.9 });
    return concatParts([
      wordBytes(a, opts),
      pad,
      wordBytes(b, opts),
      maybe(sepBytes(), 0.5)
    ]);
  }

  function patternDoubleWrap(opts) {
    const [l1, r1] = wrapperPair();
    const [l2, r2] = wrapperPair();
    const a = randomThemedWord(LEFT_WORDS, opts);
    const b = randomThemedWord(RIGHT_WORDS, opts);
    return concatParts([l1, l2, wordBytes(a, opts), sepBytes(), wordBytes(b, opts), r2, r1]);
  }

  function patternSymbolHeavy(opts) {
    const a = randomThemedWord(LEFT_WORDS, opts);
    const b = randomThemedWord(RIGHT_WORDS, opts);
    return concatParts([
      sepBytes(),
      sepBytes(),
      wordBytes(a, { ...opts, highLetterChance: 0.65 }),
      sepBytes(),
      wordBytes(b, { ...opts, highLetterChance: 0.65 }),
      sepBytes(),
      sepBytes()
    ]);
  }

  const PATTERNS = [
    patternWrapped,
    patternLoose,
    patternOldSchoolPad,
    patternDoubleWrap,
    patternSymbolHeavy
  ];

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function generateName(options = {}) {
    const maxBytes = options.maxBytes ?? 15;
    const minBytes = options.minBytes ?? 3;
    const opts = {
      highLetterChance: options.highLetterChance ?? 0.48,
      highDigitChance: options.highDigitChance ?? 0.82,
      highPunctChance: options.highPunctChance ?? 0.88,
      leetChance: options.leetChance ?? 0.4,
      quakeWordChance: options.quakeWordChance ?? 0.28,
      popCultureWordChance: options.popCultureWordChance ?? 0.16
    };

    let bytes = [];
    let attempts = 0;

    while ((bytes.length < minBytes || bytes.length > maxBytes) && attempts < 100) {
      const pattern = pick(PATTERNS);
      bytes = pattern(opts);
      if (bytes.length > maxBytes && options.truncate !== false) {
        bytes = trimToMax(bytes, maxBytes);
      }
      attempts++;
    }

    return {
      name_hex: bytesToHex(bytes),
      bytes,
      preview_approx: previewFromBytes(bytes),
      length: bytes.length
    };
  }

  function generateMany(count, options = {}) {
    const unique = options.unique !== false;
    const maxAttempts = options.maxAttempts ?? count * 50;
    const seen = new Set(options.avoidHex || []);
    const out = [];
    let attempts = 0;

    while (out.length < count && attempts < maxAttempts) {
      const item = generateName(options);
      attempts++;

      if (unique && seen.has(item.name_hex)) continue;
      seen.add(item.name_hex);
      out.push(item);
    }

    if (out.length < count) {
      throw new Error(`Only generated ${out.length}/${count} unique names after ${attempts} attempts.`);
    }

    return out;
  }

  function renderPreviewFromHex(hex) {
    return previewFromBytes(hexToBytes(hex));
  }

  return {
    generateName,
    generateMany,
    bytesToHex,
    hexToBytes,
    previewFromBytes,
    renderPreviewFromHex,
    stylizeText,
    asciiBytes,
    tables: {
      LOWER_HIGH,
      UPPER_HIGH,
      DIGIT_HIGH,
      PUNCT_HIGH,
      LEFT_WORDS,
      RIGHT_WORDS,
      QUAKE_WORDS,
      POP_CULTURE_WORDS
    }
  };
});
