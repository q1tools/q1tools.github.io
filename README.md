<div align="center">

# q1tools

**A suite of browser-based tools for Quake 1 / QuakeWorld assets, demos, maps and servers.**

[![Website](https://img.shields.io/badge/website-q1tools.github.io-5c7cfa?style=flat-square)](https://q1tools.github.io)
[![Pages](https://img.shields.io/badge/hosted%20on-GitHub%20Pages-181717?style=flat-square&logo=github)](https://github.com/q1tools/q1tools.github.io)

No installs, no build step — everything runs client-side in the browser.

[**Open the tools →**](https://q1tools.github.io)

</div>

---

## Tools

| Tool | What it does |
| --- | --- |
| **PAK Tool** | Browse and extract Quake `.pak` archives |
| **QPakMan** | PAK/WAD archive manager (Quake 1/2, Hexen II) |
| **Quake Web Tools** | View Quake assets (models, textures, levels) in the browser |
| **MDL Tool** | View and edit Quake `.mdl` alias models |
| **MD3 Viewer** | View Quake 3 `.md3` models |
| **MD5 Viewer** | View `.md5mesh` / `.md5anim` skeletal models |
| **VIS Tool** | Compute PVS visibility data for BSP maps |
| **LIT Reverse Engineer** | Analyze BSP/LIT lighting and reconstruct settings |
| **BSP→SVG** | Render Quake BSP maps to SVG |
| **Demo Tool** | Play, parse and edit `.dem` / `.dz` demos |
| **Name Maker** | Generate colored Quake player names |
| **IP Log Viewer** | Inspect Quake server IP logs |
| **Save Inspector** | Inspect Quake `.sav` save files |
| **LMP / TGA Converters** | Convert Quake image formats |
| **WADCleaver** | Work with Quake `.wad` texture archives |
| **Player Notify** | Server player notifications |
| **Quake Tree** | Interactive Quake engine family tree |

---

## Credits

These tools build on a lot of prior work from the Quake community. Below is a
breakdown of the upstream sources, libraries and reference code each tool draws
from.

### PAK Tool & Quake Web Tools

Both wrap the **QuakeWebTools** library for reading and parsing Quake archive and
asset formats in the browser, which itself bundles several third-party libraries.

| Source | Link |
| --- | --- |
| QuakeWebTools (andyp123) | https://github.com/andyp123/quake_web_tools |
| three.js + OrbitControls/TrackballControls/FirstPersonControls (mrdoob & contributors) | https://github.com/mrdoob/three.js |
| stats.js (mrdoob) | https://github.com/mrdoob/stats.js |
| DataStream.js (Ilmari Heikkinen) | https://github.com/kig/DataStream.js |

### Name Maker & IP Log Viewer

Colored Quake name generator / encoder.

| Source | Link |
| --- | --- |
| qwtfnmaker (timbergeron) | https://github.com/timbergeron/qwtfnmaker |
| Based on code by Ryan Lowe (1997–1999), xaGe / megatf (2018) | — |
| Name lists sourced in part from clan RUM | http://www.clan-rum.org/ |

### MD5 Viewer

WebGL renderer for `.md5mesh` / `.md5anim` skeletal models.

| Source | Link |
| --- | --- |
| webgl-md5renderer (Ju-Hyung Lee) | https://github.com/juhl/webgl-md5renderer |
| glMatrix 0.9.4 (Brandon Jones, Colin MacKenzie IV) | https://github.com/toji/gl-matrix |
| jQuery 1.5 | https://github.com/jquery/jquery |

### MD3 Viewer

WebGL viewer for Quake 3 `.md3` models.

| Source | Link |
| --- | --- |
| three.js (mrdoob & contributors) | https://github.com/mrdoob/three.js |

### Demo Tool

Plays, parses and edits QuakeWorld / NetQuake `.dem` and `.dz` demos.

| Source | Link |
| --- | --- |
| FTEQW web port (Spike) — in-browser playback | https://github.com/fte-team/fteqw |
| demsuperimpose (Matthew Earl) — ghost "Superimpose" merging | https://github.com/matthewearl |
| koron-go/lha (MURAOKA Taro) — LZH/LH5 decoder via NexQuake quake106 (Brian St. Marie) | https://github.com/koron-go/lha |

> The parser also supports FTE protocol extensions (FTE_PEXT), and `.dz` handling
> follows the dzip demo-compression format.

### QPakMan

PAK / WAD archive manager (Quake 1/2, Hexen II).

| Source | Link |
| --- | --- |
| qpakman (bunder; originally Andrew Apted) | https://github.com/bunder/qpakman |

### VIS Tool & LIT Reverse Engineer

PVS visibility computation, BSP/PRT portal extraction, and BSP/LIT lighting
analysis. The vis algorithm follows the classic id Software `vis` source, and
output is matched against **ericw-tools** (the modern tyrutils lineage).

| Source | Link |
| --- | --- |
| ericw-tools | https://github.com/ericwa/ericw-tools |
| Quake (QBSP/VIS) source — id Software | https://github.com/id-Software/Quake |

### BSP→SVG

Renders Quake BSP maps to SVG.

| Source | Link |
| --- | --- |
| ericw-tools | https://github.com/ericwa/ericw-tools |
| Joshua's Quake Tools | https://joshua.itch.io/quake-tools |

### Quake Tree

Interactive Quake engine family tree.

| Source | Link |
| --- | --- |
| Quake family tree diagram (Wikipedia) | https://en.wikipedia.org/wiki/File:Quake_-_family_tree.svg |

### Other tools

LMP Converter, TGA Converter, Save Inspector, WADCleaver, Player Notify and the
multiplayer file browsers are custom code written for this project. Format and
engine behavior reference id Software's GPL Quake source and QuakeSpasm / QSS-M
(QuakeSpasm-Spiked).

### Shared libraries

Third-party libraries loaded across the various tools.

| Library | Used by | Link |
| --- | --- | --- |
| Font Awesome | all (icons) | https://github.com/FortAwesome/Font-Awesome |
| three.js | MD3 Viewer, PAK Tool | https://github.com/mrdoob/three.js |
| `<model-viewer>` (Google) | PAK Tool | https://github.com/google/model-viewer |
| howler.js (James Simpson / GoldFire Studios) | PAK Tool | https://github.com/goldfire/howler.js |
| tga-js | Quake Web Tools, PAK Tool | https://github.com/Smolkale/tga-js |
| JSZip (Stuart Knightley) | TGA Converter, WADCleaver | https://github.com/Stuk/jszip |
| pako (Nodeca) | Demo Tool, QPakMan | https://github.com/nodeca/pako |
| jschardet | Name Maker | https://github.com/aadsm/jschardet |
| glMatrix | MD5 Viewer | https://github.com/toji/gl-matrix |
| jQuery (John Resig; incl. Sizzle, Dojo Foundation) | MD5 Viewer | https://github.com/jquery/jquery |
| Google Fonts | MDL Tool, LIT | https://github.com/google/fonts |

### Fonts

| Font | Link |
| --- | --- |
| Quake conchars font (`Quake1.ttf`) | id Software |
| Comic Shanns Mono Nerd Font | https://github.com/ryanoasis/nerd-fonts |

### Linked external tools

Linked from the index but maintained by others.

| Tool | Link |
| --- | --- |
| QEBSPEditor (jpiolho) | https://github.com/jpiolho/QEBSPEditor |
| Demoscope (programmer1o1) | https://programmer1o1.github.io/demoscope/ |
| QuakeOne Servers List | https://servers.quakeone.com |
| maps.quakeworld.nu | https://maps.quakeworld.nu |

### Additional references

| Reference | Link |
| --- | --- |
| qw-tools | https://github.com/qw-tools |
| Marco's q1tools | https://icculus.org/~marco/q1tools.html |

---

<div align="center">

Created by **woods** · [github.com/q1tools/q1tools.github.io](https://github.com/q1tools/q1tools.github.io)

</div>
