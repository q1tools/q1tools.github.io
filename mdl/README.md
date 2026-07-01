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
- On save, per-vertex `lightnormalindex` values are recomputed from geometry instead of preserving the loaded bytes. This keeps generated/exported models lit sensibly, but it is lossy if an artist intentionally baked unusual normals. Generated flat-prism SVG/text exports and the "Optimize Outline Normals" quick fix write silhouette-plane normals for QSS-M's `r_outline` shell expansion.
- Classic MDL tools can reject skins taller than 480 pixels even though QSS-M only developer-warns for GL rendering. For broad compatibility, prefer wider atlases over taller ones. Palette indices 224-254 are fullbright; index 255 only works as embedded-skin transparency when the "Index 255 Transparent" flag is enabled.
- QSS-M discovers replacement skin images beside the model by name: `<model>_<skinidx>`, optional `<model>_<skinidx>_pants`, `<model>_<skinidx>_shirt`, and optional fullbright overlays `<model>_<skinidx>_glow` or `<model>_<skinidx>_luma`. These external images are engine-side assets, not stored inside the MDL file.
- `MOD_NOLERP`, `MOD_NOSHADOW`, and `MOD_FBRIGHTHACK` are QSS-M runtime extra flags from cvar name lists or hardcoded matching. They are not authorable MDL header flags.

## Authoring notes

- Quake skins store palette indices. Changing palette slot colors changes every pixel using those slots; remap skin pixels if the palette order changes.
- Treat 224-254 as intentional fullbright only. Accidental pixels in that range become glow contamination.
- Keep texel 0 away from sampled artwork because QuakeSpasm-family engines flood-fill alias skins from that pixel.
- Texture seams and UV splits can raise the exported MDL vertex count, so the textured export can hit limits even when the plain mesh looks safe.
- In Blender, use Unit System None when treating 1 Blender unit as 1 Quake map unit. Multiple material slots can become MDL skin slots, but each skin needs the same mesh and UV layout. MDL export is safest with one combined mesh.
- For Quake-style remakes, a Remaster MD5 armature can be a practical animation base, but expect cleanup when fitting it to old MDL poses. For state changes like headless deaths, a separate MDL plus code-side model swap can be cleaner than mutating the original animation set.
- MDL/MD3 UVs should land on texel centers. Nearest/closest filtering is best when checking pixel-art skin bleed.
- Very short frame times such as 0.05 or 0.025 can make muzzle flashes feel snappier, but interpolation depends on engine settings. QuakeC `nextthink` timing can drive individual weapon frames at higher rates.
- Swapping between duplicate model names can force a jump cut because the models have no shared vertices to lerp. This can help spinning barrels, revolver chambers, and wind-down-to-idle transitions.
- Test viewmodels across low and high FOV. Weapon scale, bobbing, FOV, and status-bar mode can expose hidden parts or clip visible ones.
- MD3 replacements still need a matching MDL name in QuakeSpasm-family engines; keep the placeholder MDL flags intentional when the MD3 is the real asset. Use lowercase texture names in `.skin` files for Linux-safe paths.
- A null MDL placeholder is invisible when enhanced MD3 replacements are disabled. A visible message fallback MDL is safer for MD3-only assets.
- Non-viewmodel MD3 alpha can be engine-version sensitive, especially with overlapping double-sided planes, alternate skins, or placeholder MDL flags. Test foliage, glass, and cards in-engine from several angles.
- Do not make the first MD3 frame collapsed or scaled to zero; use a tiny visible scale or reference pose. A triangulate step can prevent surprise sliced angles.

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
