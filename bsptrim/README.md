# BSP Texture Trimmer

A client-side q1tools utility that creates a genuinely smaller raw Quake BSP.
It crops unused regions from eligible embedded mip textures, rather than
painting unused pixels a flat color for better ZIP compression.

## How it works

1. Parse BSP29, BSP2, or BSP2-RMQ geometry, texinfo, faces, and embedded
   miptex records.
2. Compute the texture-coordinate bounds used by all faces sharing each
   texinfo.
3. Search for the smallest 16-pixel-aligned wrapped rectangle that contains
   every bound plus the requested padding.
4. Copy that rectangle at all four stored mip levels.
5. Adjust only the S/T translation terms in affected texinfo records.
6. Rebuild the standard BSP lumps and relocate opaque BSPX lumps.

Every texinfo adjustment is a multiple of 16. This keeps the existing surface
lightmap extents and samples aligned.

By default, cropped miptex names are changed to a unique 15-character-or-shorter
name. That stops an engine from replacing the cropped embedded pixels with a
full-size external texture whose coordinate mapping no longer matches.

## Conservative exclusions

The trimmer leaves a texture untouched when it is sky, liquid/warp, animated,
fence/alpha, on a `TEX_SPECIAL` surface, has a nonstandard mip layout, spans a
complete repeat, or cannot be proven safe from the BSP geometry. Ordinary
embedded textures with no texinfo references are changed to missing miptex
slots, preserving all texture indices while removing their unused data.

Geometry, entities, visibility, lighting, collision, faces, models, and unknown
BSPX lump payloads are copied without interpretation.

## Tests

Run:

```sh
node core.test.js
```

The synthetic fixtures cover BSP29 and BSP2, all four mip levels, wrapped crops,
texinfo translation, BSPX relocation, texture renaming, conservative skips, and
second-pass idempotence.

## References

- [unusedtex](https://github.com/matthewearl/unusedtex) by Matthew Earl
- [ericw-tools](https://github.com/ericwa/ericw-tools) BSP and BSPX definitions

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licensing notices.
