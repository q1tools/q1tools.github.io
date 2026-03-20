# Quake MDL Viewer

This is a standalone browser app for viewing vanilla Quake `.mdl` alias models.

Features:

- Parses `IDPO` / version 6 `.mdl`
- Loads assets from standalone files or from `.pak`
- Uses the default Quake palette automatically
- Lets `gfx/palette.lmp` override the default when available
- Expands seam vertices correctly for back-side UVs
- Plays pose animation in the browser
- Applies Quake-style player `topcolor` / `bottomcolor` remapping

## Run

You can open `index.html` directly in a browser.

If your browser is stricter about local file access, run a tiny HTTP server in this folder:

```bash
cd /Users/timbergeron/codedev/QSS-M/web/mdl-viewer
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
