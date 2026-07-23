# Quake MDL Tool

This is a standalone browser app for viewing, editing, and exporting Quake `.mdl` alias models.

Features:

- Parses vanilla `IDPO` / version 6 `.mdl`
- Reads QuakeForge/QSS-M `MD16` models with 16-bit vertex-coordinate precision
- Loads assets from standalone files or from `.pak`
- Uses the default Quake palette automatically
- Lets `gfx/palette.lmp` override the default when available
- Expands seam vertices correctly for back-side UVs
- Plays pose animation in the browser
- Duplicates and deletes poses, and appends editable copies of complete animation sequences
- Nudges selected texture-vertex classes by exact texels for seam correction
- Collapses threshold-selected vertex regions across one pose, a sequence, or every pose without changing topology
- Previews palette fullbright pixels separately from lit base skin pixels
- Applies Quake-style player `topcolor` / `bottomcolor` remapping
- Exports the displayed pose for 3D printing as unit-aware `.3mf` or binary `.stl`
- Scales print exports in millimetres, orients and grounds them, cleans bad faces and winding, and reports mesh manifoldness

## Compatibility notes

- Saving currently writes vanilla `IDPO` / version 6 `.mdl`. Loaded `MD16` models can be viewed, but saving them will repack positions into 8-bit MDL coordinates.
- On save, per-vertex `lightnormalindex` values are recomputed from geometry instead of preserving the loaded bytes. This keeps generated/exported models lit sensibly, but it is lossy if an artist intentionally baked unusual normals. Generated flat-prism SVG/text exports and the "Optimize Outline Normals" quick fix write silhouette-plane normals for QSS-M's `r_outline` shell expansion.
- Classic MDL tools can reject skins taller than 480 pixels even though QSS-M only developer-warns for GL rendering. For broad compatibility, prefer wider atlases over taller ones. Palette indices 224-254 are fullbright; index 255 only works as embedded-skin transparency when the "Index 255 Transparent" flag is enabled.
- QSS-M discovers replacement skin images beside the model by name: `<model>_<skinidx>`, optional `<model>_<skinidx>_pants`, `<model>_<skinidx>_shirt`, and optional fullbright overlays `<model>_<skinidx>_glow` or `<model>_<skinidx>_luma`. These external images are engine-side assets, not stored inside the MDL file.
- `MOD_NOLERP`, `MOD_NOSHADOW`, and `MOD_FBRIGHTHACK` are QSS-M runtime extra flags from cvar name lists or hardcoded matching. They are not authorable MDL header flags.

## Authoring notes

