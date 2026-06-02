# Quake MDL Viewer

This is a standalone browser app for viewing Quake `.mdl` alias models.

Features:

- Parses vanilla `IDPO` / version 6 `.mdl`
- Reads QuakeForge/QSS-M `MD16` models with 16-bit vertex-coordinate precision
- Loads assets from standalone files or from `.pak`
- Uses the default Quake palette automatically
- Lets `gfx/palette.lmp` override the default when available
- Expands seam vertices correctly for back-side UVs
- Plays pose animation in the browser
- Previews palette fullbright pixels separately from lit base skin pixels
- Applies Quake-style player `topcolor` / `bottomcolor` remapping

## Compatibility notes

- Saving currently writes vanilla `IDPO` / version 6 `.mdl`. Loaded `MD16` models can be viewed, but saving them will repack positions into 8-bit MDL coordinates.
- On save, per-vertex `lightnormalindex` values are recomputed from geometry instead of preserving the loaded bytes. This keeps generated/exported models lit sensibly, but it is lossy if an artist intentionally baked unusual normals.
- QSS-M discovers replacement skin images beside the model by name: `<model>_<skinidx>`, optional `<model>_<skinidx>_pants`, `<model>_<skinidx>_shirt`, and optional fullbright overlays `<model>_<skinidx>_glow` or `<model>_<skinidx>_luma`. These external images are engine-side assets, not stored inside the MDL file.
- `MOD_NOLERP`, `MOD_NOSHADOW`, and `MOD_FBRIGHTHACK` are QSS-M runtime extra flags from cvar name lists or hardcoded matching. They are not authorable MDL header flags.

## Run

You can open `index.html` directly in a browser.

If your browser is stricter about local file access, run a tiny HTTP server in this folder:

```bash
cd /Users/timbergeron/codedev/q1tools.github.io/mdl
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Usage

1. Load one or more of:
   - a standalone `.mdl`
   - `gfx/palette.lmp` if you want to override the default palette
   - `pak0.pak`
2. Pick a model from the list on the left.
3. For `player.mdl`, enable Quake player colors and adjust shirt / pants values.

If you load `pak0.pak`, the app will auto-detect both `progs/*.mdl` and `gfx/palette.lmp`, and the detected palette will override the built-in default.
