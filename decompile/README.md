# BSP Forge

BSP Forge is a dependency-free, browser-side BSP → Valve 220 MAP decompiler
designed as an additional tool for [q1tools.github.io](https://q1tools.github.io).
Files never leave the browser.

## Format and recovery coverage

- Quake prerelease BSP28, BSP29, Quake 64 remastered BSP, BSP2, and BSP2-RMQ
- Half-Life BSP30
- Hexen II models in the BSP29/BSP2 containers
- Quake II IBSP38 and Qbism `QBSP` (direct brush-lump recovery)
- FTE/ericw BSPX `BRUSHLIST` version 1
- Quake 1-family hull 0 leaf reconstruction and clipnode hulls 1–3
- Entity/submodel recovery, origin brushes, trigger textures, Valve 220 texinfo
- Texture-boundary splitting, bounded parsing/output, cycle/depth guards, and diagnostics
- TrenchBroom-native game/format headers and winding-derived plane points
- Invalid texture-projection repair and empty/redundant convex-side cleanup
- Blue Shift BSP30 swapped entity/plane lump compatibility

The default recovery order is:

1. Use BSPX `BRUSHLIST` source planes when present. This is information that
   ericw-tools' current `bsputil --decompile` path does not yet consume.
2. Use Quake II's compiled brush and brushside lumps for Q2-family maps.
3. Otherwise walk the BSP/clipnode decision tree into bounded convex volumes,
   remove redundant planes, match surviving faces, and split conflicting
   texture regions.

Compilation destroys information: the original brush grouping, CSG order,
detail grouping, and geometry removed by CSG cannot always be recovered.
Generated maps should be treated as high-quality forensic/editor source, not a
bit-exact reconstruction of an unavailable original. Eight-decimal plane and
texture serialization is the default because it avoids avoidable off-plane
rounding warnings when recovered MAP files are compiled again.

## Improvements over `bsputil --decompile`

The comparison is deliberately narrow. BSP Forge shares several behaviors with
ericw-tools—including convex-leaf reconstruction, Valve 220 texinfo recovery,
texture-boundary splitting, trigger handling, origins, collision hulls, and
exact Quake II brush-lump use. Those are parity features, not new claims.

BSP Forge adds:

1. **BSPX `BRUSHLIST` geometry recovery.** It consumes version 1 brush bounds
   and non-axial planes, assigns surviving compiled textures where possible,
   and writes stored source-brush geometry. The current ericw decompiler has a
   TODO for using BSPX brushes.
2. **Per-model automatic recovery policy.** It can mix BSPX recovery with
   BSP-tree fallback when only some models have brush metadata, while Quake II
   continues to use its exact brush lump.
3. **Interactive diagnostics.** The app reports the detected format, actual
   recovery path, BSPX lumps and brush counts, parsed structure counts, output
   brush/side totals, and non-fatal recovery warnings.
4. **Interactive geometry preview.** Recovered brush edges can be inspected,
   panned, and zoomed with pointer, wheel, or keyboard controls before saving
   the MAP.
5. **Untrusted-file isolation.** Lump ranges, overlaps, record counts,
   references, traversal depth, graph cycles, open brushes, and amplified
   output are guarded; expensive work runs in a cancellable Web Worker.
6. **Selectable recovery policy.** Geometry source, collision hull, texture
   alignment, texture-boundary splitting, output precision, and comments are
   exposed directly in the interface.
7. **Zero-install local operation.** It runs from static GitHub Pages hosting,
   keeps the BSP inside the browser, and needs no native executable or upload.
8. **Additional engine dialects and compatibility repairs.** It recognizes the
   Quake prerelease BSP28 and Quake 64 remastered containers used by FTEQW and
   QSS-M, including Quake 64's wider miptex header, and repairs the swapped
   entity/plane lump directory seen in some Blue Shift BSP30 files.
9. **Editor-focused geometry serialization.** It derives wide, correctly
   oriented plane points from recovered face windings, projects them back to
   the source plane, removes clipped/redundant sides, and writes the exact
   `// Game:` / `// Format:` header pair TrenchBroom uses for deterministic
   loading.
10. **Texture projection validation.** Invalid, non-finite, zero-length, or
    collinear compiled texture axes are replaced with stable face-aligned
    Valve 220 axes and reported in diagnostics.
11. **Tolerant BSPX material matching.** A neighborhood spatial index matches
    stored source-brush planes to compiled faces across normal/distance
    quantization boundaries before texture-boundary splitting.

`bsputil` remains a mature, fast, scriptable native reference and also supports
many BSP inspection and mutation operations outside BSP-to-MAP recovery. BSP
Forge is an additional recovery and inspection workflow, not a replacement for
the rest of `bsputil`.

## Run and test

No install or build step is required:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

For syntax and unit checks:

```sh
npm run verify
```

The app targets current evergreen browsers with JavaScript modules, module Web
Workers, `TextDecoder`, canvas, and `File.arrayBuffer()`. Clipboard access uses
the secure-context API on GitHub Pages and a bounded fallback on local HTTP.

### Browser safety limits

Input is rejected before allocation above 1 GiB. Parsing also caps entity and
record counts, BSP/clipnode depth, cyclic or shared graph traversal,
texture-boundary splitting, and preview segments. MAP generation stops at
250,000 brushes, 2,000,000 sides, or 256 million output characters rather than
allowing a small hostile BSP to amplify into an unbounded browser allocation.
These are safety ceilings, not expected Quake map sizes.

The checked-in page applies a restrictive Content Security Policy and does not
make network requests. For deployment, retain that policy (preferably also as
an HTTP response header if the hosting layer permits one).

## q1tools integration

Copy this directory to `decompile/` in `q1tools/q1tools.github.io`, then add a
homepage link such as:

```html
<a href="decompile/">BSP Forge</a>
```

All asset paths are relative, so the tool works on GitHub Pages at that
subdirectory without a bundler.

## Provenance and license

The implementation was built against:

- ericw-tools' BSP container definitions and leaf-decompile behavior
- the FTEQW repository's Quake-family BSP structures, hardened loading behavior, and
  `specs/bspx.txt` / `BRUSHLIST` consumer
- QSS-M's Quake 64 miptex definition and defensive BSP loading behavior
- TrenchBroom's map header, Valve 220 serializer, brush clipping, face
  correction, and invalid-brush handling
- the id Software Quake and Quake II BSP formats

FTEQCC itself compiles/decompiles QuakeC bytecode, not BSP brush geometry, so it
is not shipped as a browser dependency. The relevant BSP implementation beside
it in `fteqw/engine/common` and the FTE BSPX specification are reflected here.

Because those implementation references are GPL-family sources, BSP Forge is
offered under **GPL-2.0-or-later**. Retain the SPDX header, this provenance
notice, `LICENSE.md`, and the complete GPL v2 text in `COPYING` when
integrating it.