- Quake skins store palette indices. Changing palette slot colors changes every pixel using those slots; remap skin pixels if the palette order changes.
- Treat 224-254 as intentional fullbright only. Accidental pixels in that range become glow contamination.
- A thin black line can be a one-texel UV error rather than missing geometry. On the bundled ID1 Grunt (`progs/soldier.mdl`), use UV Texel Nudge on back-face vertices with S = -1 to correct the known line along its left side; the tool reports shared vertices that also move on the front. Do not apply that asset-specific offset globally.
- Keep texel 0 away from sampled artwork because QuakeSpasm-family engines flood-fill alias skins from that pixel.
- Texture seams and UV splits can raise the exported MDL vertex count, so the textured export can hit limits even when the plain mesh looks safe.
- Vanilla `IDPO` MDL stores topology once and each pose as an unsigned-byte XYZ plus normal index per vertex. Header scale and origin map each axis onto 256 coordinate levels (0-255), so a large all-pose bounding box produces coarser steps. This causes snapping or vertex wobble even without interpolation. Keep bounds tight, avoid distant outlier or hide-away poses, and prefer MD3 for large animated meshes that need finer positions.
- In Blender, use Unit System None when treating 1 Blender unit as 1 Quake map unit. Multiple material slots can become MDL skin slots, but each skin needs the same mesh and UV layout. MDL export is safest with one combined mesh.
- MDL and QuakeC frame indices are zero-based, while many Blender MDL workflows put pose 0 on timeline frame 1. Ranges are inclusive—77 through 97 contains 21 poses and normally exports as MDL indices 0-20. Many exporters use Blender's playback/export range, and some also expect the playhead at its first frame, so extend the range and rewind before export. Keep a written range map and verify the exported pose count after every insert or deletion. QuakeC `$frame` names are compile-time aliases for the same numeric indices used by `self.frame` and `self.weaponframe`, not model precaching.
- MDL pose names occupy exactly 16 single-byte fields; the editor rejects names that would be silently truncated or mangled on save. Only true MDL frame groups store per-pose intervals. Ordinary single-frame animation speed belongs in QuakeC `nextthink` timing, so the duration field is disabled for those frames.
- Relative shape keys store object-space offsets from Basis, not bone-local motion. A Basis edit affects every pose without following a sword, limb, or head rotation, so large structural edits can warp the animation. Keep Relative mode and active-key editing enabled; for a discrete correction, the timeline frame and selected pose key must match, with that key at 1 and the other pose keys at 0. Deleting pose keys may leave keyed influence curves behind, so inspect the Action/F-curves and rebuild the 0→1→0 weights when retiming. This [Blender shape-key walkthrough](https://www.youtube.com/watch?v=rm6iKVf0Upg) demonstrates the workflow.
- To append a pose, add a relative shape key, key its value to 0 before the intended frame, 1 on that frame, and 0 immediately after it, then extend the export range and verify the result in the frame tree. This tool's Duplicate Pose action inserts an editable copy beside the selected pose, and Duplicate Sequence appends a separately named copy of the active sequence. Joining un-keyed geometry to a baked model does not invent motion for it. A separate rigid Blender helper can inherit translation and rotation by being vertex-parented to three non-collinear animated vertices, but MDL exporters may not bake separate objects correctly; prefer an armature and rebake or an MD3 workflow for major and multi-object changes.
- Numbered frame names may be organized into display sequences by an importer or viewer, but that is not an MDL frame group. A true group is one top-level frame containing multiple timed poses that cycle automatically; `self.frame` selects the top-level group index rather than each internal pose. Blender add-ons can flatten, duplicate, freeze, or merge these groups, so verify their boundaries and pose counts after export.
- When testing with QSS-M, remember that package content takes priority over regular loose files in the same game directory. If an export appears unchanged, confirm which model path is actually loaded and check for a conflicting copy inside a PAK before debugging the animation.
- For Quake-style remakes, a Remaster MD5 armature and animations can be a practical base: fit the new mesh to a neutral pose and expect manual weight and pose cleanup. Mirror tools help reconstruct symmetry. Object animation is quick for blockouts, while an armature is easier to revise and rebake. Viewmodels can omit hands or use low-detail fists as part of the weapon; hand/elbow IK targets simplify placement, while extending an arm beyond the elbow improves melee range at the cost of more cleanup and visible MDL wobble.
- A death or damage variant can be appended to the original MDL or placed in a separate MDL selected with QuakeC `setmodel`. After duplicating a sequence here, Collapse Vertex Region selects vertex indices from the displayed pose and collapses those same indices to the animated boundary in each copied pose without welding. Confirm that the intentional degenerate triangles remain. A separate model can delete the head and close the neck, costs a model swap and new code sequence, and is usually easier to rig and texture.
- Collapse Vertex Region asks for confirmation because it changes every selected target pose and intentionally creates degenerate triangles. Save edited assets under a new name while iterating; reloading the source model discards unsaved edits.
- Quake engines normally interpolate corresponding vertices along straight lines; Blender's stepped shape-key preview and its curve easing do not reproduce that runtime motion. Large rotations or scaling can compress, invert, or remove apparent volume between poses. Add intermediate poses and use smaller angular steps. For alternating Nailgun flashes, two meshes that expand and collapse in place avoid dragging one flash between barrels. Collapse/move/expand effects can also make teleports or card swaps, but fixed topology must be preserved and distant poses worsen quantization.
- Original QuakeC commonly advances alias frames every 0.1 seconds (10 fps). A 0.05-second step (20 fps) is a useful smoother starting point for fast weapons; 30-40 fps can reduce rotational distortion further but requires more poses. Frame ranges can use different `nextthink` intervals, letting a 10 fps action contain a faster muzzle-flash frame.
- Swapping an entity between two distinct, identical MDL paths resets animation interpolation in QSS-M, enabling forced jump cuts, instant repositioning, spinning-barrel stops, and hidden reload resets; test other engines before relying on it. In QSS-M, `r_lerpmodels 0` disables interpolation, `1` honors muzzle-flash and no-lerp resets, and `2` keeps interpolation through those exceptions.
- For Blender viewmodel previews, start with a camera at world origin rotated X 90°, Y 0°, Z 270°, looking down the positive X export axis. Blender and Quake FOV numbers are not directly interchangeable because aspect ratio, sensor fit, engine adaptation, HUD mode, weapon scale, and bobbing affect framing. Match a screenshot, then test low and high FOV in-engine.
- MD3 replacements still need a matching MDL name in QuakeSpasm-family engines; keep the placeholder MDL flags intentional when the MD3 is the real asset. Use lowercase texture names in `.skin` files for Linux-safe paths.
- A null MDL placeholder is invisible when enhanced MD3 replacements are disabled. A visible message fallback MDL is safer for MD3-only assets.
- Non-viewmodel MD3 alpha can be engine-version sensitive, especially with overlapping double-sided planes, alternate skins, or placeholder MDL flags. Test foliage, glass, and cards in-engine from several angles.
- Do not make the first MD3 frame collapsed or scaled to zero; use a tiny visible scale or reference pose. A triangulate step can prevent surprise sliced angles.

## Run

You can open `index.html` directly in a browser. Serving the folder over HTTP is
recommended because it lets the print exporter run expensive solid repair in a
background worker instead of temporarily occupying the UI thread.

If your browser is stricter about local file access, run a tiny HTTP server in this folder:

```bash
cd path/to/mdl
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

## 3D printing

The exporter repairs the displayed pose in the browser, so Blender is not required:

1. Select an animation frame and pause on the pose you want.
2. Open **3D Print Export**.
3. Set the intended upright height in millimetres and choose the build-plate orientation.
4. Leave **Solid Repair** on **Automatic** for the closest match to the original Quake facets.
5. Enable the oval base if the feet, tail, or a weapon need a stable plinth.
6. Prefer **3MF** because it records millimetres explicitly. Use binary STL only when a slicer does not accept 3MF.
7. Export once the report says **Watertight manifold**, then inspect the slicer's layer preview.

The export captures the exact displayed pose, including interpolation while animation is playing. Automatic repair:

- removes invalid, zero-area, duplicate, and redundant interior faces;
- welds pose vertices only along MDL edges that collapsed to the same point;
- makes adjacent winding consistent, points closed shells outward, and uses a
  centroid-majority orientation for non-planar open shells;
- fills ordinary holes and reinforces collinear holes with a sub-layer-height patch;
- falls back to a volumetric solid only when local repair cannot produce a positive-volume manifold;
- reports all repair actions, final dimensions, topology, shell count, voxel size, area, and solid volume.

The repair choices are:

- **Automatic (preserve facets)** — recommended. It keeps the original triangles wherever possible and invokes the volumetric fallback only for pathological topology.
- **Robust voxel solid** — always unions overlaps and gives open or fragile surfaces at least voxel-scale thickness. Use this for thin claws, weapons, intersecting parts, or a model that a particular slicer still dislikes.
- **Diagnostics only** — runs the original conservative cleanup without changing holes or non-manifold topology.

**Voxel Detail** controls the fallback grid. Balanced is a good starting point; Fine and Very Fine retain more detail but can take several seconds and produce much larger files. The live report gives the actual voxel size in millimetres. Adding the optional base forces Robust mode and unions an oval base below the grounded model. The exporter caps height, source geometry, voxel work, and output complexity with actionable errors instead of allowing an accidental or malformed input to exhaust browser memory. A background repair that exceeds two minutes is stopped and is not repeated on the UI thread; lower Voxel Detail before retrying.

Practical starting sizes are 40–60 mm for a resin miniature and 100 mm or more for an FDM character. Compact idle/walk poses generally need fewer supports than attacks with extended limbs. Automatic repair makes a slicer-ready closed solid, but it does not generate printer-specific supports; always inspect the layer preview. Neither 3MF nor STL includes the indexed Quake skin, so the result is an uncolored low-poly mesh intended for painting.

## Tests

Run the dependency-free print-export tests with:

```bash
node tests/print-export.test.js
node tests/print-export-worker.test.js
node tests/app-parser.test.js
node tests/ui-audit.test.js
```

Sweep every stored pose and every adjacent 50% interpolated pose in the bundled PAK with:

```bash
node tests/pak-print-sweep.test.js
```
