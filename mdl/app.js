(function () {
  "use strict";

  const TOP_RANGE = 16;
  const BOTTOM_RANGE = 96;
  const DEFAULT_FRAME_DURATION = 0.1;
  const SIDEBAR_WIDTH_KEY = "qss-mdl-viewer-sidebar-width";
  const LOCAL_FONTS_CACHE_KEY = "qss-mdl-local-fonts-cache-v1";
  const LOCAL_FONTS_ENABLED_KEY = "qss-mdl-local-fonts-enabled";
  const PALETTE_GRID_DIMENSION = 16;
  const PALETTE_CANVAS_SIZE = 256;
  const UV_EXPORT_TARGET_SIZE = 1024;
  const GOOGLE_FONTS_CSS2_URL = "https://fonts.googleapis.com/css2";
  const EARCUT_CDN_URL = "https://cdn.jsdelivr.net/npm/earcut/dist/earcut.min.js";
  const OPENTYPE_CDN_URL = "https://cdn.jsdelivr.net/npm/opentype.js/dist/opentype.min.js";
  const WAWOFF2_CDN_URL = "https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js";
  const FONTAWESOME_ICONS_URL = "https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@6.7.2/metadata/icons.json";
  const GOOGLE_FONTS_INDEX_URL = "./gfonts.json";
  const GENERATED_FONT_ICON_FILL_RGB24 = 0x5b431f;
  const BUILTIN_FONT_SOURCES = [
    {
      family: "Quake1",
      aliases: ["Quake", "Quake 1"],
      category: "built-in",
      weights: [400],
      url: "../namemaker/Quake1.ttf",
    },
  ];
  const DEFAULT_QUAKE_PALETTE_RGB24 = [
    0x000000, 0x0f0f0f, 0x1f1f1f, 0x2f2f2f, 0x3f3f3f, 0x4b4b4b, 0x5b5b5b, 0x6b6b6b,
    0x7b7b7b, 0x8b8b8b, 0x9b9b9b, 0xababab, 0xbbbbbb, 0xcbcbcb, 0xdbdbdb, 0xebebeb,
    0x0f0b07, 0x170f0b, 0x1f170b, 0x271b0f, 0x2f2313, 0x372b17, 0x3f2f17, 0x4b371b,
    0x533b1b, 0x5b431f, 0x634b1f, 0x6b531f, 0x73571f, 0x7b5f23, 0x836723, 0x8f6f23,
    0x0b0b0f, 0x13131b, 0x1b1b27, 0x272733, 0x2f2f3f, 0x37374b, 0x3f3f57, 0x474767,
    0x4f4f73, 0x5b5b7f, 0x63638b, 0x6b6b97, 0x7373a3, 0x7b7baf, 0x8383bb, 0x8b8bcb,
    0x000000, 0x070700, 0x0b0b00, 0x131300, 0x1b1b00, 0x232300, 0x2b2b07, 0x2f2f07,
    0x373707, 0x3f3f07, 0x474707, 0x4b4b0b, 0x53530b, 0x5b5b0b, 0x63630b, 0x6b6b0f,
    0x070000, 0x0f0000, 0x170000, 0x1f0000, 0x270000, 0x2f0000, 0x370000, 0x3f0000,
    0x470000, 0x4f0000, 0x570000, 0x5f0000, 0x670000, 0x6f0000, 0x770000, 0x7f0000,
    0x131300, 0x1b1b00, 0x232300, 0x2f2b00, 0x372f00, 0x433700, 0x4b3b07, 0x574307,
    0x5f4707, 0x6b4b0b, 0x77530f, 0x835713, 0x8b5b13, 0x975f1b, 0xa3631f, 0xaf6723,
    0x231307, 0x2f170b, 0x3b1f0f, 0x4b2313, 0x572b17, 0x632f1f, 0x733723, 0x7f3b2b,
    0x8f4333, 0x9f4f33, 0xaf632f, 0xbf772f, 0xcf8f2b, 0xdfab27, 0xefcb1f, 0xfff31b,
    0x0b0700, 0x1b1300, 0x2b230f, 0x372b13, 0x47331b, 0x533723, 0x633f2b, 0x6f4733,
    0x7f533f, 0x8b5f47, 0x9b6b53, 0xa77b5f, 0xb7876b, 0xc3937b, 0xd3a38b, 0xe3b397,
    0xab8ba3, 0x9f7f97, 0x937387, 0x8b677b, 0x7f5b6f, 0x775363, 0x6b4b57, 0x5f3f4b,
    0x573743, 0x4b2f37, 0x43272f, 0x371f23, 0x2b171b, 0x231313, 0x170b0b, 0x0f0707,
    0xbb739f, 0xaf6b8f, 0xa35f83, 0x975777, 0x8b4f6b, 0x7f4b5f, 0x734353, 0x6b3b4b,
    0x5f333f, 0x532b37, 0x47232b, 0x3b1f23, 0x2f171b, 0x231313, 0x170b0b, 0x0f0707,
    0xdbc3bb, 0xcbb3a7, 0xbfa39b, 0xaf978b, 0xa3877b, 0x977b6f, 0x876f5f, 0x7b6353,
    0x6b5747, 0x5f4b3b, 0x533f33, 0x433327, 0x372b1f, 0x271f17, 0x1b130f, 0x0f0b07,
    0x6f837b, 0x677b6f, 0x5f7367, 0x576b5f, 0x4f6357, 0x475b4f, 0x3f5347, 0x374b3f,
    0x2f4337, 0x2b3b2f, 0x233327, 0x1f2b1f, 0x172317, 0x0f1b13, 0x0b130b, 0x070b07,
    0xfff31b, 0xefdf17, 0xdbcb13, 0xcbb70f, 0xbba70f, 0xab970b, 0x9b8307, 0x8b7307,
    0x7b6307, 0x6b5300, 0x5b4700, 0x4b3700, 0x3b2b00, 0x2b1f00, 0x1b0f00, 0x0b0700,
    0x0000ff, 0x0b0bef, 0x1313df, 0x1b1bcf, 0x2323bf, 0x2b2baf, 0x2f2f9f, 0x2f2f8f,
    0x2f2f7f, 0x2f2f6f, 0x2f2f5f, 0x2b2b4f, 0x23233f, 0x1b1b2f, 0x13131f, 0x0b0b0f,
    0x2b0000, 0x3b0000, 0x4b0700, 0x5f0700, 0x6f0f00, 0x7f1707, 0x931f07, 0xa3270b,
    0xb7330f, 0xc34b1b, 0xcf632b, 0xdb7f3b, 0xe3974f, 0xe7ab5f, 0xefbf77, 0xf7d38b,
    0xa77b3b, 0xb79b37, 0xc7c337, 0xe7e357, 0x7fbfff, 0xabe7ff, 0xd7ffff, 0x670000,
    0x8b0000, 0xb30000, 0xd70000, 0xff0000, 0xfff393, 0xfff7c7, 0xffffff, 0x9f5b53,
  ];
  const SYNC_TYPE_LABELS = {
    0: "Sync",
    1: "Rand",
    2: "Frame Time",
  };
  const MODEL_FLAG_DEFINITIONS = [
    { mask: 8, label: "Rotate" },
    { mask: 1, label: "Rocket Smoke Trail" },
    { mask: 2, label: "Grenade Smoke Trail" },
    { mask: 4, label: "Gib Long Blood Trail" },
    { mask: 32, label: "Gib Short Blood Trail" },
    { mask: 16, label: "Wizard Green Tracer" },
    { mask: 64, label: "Hellknight Yellow Tracer" },
    { mask: 128, label: "Vore Purple Tracer" },
    { mask: 1 << 14, label: "Index 255 Transparent" },
  ];
  const VALIDATION_SEVERITY_LABELS = {
    error: "Error",
    warning: "Warning",
    info: "Note",
  };
  const VALIDATION_SEVERITY_ORDER = {
    error: 0,
    warning: 1,
    info: 2,
  };
  const VALIDATION_FIXES = {
    fitExportPacking: { id: "fit-export-packing", label: "Fit Export Packing" },
    useMeasuredRadius: { id: "use-measured-radius", label: "Use Measured Radius" },
    normalizeFrameIntervals: { id: "normalize-frame-intervals", label: "Normalize Frame Intervals" },
    normalizeSkinIntervals: { id: "normalize-skin-intervals", label: "Normalize Skin Intervals" },
  };

  const dom = {
    assetInput: document.getElementById("asset-input"),
    modelPicker: document.getElementById("model-picker"),
    modelSelect: document.getElementById("model-select"),
    paletteStatus: document.getElementById("palette-status"),
    modelStatus: document.getElementById("model-status"),
    framesPanel: document.getElementById("frames-panel"),
    frameTree: document.getElementById("frame-tree"),
    playbackPanel: document.getElementById("playback-panel"),
    detailsPanel: document.getElementById("details-panel"),
    savePanel: document.getElementById("save-panel"),
    skinsPanel: document.getElementById("skins-panel"),
    playToggle: document.getElementById("play-toggle"),
    resetCamera: document.getElementById("reset-camera"),
    speedRange: document.getElementById("speed-range"),
    speedValue: document.getElementById("speed-value"),
    frameGroupSelect: document.getElementById("frame-group-select"),
    frameRange: document.getElementById("frame-range"),
    frameInput: document.getElementById("frame-input"),
    frameValue: document.getElementById("frame-value"),
    frameName: document.getElementById("frame-name"),
    animSequenceName: document.getElementById("anim-sequence-name"),
    animPoseName: document.getElementById("anim-pose-name"),
    animPoseDuration: document.getElementById("anim-pose-duration"),
    animApplyPose: document.getElementById("anim-apply-pose"),
    animRenameSequence: document.getElementById("anim-rename-sequence"),
    animEditorStatus: document.getElementById("anim-editor-status"),
    interpolateToggle: document.getElementById("interpolate-toggle"),
    importSkinButton: document.getElementById("import-skin-button"),
    importSkinInput: document.getElementById("import-skin-input"),
    exportSkinLmpButton: document.getElementById("export-skin-lmp-button"),
    exportUvPngButton: document.getElementById("export-uv-png-button"),
    skinPolyToggle: document.getElementById("skin-poly-toggle"),
    skinPaletteUnusedToggle: document.getElementById("skin-palette-unused-toggle"),
    skinPaletteScope: document.getElementById("skin-palette-scope"),
    skinPaletteRanges: document.getElementById("skin-palette-ranges"),
    skinPaletteCanvas: document.getElementById("skin-palette-canvas"),
    skinPaletteTargetButton: document.getElementById("skin-palette-target-button"),
    skinPaletteApplyButton: document.getElementById("skin-palette-apply-button"),
    skinPaletteClearButton: document.getElementById("skin-palette-clear-button"),
    skinPaletteSelection: document.getElementById("skin-palette-selection"),
    skinPaletteTarget: document.getElementById("skin-palette-target"),
    skinPaletteHelp: document.getElementById("skin-palette-help"),
    skinSelect: document.getElementById("skin-select"),
    playerColorControls: document.getElementById("player-color-controls"),
    recolorToggle: document.getElementById("recolor-toggle"),
    topRange: document.getElementById("topcolor-range"),
    topValue: document.getElementById("topcolor-value"),
    bottomRange: document.getElementById("bottomcolor-range"),
    bottomValue: document.getElementById("bottomcolor-value"),
    skinPreview: document.getElementById("skin-preview"),
    skinStatus: document.getElementById("skin-status"),
    propertiesGrid: document.getElementById("properties-grid"),
    saveModelButton: document.getElementById("save-model-button"),
    saveMapButton: document.getElementById("save-map-button"),
    saveModelStatus: document.getElementById("save-model-status"),
    viewerShell: document.querySelector(".viewer-shell"),
    viewerLayout: document.getElementById("viewer-layout"),
    viewModeOrbit: document.getElementById("view-mode-orbit"),
    viewModeMulti: document.getElementById("view-mode-multi"),
    canvas: document.getElementById("gl-canvas"),
    mainViewPane: document.getElementById("view-main"),
    frontViewPane: document.getElementById("view-front"),
    leftViewPane: document.getElementById("view-left"),
    overlay: document.getElementById("viewport-overlay"),
    splitter: document.getElementById("sidebar-splitter"),
    canvasArea: document.querySelector(".viewer-canvas-area"),
    objectToolsPanel: document.getElementById("object-tools-panel"),
    objMoveX: document.getElementById("obj-move-x"),
    objMoveY: document.getElementById("obj-move-y"),
    objMoveZ: document.getElementById("obj-move-z"),
    objRotateX: document.getElementById("obj-rotate-x"),
    objRotateY: document.getElementById("obj-rotate-y"),
    objRotateZ: document.getElementById("obj-rotate-z"),
    objScaleX: document.getElementById("obj-scale-x"),
    objScaleY: document.getElementById("obj-scale-y"),
    objScaleZ: document.getElementById("obj-scale-z"),
    objToolsScope: document.getElementById("obj-tools-scope"),
    objCenterOrigin: document.getElementById("obj-center-origin"),
    objAlignGround: document.getElementById("obj-align-ground"),
    objToolsApply: document.getElementById("obj-tools-apply"),
    objToolsReset: document.getElementById("obj-tools-reset"),
    lightingPanel: document.getElementById("lighting-panel"),
    lightAzimuthRange: document.getElementById("light-azimuth-range"),
    lightAzimuthValue: document.getElementById("light-azimuth-value"),
    lightElevationRange: document.getElementById("light-elevation-range"),
    lightElevationValue: document.getElementById("light-elevation-value"),
    lightAmbientRange: document.getElementById("light-ambient-range"),
    lightAmbientValue: document.getElementById("light-ambient-value"),
    lightDirectRange: document.getElementById("light-direct-range"),
    lightDirectValue: document.getElementById("light-direct-value"),
    lightHemiRange: document.getElementById("light-hemi-range"),
    lightHemiValue: document.getElementById("light-hemi-value"),
    displayPanel: document.getElementById("display-panel"),
    validationPanel: document.getElementById("validation-panel"),
    validationSummary: document.getElementById("validation-summary"),
    validationList: document.getElementById("validation-list"),
    renderModeSelect: document.getElementById("render-mode-select"),
    opacityRange: document.getElementById("opacity-range"),
    opacityValue: document.getElementById("opacity-value"),
    backfaceCullToggle: document.getElementById("backface-cull-toggle"),
    drawShadowsToggle: document.getElementById("draw-shadows-toggle"),
    wireframeOverlayToggle: document.getElementById("wireframe-overlay-toggle"),
    showEyeToggle: document.getElementById("show-eye-toggle"),
    showBoundsToggle: document.getElementById("show-bounds-toggle"),
    showRadiusToggle: document.getElementById("show-radius-toggle"),
    fullbrightToggle: document.getElementById("fullbright-toggle"),
    showNormalsToggle: document.getElementById("show-normals-toggle"),
    groundPlaneToggle: document.getElementById("ground-plane-toggle"),
    axisToggle: document.getElementById("axis-toggle"),
    bgDark: document.getElementById("bg-dark"),
    bgWhite: document.getElementById("bg-white"),
    bgGrid: document.getElementById("bg-grid"),
    svgImportPanel: document.getElementById("svg-import-panel"),
    svgImportInput: document.getElementById("svg-import-input"),
    svgTextContent: document.getElementById("svg-text-content"),
    svgFontFamily: document.getElementById("svg-font-family"),
    svgFontWeight: document.getElementById("svg-font-weight"),
    svgFontItalic: document.getElementById("svg-font-italic"),
    svgTextGenerate: document.getElementById("svg-text-generate"),
    svgLocalFontsEnable: document.getElementById("svg-local-fonts-enable"),
    svgThickness: document.getElementById("svg-thickness"),
    svgBevelWidth: document.getElementById("svg-bevel-width"),
    svgBevelSegments: document.getElementById("svg-bevel-segments"),
    svgSkinWidth: document.getElementById("svg-skin-width"),
    svgSkinHeight: document.getElementById("svg-skin-height"),
    svgModelScale: document.getElementById("svg-model-scale"),
    svgSimplify: document.getElementById("svg-simplify"),
    svgSimplifyValue: document.getElementById("svg-simplify-value"),
    svgImportGenerate: document.getElementById("svg-import-generate"),
    svgImportStatus: document.getElementById("svg-import-status"),
    gfResults: document.getElementById("gf-results"),
    faSearch: document.getElementById("fa-search"),
    faStyle: document.getElementById("fa-style"),
    faResults: document.getElementById("fa-results"),
    faSelectedLabel: document.getElementById("fa-selected-label"),
    faGenerate: document.getElementById("fa-generate"),
  };

  const skinPreviewContext = dom.skinPreview.getContext("2d", { alpha: true });
  const skinPaletteContext = dom.skinPaletteCanvas.getContext("2d", { alpha: true });
  let earcutLoadPromise = null;
  let opentypeLoadPromise = null;
  let woff2LoadPromise = null;

  const state = {
    assets: new Map(),
    paletteRGBA: null,
    paletteLabel: "",
    model: null,
    currentModelKey: "",
    playing: false,
    playbackSpeed: 1,
    playhead: 0,
    selectedFrameGroupIndex: 0,
    manualFrameIndex: 0,
    frameTreeOpen: new Set(),
    viewportMode: "orbit",
    bgMode: "dark",
    showGroundPlane: true,
    showWorldAxes: true,
    renderMode: "textured",
    modelOpacity: 1,
    backfaceCulling: false,
    drawShadows: false,
    wireframeOverlay: false,
    showEyePosition: false,
    showBoundsOverlay: false,
    showBoundingRadius: false,
    previewFullbrights: true,
    showNormals: false,
    lightAzimuth: 45,
    lightElevation: 60,
    lightAmbient: 0.45,
    lightDirect: 0.45,
    lightHemi: 1.0,
    interpolate: true,
    selectedSkinIndex: 0,
    showSkinPolys: false,
    skinPaletteShowUnused: true,
    skinPaletteScope: "frame",
    skinPaletteRangeEnabled: Array.from({ length: PALETTE_GRID_DIMENSION }, () => true),
    skinPaletteSourceIndices: new Set(),
    skinPaletteTargetIndex: -1,
    skinPalettePickingTarget: false,
    skinPaletteHoverIndex: -1,
    recolorEnabled: false,
    topColor: 0,
    bottomColor: 0,
    textureDirty: true,
    geometryDirty: true,
    svgPendingText: null,
    svgPendingName: "",
    svgPendingOptions: null,
    gfFontsIndex: null,
    gfFontsLoading: false,
    gfActiveIndex: -1,
    gfSearchResults: [],
    selectedFontEntry: null,
    localFontsIndex: null,
    localFontsLoading: false,
    localFontsHydrated: false,
    localFontFaces: new Map(),
    faIconsIndex: null,
    faIconsLoading: false,
    faSelectedIcon: null,
    currentSkinFrameIndex: 0,
    drag: null,
    resizingSidebar: null,
    sampleCache: {
      poseA: -1,
      poseB: -1,
      blend: -1,
      frameIndex: -1,
      frameName: "",
    },
    camera: {
      yaw: -0.8,
      pitch: 0.55,
      distance: 150,
      target: [0, 0, 0],
    },
    gl: null,
  };

  function init() {
    applyDefaultPalette();
    buildSkinPaletteRanges();
    syncSkinPaletteControls();
    applySidebarWidth(loadSidebarWidth());
    initRenderer();
    bindEvents();
    refreshModelList();

    setViewportMode("orbit");
    setBgMode("dark");
    updatePlaybackControls();
    syncModelDependentPanels();
    updateColorLabels();
    syncDisplayControls();
    updateSkinPaletteEditor();
    updateValidationPanel();
    restoreCachedLocalFonts();
    void maybeWarmLocalFontsCache();
    updateOverlay("Load a `.mdl` or `.pak` to begin. Using the default Quake palette; load `palette.lmp` to override it.");
    requestAnimationFrame(frame);
  }

  function buildSkinPaletteRanges() {
    dom.skinPaletteRanges.innerHTML = "";
    for (let rangeIndex = 0; rangeIndex < PALETTE_GRID_DIMENSION; rangeIndex++) {
      const row = document.createElement("label");
      row.className = "skin-palette-range";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.skinPaletteRangeEnabled[rangeIndex];
      input.dataset.rangeIndex = String(rangeIndex);

      const text = document.createElement("span");
      text.className = "skin-palette-range-text";

      const title = document.createElement("span");
      title.className = "skin-palette-range-title";
      title.textContent = getSkinPaletteRangeTitle(rangeIndex);
      text.appendChild(title);

      const subtitle = getSkinPaletteRangeSubtitle(rangeIndex);
      if (subtitle) {
        const meta = document.createElement("span");
        meta.className = "skin-palette-range-meta";
        meta.textContent = subtitle;
        text.appendChild(meta);
      }

      row.appendChild(input);
      row.appendChild(text);
      dom.skinPaletteRanges.appendChild(row);
    }
  }

  function syncSkinPaletteControls() {
    dom.skinPaletteUnusedToggle.checked = state.skinPaletteShowUnused;
    dom.skinPaletteScope.value = state.skinPaletteScope;
    dom.skinPaletteRanges.querySelectorAll("input[data-range-index]").forEach((input) => {
      const rangeIndex = clamp(parseInt(input.dataset.rangeIndex, 10) || 0, 0, PALETTE_GRID_DIMENSION - 1);
      input.checked = !!state.skinPaletteRangeEnabled[rangeIndex];
    });
  }

  function bindEvents() {
    dom.assetInput.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) {
        return;
      }
      await loadFiles(files);
      dom.assetInput.value = "";
    });

    dom.modelSelect.addEventListener("change", () => {
      if (!dom.modelSelect.value) {
        return;
      }
      loadModelByKey(dom.modelSelect.value);
    });


    dom.viewModeOrbit.addEventListener("click", () => {
      setViewportMode("orbit");
    });

    dom.viewModeMulti.addEventListener("click", () => {
      setViewportMode("multi");
    });

    dom.groundPlaneToggle.addEventListener("click", () => {
      state.showGroundPlane = !state.showGroundPlane;
      dom.groundPlaneToggle.classList.toggle("is-active", state.showGroundPlane);
      dom.groundPlaneToggle.setAttribute("aria-pressed", state.showGroundPlane ? "true" : "false");
    });

    dom.axisToggle.addEventListener("click", () => {
      state.showWorldAxes = !state.showWorldAxes;
      dom.axisToggle.classList.toggle("is-active", state.showWorldAxes);
      dom.axisToggle.setAttribute("aria-pressed", state.showWorldAxes ? "true" : "false");
    });

    dom.bgDark.addEventListener("click", () => setBgMode("dark"));
    dom.bgWhite.addEventListener("click", () => setBgMode("white"));
    dom.bgGrid.addEventListener("click", () => setBgMode("grid"));

    dom.lightAzimuthRange.addEventListener("input", () => {
      state.lightAzimuth = parseFloat(dom.lightAzimuthRange.value);
      dom.lightAzimuthValue.textContent = state.lightAzimuth + "°";
    });
    dom.lightElevationRange.addEventListener("input", () => {
      state.lightElevation = parseFloat(dom.lightElevationRange.value);
      dom.lightElevationValue.textContent = state.lightElevation + "°";
    });
    dom.lightAmbientRange.addEventListener("input", () => {
      state.lightAmbient = parseFloat(dom.lightAmbientRange.value);
      dom.lightAmbientValue.textContent = state.lightAmbient.toFixed(2);
    });
    dom.lightDirectRange.addEventListener("input", () => {
      state.lightDirect = parseFloat(dom.lightDirectRange.value);
      dom.lightDirectValue.textContent = state.lightDirect.toFixed(2);
    });
    dom.lightHemiRange.addEventListener("input", () => {
      state.lightHemi = parseFloat(dom.lightHemiRange.value);
      dom.lightHemiValue.textContent = state.lightHemi.toFixed(2);
    });

    dom.propertiesGrid.addEventListener("change", handlePropertiesGridChange);

    dom.propertiesGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      if (button.dataset.action === "apply-skin-size") {
        applySkinSizeDraft();
        return;
      }

      if (button.dataset.action === "fit-export-packing") {
        fitModelExportPacking();
      }
    });

    dom.validationList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-validation-fix]");
      if (!button) {
        return;
      }
      applyValidationFix(button.dataset.validationFix);
    });

    dom.saveModelButton.addEventListener("click", async () => {
      await saveCurrentModel();
    });
    dom.saveMapButton.addEventListener("click", async () => {
      await saveCurrentModelAsMap();
    });

    dom.objToolsApply.addEventListener("click", () => {
      applyObjectTransform();
    });

    dom.objCenterOrigin.addEventListener("click", () => {
      centerModelOnOrigin();
    });

    dom.objAlignGround.addEventListener("click", () => {
      alignModelToGround();
    });

    dom.objToolsReset.addEventListener("click", () => {
      resetObjectToolsInputs();
    });

    dom.importSkinButton.addEventListener("click", () => {
      dom.importSkinInput.click();
    });

    dom.importSkinInput.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files || []);
      if (file) {
        await importSkinFile(file);
      }
      dom.importSkinInput.value = "";
    });

    dom.exportSkinLmpButton.addEventListener("click", () => {
      exportCurrentSkinAsLmp();
    });

    dom.exportUvPngButton.addEventListener("click", async () => {
      await exportCurrentUvAsPng();
    });

    dom.svgImportInput.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files || []);
      if (file) {
        await loadSvgFile(file);
      }
      dom.svgImportInput.value = "";
    });

    dom.svgTextGenerate.addEventListener("click", () => {
      generateModelFromGoogleFontText();
    });
    if (dom.svgLocalFontsEnable) {
      dom.svgLocalFontsEnable.addEventListener("click", async () => {
        dom.svgLocalFontsEnable.disabled = true;
        dom.svgImportStatus.textContent = "Requesting access to installed fonts...";
        try {
          const localFonts = await ensureLocalFontsIndex({ requireLiveData: true, forceRefresh: true });
          const count = localFonts.length;
          dom.svgImportStatus.textContent = count
            ? `Loaded ${count} installed fonts. Search by full face name or family.`
            : "No installed fonts were returned by the browser.";
          if (dom.svgFontFamily.value.trim()) {
            searchGoogleFonts();
          }
        } catch (error) {
          console.error(error);
          dom.svgImportStatus.textContent = `Installed font access failed: ${error.message}`;
        } finally {
          dom.svgLocalFontsEnable.disabled = false;
          updateLocalFontsButtonState();
        }
      });
      if (typeof window.queryLocalFonts !== "function") {
        dom.svgLocalFontsEnable.disabled = true;
        dom.svgLocalFontsEnable.title = "Installed font access is not available in this browser.";
      }
      updateLocalFontsButtonState();
    }

    let gfSearchTimer = 0;
    dom.svgFontFamily.addEventListener("input", () => {
      state.selectedFontEntry = null;
      clearTimeout(gfSearchTimer);
      gfSearchTimer = setTimeout(() => searchGoogleFonts(), 200);
    });
    dom.svgFontFamily.addEventListener("focus", () => {
      if (dom.svgFontFamily.value.trim()) {
        searchGoogleFonts();
      }
    });
    dom.svgFontFamily.addEventListener("keydown", (event) => {
      handleGoogleFontKeydown(event);
    });
    dom.gfResults.addEventListener("mousedown", (event) => {
      const item = event.target.closest(".gf-font-item");
      if (!item) return;
      event.preventDefault();
      pickGoogleFont(parseInt(item.dataset.index, 10));
    });
    document.addEventListener("mousedown", (event) => {
      if (!event.target.closest(".gf-search-wrapper")) {
        closeGoogleFontResults();
      }
    });

    dom.svgImportGenerate.addEventListener("click", () => {
      generateModelFromPendingSvg();
    });

    if (dom.svgSimplify) {
      updateSimplifyLabel();
      // Update the readout while dragging, but only re-extrude on release: the
      // cached SVG is reused (no font refetch), yet a full rebuild per tick would
      // thrash the camera/playback reset in activateGeneratedModel.
      dom.svgSimplify.addEventListener("input", updateSimplifyLabel);
      dom.svgSimplify.addEventListener("change", () => {
        updateSimplifyLabel();
        if (state.svgPendingText) {
          generateModelFromPendingSvg();
        }
      });
    }

    let faSearchTimer = 0;
    dom.faSearch.addEventListener("input", () => {
      clearTimeout(faSearchTimer);
      faSearchTimer = setTimeout(() => searchFontAwesomeIcons(), 250);
    });
    dom.faStyle.addEventListener("change", () => {
      searchFontAwesomeIcons();
    });
    dom.faResults.addEventListener("click", (event) => {
      const cell = event.target.closest(".fa-icon-cell");
      if (!cell) return;
      selectFontAwesomeIcon(cell.dataset.iconName, cell.dataset.iconStyle);
    });
    dom.faGenerate.addEventListener("click", () => {
      generateModelFromFontAwesomeIcon();
    });

    dom.renderModeSelect.addEventListener("change", () => {
      state.renderMode = normalizeRenderMode(dom.renderModeSelect.value);
      syncDisplayControls();
    });

    dom.opacityRange.addEventListener("input", () => {
      state.modelOpacity = clamp(parseFloat(dom.opacityRange.value) || 1, 0.1, 1);
      syncDisplayControls();
    });

    dom.backfaceCullToggle.addEventListener("change", () => {
      state.backfaceCulling = dom.backfaceCullToggle.checked;
    });

    dom.drawShadowsToggle.addEventListener("change", () => {
      state.drawShadows = dom.drawShadowsToggle.checked;
    });

    dom.wireframeOverlayToggle.addEventListener("change", () => {
      state.wireframeOverlay = dom.wireframeOverlayToggle.checked;
    });

    dom.showEyeToggle.addEventListener("change", () => {
      state.showEyePosition = dom.showEyeToggle.checked;
    });

    dom.showBoundsToggle.addEventListener("change", () => {
      state.showBoundsOverlay = dom.showBoundsToggle.checked;
    });

    dom.showRadiusToggle.addEventListener("change", () => {
      state.showBoundingRadius = dom.showRadiusToggle.checked;
    });

    dom.fullbrightToggle.addEventListener("change", () => {
      state.previewFullbrights = dom.fullbrightToggle.checked;
    });

    dom.showNormalsToggle.addEventListener("change", () => {
      state.showNormals = dom.showNormalsToggle.checked;
    });

    dom.skinPaletteUnusedToggle.addEventListener("change", () => {
      state.skinPaletteShowUnused = dom.skinPaletteUnusedToggle.checked;
      pruneSkinPaletteSourceSelection();
      updateSkinPaletteEditor();
    });

    dom.skinPaletteScope.addEventListener("change", () => {
      state.skinPaletteScope = dom.skinPaletteScope.value === "skin" ? "skin" : "frame";
      pruneSkinPaletteSourceSelection();
      updateSkinPaletteEditor();
    });

    dom.skinPaletteRanges.addEventListener("change", (event) => {
      const checkbox = event.target.closest("input[data-range-index]");
      if (!checkbox) {
        return;
      }

      const rangeIndex = clamp(parseInt(checkbox.dataset.rangeIndex, 10) || 0, 0, PALETTE_GRID_DIMENSION - 1);
      state.skinPaletteRangeEnabled[rangeIndex] = checkbox.checked;
      pruneSkinPaletteSourceSelection();
      updateSkinPaletteEditor();
    });

    dom.skinPaletteTargetButton.addEventListener("click", () => {
      state.skinPalettePickingTarget = !state.skinPalettePickingTarget;
      updateSkinPaletteEditor();
    });

    dom.skinPaletteApplyButton.addEventListener("click", () => {
      applySkinPaletteRemap();
    });

    dom.skinPaletteClearButton.addEventListener("click", () => {
      clearSkinPaletteSelection(true);
      updateSkinPaletteEditor();
    });

    dom.skinPaletteCanvas.addEventListener("click", (event) => {
      if (event.detail > 1) {
        return;
      }
      handleSkinPaletteCanvasClick(event, false);
    });

    dom.skinPaletteCanvas.addEventListener("dblclick", (event) => {
      handleSkinPaletteCanvasClick(event, true);
    });

    dom.skinPaletteCanvas.addEventListener("mousemove", (event) => {
      const hoverIndex = getSkinPaletteIndexFromEvent(event);
      if (hoverIndex === state.skinPaletteHoverIndex) {
        return;
      }
      state.skinPaletteHoverIndex = hoverIndex;
      updateSkinPaletteEditor();
    });

    dom.skinPaletteCanvas.addEventListener("mouseleave", () => {
      if (state.skinPaletteHoverIndex === -1) {
        return;
      }
      state.skinPaletteHoverIndex = -1;
      updateSkinPaletteEditor();
    });

    dom.frameTree.addEventListener("click", (event) => {
      const poseButton = event.target.closest("[data-pose-index]");
      if (poseButton) {
        selectFrameGroup(
          parseInt(poseButton.dataset.groupIndex, 10) || 0,
          parseInt(poseButton.dataset.poseIndex, 10) || 0
        );
        return;
      }

      const summary = event.target.closest("summary[data-group-index]");
      if (!summary) {
        return;
      }

      selectFrameGroup(parseInt(summary.dataset.groupIndex, 10) || 0, 0, false);
    });

    dom.playToggle.addEventListener("click", () => {
      if (!state.model) {
        return;
      }
      const activeGroup = getActiveFrameGroup();
      const activePoseCount = activeGroup ? Math.max(activeGroup.poseIndices.length, 1) : 0;
      if (!state.playing && activePoseCount <= 1) {
        const fallbackGroupIndex = findFirstPlayableFrameGroupIndex(state.model);
        if (fallbackGroupIndex >= 0) {
          selectFrameGroup(fallbackGroupIndex, 0);
        }
      }
      state.playing = !state.playing;
      updatePlaybackControls();
    });

    dom.resetCamera.addEventListener("click", () => {
      resetCamera();
    });

    dom.speedRange.addEventListener("input", () => {
      state.playbackSpeed = parseFloat(dom.speedRange.value);
      dom.speedValue.textContent = `${state.playbackSpeed.toFixed(2)}x`;
    });

    dom.frameGroupSelect.addEventListener("change", () => {
      selectFrameGroup(parseInt(dom.frameGroupSelect.value, 10) || 0, 0);
    });

    dom.frameRange.addEventListener("input", () => {
      setManualFrameIndex(parseInt(dom.frameRange.value, 10) || 0);
    });

    dom.frameInput.addEventListener("input", () => {
      const requestedFrame = parseInt(dom.frameInput.value, 10);
      if (!Number.isFinite(requestedFrame)) {
        return;
      }
      setManualFrameIndex(requestedFrame - 1, true);
    });

    dom.frameInput.addEventListener("blur", () => {
      updateTimelineRange();
    });

    dom.animApplyPose.addEventListener("click", () => {
      applyActivePoseEdits();
    });

    dom.animRenameSequence.addEventListener("click", () => {
      renameActiveSequence();
    });

    dom.interpolateToggle.addEventListener("change", () => {
      state.interpolate = dom.interpolateToggle.checked;
      state.geometryDirty = true;
    });

    dom.skinSelect.addEventListener("change", () => {
      state.selectedSkinIndex = parseInt(dom.skinSelect.value, 10) || 0;
      clearSkinPaletteSelection(true);
      state.textureDirty = true;
      updateSkinStatus();
    });

    dom.skinPolyToggle.addEventListener("change", () => {
      state.showSkinPolys = dom.skinPolyToggle.checked;
      state.textureDirty = true;
    });

    dom.recolorToggle.addEventListener("change", () => {
      state.recolorEnabled = dom.recolorToggle.checked;
      state.textureDirty = true;
      updateSkinStatus();
    });

    dom.topRange.addEventListener("input", () => {
      state.topColor = parseInt(dom.topRange.value, 10) || 0;
      updateColorLabels();
      state.textureDirty = true;
    });

    dom.bottomRange.addEventListener("input", () => {
      state.bottomColor = parseInt(dom.bottomRange.value, 10) || 0;
      updateColorLabels();
      state.textureDirty = true;
    });

    dom.canvas.addEventListener("pointerdown", (event) => {
      if (!isEventInsideElement(event, dom.mainViewPane)) {
        return;
      }
      dom.canvas.setPointerCapture(event.pointerId);
      state.drag = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    });

    dom.canvas.addEventListener("pointermove", (event) => {
      if (!state.drag || state.drag.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - state.drag.x;
      const dy = event.clientY - state.drag.y;
      state.drag.x = event.clientX;
      state.drag.y = event.clientY;

      state.camera.yaw -= dx * 0.01;
      state.camera.pitch += dy * 0.01;
      state.camera.pitch = clamp(state.camera.pitch, -1.45, 1.45);
    });

    dom.canvas.addEventListener("pointerup", (event) => {
      if (state.drag && state.drag.pointerId === event.pointerId) {
        state.drag = null;
      }
    });

    dom.canvas.addEventListener("pointercancel", () => {
      state.drag = null;
    });

    dom.canvas.addEventListener("wheel", (event) => {
      if (!isEventInsideElement(event, dom.mainViewPane)) {
        return;
      }
      event.preventDefault();
      const factor = Math.exp(event.deltaY * 0.001);
      state.camera.distance = clamp(state.camera.distance * factor, 5, 20000);
    }, { passive: false });

    if (dom.splitter) {
      dom.splitter.addEventListener("pointerdown", (event) => {
        if (window.matchMedia("(max-width: 1100px)").matches) {
          return;
        }

        dom.splitter.setPointerCapture(event.pointerId);
        state.resizingSidebar = {
          pointerId: event.pointerId,
        };
        document.body.classList.add("is-resizing");
        event.preventDefault();
      });

      dom.splitter.addEventListener("pointermove", (event) => {
        if (!state.resizingSidebar || state.resizingSidebar.pointerId !== event.pointerId) {
          return;
        }
        resizeSidebarTo(event.clientX);
      });

      dom.splitter.addEventListener("pointerup", (event) => {
        if (!state.resizingSidebar || state.resizingSidebar.pointerId !== event.pointerId) {
          return;
        }
        resizeSidebarTo(event.clientX);
        finishSidebarResize();
      });

      dom.splitter.addEventListener("pointercancel", () => {
        finishSidebarResize();
      });

      dom.splitter.addEventListener("keydown", (event) => {
        if (window.matchMedia("(max-width: 1100px)").matches) {
          return;
        }

        const current = getCurrentSidebarWidth();
        if (event.key === "ArrowLeft") {
          applySidebarWidth(current - 24);
          persistSidebarWidth(getCurrentSidebarWidth());
          event.preventDefault();
        } else if (event.key === "ArrowRight") {
          applySidebarWidth(current + 24);
          persistSidebarWidth(getCurrentSidebarWidth());
          event.preventDefault();
        }
      });
    }
  }

  async function loadFiles(files) {
    for (const file of files) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".svg")) {
          const text = new TextDecoder().decode(bytes);
          await loadSvgText(text, file.name, { sourceKind: "svg" });
          continue;
        } else if (lowerName.endsWith(".pak")) {
          const pakAssets = parsePak(file.name, bytes);
          for (const asset of pakAssets) {
            ingestAsset(asset.path, asset.bytes, `pak:${file.name}`);
          }
        } else {
          ingestAsset(file.name, bytes, "file");
        }
      } catch (error) {
        console.error(error);
        updateOverlay(`Failed to load ${file.name}: ${error.message}`);
      }
    }

    refreshModelList();
    if (!state.currentModelKey && dom.modelSelect.options.length) {
      loadModelByKey(dom.modelSelect.options[0].value);
    } else if (state.currentModelKey) {
      const currentAsset = state.assets.get(state.currentModelKey);
      if (currentAsset) {
        loadModelByKey(state.currentModelKey, false);
      }
    }
  }

  function ingestAsset(path, bytes, source) {
    const normalizedPath = normalizePath(path);
    const lowerPath = normalizedPath.toLowerCase();

    if (lowerPath.endsWith(".mdl")) {
      state.assets.set(lowerPath, {
        key: lowerPath,
        path: normalizedPath,
        source,
        kind: "mdl",
        bytes,
      });
      return;
    }

    const baseName = lowerPath.split("/").pop();
    if (baseName === "palette.lmp" || (lowerPath.endsWith(".lmp") && bytes.length === 768)) {
      state.assets.set(lowerPath, {
        key: lowerPath,
        path: normalizedPath,
        source,
        kind: "palette",
        bytes,
      });
      setPalette(bytes, normalizedPath);
    }
  }

  function refreshModelList() {
    const modelAssets = Array.from(state.assets.values())
      .filter((asset) => asset.kind === "mdl")
      .sort((a, b) => a.path.localeCompare(b.path));

    const hasModels = modelAssets.length > 0;
    dom.modelPicker.classList.toggle("is-hidden", !hasModels);
    dom.modelPicker.setAttribute("aria-hidden", hasModels ? "false" : "true");

    dom.modelSelect.innerHTML = "";
    for (const asset of modelAssets) {
      const option = document.createElement("option");
      option.value = asset.key;
      option.textContent = asset.path;
      dom.modelSelect.appendChild(option);
    }

    if (state.currentModelKey) {
      dom.modelSelect.value = state.currentModelKey;
    }
  }

  function setPalette(bytes, label) {
    state.paletteRGBA = parsePalette(bytes);
    state.paletteLabel = label;
    dom.paletteStatus.textContent = label;
    state.textureDirty = true;
    updateSkinStatus();
  }

  function applyDefaultPalette() {
    state.paletteRGBA = buildDefaultPaletteRGBA();
    state.paletteLabel = "Default Quake palette";
    dom.paletteStatus.textContent = state.paletteLabel;
    state.textureDirty = true;
  }

  function loadModelByKey(key, resetPlayhead = true) {
    const asset = state.assets.get(key);
    if (!asset || asset.kind !== "mdl") {
      return;
    }
    if (!asset.bytes) {
      return;
    }

    try {
      const model = parseMDL(asset.bytes, asset.path);
      model.render = buildRenderData(model);
      model.frameGroups = buildFrameGroups(model);
      state.model = model;
      state.currentModelKey = key;
      dom.modelSelect.value = key;
      dom.modelStatus.textContent = asset.path;
      state.frameTreeOpen = new Set(model.frameGroups.map((_, index) => index));
      populateFrameGroupList(model);
      renderFrameTree(model);
      populateSkinList(model);
      populateProperties(model);
      updateValidationPanel();
      setSaveStatus("Edit fields below, then save or export the model.");
  
      const defaultFrameGroupIndex = findFirstPlayableFrameGroupIndex(model);
      state.selectedFrameGroupIndex = defaultFrameGroupIndex >= 0 ? defaultFrameGroupIndex : 0;
      dom.frameGroupSelect.value = String(state.selectedFrameGroupIndex);
      state.selectedSkinIndex = 0;
      dom.skinSelect.value = "0";
      clearSkinPaletteSelection(true);
      state.recolorEnabled = /(^|\/)player\.mdl$/i.test(model.path);
      dom.recolorToggle.checked = state.recolorEnabled;
      syncPlayerColorControls();
      if (resetPlayhead) {
        state.playhead = 0;
        state.manualFrameIndex = 0;
      } else {
        const activeGroup = getActiveFrameGroup();
        const poseCount = activeGroup ? activeGroup.poseIndices.length : 1;
        state.manualFrameIndex = clamp(state.manualFrameIndex, 0, Math.max(poseCount - 1, 0));
      }
      state.playing = false;
      updateTimelineRange();
      resetCamera();
      updatePlaybackControls();
      syncModelDependentPanels();
      updateSkinStatus();
      syncFrameTreeSelection(state.manualFrameIndex);
      state.textureDirty = true;
      state.geometryDirty = true;
      uploadModelBuffers();
      hideOverlay();
    } catch (error) {
      console.error(error);
      updateOverlay(`Failed to parse ${asset.path}: ${error.message}`);
    }
  }

  function populateSkinList(model) {
    dom.skinSelect.innerHTML = "";
    model.skins.forEach((skin, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = skin.frames.length > 1
        ? `Skin ${index} (${skin.frames.length} frames)`
        : `Skin ${index}`;
      dom.skinSelect.appendChild(option);
    });
  }

  function populateFrameGroupList(model) {
    dom.frameGroupSelect.innerHTML = "";
    model.frameGroups.forEach((group, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = group.label;
      dom.frameGroupSelect.appendChild(option);
    });
  }

  function renderFrameTree(model) {
    dom.frameTree.innerHTML = "";

    model.frameGroups.forEach((group, groupIndex) => {
      const poseCount = Math.max(group.poseIndices.length, 1);
      const isGrouped = poseCount > 1 && group.type !== "all";

      if (!isGrouped) {
        const leaf = document.createElement("button");
        leaf.type = "button";
        leaf.className = "frame-leaf";
        leaf.dataset.groupIndex = String(groupIndex);
        leaf.dataset.poseIndex = "0";
        leaf.textContent = group.poseName || group.label;
        dom.frameTree.appendChild(leaf);
        return;
      }

      const details = document.createElement("details");
      details.className = "frame-group";
      details.dataset.groupIndex = String(groupIndex);
      details.open = state.frameTreeOpen.has(groupIndex);
      details.addEventListener("toggle", () => {
        if (details.open) {
          state.frameTreeOpen.add(groupIndex);
        } else {
          state.frameTreeOpen.delete(groupIndex);
        }
      });

      const summary = document.createElement("summary");
      summary.dataset.groupIndex = String(groupIndex);

      const label = document.createElement("span");
      label.className = "frame-group-label";
      label.textContent = group.treeLabel || group.label;
      summary.appendChild(label);

      const list = document.createElement("div");
      list.className = "frame-pose-list";
      group.poseIndices.forEach((poseIndex, poseIndexInGroup) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "frame-pose";
        button.dataset.groupIndex = String(groupIndex);
        button.dataset.poseIndex = String(poseIndexInGroup);
        button.textContent = model.poses[poseIndex]?.name || `${group.name || group.label}_${poseIndexInGroup + 1}`;
        list.appendChild(button);
      });

      details.appendChild(summary);
      details.appendChild(list);
      dom.frameTree.appendChild(details);
    });
  }

  function selectFrameGroup(groupIndex, poseIndex = 0, stopPlayback = true) {
    if (!state.model || !state.model.frameGroups || !state.model.frameGroups.length) {
      return;
    }

    state.selectedFrameGroupIndex = clamp(groupIndex, 0, state.model.frameGroups.length - 1);
    const activeGroup = getActiveFrameGroup();
    const poseCount = activeGroup ? Math.max(activeGroup.poseIndices.length, 1) : 1;
    state.manualFrameIndex = clamp(poseIndex, 0, poseCount - 1);
    state.playhead = computePoseStartTime(activeGroup, state.manualFrameIndex);
    if (stopPlayback) {
      state.playing = false;
    }

    dom.frameGroupSelect.value = String(state.selectedFrameGroupIndex);
    if (activeGroup && activeGroup.poseIndices.length > 1) {
      state.frameTreeOpen.add(state.selectedFrameGroupIndex);
    }

    updateTimelineRange();
    updatePlaybackControls();
    syncFrameTreeSelection(state.manualFrameIndex);
    state.geometryDirty = true;
  }

  function findFirstPlayableFrameGroupIndex(model) {
    if (!model || !model.frameGroups || !model.frameGroups.length) {
      return -1;
    }

    const sequenceIndex = model.frameGroups.findIndex((group) =>
      group.type !== "all" && (group.poseIndices?.length || 0) > 1
    );
    if (sequenceIndex >= 0) {
      return sequenceIndex;
    }

    return model.frameGroups.findIndex((group) => (group.poseIndices?.length || 0) > 1);
  }

  function syncFrameTreeSelection(frameIndex = state.manualFrameIndex) {
    const selectedGroupIndex = String(state.selectedFrameGroupIndex);
    const selectedPoseIndex = String(frameIndex);

    dom.frameTree.querySelectorAll("summary[data-group-index]").forEach((summary) => {
      const isSelected = summary.dataset.groupIndex === selectedGroupIndex;
      summary.classList.toggle("is-selected", isSelected);
    });

    dom.frameTree.querySelectorAll(".frame-leaf, .frame-pose").forEach((element) => {
      const isSelected = element.dataset.groupIndex === selectedGroupIndex &&
        element.dataset.poseIndex === selectedPoseIndex;
      element.classList.toggle("is-selected", isSelected);
      element.setAttribute("aria-selected", isSelected ? "true" : "false");
    });

    const activeDetails = dom.frameTree.querySelector(`details[data-group-index="${selectedGroupIndex}"]`);
    if (activeDetails) {
      activeDetails.open = true;
    }
  }

  function populateProperties(model) {
    dom.propertiesGrid.innerHTML = "";

    const firstFrameBounds = model.render.positionsByPose.length
      ? computeBounds([model.render.positionsByPose[0]])
      : null;
    const allFrameBounds = model.render.bounds;

    dom.propertiesGrid.appendChild(buildPropertyCard("Model Contents", [
      ["Path", model.path],
      ["Skins", String(model.skins.length)],
      ["Frames", String(model.numFrames)],
      ["Poses", String(model.poses.length)],
      ["Vertices", String(model.numVerts)],
      ["Triangles", String(model.numTris)],
      ["Render Vertices", String(model.render.vertexCount)],
    ]));

    dom.propertiesGrid.appendChild(buildBoundsCard("Bounds", firstFrameBounds, allFrameBounds));
    dom.propertiesGrid.appendChild(buildBoundingRadiusEditor(model));
    dom.propertiesGrid.appendChild(buildExportPackingCard(model));
    dom.propertiesGrid.appendChild(buildSkinSizeEditor(model));
    dom.propertiesGrid.appendChild(buildEyePositionEditor(model));
    dom.propertiesGrid.appendChild(buildSyncTypeEditor(model));
    dom.propertiesGrid.appendChild(buildFlagsCard(model.flags));
  }

  function buildPropertyCard(title, rows) {
    const section = document.createElement("section");
    section.className = "property-card";

    const heading = document.createElement("h3");
    heading.textContent = title;
    section.appendChild(heading);

    const list = document.createElement("dl");
    list.className = "property-list";
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.appendChild(dt);
      row.appendChild(dd);
      list.appendChild(row);
    });
    section.appendChild(list);

    return section;
  }

  function buildBoundsCard(title, firstBounds, allBounds) {
    const section = document.createElement("section");
    section.className = "property-card property-card-wide";

    const heading = document.createElement("h3");
    heading.textContent = title;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "property-subgrid";
    grid.appendChild(buildBoundsSubsection("First Frame", firstBounds));
    grid.appendChild(buildBoundsSubsection("All Frames", allBounds));
    section.appendChild(grid);

    return section;
  }

  function buildBoundsSubsection(title, bounds) {
    const wrapper = document.createElement("section");
    wrapper.className = "property-subsection";

    const heading = document.createElement("h4");
    heading.textContent = title;
    wrapper.appendChild(heading);

    const rows = bounds
      ? [
          [buildAxisTupleLabel("Box"), formatVec3(boundsSize(bounds))],
          [buildAxisTupleLabel("Upper"), formatVec3(bounds.max)],
          [buildAxisTupleLabel("Lower"), formatVec3(bounds.min)],
        ]
      : [
          [buildAxisTupleLabel("Box"), "-"],
          [buildAxisTupleLabel("Upper"), "-"],
          [buildAxisTupleLabel("Lower"), "-"],
        ];

    wrapper.appendChild(buildPropertyList(rows));
    return wrapper;
  }

  function buildSkinSizeEditor(model) {
    const section = document.createElement("section");
    section.className = "property-card";

    const heading = document.createElement("h3");
    heading.textContent = "Skin Size";
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "property-edit-grid";
    grid.appendChild(buildLabeledNumberInput("Width", "prop-skin-width", model.skinWidth, {
      min: 1,
      max: 3072,
      step: 1,
    }));
    grid.appendChild(buildLabeledNumberInput("Height", "prop-skin-height", model.skinHeight, {
      min: 1,
      max: 1024,
      step: 1,
    }));
    section.appendChild(grid);

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = "apply-skin-size";
    button.textContent = "Apply Skin Size";
    section.appendChild(button);

    const hint = document.createElement("p");
    hint.className = "hint property-hint";
    hint.textContent = "Resizes all skins and scales skin vertices to match the new size.";
    section.appendChild(hint);

    return section;
  }

  function buildEyePositionEditor(model) {
    const section = document.createElement("section");
    section.className = "property-card";

    const heading = document.createElement("h3");
    heading.textContent = "Eye Position";
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "property-edit-grid";
    grid.appendChild(buildLabeledNumberInput("X", "prop-eye-x", model.eyePosition[0], { step: "any" }));
    grid.appendChild(buildLabeledNumberInput("Y", "prop-eye-y", model.eyePosition[1], { step: "any" }));
    grid.appendChild(buildLabeledNumberInput("Z", "prop-eye-z", model.eyePosition[2], { step: "any" }));
    section.appendChild(grid);

    return section;
  }

  function buildBoundingRadiusEditor(model) {
    const section = document.createElement("section");
    section.className = "property-card";

    const heading = document.createElement("h3");
    heading.textContent = "Bounding Radius";
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "property-edit-grid";
    grid.appendChild(buildLabeledNumberInput("Header", "prop-bounding-radius", model.boundingRadius, {
      min: 0,
      step: "any",
    }));
    section.appendChild(grid);

    const measured = document.createElement("p");
    measured.className = "hint property-hint";
    measured.textContent = `Max vertex distance from origin across all poses: ${formatNumber(computeModelOriginRadius(model.render.positionsByPose))}`;
    section.appendChild(measured);

    const note = document.createElement("p");
    note.className = "hint property-hint";
    note.textContent = "This header value is visualized around the model origin and used when exporting the MDL.";
    section.appendChild(note);

    return section;
  }

  function buildExportPackingCard(model) {
    const section = document.createElement("section");
    section.className = "property-card property-card-wide";

    const heading = document.createElement("h3");
    heading.textContent = "Export Packing";
    section.appendChild(heading);

    const stats = computePackedCoordinateStats(model);
    section.appendChild(buildPropertyList([
      [buildAxisTupleLabel("Scale"), formatVec3(model.scale)],
      [buildAxisTupleLabel("Origin"), formatVec3(model.scaleOrigin)],
      [buildAxisTupleLabel("Packed Min"), formatVec3(stats.min)],
      [buildAxisTupleLabel("Packed Max"), formatVec3(stats.max)],
    ]));

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = "fit-export-packing";
    button.textContent = "Fit Export Packing";
    section.appendChild(button);

    const status = document.createElement("p");
    status.className = "hint property-hint";
    status.textContent = describePackedCoordinateStats(stats);
    section.appendChild(status);

    const note = document.createElement("p");
    note.className = "hint property-hint";
    note.textContent = "This only updates MDL export packing metadata (scale + origin). It does not move vertices in the viewport.";
    section.appendChild(note);

    return section;
  }

  function buildSyncTypeEditor(model) {
    const syncType = model.synctype ?? model.syncType ?? 0;
    const section = document.createElement("section");
    section.className = "property-card";

    const heading = document.createElement("h3");
    heading.textContent = "Sync Type";
    section.appendChild(heading);

    const checkbox = document.createElement("label");
    checkbox.className = "checkbox property-checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = "prop-sync-rand";
    input.checked = syncType === 1;

    const text = document.createElement("span");
    text.textContent = "Rand";

    checkbox.appendChild(input);
    checkbox.appendChild(text);
    section.appendChild(checkbox);

    const hint = document.createElement("p");
    hint.className = "hint property-hint";
    hint.textContent = `Unchecked = Sync (0), checked = Rand (1). Current value: ${describeSyncType(syncType)}.`;
    section.appendChild(hint);

    return section;
  }

  function buildPropertyList(rows) {
    const list = document.createElement("dl");
    list.className = "property-list";
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      if (typeof label === "string") {
        dt.textContent = label;
      } else {
        dt.appendChild(label);
      }
      dd.textContent = value;
      row.appendChild(dt);
      row.appendChild(dd);
      list.appendChild(row);
    });
    return list;
  }

  function buildAxisTupleLabel(prefix) {
    const label = document.createElement("span");
    label.className = "property-axis-label";

    label.appendChild(document.createTextNode(`${prefix} (`));
    label.appendChild(buildAxisToken("x"));
    label.appendChild(document.createTextNode(","));
    label.appendChild(buildAxisToken("y"));
    label.appendChild(document.createTextNode(","));
    label.appendChild(buildAxisToken("z"));
    label.appendChild(document.createTextNode(")"));

    return label;
  }

  function buildAxisToken(axis) {
    const token = document.createElement("span");
    token.className = `property-axis-token axis-${axis}`;
    token.textContent = axis;
    return token;
  }

  function buildFlagsCard(flags) {
    const section = document.createElement("section");
    section.className = "property-card property-card-wide";

    const heading = document.createElement("h3");
    heading.textContent = "Flags";
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "flag-list";
    MODEL_FLAG_DEFINITIONS.forEach((definition) => {
      const row = document.createElement("label");
      row.className = "flag-row";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "flag-checkbox";
      checkbox.dataset.flagMask = String(definition.mask);
      checkbox.checked = (flags & definition.mask) !== 0;

      const label = document.createElement("span");
      label.className = "flag-label";
      label.textContent = definition.label;

      row.appendChild(checkbox);
      row.appendChild(label);
      list.appendChild(row);
    });
    section.appendChild(list);

    const raw = document.createElement("div");
    raw.className = "property-flags-raw hint";
    raw.textContent = `Raw: ${formatFlags(flags)}`;
    section.appendChild(raw);

    return section;
  }

  function buildLabeledNumberInput(labelText, id, value, options = {}) {
    const wrapper = document.createElement("label");
    wrapper.className = "property-input-row";

    const label = document.createElement("span");
    label.className = "property-input-label";
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.value = String(value);
    if (options.min !== undefined) {
      input.min = String(options.min);
    }
    if (options.max !== undefined) {
      input.max = String(options.max);
    }
    if (options.step !== undefined) {
      input.step = String(options.step);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function updateTimelineRange(preserveFocusedFrameInput = false) {
    const activeGroup = getActiveFrameGroup();
    const poseCount = activeGroup ? Math.max(activeGroup.poseIndices.length, 1) : 1;
    const frameIndex = clamp(state.manualFrameIndex, 0, poseCount - 1);
    dom.frameRange.max = String(poseCount - 1);
    dom.frameRange.value = String(frameIndex);
    dom.frameInput.min = "1";
    dom.frameInput.max = String(poseCount);
    if (!preserveFocusedFrameInput || document.activeElement !== dom.frameInput) {
      dom.frameInput.value = String(frameIndex + 1);
    }
  }

  function updatePlaybackControls() {
    const activeGroup = getActiveFrameGroup();
    const poseCount = activeGroup ? activeGroup.poseIndices.length : 0;
    const hasPlayableGroup = findFirstPlayableFrameGroupIndex(state.model) >= 0;
    dom.playToggle.textContent = state.playing ? "Pause" : "Play";
    dom.frameGroupSelect.disabled = !state.model;
    dom.frameRange.disabled = !state.model;
    dom.frameInput.disabled = !state.model;
    dom.skinSelect.disabled = !state.model;
    dom.skinPolyToggle.disabled = !state.model;
    dom.skinPaletteUnusedToggle.disabled = !state.model;
    dom.skinPaletteScope.disabled = !state.model;
    dom.skinPaletteTargetButton.disabled = !state.model;
    dom.skinPaletteApplyButton.disabled = !state.model;
    dom.skinPaletteClearButton.disabled = !state.model;
    dom.recolorToggle.disabled = !state.model;
    dom.topRange.disabled = !state.model;
    dom.bottomRange.disabled = !state.model;
    dom.playToggle.disabled = !state.model || !hasPlayableGroup;
    dom.frameRange.disabled = !state.model || poseCount <= 1;
    dom.resetCamera.disabled = !state.model;
    updateAnimationEditor();
  }

  function setManualFrameIndex(frameIndex, preserveFocusedFrameInput = false) {
    const activeGroup = getActiveFrameGroup();
    const poseCount = activeGroup ? Math.max(activeGroup.poseIndices.length, 1) : 1;
    state.manualFrameIndex = clamp(frameIndex, 0, poseCount - 1);
    state.playhead = computePoseStartTime(activeGroup, state.manualFrameIndex);
    state.playing = false;
    updateTimelineRange(preserveFocusedFrameInput);
    updatePlaybackControls();
    syncFrameTreeSelection(state.manualFrameIndex);
    state.geometryDirty = true;
  }

  function updateAnimationEditor() {
    const context = getSelectedPoseEditContext();
    if (!context) {
      dom.animSequenceName.value = "";
      dom.animPoseName.value = "";
      dom.animPoseDuration.value = "";
      dom.animSequenceName.disabled = true;
      dom.animPoseName.disabled = true;
      dom.animPoseDuration.disabled = true;
      dom.animApplyPose.disabled = true;
      dom.animRenameSequence.disabled = true;
      dom.animEditorStatus.textContent = state.model
        ? "Select a frame to edit names and timing."
        : "Load a model to edit animation names and timing.";
      return;
    }

    const disableEdits = state.playing;
    dom.animSequenceName.value = context.sequenceName;
    dom.animPoseName.value = context.pose?.name || `pose_${context.poseIndex}`;
    dom.animPoseDuration.value = context.duration.toFixed(3).replace(/\.?0+$/, "");
    dom.animSequenceName.disabled = disableEdits || context.activeGroup.type === "all";
    dom.animPoseName.disabled = disableEdits;
    dom.animPoseDuration.disabled = disableEdits;
    dom.animApplyPose.disabled = disableEdits;
    dom.animRenameSequence.disabled = disableEdits || context.activeGroup.type === "all";

    if (state.playing) {
      dom.animEditorStatus.textContent = "Pause playback to edit pose names and timing.";
      return;
    }

    const groupLabel = context.activeGroup.type === "all"
      ? "All frames view"
      : (context.activeGroup.treeLabel || context.activeGroup.label);
    dom.animEditorStatus.textContent = `Editing pose ${context.poseIndexInGroup + 1} of ${context.activeGroup.poseIndices.length} in ${groupLabel}.`;
  }

  function getSelectedPoseEditContext() {
    if (!state.model) {
      return null;
    }

    const activeGroup = getActiveFrameGroup();
    if (!activeGroup || !activeGroup.poseIndices?.length) {
      return null;
    }

    const poseIndexInGroup = clamp(state.manualFrameIndex, 0, Math.max(activeGroup.poseIndices.length - 1, 0));
    const poseIndex = activeGroup.poseIndices[poseIndexInGroup];
    const pose = state.model.poses[poseIndex] || null;
    const fallbackSource = findPoseSource(state.model, poseIndex);
    const topFrameIndex = Number.isInteger(activeGroup.topFrameIndices?.[poseIndexInGroup])
      ? activeGroup.topFrameIndices[poseIndexInGroup]
      : fallbackSource.topFrameIndex;
    const topFramePoseOffset = Number.isInteger(activeGroup.topFramePoseOffsets?.[poseIndexInGroup])
      ? activeGroup.topFramePoseOffsets[poseIndexInGroup]
      : fallbackSource.poseOffset;
    const topFrame = topFrameIndex >= 0 ? state.model.topFrames[topFrameIndex] || null : null;
    const duration = Math.max(activeGroup.durations?.[poseIndexInGroup] || DEFAULT_FRAME_DURATION, 0.001);
    const sequenceName = activeGroup.type === "all"
      ? ""
      : (activeGroup.treeLabel || inferSequenceName(pose?.name || activeGroup.name || activeGroup.label, poseIndexInGroup));

    return {
      activeGroup,
      poseIndexInGroup,
      poseIndex,
      pose,
      topFrameIndex,
      topFramePoseOffset,
      topFrame,
      duration,
      sequenceName,
    };
  }

  function findPoseSource(model, poseIndex) {
    if (!model?.topFrames?.length) {
      return { topFrameIndex: -1, poseOffset: 0 };
    }

    for (let topFrameIndex = 0; topFrameIndex < model.topFrames.length; topFrameIndex++) {
      const frame = model.topFrames[topFrameIndex];
      const poseOffset = frame.poseIndices.indexOf(poseIndex);
      if (poseOffset >= 0) {
        return { topFrameIndex, poseOffset };
      }
    }

    return { topFrameIndex: -1, poseOffset: 0 };
  }

  function applyActivePoseEdits() {
    const context = getSelectedPoseEditContext();
    if (!context || !context.pose) {
      setSaveStatus("Select a pose before applying animation edits.");
      return;
    }

    const nextPoseName = dom.animPoseName.value.trim();
    const nextDuration = parseFloat(dom.animPoseDuration.value);
    if (!nextPoseName) {
      setSaveStatus("Pose name cannot be empty.");
      return;
    }
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      setSaveStatus("Pose duration must be greater than zero.");
      return;
    }

    context.pose.name = nextPoseName;
    if (context.topFrame && context.topFrame.poseIndices.length <= 1) {
      context.topFrame.name = nextPoseName;
    }
    if (context.topFrame) {
      setTopFramePoseDuration(context.topFrame, context.topFramePoseOffset, nextDuration);
    }

    state.playing = false;
    rebuildAnimationViewForPose(context.poseIndex, context.activeGroup.type === "all");
    setSaveStatus(`Updated pose ${nextPoseName} to ${formatNumber(nextDuration)}s. Save .mdl to export changes.`);
  }

  function renameActiveSequence() {
    const context = getSelectedPoseEditContext();
    if (!context || !context.activeGroup || context.activeGroup.type === "all") {
      setSaveStatus("Select a sequence group before renaming it.");
      return;
    }

    const baseName = dom.animSequenceName.value.trim();
    if (!baseName) {
      setSaveStatus("Sequence name cannot be empty.");
      return;
    }

    const poseCount = context.activeGroup.poseIndices.length;
    const suffixWidth = Math.max(
      poseCount > 1 ? String(poseCount).length : 0,
      ...context.activeGroup.poseIndices.map((poseIndex) => {
        const match = (state.model.poses[poseIndex]?.name || "").match(/(\d+)$/);
        return match ? match[1].length : 0;
      })
    );
    const touchedTopFrames = new Set();

    context.activeGroup.poseIndices.forEach((poseIndex, index) => {
      const existingName = state.model.poses[poseIndex]?.name || "";
      const match = existingName.match(/(\d+)$/);
      let suffix = "";
      if (poseCount > 1) {
        suffix = match?.[1] || String(index + 1).padStart(Math.max(suffixWidth, 1), "0");
      }
      state.model.poses[poseIndex].name = `${baseName}${suffix}`;

      const topFrameIndex = context.activeGroup.topFrameIndices?.[index];
      if (Number.isInteger(topFrameIndex) && topFrameIndex >= 0) {
        touchedTopFrames.add(topFrameIndex);
      }
    });

    touchedTopFrames.forEach((topFrameIndex) => {
      const frame = state.model.topFrames[topFrameIndex];
      if (!frame) {
        return;
      }
      frame.name = frame.poseIndices.length > 1 ? baseName : (state.model.poses[frame.poseIndices[0]]?.name || baseName);
    });

    state.playing = false;
    rebuildAnimationViewForPose(context.poseIndex, false);
    setSaveStatus(`Renamed sequence to ${baseName}. Save .mdl to export changes.`);
  }

  function setTopFramePoseDuration(frame, poseOffset, duration) {
    if (!frame) {
      return;
    }

    const clampedDuration = Math.max(duration || DEFAULT_FRAME_DURATION, 0.001);
    const poseCount = Math.max(frame.poseIndices?.length || 0, 1);
    const durations = deriveDurations(frame.intervals, poseCount);
    durations[clamp(poseOffset, 0, poseCount - 1)] = clampedDuration;
    frame.intervals = deriveIntervalsFromDurations(durations);
  }

  function rebuildAnimationViewForPose(poseIndex, preferAllView = false) {
    if (!state.model) {
      return;
    }

    state.model.frameGroups = buildFrameGroups(state.model);
    populateFrameGroupList(state.model);
    renderFrameTree(state.model);
    const nextGroupIndex = findFrameGroupIndexForPose(state.model, poseIndex, preferAllView);
    const nextGroup = state.model.frameGroups[nextGroupIndex] || null;
    const nextPoseIndex = nextGroup ? Math.max(nextGroup.poseIndices.indexOf(poseIndex), 0) : 0;
    selectFrameGroup(nextGroupIndex, nextPoseIndex);
    updateValidationPanel();
  }

  function findFrameGroupIndexForPose(model, poseIndex, preferAllView = false) {
    if (!model?.frameGroups?.length) {
      return 0;
    }

    if (preferAllView) {
      const allIndex = model.frameGroups.findIndex((group) =>
        group.type === "all" && group.poseIndices.includes(poseIndex)
      );
      if (allIndex >= 0) {
        return allIndex;
      }
    }

    const sequenceIndex = model.frameGroups.findIndex((group) =>
      group.type !== "all" && group.poseIndices.includes(poseIndex)
    );
    if (sequenceIndex >= 0) {
      return sequenceIndex;
    }

    const anyIndex = model.frameGroups.findIndex((group) => group.poseIndices.includes(poseIndex));
    return anyIndex >= 0 ? anyIndex : 0;
  }

  function syncModelDependentPanels() {
    const hasModel = !!state.model;
    const panels = [
      dom.framesPanel,
      dom.playbackPanel,
      dom.skinsPanel,
      dom.detailsPanel,
      dom.objectToolsPanel,
      dom.lightingPanel,
      dom.displayPanel,
      dom.validationPanel,
      dom.savePanel,
    ];

    panels.forEach((panel) => {
      panel.classList.toggle("is-hidden", !hasModel);
      panel.setAttribute("aria-hidden", hasModel ? "false" : "true");
    });

    syncSaveControls();
  }

  function syncSaveControls() {
    const hasModel = !!state.model;
    const canExportMap = canExportModelAsMap(state.model);
    dom.saveModelButton.disabled = !hasModel;
    dom.saveMapButton.disabled = !canExportMap;
    dom.saveMapButton.title = !hasModel
      ? "Load a model before exporting a .map."
      : state.model?.mapExportData?.kind === "flat-prism"
        ? "Export the generated solid as clean Quake .map brushwork."
        : "Export the current pose as Quake .map brushwork (one brush per triangle).";
  }


  function setViewportMode(mode) {
    const normalizedMode = mode === "multi" ? "multi" : "orbit";
    state.viewportMode = normalizedMode;

    const isOrbitOnly = normalizedMode === "orbit";
    dom.viewerLayout.classList.toggle("is-orbit-only", isOrbitOnly);
    dom.viewModeOrbit.classList.toggle("is-active", isOrbitOnly);
    dom.viewModeMulti.classList.toggle("is-active", !isOrbitOnly);
    dom.viewModeOrbit.setAttribute("aria-pressed", isOrbitOnly ? "true" : "false");
    dom.viewModeMulti.setAttribute("aria-pressed", isOrbitOnly ? "false" : "true");
  }

  function setBgMode(mode) {
    state.bgMode = mode;
    dom.canvasArea.classList.remove("bg-dark", "bg-white", "bg-grid");
    dom.canvasArea.classList.add("bg-" + mode);
    dom.bgDark.classList.toggle("is-active", mode === "dark");
    dom.bgWhite.classList.toggle("is-active", mode === "white");
    dom.bgGrid.classList.toggle("is-active", mode === "grid");
    dom.bgDark.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    dom.bgWhite.setAttribute("aria-pressed", mode === "white" ? "true" : "false");
    dom.bgGrid.setAttribute("aria-pressed", mode === "grid" ? "true" : "false");
  }

  function normalizeRenderMode(mode) {
    return ["textured", "smooth", "flat", "wireframe"].includes(mode) ? mode : "textured";
  }

  function syncDisplayControls() {
    state.renderMode = normalizeRenderMode(state.renderMode);
    state.modelOpacity = clamp(state.modelOpacity, 0.1, 1);

    dom.renderModeSelect.value = state.renderMode;
    dom.opacityRange.value = state.modelOpacity.toFixed(2);
    dom.opacityValue.textContent = state.modelOpacity.toFixed(2);
    dom.backfaceCullToggle.checked = state.backfaceCulling;
    dom.drawShadowsToggle.checked = state.drawShadows;
    dom.wireframeOverlayToggle.checked = state.wireframeOverlay;
    dom.showEyeToggle.checked = state.showEyePosition;
    dom.showBoundsToggle.checked = state.showBoundsOverlay;
    dom.showRadiusToggle.checked = state.showBoundingRadius;
    dom.fullbrightToggle.checked = state.previewFullbrights;
    dom.showNormalsToggle.checked = state.showNormals;
  }

  function syncPlayerColorControls() {
    const isPlayerModel = !!state.model && /(^|\/)player\.mdl$/i.test(state.model.path);
    dom.playerColorControls.classList.toggle("is-hidden", !isPlayerModel);
    dom.playerColorControls.setAttribute("aria-hidden", isPlayerModel ? "false" : "true");
  }

  function handlePropertiesGridChange(event) {
    if (!state.model) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    let didChange = false;
    switch (target.id) {
      case "prop-bounding-radius":
        state.model.boundingRadius = Math.max(0, parseEditableNumber(target.value, state.model.boundingRadius));
        setSaveStatus("Bounding radius updated. Save .mdl to export changes.");
        didChange = true;
        break;
      case "prop-eye-x":
        state.model.eyePosition[0] = parseEditableNumber(target.value, state.model.eyePosition[0]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        didChange = true;
        break;
      case "prop-eye-y":
        state.model.eyePosition[1] = parseEditableNumber(target.value, state.model.eyePosition[1]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        didChange = true;
        break;
      case "prop-eye-z":
        state.model.eyePosition[2] = parseEditableNumber(target.value, state.model.eyePosition[2]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        didChange = true;
        break;
      case "prop-sync-rand":
        state.model.synctype = target.checked ? 1 : 0;
        state.model.syncType = state.model.synctype;
        populateProperties(state.model);
        setSaveStatus("Sync type updated. Save .mdl to export changes.");
        didChange = true;
        break;
      default:
        if (target.dataset.flagMask) {
          updateModelFlag(parseInt(target.dataset.flagMask, 10), target.checked);
          populateProperties(state.model);
          setSaveStatus("Flags updated. Save .mdl to export changes.");
          didChange = true;
        }
        break;
    }

    if (didChange) {
      updateValidationPanel();
    }
  }

  function updateModelFlag(mask, enabled) {
    if (!state.model || !Number.isFinite(mask)) {
      return;
    }

    if (enabled) {
      state.model.flags |= mask;
    } else {
      state.model.flags &= ~mask;
    }
  }

  function fitModelExportPacking() {
    if (!state.model) {
      return;
    }

    const posePositions = state.model.poses
      .map((pose) => pose.positions)
      .filter((positions) => positions && positions.length);
    if (!posePositions.length) {
      setSaveStatus("No pose geometry is available to fit export packing.");
      return;
    }

    const bounds = computeBounds(posePositions);
    if (!bounds.min.every(Number.isFinite) || !bounds.max.every(Number.isFinite)) {
      setSaveStatus("Export packing could not be fit because pose bounds are invalid.");
      return;
    }

    const nextScale = [1, 1, 1];
    const nextOrigin = bounds.min.slice();
    for (let axis = 0; axis < 3; axis++) {
      const range = bounds.max[axis] - bounds.min[axis];
      nextScale[axis] = range > 1e-9 ? range / 255 : 1;
    }

    state.model.scale = nextScale;
    state.model.scaleOrigin = nextOrigin;
    populateProperties(state.model);
    updateValidationPanel();
    setSaveStatus(`Fitted export packing to current geometry. Scale ${formatVec3(nextScale)}, origin ${formatVec3(nextOrigin)}.`);
  }

  function applyValidationFix(fixId) {
    switch (fixId) {
      case VALIDATION_FIXES.fitExportPacking.id:
        fitModelExportPacking();
        break;
      case VALIDATION_FIXES.useMeasuredRadius.id:
        applyMeasuredBoundingRadius();
        break;
      case VALIDATION_FIXES.normalizeFrameIntervals.id:
        normalizeFrameIntervals();
        break;
      case VALIDATION_FIXES.normalizeSkinIntervals.id:
        normalizeSkinIntervals();
        break;
      default:
        break;
    }
  }

  function applyMeasuredBoundingRadius() {
    if (!state.model) {
      return;
    }

    const measuredRadius = computeModelOriginRadius(state.model.render.positionsByPose);
    state.model.boundingRadius = Math.max(0, measuredRadius);
    populateProperties(state.model);
    updateValidationPanel();
    setSaveStatus(`Set bounding radius to measured extent ${formatNumber(measuredRadius)}. Save .mdl to export changes.`);
  }

  function normalizeFrameIntervals() {
    if (!state.model?.topFrames?.length) {
      return;
    }

    let normalized = 0;
    state.model.topFrames.forEach((frame) => {
      const poseCount = frame.poseIndices?.length || 0;
      if (poseCount <= 1 && frame.type !== "group") {
        return;
      }

      const hasValidIntervals = Array.isArray(frame.intervals) &&
        frame.intervals.length === poseCount &&
        frame.intervals.every((value) => Number.isFinite(value) && value > 0);
      if (hasValidIntervals) {
        return;
      }

      frame.intervals = deriveIntervalsFromDurations(deriveDurations(frame.intervals, poseCount));
      normalized += 1;
    });

    if (!normalized) {
      setSaveStatus("No invalid frame intervals needed normalization.");
      return;
    }

    state.playing = false;
    rebuildFrameGroupsPreservingSelection();
    setSaveStatus(`Normalized ${normalized} animated frame group${normalized === 1 ? "" : "s"}. Save .mdl to export changes.`);
  }

  function normalizeSkinIntervals() {
    if (!state.model?.skins?.length) {
      return;
    }

    let normalized = 0;
    state.model.skins.forEach((skin) => {
      const frameCount = skin.frames?.length || 0;
      if (frameCount <= 1 && skin.type !== "group") {
        return;
      }

      const hasValidIntervals = Array.isArray(skin.intervals) &&
        skin.intervals.length === frameCount &&
        skin.intervals.every((value) => Number.isFinite(value) && value > 0);
      if (hasValidIntervals) {
        return;
      }

      skin.intervals = deriveIntervalsFromDurations(deriveDurations(skin.intervals, frameCount));
      normalized += 1;
    });

    if (!normalized) {
      setSaveStatus("No invalid skin intervals needed normalization.");
      return;
    }

    state.textureDirty = true;
    updateSkinStatus();
    updateValidationPanel();
    setSaveStatus(`Normalized ${normalized} animated skin entr${normalized === 1 ? "y" : "ies"}. Save .mdl to export changes.`);
  }

  function rebuildFrameGroupsPreservingSelection() {
    if (!state.model) {
      return;
    }

    const context = getSelectedPoseEditContext();
    if (context) {
      rebuildAnimationViewForPose(context.poseIndex, context.activeGroup.type === "all");
      return;
    }

    state.model.frameGroups = buildFrameGroups(state.model);
    populateFrameGroupList(state.model);
    renderFrameTree(state.model);
    updateTimelineRange();
    updatePlaybackControls();
    updateValidationPanel();
  }

  function applySkinSizeDraft() {
    if (!state.model) {
      return;
    }

    const widthInput = dom.propertiesGrid.querySelector("#prop-skin-width");
    const heightInput = dom.propertiesGrid.querySelector("#prop-skin-height");
    if (!(widthInput instanceof HTMLInputElement) || !(heightInput instanceof HTMLInputElement)) {
      return;
    }

    const nextWidth = clamp(Math.round(parseEditableNumber(widthInput.value, state.model.skinWidth)), 1, 3072);
    const nextHeight = clamp(Math.round(parseEditableNumber(heightInput.value, state.model.skinHeight)), 1, 1024);
    resizeModelSkins(state.model, nextWidth, nextHeight);
  }

  function syncPendingSkinSizeDraft() {
    if (!state.model) {
      return;
    }

    const widthInput = dom.propertiesGrid.querySelector("#prop-skin-width");
    const heightInput = dom.propertiesGrid.querySelector("#prop-skin-height");
    if (!(widthInput instanceof HTMLInputElement) || !(heightInput instanceof HTMLInputElement)) {
      return;
    }

    const draftWidth = clamp(Math.round(parseEditableNumber(widthInput.value, state.model.skinWidth)), 1, 3072);
    const draftHeight = clamp(Math.round(parseEditableNumber(heightInput.value, state.model.skinHeight)), 1, 1024);
    if (draftWidth !== state.model.skinWidth || draftHeight !== state.model.skinHeight) {
      resizeModelSkins(state.model, draftWidth, draftHeight);
    }
  }

  function resizeModelSkins(model, nextWidth, nextHeight) {
    const prevWidth = model.skinWidth;
    const prevHeight = model.skinHeight;
    if (nextWidth === prevWidth && nextHeight === prevHeight) {
      setSaveStatus("Skin size unchanged.");
      return;
    }

    model.skins.forEach((skin) => {
      skin.frames = skin.frames.map((frame) =>
        resizeIndexedImage(frame, prevWidth, prevHeight, nextWidth, nextHeight)
      );
    });

    model.stVerts.forEach((st) => {
      st.s = clamp(Math.round(st.s * nextWidth / Math.max(prevWidth, 1)), 0, Math.max(nextWidth - 1, 0));
      st.t = clamp(Math.round(st.t * nextHeight / Math.max(prevHeight, 1)), 0, Math.max(nextHeight - 1, 0));
    });

    model.skinWidth = nextWidth;
    model.skinHeight = nextHeight;
    model.render = buildRenderData(model);

    populateProperties(model);
    updateSkinStatus();
    updateValidationPanel();
    uploadModelBuffers();
    state.textureDirty = true;
    state.geometryDirty = true;
    setSaveStatus(`Resized skins to ${nextWidth} x ${nextHeight}.`);
  }

  function resizeIndexedImage(source, sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const target = new Uint8Array(targetWidth * targetHeight);
    for (let y = 0; y < targetHeight; y++) {
      const sourceY = Math.min(sourceHeight - 1, Math.floor((y + 0.5) * sourceHeight / targetHeight));
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = Math.min(sourceWidth - 1, Math.floor((x + 0.5) * sourceWidth / targetWidth));
        target[y * targetWidth + x] = source[sourceY * sourceWidth + sourceX];
      }
    }
    return target;
  }

  async function importSkinFile(file) {
    if (!state.model) {
      return;
    }
    if (!state.paletteRGBA) {
      setSaveStatus("No palette is available for skin import.");
      return;
    }

    try {
      const image = await loadImageFromFile(file);
      const rgba = drawImageToRgba(image, state.model.skinWidth, state.model.skinHeight);
      const indexed = rgbaToIndexedQuakePalette(rgba, state.paletteRGBA);

      const skin = state.model.skins[state.selectedSkinIndex];
      const skinFrameIndex = getCurrentSkinFrameIndex();
      skin.frames[skinFrameIndex] = indexed;

      state.textureDirty = true;
      updateSkinStatus();
      updateValidationPanel();
      setSaveStatus(`Imported ${file.name} into skin ${state.selectedSkinIndex}, frame ${skinFrameIndex}.`);
    } catch (error) {
      console.error(error);
      setSaveStatus(`Skin import failed: ${error.message}`);
    }
  }

  function exportCurrentSkinAsLmp() {
    if (!state.model) {
      setSaveStatus("Load a model before exporting a skin.");
      return;
    }

    const skin = state.model.skins[state.selectedSkinIndex];
    if (!skin || !skin.frames.length) {
      setSaveStatus("No skin available to export.");
      return;
    }

    const skinFrameIndex = clamp(getCurrentSkinFrameIndex(), 0, skin.frames.length - 1);
    const indexed = skin.frames[skinFrameIndex];
    const width = state.model.skinWidth | 0;
    const height = state.model.skinHeight | 0;
    const pixelCount = width * height;

    if (!indexed || indexed.length < pixelCount) {
      setSaveStatus("Skin data is incomplete; cannot export.");
      return;
    }

    const bytes = new Uint8Array(8 + pixelCount);
    const view = new DataView(bytes.buffer);
    view.setInt32(0, width, true);
    view.setInt32(4, height, true);
    bytes.set(indexed.subarray(0, pixelCount), 8);

    const suggestedName = getSuggestedSkinLmpFilename(
      state.model.path,
      state.selectedSkinIndex,
      skin.frames.length > 1 ? skinFrameIndex : -1
    );

    downloadBytes(bytes, suggestedName, "application/octet-stream");
    setSaveStatus(`Exported ${suggestedName}.`);
  }

  async function exportCurrentUvAsPng() {
    if (!state.model) {
      setSaveStatus("Load a model before exporting a UV map.");
      return;
    }

    const width = state.model.skinWidth | 0;
    const height = state.model.skinHeight | 0;
    if (width <= 0 || height <= 0) {
      setSaveStatus("Skin dimensions are invalid; cannot export the UV map.");
      return;
    }

    const scale = Math.max(1, Math.ceil(UV_EXPORT_TARGET_SIZE / Math.max(width, height)));
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      setSaveStatus("Could not create an export canvas for the UV map.");
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawSkinPolyOverlay(state.model, scale, context, {
      shadowColor: "rgba(0, 0, 0, 0.92)",
      lineColor: "rgba(255, 255, 255, 0.96)",
      shadowScale: 1.35,
      lineScale: 0.8,
    });

    const suggestedName = getSuggestedUvPngFilename(state.model.path, state.selectedSkinIndex);
    await downloadCanvasAsPng(canvas, suggestedName);
    setSaveStatus(`Exported ${suggestedName}.`);
  }

  function getSuggestedSkinLmpFilename(modelPath, skinIndex, skinFrameIndex) {
    const normalized = normalizePath(modelPath || "model.mdl");
    const base = (normalized.split("/").pop() || "model.mdl").replace(/\.mdl$/i, "");
    const frameSuffix = skinFrameIndex >= 0 ? `_frame${skinFrameIndex}` : "";
    return `${base}_skin${skinIndex}${frameSuffix}.lmp`;
  }

  function getSuggestedUvPngFilename(modelPath, skinIndex) {
    const normalized = normalizePath(modelPath || "model.mdl");
    const base = (normalized.split("/").pop() || "model.mdl").replace(/\.mdl$/i, "");
    return `${base}_skin${skinIndex}_uv.png`;
  }

  function downloadBytes(bytes, filename, mimeType) {
    const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
    downloadBlob(blob, filename);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function downloadCanvasAsPng(canvas, filename) {
    if (canvas.toBlob) {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
            return;
          }
          reject(new Error("Failed to encode PNG data"));
        }, "image/png");
      });
      downloadBlob(blob, filename);
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not decode ${file.name}`));
      };
      image.src = url;
    });
  }

  function drawImageToRgba(image, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  function rgbaToIndexedQuakePalette(rgba, palette) {
    const indexed = new Uint8Array(rgba.length / 4);
    const cache = new Map();

    for (let i = 0, out = 0; i < rgba.length; i += 4, out++) {
      const alpha = rgba[i + 3];
      if (alpha < 128) {
        indexed[out] = 255;
        continue;
      }

      const rgbKey = (rgba[i + 0] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      let paletteIndex = cache.get(rgbKey);
      if (paletteIndex === undefined) {
        paletteIndex = findNearestPaletteIndex(rgba[i + 0], rgba[i + 1], rgba[i + 2], palette);
        cache.set(rgbKey, paletteIndex);
      }
      indexed[out] = paletteIndex;
    }

    return indexed;
  }

  function findNearestPaletteIndex(r, g, b, palette) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let index = 0; index < 255; index++) {
      const dr = palette[index * 4 + 0] - r;
      const dg = palette[index * 4 + 1] - g;
      const db = palette[index * 4 + 2] - b;
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
        if (distance === 0) {
          break;
        }
      }
    }

    return bestIndex;
  }

  function canExportModelAsMap(model) {
    return !!(
      model &&
      Number.isInteger(model.numVerts) &&
      model.numVerts > 0 &&
      model.poses?.length &&
      model.triangles?.length
    );
  }

  function syncRenderGeometryToModel(model) {
    if (!model?.render?.originalIndices || !model.poses?.length) {
      return;
    }

    const render = model.render;
    const originalIndices = render.originalIndices;
    const renderVertexCount = originalIndices.length;
    if (!renderVertexCount) {
      return;
    }

    for (let poseIndex = 0; poseIndex < model.poses.length; poseIndex++) {
      const renderPositions = render.positionsByPose[poseIndex];
      const pose = model.poses[poseIndex];
      if (!renderPositions || !pose?.positions) {
        continue;
      }

      const accum = new Float64Array(model.numVerts * 3);
      const counts = new Uint32Array(model.numVerts);
      for (let renderIndex = 0; renderIndex < renderVertexCount; renderIndex++) {
        const originalIndex = originalIndices[renderIndex];
        const srcOffset = renderIndex * 3;
        const dstOffset = originalIndex * 3;
        accum[dstOffset + 0] += renderPositions[srcOffset + 0];
        accum[dstOffset + 1] += renderPositions[srcOffset + 1];
        accum[dstOffset + 2] += renderPositions[srcOffset + 2];
        counts[originalIndex] += 1;
      }

      for (let vertexIndex = 0; vertexIndex < model.numVerts; vertexIndex++) {
        const count = counts[vertexIndex];
        if (!count) {
          continue;
        }
        const offset = vertexIndex * 3;
        pose.positions[offset + 0] = accum[offset + 0] / count;
        pose.positions[offset + 1] = accum[offset + 1] / count;
        pose.positions[offset + 2] = accum[offset + 2] / count;
      }
    }
  }

  function getSuggestedMapFilename(path) {
    const normalized = normalizePath(path || "model.mdl");
    const base = normalized.split("/").pop() || "model.mdl";
    return base.replace(/\.[^.]+$/i, "") + ".map";
  }

  function getPoseVertex(positions, vertexIndex) {
    const offset = vertexIndex * 3;
    return [
      positions[offset + 0],
      positions[offset + 1],
      positions[offset + 2],
    ];
  }

  function subtractVec3(a, b) {
    return [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
    ];
  }

  function crossVec3(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function dotVec3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function addScaledVec3(point, direction, distance) {
    return [
      point[0] + direction[0] * distance,
      point[1] + direction[1] * distance,
      point[2] + direction[2] * distance,
    ];
  }

  function normalizeVec3(vector) {
    const length = Math.hypot(vector[0], vector[1], vector[2]);
    if (length <= 1e-8) {
      return null;
    }
    return [
      vector[0] / length,
      vector[1] / length,
      vector[2] / length,
    ];
  }

  function computeTriangleArea3D(a, b, c) {
    const ab = subtractVec3(b, a);
    const ac = subtractVec3(c, a);
    const cross = crossVec3(ab, ac);
    return Math.hypot(cross[0], cross[1], cross[2]) * 0.5;
  }

  function orientBrushPlaneInward(a, b, c, interiorPoint) {
    const ab = subtractVec3(b, a);
    const ac = subtractVec3(c, a);
    const normal = crossVec3(ab, ac);
    return dotVec3(normal, subtractVec3(interiorPoint, a)) >= 0
      ? [a, b, c]
      : [a, c, b];
  }

  function formatMapPlane(points, textureName) {
    const [a, b, c] = points;
    return `( ${formatNumber(a[0])} ${formatNumber(a[1])} ${formatNumber(a[2])} ) `
      + `( ${formatNumber(b[0])} ${formatNumber(b[1])} ${formatNumber(b[2])} ) `
      + `( ${formatNumber(c[0])} ${formatNumber(c[1])} ${formatNumber(c[2])} ) `
      + `${textureName} 0 0 0 1 1`;
  }

  function getCurrentMapExportPositions(model) {
    if (!model?.poses?.length) {
      return null;
    }

    if (state.model !== model) {
      return model.poses[0]?.positions || null;
    }

    const sample = getCurrentPoseSample();
    const poseA = model.poses[sample.poseA]?.positions;
    const poseB = model.poses[sample.poseB]?.positions || poseA;
    if (!poseA) {
      return null;
    }

    if (sample.blend === 0 || sample.poseA === sample.poseB || !state.interpolate) {
      return poseA;
    }

    const out = new Float32Array(poseA.length);
    const invBlend = 1 - sample.blend;
    for (let i = 0; i < poseA.length; i++) {
      out[i] = poseA[i] * invBlend + poseB[i] * sample.blend;
    }
    return out;
  }

  function buildMapTextFromBrushBlocks(brushBlocks) {
    return [
      "// Game: Quake",
      "// Format: Standard",
      "// entity 0",
      "{",
      "\"classname\" \"worldspawn\"",
      ...brushBlocks,
      "}",
      "",
    ].join("\n");
  }

  function buildFlatPrismBrushLines(frontA, frontB, frontC, backA, backB, backC, textureName) {
    const centroid = [
      (frontA[0] + frontB[0] + frontC[0] + backA[0] + backB[0] + backC[0]) / 6,
      (frontA[1] + frontB[1] + frontC[1] + backA[1] + backB[1] + backC[1]) / 6,
      (frontA[2] + frontB[2] + frontC[2] + backA[2] + backB[2] + backC[2]) / 6,
    ];

    return [
      formatMapPlane(orientBrushPlaneInward(frontA, frontB, frontC, centroid), textureName),
      formatMapPlane(orientBrushPlaneInward(backA, backB, backC, centroid), textureName),
      formatMapPlane(orientBrushPlaneInward(frontA, backA, backB, centroid), textureName),
      formatMapPlane(orientBrushPlaneInward(frontB, backB, backC, centroid), textureName),
      formatMapPlane(orientBrushPlaneInward(frontC, backC, backA, centroid), textureName),
    ];
  }

  function buildGeneratedFlatPrismMapExport(model, positions) {
    if (!model?.mapExportData || model.mapExportData.kind !== "flat-prism") {
      throw new Error("Generated MAP export metadata is unavailable.");
    }

    const { capVertexCount, capTriangleCount } = model.mapExportData;
    const textureName = model.mapExportData.textureName || "__TB_empty";
    const brushBlocks = [];

    for (let triIndex = 0; triIndex < capTriangleCount; triIndex++) {
      const triangle = model.triangles[triIndex];
      if (!triangle?.vertIndex || triangle.vertIndex.length !== 3) {
        continue;
      }

      const [frontAIndex, frontBIndex, frontCIndex] = triangle.vertIndex;
      if (
        frontAIndex >= capVertexCount ||
        frontBIndex >= capVertexCount ||
        frontCIndex >= capVertexCount
      ) {
        throw new Error("Generated cap topology is invalid for MAP export.");
      }

      const backAIndex = frontAIndex + capVertexCount;
      const backBIndex = frontBIndex + capVertexCount;
      const backCIndex = frontCIndex + capVertexCount;
      if (
        backAIndex >= model.numVerts ||
        backBIndex >= model.numVerts ||
        backCIndex >= model.numVerts
      ) {
        throw new Error("Generated back-cap topology is invalid for MAP export.");
      }

      const frontA = getPoseVertex(positions, frontAIndex);
      const frontB = getPoseVertex(positions, frontBIndex);
      const frontC = getPoseVertex(positions, frontCIndex);
      const backA = getPoseVertex(positions, backAIndex);
      const backB = getPoseVertex(positions, backBIndex);
      const backC = getPoseVertex(positions, backCIndex);

      if (
        computeTriangleArea3D(frontA, frontB, frontC) <= 1e-5 ||
        computeTriangleArea3D(backA, backB, backC) <= 1e-5
      ) {
        continue;
      }

      const planeLines = buildFlatPrismBrushLines(frontA, frontB, frontC, backA, backB, backC, textureName);
      brushBlocks.push([
        `// brush ${brushBlocks.length}`,
        "{",
        ...planeLines,
        "}",
      ].join("\n"));
    }

    if (!brushBlocks.length) {
      throw new Error("No valid solid brushes were produced for MAP export.");
    }

    return {
      brushCount: brushBlocks.length,
      mode: "flat-prism",
      text: buildMapTextFromBrushBlocks(brushBlocks),
      textureName,
    };
  }

  function getTriangleBrushDepth(model) {
    const radius = Number.isFinite(model?.render?.bounds?.radius)
      ? model.render.bounds.radius
      : (Number.isFinite(model?.boundingRadius) ? model.boundingRadius : 32);
    return clamp(radius * 0.03, 1, 4);
  }

  function buildTriangleBrushSoupMapExport(model, positions) {
    const textureName = "__TB_empty";
    const brushDepth = getTriangleBrushDepth(model);
    const brushBlocks = [];

    for (const triangle of model.triangles) {
      if (!triangle?.vertIndex || triangle.vertIndex.length !== 3) {
        continue;
      }

      const [ia, ib, ic] = triangle.vertIndex;
      if (
        ia < 0 || ia >= model.numVerts ||
        ib < 0 || ib >= model.numVerts ||
        ic < 0 || ic >= model.numVerts
      ) {
        continue;
      }

      const a = getPoseVertex(positions, ia);
      const b = getPoseVertex(positions, ib);
      const c = getPoseVertex(positions, ic);
      const normal = normalizeVec3(crossVec3(subtractVec3(b, a), subtractVec3(c, a)));
      if (!normal || computeTriangleArea3D(a, b, c) <= 1e-5) {
        continue;
      }

      const backA = addScaledVec3(a, normal, -brushDepth);
      const backB = addScaledVec3(b, normal, -brushDepth);
      const backC = addScaledVec3(c, normal, -brushDepth);
      const planeLines = buildFlatPrismBrushLines(a, b, c, backA, backB, backC, textureName);

      brushBlocks.push([
        `// brush ${brushBlocks.length}`,
        "{",
        ...planeLines,
        "}",
      ].join("\n"));
    }

    if (!brushBlocks.length) {
      throw new Error("No valid triangle brushes were produced for MAP export.");
    }

    return {
      brushCount: brushBlocks.length,
      mode: "triangle-prisms",
      text: buildMapTextFromBrushBlocks(brushBlocks),
      textureName,
      brushDepth,
    };
  }

  function buildCurrentModelMapExport(model) {
    if (!canExportModelAsMap(model)) {
      throw new Error("No model geometry is available for MAP export.");
    }

    const positions = getCurrentMapExportPositions(model);
    if (!positions?.length) {
      throw new Error("No pose geometry is available for MAP export.");
    }

    if (model.mapExportData?.kind === "flat-prism") {
      return buildGeneratedFlatPrismMapExport(model, positions);
    }

    return buildTriangleBrushSoupMapExport(model, positions);
  }

  async function saveCurrentModel() {
    if (!state.model) {
      return;
    }

    try {
      syncPendingSkinSizeDraft();
      syncRenderGeometryToModel(state.model);
      const bytes = serializeMDL(state.model);
      const suggestedName = getSuggestedModelFilename(state.model.path);

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{
              description: "Quake MDL",
              accept: {
                "application/octet-stream": [".mdl"],
              },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(bytes);
          await writable.close();
          setSaveStatus(`Saved ${suggestedName}.`);
          return;
        } catch (error) {
          if (error && error.name === "AbortError") {
            return;
          }
        }
      }

      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setSaveStatus(`Exported ${suggestedName}.`);
    } catch (error) {
      console.error(error);
      setSaveStatus(`Save failed: ${error.message}`);
    }
  }

  async function saveCurrentModelAsMap() {
    if (!state.model) {
      return;
    }

    if (!canExportModelAsMap(state.model)) {
      setSaveStatus("No model geometry is available for MAP export.");
      return;
    }

    try {
      syncRenderGeometryToModel(state.model);
      const exportData = buildCurrentModelMapExport(state.model);
      const suggestedName = getSuggestedMapFilename(state.model.path);

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{
              description: "Quake MAP",
              accept: {
                "text/plain": [".map"],
              },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(exportData.text);
          await writable.close();
          setSaveStatus(`Saved ${suggestedName} (${exportData.brushCount} brushes, texture ${exportData.textureName}).`);
          return;
        } catch (error) {
          if (error && error.name === "AbortError") {
            return;
          }
        }
      }

      downloadBlob(new Blob([exportData.text], { type: "text/plain;charset=utf-8" }), suggestedName);
      setSaveStatus(`Exported ${suggestedName} (${exportData.brushCount} brushes, texture ${exportData.textureName}).`);
    } catch (error) {
      console.error(error);
      setSaveStatus(`MAP export failed: ${error.message}`);
    }
  }

  function setSaveStatus(message) {
    dom.saveModelStatus.textContent = message;
  }

  function updateColorLabels() {
    dom.topValue.textContent = String(state.topColor);
    dom.bottomValue.textContent = String(state.bottomColor);
  }

  function updateSkinStatus() {
    if (!state.model) {
      dom.skinStatus.textContent = "No skin loaded";
      clearSkinPreview();
      syncPlayerColorControls();
      updateSkinPaletteEditor();
      return;
    }

    const skin = state.model.skins[state.selectedSkinIndex];
    const animated = skin.frames.length > 1 ? `, ${skin.frames.length} skin frames` : "";
    const isPlayerModel = /(^|\/)player\.mdl$/i.test(state.model.path);
    const recolor = isPlayerModel && state.recolorEnabled ? `, top=${state.topColor} bottom=${state.bottomColor}` : "";
    dom.skinStatus.textContent = `${state.model.skinWidth} x ${state.model.skinHeight}${animated}${recolor}`;
    syncPlayerColorControls();
    updateSkinPaletteEditor();
  }

  function updateValidationPanel() {
    if (!dom.validationSummary || !dom.validationList) {
      return;
    }

    dom.validationSummary.className = "validation-summary hint";
    dom.validationList.innerHTML = "";

    if (!state.model) {
      dom.validationSummary.textContent = "No model loaded.";
      return;
    }

    const report = buildValidationReport(state.model);
    const { errors, warnings, infos } = report.counts;

    if (!report.findings.length) {
      dom.validationSummary.textContent = "No issues detected. Export data looks internally consistent.";
      dom.validationSummary.classList.add("is-clean");

      const empty = document.createElement("div");
      empty.className = "validation-empty";
      empty.textContent = "No export-time issues found for the current model.";
      dom.validationList.appendChild(empty);
      return;
    }

    const parts = [];
    if (errors) {
      parts.push(`${errors} error${errors === 1 ? "" : "s"}`);
    }
    if (warnings) {
      parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
    }
    if (infos) {
      parts.push(`${infos} note${infos === 1 ? "" : "s"}`);
    }
    dom.validationSummary.textContent = parts.join(", ") + ".";
    dom.validationSummary.classList.add(errors ? "is-error" : warnings ? "is-warning" : "is-info");

    if (report.fixes.length) {
      const actions = document.createElement("section");
      actions.className = "validation-actions";

      const label = document.createElement("div");
      label.className = "validation-actions-label";
      label.textContent = "Quick fixes";
      actions.appendChild(label);

      const row = document.createElement("div");
      row.className = "validation-actions-row";
      report.fixes.forEach((fix) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "validation-fix-button";
        button.dataset.validationFix = fix.id;
        button.textContent = fix.label;
        row.appendChild(button);
      });
      actions.appendChild(row);
      dom.validationList.appendChild(actions);
    }

    report.findings.forEach((finding) => {
      const item = document.createElement("section");
      item.className = `validation-item is-${finding.severity}`;

      const header = document.createElement("div");
      header.className = "validation-item-header";

      const badge = document.createElement("span");
      badge.className = `validation-badge is-${finding.severity}`;
      badge.textContent = VALIDATION_SEVERITY_LABELS[finding.severity] || VALIDATION_SEVERITY_LABELS.info;

      const title = document.createElement("div");
      title.className = "validation-item-title";
      title.textContent = finding.title;

      const detail = document.createElement("div");
      detail.className = "validation-item-detail";
      detail.textContent = finding.detail;

      header.appendChild(badge);
      header.appendChild(title);
      item.appendChild(header);
      item.appendChild(detail);
      dom.validationList.appendChild(item);
    });
  }

  function buildValidationReport(model) {
    const findings = [];

    validateModelCounts(model, findings);
    validateSkinConsistency(model, findings);
    validateFrameConsistency(model, findings);
    validateTopologyConsistency(model, findings);
    validatePackedGeometry(model, findings);
    validateBoundingRadius(model, findings);

    findings.sort((a, b) => {
      const severityDiff = (VALIDATION_SEVERITY_ORDER[a.severity] ?? 99) - (VALIDATION_SEVERITY_ORDER[b.severity] ?? 99);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return a.title.localeCompare(b.title);
    });

    const counts = {
      errors: 0,
      warnings: 0,
      infos: 0,
    };
    findings.forEach((finding) => {
      if (finding.severity === "error") {
        counts.errors += 1;
      } else if (finding.severity === "warning") {
        counts.warnings += 1;
      } else {
        counts.infos += 1;
      }
    });

    const fixMap = new Map();
    findings.forEach((finding) => {
      finding.fixes?.forEach((fix) => {
        if (!fixMap.has(fix.id)) {
          fixMap.set(fix.id, fix);
        }
      });
    });

    return {
      findings,
      counts,
      fixes: Array.from(fixMap.values()),
    };
  }

  function pushValidationFinding(findings, severity, title, detail, fixes = []) {
    findings.push({
      severity,
      title,
      detail,
      fixes,
    });
  }

  function validateModelCounts(model, findings) {
    if (!model.poses.length) {
      pushValidationFinding(
        findings,
        "error",
        "Model has no poses",
        "The file contains no pose data, so there is nothing valid to render or export."
      );
    }

    if (model.numSkins !== model.skins.length) {
      pushValidationFinding(
        findings,
        "warning",
        "Header skin count differs from loaded skin data",
        `Header says ${model.numSkins}, but ${model.skins.length} skin entries are loaded. Save will use the loaded skin array length.`
      );
    }

    if (model.numVerts !== model.stVerts.length) {
      pushValidationFinding(
        findings,
        "error",
        "Header vertex count differs from texture vertex data",
        `Header says ${model.numVerts} vertices, but ${model.stVerts.length} texture vertices are present.`
      );
    }

    if (model.numTris !== model.triangles.length) {
      pushValidationFinding(
        findings,
        "error",
        "Header triangle count differs from triangle data",
        `Header says ${model.numTris} triangles, but ${model.triangles.length} triangle records are present.`
      );
    }

    if (model.numFrames !== model.topFrames.length) {
      pushValidationFinding(
        findings,
        "warning",
        "Header frame count differs from top-level frame groups",
        `Header says ${model.numFrames} frames, but ${model.topFrames.length} top-level frames/groups are loaded. Save will use the loaded frame groups.`
      );
    }

    const expectedPositionLength = model.numVerts * 3;
    const badPoseLengths = model.poses.reduce((count, pose) => (
      pose.positions && pose.positions.length === expectedPositionLength ? count : count + 1
    ), 0);
    if (badPoseLengths) {
      pushValidationFinding(
        findings,
        "error",
        "Pose vertex data length does not match the header vertex count",
        `${badPoseLengths} pose${badPoseLengths === 1 ? "" : "s"} do not contain ${expectedPositionLength} coordinate values.`
      );
    }

    if (model.numVerts > 2048) {
      pushValidationFinding(
        findings,
        "warning",
        "High vertex count",
        `Model has ${model.numVerts} vertices. Some Quake engines limit models to 2048 vertices.`
      );
    }
    if (model.numTris > 4096) {
      pushValidationFinding(
        findings,
        "warning",
        "High triangle count",
        `Model has ${model.numTris} triangles. Some Quake engines limit models to 4096 triangles.`
      );
    }
  }

  function validateSkinConsistency(model, findings) {
    if (!Number.isInteger(model.skinWidth) || !Number.isInteger(model.skinHeight) || model.skinWidth < 1 || model.skinHeight < 1) {
      pushValidationFinding(
        findings,
        "error",
        "Skin dimensions are invalid",
        `Skin size must be positive integers. Current size is ${model.skinWidth} x ${model.skinHeight}.`
      );
      return;
    }

    const expectedPixels = model.skinWidth * model.skinHeight;
    let emptySkins = 0;
    let frameSizeMismatches = 0;
    let intervalIssues = 0;

    model.skins.forEach((skin) => {
      if (!skin.frames?.length) {
        emptySkins += 1;
        return;
      }

      skin.frames.forEach((frame) => {
        if (!frame || frame.length !== expectedPixels) {
          frameSizeMismatches += 1;
        }
      });

      if (skin.frames.length > 1 || skin.type === "group") {
        const hasValidIntervals = Array.isArray(skin.intervals) &&
          skin.intervals.length === skin.frames.length &&
          skin.intervals.every((value) => Number.isFinite(value) && value > 0);
        if (!hasValidIntervals) {
          intervalIssues += 1;
        }
      }
    });

    if (emptySkins) {
      pushValidationFinding(
        findings,
        "error",
        "Skin entries are missing frame data",
        `${emptySkins} skin entr${emptySkins === 1 ? "y has" : "ies have"} no frame pixels.`
      );
    }

    if (frameSizeMismatches) {
      pushValidationFinding(
        findings,
        "error",
        "Skin frame byte counts do not match the current skin dimensions",
        `${frameSizeMismatches} skin frame${frameSizeMismatches === 1 ? "" : "s"} do not contain exactly ${expectedPixels} indexed pixels.`
      );
    }

    if (intervalIssues) {
      pushValidationFinding(
        findings,
        "warning",
        "Animated skin intervals are incomplete or invalid",
        `${intervalIssues} animated skin entr${intervalIssues === 1 ? "y has" : "ies have"} missing, non-finite, or non-positive interval data.`,
        [VALIDATION_FIXES.normalizeSkinIntervals]
      );
    }

    const hasOnseamVertices = model.stVerts.some((st) => !!st.onseam);
    if (hasOnseamVertices && model.skinWidth % 2 !== 0) {
      pushValidationFinding(
        findings,
        "warning",
        "Odd skin width with onseam vertices",
        `Skin width ${model.skinWidth} is odd, but the mesh uses onseam texture vertices. Backface seam offsets assume a half-width split.`
      );
    }
  }

  function validateFrameConsistency(model, findings) {
    let emptyFrameGroups = 0;
    let invalidPoseRefs = 0;
    let intervalIssues = 0;

    model.topFrames.forEach((frame) => {
      const poseIndices = Array.isArray(frame.poseIndices) ? frame.poseIndices : [];
      if (!poseIndices.length) {
        emptyFrameGroups += 1;
      }

      poseIndices.forEach((poseIndex) => {
        if (!Number.isInteger(poseIndex) || poseIndex < 0 || poseIndex >= model.poses.length) {
          invalidPoseRefs += 1;
        }
      });

      if (frame.type === "group" || poseIndices.length > 1) {
        const hasValidIntervals = Array.isArray(frame.intervals) &&
          frame.intervals.length === poseIndices.length &&
          frame.intervals.every((value) => Number.isFinite(value) && value > 0);
        if (!hasValidIntervals) {
          intervalIssues += 1;
        }
      }
    });

    if (emptyFrameGroups) {
      pushValidationFinding(
        findings,
        "warning",
        "Top-level frames are missing pose assignments",
        `${emptyFrameGroups} frame entr${emptyFrameGroups === 1 ? "y has" : "ies have"} no pose indices.`
      );
    }

    if (invalidPoseRefs) {
      pushValidationFinding(
        findings,
        "error",
        "Frame groups reference missing poses",
        `${invalidPoseRefs} pose reference${invalidPoseRefs === 1 ? "" : "s"} point outside the loaded pose array.`
      );
    }

    if (intervalIssues) {
      pushValidationFinding(
        findings,
        "warning",
        "Frame group intervals are incomplete or invalid",
        `${intervalIssues} animated frame group${intervalIssues === 1 ? "" : "s"} have missing, non-finite, or non-positive interval values.`,
        [VALIDATION_FIXES.normalizeFrameIntervals]
      );
    }
  }

  function validateTopologyConsistency(model, findings) {
    let outOfBoundsSt = 0;
    model.stVerts.forEach((st) => {
      if (!st || !Number.isFinite(st.s) || !Number.isFinite(st.t) ||
        st.s < 0 || st.s >= model.skinWidth ||
        st.t < 0 || st.t >= model.skinHeight) {
        outOfBoundsSt += 1;
      }
    });

    let uvOutOfRange = 0;
    if (model.render?.uvs?.length) {
      for (let i = 0; i < model.render.uvs.length; i += 2) {
        const u = model.render.uvs[i + 0];
        const v = model.render.uvs[i + 1];
        if (!Number.isFinite(u) || !Number.isFinite(v) || u < 0 || u > 1 || v < 0 || v > 1) {
          uvOutOfRange += 1;
        }
      }
    }

    let invalidTriangleRefs = 0;
    let duplicateIndexTriangles = 0;
    let invalidFacesfront = 0;
    const validTriangles = [];

    model.triangles.forEach((triangle, triIndex) => {
      const [a, b, c] = triangle.vertIndex || [];
      if (triangle.facesfront !== 0 && triangle.facesfront !== 1) {
        invalidFacesfront += 1;
      }

      const isValid = [a, b, c].every((index) => Number.isInteger(index) && index >= 0 && index < model.numVerts);
      if (!isValid) {
        invalidTriangleRefs += 1;
        return;
      }

      if (a === b || b === c || c === a) {
        duplicateIndexTriangles += 1;
        return;
      }

      validTriangles.push([triIndex, a, b, c]);
    });

    if (outOfBoundsSt) {
      pushValidationFinding(
        findings,
        "warning",
        "Texture vertices fall outside the skin bounds",
        `${outOfBoundsSt} texture vertex${outOfBoundsSt === 1 ? "" : "es"} have s/t coordinates outside the current ${model.skinWidth} x ${model.skinHeight} skin area.`
      );
    }

    if (uvOutOfRange) {
      pushValidationFinding(
        findings,
        "warning",
        "Expanded UVs extend outside the normalized skin range",
        `${uvOutOfRange} rendered UV coordinate pair${uvOutOfRange === 1 ? "" : "s"} fall outside 0..1, so preview and export seam mapping may clamp unexpectedly.`
      );
    }

    if (invalidTriangleRefs) {
      pushValidationFinding(
        findings,
        "error",
        "Triangles reference vertices outside the header vertex count",
        `${invalidTriangleRefs} triangle${invalidTriangleRefs === 1 ? "" : "s"} point outside the 0..${Math.max(model.numVerts - 1, 0)} vertex range.`
      );
    }

    if (duplicateIndexTriangles) {
      pushValidationFinding(
        findings,
        "warning",
        "Triangles contain repeated vertex indices",
        `${duplicateIndexTriangles} triangle${duplicateIndexTriangles === 1 ? "" : "s"} reuse the same vertex index more than once, which makes them degenerate by construction.`
      );
    }

    if (invalidFacesfront) {
      pushValidationFinding(
        findings,
        "info",
        "Triangle facesfront flags contain non-standard values",
        `${invalidFacesfront} triangle${invalidFacesfront === 1 ? "" : "s"} use facesfront values other than 0 or 1.`
      );
    }

    const radius = model.render?.bounds?.radius || 1;
    const areaEpsilon = Math.max(radius * radius * 1e-10, 1e-8);
    let degenerateHits = 0;
    const degenerateTriangles = new Set();
    const degeneratePoses = new Set();
    const degenerateExamples = [];

    model.poses.forEach((pose, poseIndex) => {
      const positions = pose.positions;
      if (!positions || positions.length < model.numVerts * 3) {
        return;
      }

      validTriangles.forEach(([triIndex, a, b, c]) => {
        const i0 = a * 3;
        const i1 = b * 3;
        const i2 = c * 3;
        const ax = positions[i1 + 0] - positions[i0 + 0];
        const ay = positions[i1 + 1] - positions[i0 + 1];
        const az = positions[i1 + 2] - positions[i0 + 2];
        const bx = positions[i2 + 0] - positions[i0 + 0];
        const by = positions[i2 + 1] - positions[i0 + 1];
        const bz = positions[i2 + 2] - positions[i0 + 2];
        const crossMagnitude = Math.hypot(
          ay * bz - az * by,
          az * bx - ax * bz,
          ax * by - ay * bx
        );

        if (crossMagnitude <= areaEpsilon) {
          degenerateHits += 1;
          degenerateTriangles.add(triIndex);
          degeneratePoses.add(poseIndex);
          if (degenerateExamples.length < 3) {
            degenerateExamples.push(`tri ${triIndex}, pose ${poseIndex}`);
          }
        }
      });
    });

    if (degenerateHits) {
      const exampleText = degenerateExamples.length ? ` Examples: ${degenerateExamples.join("; ")}.` : "";
      pushValidationFinding(
        findings,
        "warning",
        "Degenerate triangles were detected in pose geometry",
        `${degenerateHits} degenerate triangle instance${degenerateHits === 1 ? "" : "s"} were found across ${degenerateTriangles.size} triangle${degenerateTriangles.size === 1 ? "" : "s"} and ${degeneratePoses.size} pose${degeneratePoses.size === 1 ? "" : "s"}.${exampleText}`
      );
    }
  }

  function validatePackedGeometry(model, findings) {
    const stats = computePackedCoordinateStats(model);
    const { invalidScaleAxes, invalidOriginAxes } = stats;

    if (invalidScaleAxes.length) {
      pushValidationFinding(
        findings,
        "error",
        "Scale axes are invalid for MDL export",
        `Scale values for ${invalidScaleAxes.join(", ")} are zero, near-zero, or non-finite. Packed vertices cannot be written safely.`,
        [VALIDATION_FIXES.fitExportPacking]
      );
      return;
    }

    if (invalidOriginAxes.length) {
      pushValidationFinding(
        findings,
        "error",
        "Scale origin contains non-finite values",
        `Scale origin axes ${invalidOriginAxes.join(", ")} are not finite numbers.`,
        [VALIDATION_FIXES.fitExportPacking]
      );
      return;
    }

    if (stats.nonFiniteCoords) {
      pushValidationFinding(
        findings,
        "error",
        "Pose geometry contains non-finite coordinates",
        `${stats.nonFiniteCoords} coordinate value${stats.nonFiniteCoords === 1 ? "" : "s"} are NaN or infinite.`
      );
    }

    const clampHits = stats.underflowCounts.reduce((sum, value) => sum + value, 0) +
      stats.overflowCounts.reduce((sum, value) => sum + value, 0);
    if (clampHits) {
      pushValidationFinding(
        findings,
        "error",
        "Geometry falls outside the MDL 0..255 packed coordinate range",
        `${formatPackedAxisSummary("x", stats.min[0], stats.max[0], stats.underflowCounts[0], stats.overflowCounts[0])}; ${formatPackedAxisSummary("y", stats.min[1], stats.max[1], stats.underflowCounts[1], stats.overflowCounts[1])}; ${formatPackedAxisSummary("z", stats.min[2], stats.max[2], stats.underflowCounts[2], stats.overflowCounts[2])}. Save would clamp those coordinates.`,
        [VALIDATION_FIXES.fitExportPacking]
      );
    }
  }

  function computePackedCoordinateStats(model) {
    const stats = {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
      underflowCounts: [0, 0, 0],
      overflowCounts: [0, 0, 0],
      nonFiniteCoords: 0,
      invalidScaleAxes: [],
      invalidOriginAxes: [],
    };

    ["x", "y", "z"].forEach((axis, axisIndex) => {
      if (!Number.isFinite(model.scale?.[axisIndex]) || Math.abs(model.scale[axisIndex]) < 1e-6) {
        stats.invalidScaleAxes.push(axis);
      }
      if (!Number.isFinite(model.scaleOrigin?.[axisIndex])) {
        stats.invalidOriginAxes.push(axis);
      }
    });

    if (stats.invalidScaleAxes.length || stats.invalidOriginAxes.length) {
      return stats;
    }

    model.poses.forEach((pose) => {
      const positions = pose.positions;
      if (!positions) {
        return;
      }

      for (let i = 0; i < positions.length; i += 3) {
        for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
          const value = positions[i + axisIndex];
          if (!Number.isFinite(value)) {
            stats.nonFiniteCoords += 1;
            continue;
          }

          const packed = (value - model.scaleOrigin[axisIndex]) / model.scale[axisIndex];
          stats.min[axisIndex] = Math.min(stats.min[axisIndex], packed);
          stats.max[axisIndex] = Math.max(stats.max[axisIndex], packed);
          if (packed < 0) {
            stats.underflowCounts[axisIndex] += 1;
          } else if (packed > 255) {
            stats.overflowCounts[axisIndex] += 1;
          }
        }
      }
    });

    return stats;
  }

  function describePackedCoordinateStats(stats) {
    if (stats.invalidScaleAxes.length) {
      return `Current packing is invalid: scale ${stats.invalidScaleAxes.join(", ")} ${stats.invalidScaleAxes.length === 1 ? "axis is" : "axes are"} zero, near-zero, or non-finite.`;
    }
    if (stats.invalidOriginAxes.length) {
      return `Current packing is invalid: scale origin ${stats.invalidOriginAxes.join(", ")} ${stats.invalidOriginAxes.length === 1 ? "axis is" : "axes are"} non-finite.`;
    }
    if (stats.nonFiniteCoords) {
      return `Current geometry includes ${stats.nonFiniteCoords} non-finite coordinate value${stats.nonFiniteCoords === 1 ? "" : "s"}.`;
    }

    const clampHits = stats.underflowCounts.reduce((sum, value) => sum + value, 0) +
      stats.overflowCounts.reduce((sum, value) => sum + value, 0);
    const summary = [
      formatPackedAxisSummary("x", stats.min[0], stats.max[0], stats.underflowCounts[0], stats.overflowCounts[0]),
      formatPackedAxisSummary("y", stats.min[1], stats.max[1], stats.underflowCounts[1], stats.overflowCounts[1]),
      formatPackedAxisSummary("z", stats.min[2], stats.max[2], stats.underflowCounts[2], stats.overflowCounts[2]),
    ].join("; ");

    if (clampHits) {
      return `Current packing would clamp geometry on save: ${summary}.`;
    }
    return `Current packing stays within the MDL 0..255 range: ${summary}.`;
  }

  function validateBoundingRadius(model, findings) {
    const measuredRadius = computeModelOriginRadius(model.render.positionsByPose);
    const headerRadius = Number(model.boundingRadius);

    if (!Number.isFinite(headerRadius) || headerRadius < 0) {
      pushValidationFinding(
        findings,
        "error",
        "Header bounding radius is invalid",
        `Bounding radius must be a finite value >= 0. Current value is ${String(model.boundingRadius)}.`,
        [VALIDATION_FIXES.useMeasuredRadius]
      );
      return;
    }

    if (headerRadius + 0.01 < measuredRadius) {
      pushValidationFinding(
        findings,
        "warning",
        "Header bounding radius is smaller than the model extent",
        `Header radius is ${formatNumber(headerRadius)}, but the measured max vertex distance from origin is ${formatNumber(measuredRadius)}.`,
        [VALIDATION_FIXES.useMeasuredRadius]
      );
      return;
    }

    if (headerRadius > Math.max(measuredRadius * 1.25, measuredRadius + 8)) {
      pushValidationFinding(
        findings,
        "info",
        "Header bounding radius is much larger than necessary",
        `Header radius is ${formatNumber(headerRadius)}, while the measured max vertex distance from origin is ${formatNumber(measuredRadius)}.`,
        [VALIDATION_FIXES.useMeasuredRadius]
      );
    }
  }

  function formatPackedAxisSummary(axis, min, max, underflow, overflow) {
    const rangeText = Number.isFinite(min) && Number.isFinite(max)
      ? `${formatNumber(min)}..${formatNumber(max)}`
      : "n/a";
    const counts = [];
    if (underflow) {
      counts.push(`${underflow} under`);
    }
    if (overflow) {
      counts.push(`${overflow} over`);
    }
    return `${axis} ${rangeText}${counts.length ? ` (${counts.join(", ")})` : ""}`;
  }

  function getSkinPaletteRangeTitle(rangeIndex) {
    const start = rangeIndex * PALETTE_GRID_DIMENSION;
    if (start === TOP_RANGE) {
      return "Shirt";
    }
    if (start === BOTTOM_RANGE) {
      return "Pants";
    }
    return `${start}-${start + PALETTE_GRID_DIMENSION - 1}`;
  }

  function getSkinPaletteRangeSubtitle(rangeIndex) {
    return "";
  }

  function clearSkinPaletteSelection(clearTarget = false) {
    state.skinPaletteSourceIndices.clear();
    state.skinPalettePickingTarget = false;
    if (clearTarget) {
      state.skinPaletteTargetIndex = -1;
    }
  }

  function getSkinPaletteUsage() {
    const usage = new Uint32Array(256);
    if (!state.model) {
      return usage;
    }

    const skin = state.model.skins[state.selectedSkinIndex];
    if (!skin || !skin.frames.length) {
      return usage;
    }

    const frameIndices = state.skinPaletteScope === "skin"
      ? skin.frames.map((_, index) => index)
      : [clamp(getCurrentSkinFrameIndex(), 0, skin.frames.length - 1)];

    frameIndices.forEach((frameIndex) => {
      const frame = skin.frames[frameIndex];
      for (let i = 0; i < frame.length; i++) {
        usage[frame[i]] += 1;
      }
    });

    return usage;
  }

  function isSkinPaletteRangeEnabled(index) {
    const rangeIndex = clamp(Math.floor(index / PALETTE_GRID_DIMENSION), 0, PALETTE_GRID_DIMENSION - 1);
    return !!state.skinPaletteRangeEnabled[rangeIndex];
  }

  function isSkinPaletteSourceSelectable(index, usage) {
    return isSkinPaletteRangeEnabled(index) && (state.skinPaletteShowUnused || usage[index] > 0);
  }

  function pruneSkinPaletteSourceSelection() {
    const usage = getSkinPaletteUsage();
    const next = new Set();
    state.skinPaletteSourceIndices.forEach((index) => {
      if (isSkinPaletteSourceSelectable(index, usage)) {
        next.add(index);
      }
    });
    state.skinPaletteSourceIndices = next;
  }

  function getSortedSkinPaletteSources() {
    return Array.from(state.skinPaletteSourceIndices).sort((a, b) => a - b);
  }

  function updateSkinPaletteEditor() {
    syncSkinPaletteControls();

    const usage = getSkinPaletteUsage();
    const palette = state.paletteRGBA
      ? buildDisplayPalette(state.paletteRGBA, state.recolorEnabled, state.topColor, state.bottomColor)
      : buildDefaultPaletteRGBA();

    pruneSkinPaletteSourceSelection();
    drawSkinPaletteCanvas(palette, usage);

    dom.skinPaletteRanges.querySelectorAll(".skin-palette-range").forEach((row, rangeIndex) => {
      const start = rangeIndex * PALETTE_GRID_DIMENSION;
      let usedPixels = 0;
      for (let i = start; i < start + PALETTE_GRID_DIMENSION; i++) {
        usedPixels += usage[i];
      }
      row.classList.toggle("is-disabled", !state.skinPaletteRangeEnabled[rangeIndex]);
      row.classList.toggle("is-unused", usedPixels === 0);
      row.title = `${start}-${start + PALETTE_GRID_DIMENSION - 1}: ${usedPixels} pixel${usedPixels === 1 ? "" : "s"}`;
    });

    if (!state.model) {
      dom.skinPaletteSelection.textContent = "Source: none";
      dom.skinPaletteTarget.textContent = "Target: none";
      dom.skinPaletteHelp.textContent = "Load a model to remap skin palette indices.";
      dom.skinPaletteTargetButton.textContent = "Pick Target";
      dom.skinPaletteApplyButton.disabled = true;
      dom.skinPaletteClearButton.disabled = true;
      dom.skinPaletteCanvas.style.cursor = "default";
      dom.skinPaletteCanvas.title = "Load a model to edit palette indices";
      return;
    }

    const sourceIndices = getSortedSkinPaletteSources();
    const previewText = sourceIndices.length
      ? sourceIndices.slice(0, 8).join(", ") + (sourceIndices.length > 8 ? ", ..." : "")
      : "none";
    dom.skinPaletteSelection.textContent = sourceIndices.length
      ? `Source: ${sourceIndices.length} color${sourceIndices.length === 1 ? "" : "s"} (${previewText})`
      : "Source: none";
    dom.skinPaletteTarget.textContent = state.skinPaletteTargetIndex >= 0
      ? `Target: ${state.skinPaletteTargetIndex}`
      : "Target: none";
    dom.skinPaletteHelp.textContent = state.skinPalettePickingTarget
      ? "Click a palette color to set the remap target."
      : "Click source colors, pick a target, then apply. Double-click a target swatch to remap immediately.";
    dom.skinPaletteTargetButton.textContent = state.skinPalettePickingTarget
      ? "Click Target..."
      : state.skinPaletteTargetIndex >= 0
        ? `Target ${state.skinPaletteTargetIndex}`
        : "Pick Target";
    dom.skinPaletteCanvas.style.cursor = state.skinPalettePickingTarget ? "copy" : "crosshair";
    dom.skinPaletteCanvas.title = state.skinPaletteHoverIndex >= 0
      ? `Palette ${state.skinPaletteHoverIndex}: ${usage[state.skinPaletteHoverIndex]} pixel${usage[state.skinPaletteHoverIndex] === 1 ? "" : "s"} in scope`
      : "Palette mapping grid";

    const canApply = state.skinPaletteTargetIndex >= 0 &&
      sourceIndices.some((index) => index !== state.skinPaletteTargetIndex);
    dom.skinPaletteApplyButton.disabled = !canApply;
    dom.skinPaletteClearButton.disabled = !sourceIndices.length && state.skinPaletteTargetIndex < 0 && !state.skinPalettePickingTarget;
  }

  function drawSkinPaletteCanvas(palette, usage) {
    const canvas = dom.skinPaletteCanvas;
    if (canvas.width !== PALETTE_CANVAS_SIZE) {
      canvas.width = PALETTE_CANVAS_SIZE;
    }
    if (canvas.height !== PALETTE_CANVAS_SIZE) {
      canvas.height = PALETTE_CANVAS_SIZE;
    }

    const cellSize = canvas.width / PALETTE_GRID_DIMENSION;
    skinPaletteContext.clearRect(0, 0, canvas.width, canvas.height);
    skinPaletteContext.fillStyle = "#0c1016";
    skinPaletteContext.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 256; index++) {
      const x = (index % PALETTE_GRID_DIMENSION) * cellSize;
      const y = Math.floor(index / PALETTE_GRID_DIMENSION) * cellSize;

      skinPaletteContext.fillStyle = `rgba(${palette[index * 4 + 0]}, ${palette[index * 4 + 1]}, ${palette[index * 4 + 2]}, 1)`;
      skinPaletteContext.fillRect(x, y, cellSize, cellSize);

      if (!state.skinPaletteShowUnused && usage[index] === 0) {
        skinPaletteContext.fillStyle = "rgba(4, 6, 10, 0.78)";
        skinPaletteContext.fillRect(x, y, cellSize, cellSize);
      }

      if (!isSkinPaletteRangeEnabled(index)) {
        skinPaletteContext.fillStyle = "rgba(7, 10, 14, 0.56)";
        skinPaletteContext.fillRect(x, y, cellSize, cellSize);
      }

      skinPaletteContext.strokeStyle = "rgba(0, 0, 0, 0.45)";
      skinPaletteContext.lineWidth = 1;
      skinPaletteContext.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

      if (usage[index] === 0) {
        skinPaletteContext.strokeStyle = "rgba(0, 0, 0, 0.55)";
        skinPaletteContext.lineWidth = 1;
        skinPaletteContext.beginPath();
        skinPaletteContext.moveTo(x + 2, y + 2);
        skinPaletteContext.lineTo(x + cellSize - 2, y + cellSize - 2);
        skinPaletteContext.moveTo(x + cellSize - 2, y + 2);
        skinPaletteContext.lineTo(x + 2, y + cellSize - 2);
        skinPaletteContext.stroke();
      }

      if (state.skinPaletteSourceIndices.has(index)) {
        skinPaletteContext.strokeStyle = "rgba(162, 224, 95, 0.98)";
        skinPaletteContext.lineWidth = 2;
        skinPaletteContext.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
      }

      if (state.skinPaletteTargetIndex === index) {
        skinPaletteContext.strokeStyle = "rgba(244, 247, 252, 0.98)";
        skinPaletteContext.lineWidth = 3;
        skinPaletteContext.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
        skinPaletteContext.strokeStyle = "rgba(95, 214, 224, 0.98)";
        skinPaletteContext.lineWidth = 1;
        skinPaletteContext.strokeRect(x + 4.5, y + 4.5, cellSize - 9, cellSize - 9);
      } else if (state.skinPaletteHoverIndex === index) {
        skinPaletteContext.strokeStyle = "rgba(95, 214, 224, 0.65)";
        skinPaletteContext.lineWidth = 1.5;
        skinPaletteContext.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      }
    }
  }

  function getSkinPaletteIndexFromEvent(event) {
    if (!state.model) {
      return -1;
    }

    const rect = dom.skinPaletteCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return -1;
    }

    const x = (event.clientX - rect.left) * (dom.skinPaletteCanvas.width / rect.width);
    const y = (event.clientY - rect.top) * (dom.skinPaletteCanvas.height / rect.height);
    if (x < 0 || y < 0 || x >= dom.skinPaletteCanvas.width || y >= dom.skinPaletteCanvas.height) {
      return -1;
    }

    const cellSize = dom.skinPaletteCanvas.width / PALETTE_GRID_DIMENSION;
    const column = clamp(Math.floor(x / cellSize), 0, PALETTE_GRID_DIMENSION - 1);
    const row = clamp(Math.floor(y / cellSize), 0, PALETTE_GRID_DIMENSION - 1);
    return row * PALETTE_GRID_DIMENSION + column;
  }

  function handleSkinPaletteCanvasClick(event, applyDirect) {
    if (!state.model) {
      return;
    }

    const index = getSkinPaletteIndexFromEvent(event);
    if (index < 0) {
      return;
    }

    if (state.skinPalettePickingTarget) {
      state.skinPaletteTargetIndex = index;
      state.skinPalettePickingTarget = false;
      if (applyDirect && state.skinPaletteSourceIndices.size) {
        applySkinPaletteRemap();
        return;
      }
      updateSkinPaletteEditor();
      return;
    }

    if (applyDirect && state.skinPaletteSourceIndices.size) {
      state.skinPaletteTargetIndex = index;
      applySkinPaletteRemap();
      return;
    }

    const usage = getSkinPaletteUsage();
    if (!isSkinPaletteSourceSelectable(index, usage)) {
      return;
    }

    if (state.skinPaletteSourceIndices.has(index)) {
      state.skinPaletteSourceIndices.delete(index);
    } else {
      state.skinPaletteSourceIndices.add(index);
    }
    updateSkinPaletteEditor();
  }

  function applySkinPaletteRemap() {
    if (!state.model || state.skinPaletteTargetIndex < 0) {
      return;
    }

    const sourceIndices = getSortedSkinPaletteSources().filter((index) => index !== state.skinPaletteTargetIndex);
    if (!sourceIndices.length) {
      setSaveStatus("Select at least one source color and a different target color.");
      return;
    }

    const sourceSet = new Set(sourceIndices);
    const skin = state.model.skins[state.selectedSkinIndex];
    const frameIndices = state.skinPaletteScope === "skin"
      ? skin.frames.map((_, index) => index)
      : [clamp(getCurrentSkinFrameIndex(), 0, skin.frames.length - 1)];

    let changedPixels = 0;
    frameIndices.forEach((frameIndex) => {
      const frame = skin.frames[frameIndex];
      for (let i = 0; i < frame.length; i++) {
        if (sourceSet.has(frame[i])) {
          frame[i] = state.skinPaletteTargetIndex;
          changedPixels += 1;
        }
      }
    });

    if (!changedPixels) {
      setSaveStatus("No pixels in the selected scope matched the chosen source colors.");
      return;
    }

    clearSkinPaletteSelection(false);
    state.textureDirty = true;
    updateSkinStatus();
    updateValidationPanel();
    updateSkinPaletteEditor();

    const scopeLabel = state.skinPaletteScope === "skin"
      ? `${frameIndices.length} skin frame${frameIndices.length === 1 ? "" : "s"}`
      : `skin frame ${frameIndices[0] + 1}`;
    setSaveStatus(`Remapped ${changedPixels} pixel${changedPixels === 1 ? "" : "s"} to palette index ${state.skinPaletteTargetIndex} in ${scopeLabel}.`);
  }

  function describeSyncType(value) {
    const label = SYNC_TYPE_LABELS[value];
    if (label) {
      return `${label} (${value})`;
    }
    return `Unknown (${value})`;
  }

  function formatFlags(flags) {
    return `0x${(flags >>> 0).toString(16).padStart(8, "0")} (${flags})`;
  }

  function parseEditableNumber(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getModelBoundingRadius(model) {
    if (!model) {
      return 0;
    }
    return Math.max(0, Number.isFinite(model.boundingRadius) ? model.boundingRadius : computeModelOriginRadius(model.render.positionsByPose));
  }

  function computeModelOriginRadius(positionsByPose) {
    let radius = 0;
    if (!positionsByPose) {
      return radius;
    }

    for (const positions of positionsByPose) {
      for (let i = 0; i < positions.length; i += 3) {
        radius = Math.max(radius, Math.hypot(positions[i + 0], positions[i + 1], positions[i + 2]));
      }
    }

    return radius;
  }

  function boundsSize(bounds) {
    return [
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    ];
  }

  function formatVec3(vector) {
    return vector.map((value) => formatNumber(value)).join(",");
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    if (Math.abs(value - Math.round(value)) < 0.001) {
      return String(Math.round(value));
    }
    return value.toFixed(3).replace(/\.?0+$/, "");
  }

  function getSuggestedModelFilename(path) {
    const normalized = normalizePath(path || "model.mdl");
    const base = normalized.split("/").pop() || "model.mdl";
    return base.toLowerCase().endsWith(".mdl") ? base : `${base}.mdl`;
  }

  function getOverlayText(model) {
    const paletteText = state.paletteRGBA
      ? `Palette: ${state.paletteLabel}`
      : "Palette unavailable.";
    return `${model.path}\n${model.numVerts} vertices, ${model.numTris} triangles, ${model.poses.length} poses.\n${paletteText}`;
  }

  function updateOverlay(text) {
    dom.overlay.textContent = text;
    dom.overlay.hidden = false;
  }

  function hideOverlay() {
    dom.overlay.hidden = true;
  }

  function parsePak(name, bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const ident = readASCII(view, 0, 4);
    if (ident !== "PACK") {
      throw new Error(`${name} is not a Quake PAK file`);
    }

    const dirOffset = view.getInt32(4, true);
    const dirLength = view.getInt32(8, true);
    const entryCount = Math.floor(dirLength / 64);
    const assets = [];

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = dirOffset + i * 64;
      const path = readASCII(view, entryOffset, 56).replace(/\0.*$/, "");
      const fileOffset = view.getInt32(entryOffset + 56, true);
      const fileSize = view.getInt32(entryOffset + 60, true);
      const fileBytes = bytes.slice(fileOffset, fileOffset + fileSize);

      assets.push({
        path,
        bytes: fileBytes,
      });
    }

    return assets;
  }

  function parsePalette(bytes) {
    if (bytes.length !== 768) {
      throw new Error(`Expected 768 bytes for palette.lmp, got ${bytes.length}`);
    }

    const rgba = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      rgba[i * 4 + 0] = bytes[i * 3 + 0];
      rgba[i * 4 + 1] = bytes[i * 3 + 1];
      rgba[i * 4 + 2] = bytes[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
    rgba[255 * 4 + 3] = 0;
    return rgba;
  }

  function buildDefaultPaletteRGBA() {
    const rgba = new Uint8Array(256 * 4);
    for (let i = 0; i < DEFAULT_QUAKE_PALETTE_RGB24.length; i++) {
      const color = DEFAULT_QUAKE_PALETTE_RGB24[i];
      rgba[i * 4 + 0] = (color >> 16) & 0xff;
      rgba[i * 4 + 1] = (color >> 8) & 0xff;
      rgba[i * 4 + 2] = color & 0xff;
      rgba[i * 4 + 3] = 255;
    }
    rgba[255 * 4 + 3] = 0;
    return rgba;
  }

  // ── SVG-to-MDL: parsing, triangulation, extrusion, bevel, skin ────────────

  function parseSvgPathData(d, options = {}) {
    const subpaths = [];
    let current = [];
    let cx = 0, cy = 0;
    let sx = 0, sy = 0;
    let prevCx2 = 0, prevCy2 = 0;
    let prevCmd = "";
    const flattenTolerance = Number.isFinite(options.flattenTolerance) ? options.flattenTolerance : 0.02;
    const arcMaxAngle = Number.isFinite(options.arcMaxAngle) ? options.arcMaxAngle : (Math.PI / 16);

    const tokens = d.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
    let i = 0;

    function num() { return parseFloat(tokens[i++]); }

    function flattenCubic(x0, y0, x1, y1, x2, y2, x3, y3, tol, pts) {
      const dx = x3 - x0, dy = y3 - y0;
      const d1 = Math.abs((x1 - x3) * dy - (y1 - y3) * dx);
      const d2 = Math.abs((x2 - x3) * dy - (y2 - y3) * dx);
      if ((d1 + d2) * (d1 + d2) <= tol * (dx * dx + dy * dy)) {
        pts.push(x3, y3);
        return;
      }
      const mx01 = (x0 + x1) * 0.5, my01 = (y0 + y1) * 0.5;
      const mx12 = (x1 + x2) * 0.5, my12 = (y1 + y2) * 0.5;
      const mx23 = (x2 + x3) * 0.5, my23 = (y2 + y3) * 0.5;
      const mx012 = (mx01 + mx12) * 0.5, my012 = (my01 + my12) * 0.5;
      const mx123 = (mx12 + mx23) * 0.5, my123 = (my12 + my23) * 0.5;
      const mx0123 = (mx012 + mx123) * 0.5, my0123 = (my012 + my123) * 0.5;
      flattenCubic(x0, y0, mx01, my01, mx012, my012, mx0123, my0123, tol, pts);
      flattenCubic(mx0123, my0123, mx123, my123, mx23, my23, x3, y3, tol, pts);
    }

    function flattenQuadratic(x0, y0, x1, y1, x2, y2, tol, pts) {
      flattenCubic(
        x0, y0,
        x0 + (x1 - x0) * 2 / 3, y0 + (y1 - y0) * 2 / 3,
        x2 + (x1 - x2) * 2 / 3, y2 + (y1 - y2) * 2 / 3,
        x2, y2, tol, pts
      );
    }

    function arcToSegments(cx0, cy0, rx, ry, xAxisRotation, largeArc, sweep, x, y, pts) {
      const phi = xAxisRotation * Math.PI / 180;
      const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
      const dx2 = (cx0 - x) / 2, dy2 = (cy0 - y) / 2;
      const x1p = cosPhi * dx2 + sinPhi * dy2;
      const y1p = -sinPhi * dx2 + cosPhi * dy2;

      let rxSq = rx * rx, rySq = ry * ry;
      const x1pSq = x1p * x1p, y1pSq = y1p * y1p;

      let lambda = x1pSq / rxSq + y1pSq / rySq;
      if (lambda > 1) {
        const s = Math.sqrt(lambda);
        rx *= s; ry *= s;
        rxSq = rx * rx; rySq = ry * ry;
      }

      let sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
      let factor = Math.sqrt(sq) * ((largeArc === sweep) ? -1 : 1);
      const cxp = factor * rx * y1p / ry;
      const cyp = -factor * ry * x1p / rx;
      const cxFinal = cosPhi * cxp - sinPhi * cyp + (cx0 + x) / 2;
      const cyFinal = sinPhi * cxp + cosPhi * cyp + (cy0 + y) / 2;

      const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
      let dtheta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1;
      if (sweep && dtheta < 0) dtheta += 2 * Math.PI;
      if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;

      const segments = Math.max(1, Math.ceil(Math.abs(dtheta) / arcMaxAngle));
      for (let j = 1; j <= segments; j++) {
        const t = theta1 + dtheta * j / segments;
        const ex = cosPhi * rx * Math.cos(t) - sinPhi * ry * Math.sin(t) + cxFinal;
        const ey = sinPhi * rx * Math.cos(t) + cosPhi * ry * Math.sin(t) + cyFinal;
        pts.push(ex, ey);
      }
    }

    while (i < tokens.length) {
      const cmd = /^[a-zA-Z]$/.test(tokens[i]) ? tokens[i++] : (
        "MmLlHhVvCcSsQqTtAaZz".includes(prevCmd) ? (
          prevCmd === "M" ? "L" : prevCmd === "m" ? "l" : prevCmd
        ) : ""
      );
      prevCmd = cmd;

      switch (cmd) {
        case "M": cx = num(); cy = num(); sx = cx; sy = cy;
          if (current.length) subpaths.push(current);
          current = [cx, cy]; break;
        case "m": cx += num(); cy += num(); sx = cx; sy = cy;
          if (current.length) subpaths.push(current);
          current = [cx, cy]; break;
        case "L": cx = num(); cy = num(); current.push(cx, cy); break;
        case "l": cx += num(); cy += num(); current.push(cx, cy); break;
        case "H": cx = num(); current.push(cx, cy); break;
        case "h": cx += num(); current.push(cx, cy); break;
        case "V": cy = num(); current.push(cx, cy); break;
        case "v": cy += num(); current.push(cx, cy); break;
        case "C": {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
          flattenCubic(cx, cy, x1, y1, x2, y2, x3, y3, flattenTolerance, current);
          prevCx2 = x2; prevCy2 = y2; cx = x3; cy = y3; break;
        }
        case "c": {
          const x1 = cx + num(), y1 = cy + num(), x2 = cx + num(), y2 = cy + num();
          const x3 = cx + num(), y3 = cy + num();
          flattenCubic(cx, cy, x1, y1, x2, y2, x3, y3, flattenTolerance, current);
          prevCx2 = x2; prevCy2 = y2; cx = x3; cy = y3; break;
        }
        case "S": {
          const rx1 = 2 * cx - prevCx2, ry1 = 2 * cy - prevCy2;
          const x2 = num(), y2 = num(), x3 = num(), y3 = num();
          flattenCubic(cx, cy, rx1, ry1, x2, y2, x3, y3, flattenTolerance, current);
          prevCx2 = x2; prevCy2 = y2; cx = x3; cy = y3; break;
        }
        case "s": {
          const rx1 = 2 * cx - prevCx2, ry1 = 2 * cy - prevCy2;
          const x2 = cx + num(), y2 = cy + num(), x3 = cx + num(), y3 = cy + num();
          flattenCubic(cx, cy, rx1, ry1, x2, y2, x3, y3, flattenTolerance, current);
          prevCx2 = x2; prevCy2 = y2; cx = x3; cy = y3; break;
        }
        case "Q": {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num();
          flattenQuadratic(cx, cy, x1, y1, x2, y2, flattenTolerance, current);
          prevCx2 = x1; prevCy2 = y1; cx = x2; cy = y2; break;
        }
        case "q": {
          const x1 = cx + num(), y1 = cy + num(), x2 = cx + num(), y2 = cy + num();
          flattenQuadratic(cx, cy, x1, y1, x2, y2, flattenTolerance, current);
          prevCx2 = x1; prevCy2 = y1; cx = x2; cy = y2; break;
        }
        case "T": {
          const rx1 = 2 * cx - prevCx2, ry1 = 2 * cy - prevCy2;
          const x2 = num(), y2 = num();
          flattenQuadratic(cx, cy, rx1, ry1, x2, y2, flattenTolerance, current);
          prevCx2 = rx1; prevCy2 = ry1; cx = x2; cy = y2; break;
        }
        case "t": {
          const rx1 = 2 * cx - prevCx2, ry1 = 2 * cy - prevCy2;
          const x2 = cx + num(), y2 = cy + num();
          flattenQuadratic(cx, cy, rx1, ry1, x2, y2, flattenTolerance, current);
          prevCx2 = rx1; prevCy2 = ry1; cx = x2; cy = y2; break;
        }
        case "A": case "a": {
          const isRel = cmd === "a";
          let arx = Math.abs(num()), ary = Math.abs(num());
          const xRot = num(), lA = !!num(), sw = !!num();
          let ax = num(), ay = num();
          if (isRel) { ax += cx; ay += cy; }
          if (arx === 0 || ary === 0) { current.push(ax, ay); }
          else { arcToSegments(cx, cy, arx, ary, xRot, lA, sw, ax, ay, current); }
          cx = ax; cy = ay; break;
        }
        case "Z": case "z":
          cx = sx; cy = sy;
          if (current.length >= 4) subpaths.push(current);
          current = []; break;
        default: i++; break;
      }
    }
    if (current.length >= 4) subpaths.push(current);
    return subpaths;
  }

  function flattenSvgTransform(element) {
    let mat = [1, 0, 0, 1, 0, 0];

    function multiply(a, b) {
      return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5],
      ];
    }

    function parseTransformAttr(attr) {
      const transforms = [];
      const re = /(\w+)\s*\(([^)]*)\)/g;
      let m;
      while ((m = re.exec(attr)) !== null) {
        const type = m[1];
        const args = m[2].split(/[\s,]+/).map(Number);
        switch (type) {
          case "translate":
            transforms.push([1, 0, 0, 1, args[0] || 0, args[1] || 0]);
            break;
          case "scale": {
            const sx = args[0] || 1, sy = args.length > 1 ? args[1] : sx;
            transforms.push([sx, 0, 0, sy, 0, 0]);
            break;
          }
          case "rotate": {
            const a = (args[0] || 0) * Math.PI / 180;
            const cos = Math.cos(a), sin = Math.sin(a);
            const tx = args[1] || 0, ty = args[2] || 0;
            let r = [cos, sin, -sin, cos, 0, 0];
            if (tx || ty) {
              r = multiply([1, 0, 0, 1, tx, ty], multiply(r, [1, 0, 0, 1, -tx, -ty]));
            }
            transforms.push(r);
            break;
          }
          case "skewX": {
            const a = Math.tan((args[0] || 0) * Math.PI / 180);
            transforms.push([1, 0, a, 1, 0, 0]);
            break;
          }
          case "skewY": {
            const a = Math.tan((args[0] || 0) * Math.PI / 180);
            transforms.push([1, a, 0, 1, 0, 0]);
            break;
          }
          case "matrix":
            if (args.length >= 6) transforms.push(args.slice(0, 6));
            break;
        }
      }
      let combined = [1, 0, 0, 1, 0, 0];
      for (const t of transforms) combined = multiply(combined, t);
      return combined;
    }

    const chain = [];
    let el = element;
    while (el && el.nodeType === 1 && el.tagName !== "svg") {
      const attr = el.getAttribute("transform");
      if (attr) chain.push(parseTransformAttr(attr));
      el = el.parentElement;
    }
    for (let j = chain.length - 1; j >= 0; j--) {
      mat = multiply(mat, chain[j]);
    }
    return mat;
  }

  function applyMatrix2D(points, matrix) {
    const [a, b, c, d, e, f] = matrix;
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i], y = points[i + 1];
      points[i] = a * x + c * y + e;
      points[i + 1] = b * x + d * y + f;
    }
  }

  function getSvgCurveSettings(viewBox) {
    const minDim = Math.max(1, Math.min(Math.abs(viewBox.w) || 1, Math.abs(viewBox.h) || 1));
    return {
      flattenTolerance: Math.max(minDim / 8192, 0.001),
      arcMaxAngle: Math.PI / 32,
      roundedRectSteps: 24,
      ellipseSegments: 96,
    };
  }

  function parseSvgToContours(svgText) {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) throw new Error("No <svg> element found");

    let viewBox;
    const vbAttr = svgEl.getAttribute("viewBox");
    if (vbAttr) {
      const parts = vbAttr.split(/[\s,]+/).map(Number);
      if (parts.length === 4) viewBox = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
    if (!viewBox) {
      const w = parseFloat(svgEl.getAttribute("width")) || 300;
      const h = parseFloat(svgEl.getAttribute("height")) || 150;
      viewBox = { x: 0, y: 0, w, h };
    }
    const curveSettings = getSvgCurveSettings(viewBox);

    const contours = [];

    function addContourPoints(points, element) {
      if (points.length < 6) return;
      const mat = flattenSvgTransform(element);
      const isIdentity = mat[0] === 1 && mat[1] === 0 && mat[2] === 0 && mat[3] === 1 && mat[4] === 0 && mat[5] === 0;
      if (!isIdentity) applyMatrix2D(points, mat);

      const area = contourSignedArea(points);
      contours.push({
        points,
        windingSign: area >= 0 ? 1 : -1,
        useWindingRole: element.getAttribute("data-mdl-contour-rule") === "winding"
          || svgEl.getAttribute("data-mdl-contour-rule") === "winding",
      });
    }

    const shapes = svgEl.querySelectorAll("path, rect, circle, ellipse, polygon, polyline");
    for (const el of shapes) {
      const style = el.getAttribute("style") || "";
      const display = el.getAttribute("display") || "";
      if (display === "none" || /display\s*:\s*none/i.test(style)) continue;
      const fillStyle = /fill\s*:\s*([^;]+)/i.exec(style);
      const fillAttr = el.getAttribute("fill");
      const resolvedFill = fillStyle ? fillStyle[1].trim() : fillAttr;
      if (resolvedFill === "none") continue;

      const tag = el.tagName.toLowerCase();

      if (tag === "path") {
        const d = el.getAttribute("d");
        if (!d) continue;
        const subpaths = parseSvgPathData(d, curveSettings);
        for (const pts of subpaths) addContourPoints(pts, el);
      } else if (tag === "rect") {
        const x = parseFloat(el.getAttribute("x")) || 0;
        const y = parseFloat(el.getAttribute("y")) || 0;
        const w = parseFloat(el.getAttribute("width")) || 0;
        const h = parseFloat(el.getAttribute("height")) || 0;
        if (w > 0 && h > 0) {
          const rx = Math.min(parseFloat(el.getAttribute("rx")) || 0, w / 2);
          const ry = Math.min(parseFloat(el.getAttribute("ry")) || rx, h / 2);
          if (rx > 0 && ry > 0) {
            const pts = [];
            const steps = curveSettings.roundedRectSteps;
            function arcCorner(cx, cy, startAngle) {
              for (let j = 0; j <= steps; j++) {
                const a = startAngle + (Math.PI / 2) * j / steps;
                pts.push(cx + rx * Math.cos(a), cy + ry * Math.sin(a));
              }
            }
            arcCorner(x + w - rx, y + ry, -Math.PI / 2);
            arcCorner(x + w - rx, y + h - ry, 0);
            arcCorner(x + rx, y + h - ry, Math.PI / 2);
            arcCorner(x + rx, y + ry, Math.PI);
            addContourPoints(pts, el);
          } else {
            addContourPoints([x, y, x + w, y, x + w, y + h, x, y + h], el);
          }
        }
      } else if (tag === "circle") {
        const cx = parseFloat(el.getAttribute("cx")) || 0;
        const cy = parseFloat(el.getAttribute("cy")) || 0;
        const r = parseFloat(el.getAttribute("r")) || 0;
        if (r > 0) {
          const pts = [];
          const n = curveSettings.ellipseSegments;
          for (let j = 0; j < n; j++) {
            const a = (2 * Math.PI * j) / n;
            pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
          }
          addContourPoints(pts, el);
        }
      } else if (tag === "ellipse") {
        const cx = parseFloat(el.getAttribute("cx")) || 0;
        const cy = parseFloat(el.getAttribute("cy")) || 0;
        const erx = parseFloat(el.getAttribute("rx")) || 0;
        const ery = parseFloat(el.getAttribute("ry")) || 0;
        if (erx > 0 && ery > 0) {
          const pts = [];
          const n = curveSettings.ellipseSegments;
          for (let j = 0; j < n; j++) {
            const a = (2 * Math.PI * j) / n;
            pts.push(cx + erx * Math.cos(a), cy + ery * Math.sin(a));
          }
          addContourPoints(pts, el);
        }
      } else if (tag === "polygon" || tag === "polyline") {
        const raw = el.getAttribute("points");
        if (!raw) continue;
        const nums = raw.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g);
        if (nums && nums.length >= 4) {
          addContourPoints(nums.map(Number), el);
        }
      }
    }

    if (!contours.length) throw new Error("SVG contains no drawable shapes");
    return { contours, viewBox };
  }

  // ── Ear-clipping triangulation ──────────────────────────────────────────────

  function contourSignedArea(pts) {
    let area = 0;
    for (let i = 0, n = pts.length; i < n; i += 2) {
      const j = (i + 2) % n;
      area += pts[i] * pts[j + 1] - pts[j] * pts[i + 1];
    }
    return area * 0.5;
  }

  function pointInContour(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  const SVG_CONTOUR_EPSILON = 0.001;

  function deduplicateContour(pts, epsilon) {
    if (pts.length < 6) return pts;
    const out = [pts[0], pts[1]];
    for (let i = 2; i < pts.length; i += 2) {
      const px = out[out.length - 2], py = out[out.length - 1];
      if (Math.abs(pts[i] - px) > epsilon || Math.abs(pts[i + 1] - py) > epsilon) {
        out.push(pts[i], pts[i + 1]);
      }
    }
    // Remove last point if it duplicates the first
    if (out.length >= 4) {
      const lx = out[out.length - 2], ly = out[out.length - 1];
      if (Math.abs(lx - out[0]) <= epsilon && Math.abs(ly - out[1]) <= epsilon) {
        out.length -= 2;
      }
    }
    return out;
  }

  function pointToSegmentDistanceSquared(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-20) {
      const ex = px - ax, ey = py - ay;
      return ex * ex + ey * ey;
    }
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const ex = px - cx, ey = py - cy;
    return ex * ex + ey * ey;
  }

  // Ramer-Douglas-Peucker simplification for a closed contour [x0,y0,x1,y1,...].
  // The flattener emits curve detail finer than the MDL byte-quantized output can
  // represent; removing vertices within `tolerance` of their chord drops that
  // redundant detail, which avoids degenerate sliver triangles after packing and
  // keeps triangulation robust within the exported model's packed resolution.
  function simplifyClosedContour(points, tolerance, forcedKeepIndices = null) {
    const n = points.length / 2;
    if (n < 5 || !(tolerance > 0)) {
      return points.slice();
    }
    const tolSq = tolerance * tolerance;

    // Anchor on vertex 0 and the vertex farthest from it so the closed loop is
    // split into two open chains that RDP can simplify without collapsing.
    let far = 0;
    let farDist = -1;
    for (let i = 1; i < n; i++) {
      const dx = points[i * 2] - points[0];
      const dy = points[i * 2 + 1] - points[1];
      const d = dx * dx + dy * dy;
      if (d > farDist) {
        farDist = d;
        far = i;
      }
    }
    if (far === 0) {
      return points.slice();
    }

    const keep = new Array(n).fill(false);
    const anchors = new Set([0, far]);
    if (forcedKeepIndices) {
      for (const index of forcedKeepIndices) {
        if (index >= 0 && index < n) anchors.add(index);
      }
    }
    const sortedAnchors = Array.from(anchors).sort((a, b) => a - b);
    if (sortedAnchors.length < 2) {
      return points.slice();
    }
    for (const index of sortedAnchors) {
      keep[index] = true;
    }

    // Iterative RDP over virtual index ranges; vertex(i) = points[(i % n)].
    const stack = [];
    for (let i = 0; i < sortedAnchors.length; i++) {
      const lo = sortedAnchors[i];
      let hi = sortedAnchors[(i + 1) % sortedAnchors.length];
      if (hi <= lo) hi += n;
      stack.push([lo, hi]);
    }
    while (stack.length) {
      const [lo, hi] = stack.pop();
      if (hi <= lo + 1) continue;
      const a = lo % n;
      const b = hi % n;
      const ax = points[a * 2], ay = points[a * 2 + 1];
      const bx = points[b * 2], by = points[b * 2 + 1];
      let maxDist = -1;
      let idx = -1;
      for (let i = lo + 1; i < hi; i++) {
        const v = i % n;
        const d = pointToSegmentDistanceSquared(points[v * 2], points[v * 2 + 1], ax, ay, bx, by);
        if (d > maxDist) {
          maxDist = d;
          idx = i;
        }
      }
      if (maxDist > tolSq && idx >= 0) {
        keep[idx % n] = true;
        stack.push([lo, idx], [idx, hi]);
      }
    }

    const out = [];
    for (let i = 0; i < n; i++) {
      if (keep[i]) out.push(points[i * 2], points[i * 2 + 1]);
    }
    return out.length >= 6 ? out : points.slice();
  }

  function getContourExtremeIndices(points) {
    const count = points.length / 2;
    const indices = new Set();
    if (count < 1) return indices;

    let minXIndex = 0, maxXIndex = 0, minYIndex = 0, maxYIndex = 0;
    let minX = points[0], maxX = points[0], minY = points[1], maxY = points[1];
    for (let i = 1; i < count; i++) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      if (x < minX) { minX = x; minXIndex = i; }
      if (x > maxX) { maxX = x; maxXIndex = i; }
      if (y < minY) { minY = y; minYIndex = i; }
      if (y > maxY) { maxY = y; maxYIndex = i; }
    }

    indices.add(minXIndex);
    indices.add(maxXIndex);
    indices.add(minYIndex);
    indices.add(maxYIndex);
    return indices;
  }

  function getContourFeatureIndices(points) {
    const count = points.length / 2;
    const indices = getContourExtremeIndices(points);
    if (count < 3) {
      return indices;
    }

    const cornerCosThreshold = Math.cos(Math.PI / 7.2); // Preserve turns of 25 degrees or sharper.
    for (let i = 0; i < count; i++) {
      const prev = (i - 1 + count) % count;
      const next = (i + 1) % count;
      const ax = points[i * 2] - points[prev * 2];
      const ay = points[i * 2 + 1] - points[prev * 2 + 1];
      const bx = points[next * 2] - points[i * 2];
      const by = points[next * 2 + 1] - points[i * 2 + 1];
      const lenA = Math.hypot(ax, ay);
      const lenB = Math.hypot(bx, by);
      if (lenA <= SVG_CONTOUR_EPSILON || lenB <= SVG_CONTOUR_EPSILON) {
        continue;
      }

      const cos = (ax * bx + ay * by) / (lenA * lenB);
      if (cos < cornerCosThreshold) {
        indices.add(i);
      }
    }
    return indices;
  }

  function isSafeSimplifiedContour(originalPoints, simplifiedPoints) {
    if (simplifiedPoints.length < 6) {
      return false;
    }

    const originalArea = contourSignedArea(originalPoints);
    const simplifiedArea = contourSignedArea(simplifiedPoints);
    const originalSign = Math.sign(originalArea);
    const simplifiedSign = Math.sign(simplifiedArea);
    if (originalSign && simplifiedSign && originalSign !== simplifiedSign) {
      return false;
    }
    const interior = getContourInteriorPoint(originalPoints);
    if (!pointInContour(interior[0], interior[1], simplifiedPoints)) {
      return false;
    }
    return Math.abs(simplifiedArea) > SVG_CONTOUR_EPSILON;
  }

  function getContourCentroid(points) {
    let cx = 0;
    let cy = 0;
    const count = points.length / 2;
    for (let i = 0; i < points.length; i += 2) {
      cx += points[i];
      cy += points[i + 1];
    }
    return [cx / Math.max(count, 1), cy / Math.max(count, 1)];
  }

  function getContourInteriorPoint(points) {
    if (!points || points.length < 6) {
      return getContourCentroid(points || []);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < points.length; i += 2) {
      minX = Math.min(minX, points[i]);
      minY = Math.min(minY, points[i + 1]);
      maxX = Math.max(maxX, points[i]);
      maxY = Math.max(maxY, points[i + 1]);
    }

    const bboxSize = Math.max(maxX - minX, maxY - minY, 1);
    const inset = Math.max(SVG_CONTOUR_EPSILON * 8, bboxSize * 1e-4);
    for (let i = 0, n = points.length; i < n; i += 2) {
      const j = (i + 2) % n;
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[j];
      const y2 = points[j + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      if (length <= SVG_CONTOUR_EPSILON) {
        continue;
      }

      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;
      const nx = -dy / length;
      const ny = dx / length;
      const candidateA = [midX + nx * inset, midY + ny * inset];
      if (pointInContour(candidateA[0], candidateA[1], points)) {
        return candidateA;
      }

      const candidateB = [midX - nx * inset, midY - ny * inset];
      if (pointInContour(candidateB[0], candidateB[1], points)) {
        return candidateB;
      }
    }

    const yValues = [];
    for (let i = 0; i < points.length; i += 2) {
      yValues.push(points[i + 1]);
    }
    yValues.sort((a, b) => a - b);

    for (let i = 0; i < yValues.length - 1; i++) {
      const y0 = yValues[i];
      const y1 = yValues[i + 1];
      if (!Number.isFinite(y0) || !Number.isFinite(y1) || Math.abs(y1 - y0) <= SVG_CONTOUR_EPSILON) {
        continue;
      }

      const scanY = (y0 + y1) * 0.5;
      const hits = [];
      for (let j = 0, n = points.length; j < n; j += 2) {
        const k = (j + 2) % n;
        const x1 = points[j];
        const y1Edge = points[j + 1];
        const x2 = points[k];
        const y2Edge = points[k + 1];

        if (Math.abs(y2Edge - y1Edge) <= SVG_CONTOUR_EPSILON) {
          continue;
        }

        const minY = Math.min(y1Edge, y2Edge);
        const maxY = Math.max(y1Edge, y2Edge);
        if (scanY < minY || scanY >= maxY) {
          continue;
        }

        const t = (scanY - y1Edge) / (y2Edge - y1Edge);
        hits.push(x1 + (x2 - x1) * t);
      }

      if (hits.length < 2) {
        continue;
      }

      hits.sort((a, b) => a - b);
      let bestSegment = null;
      for (let j = 0; j < hits.length - 1; j += 2) {
        const left = hits[j];
        const right = hits[j + 1];
        const width = right - left;
        if (width <= SVG_CONTOUR_EPSILON) {
          continue;
        }
        if (!bestSegment || width > bestSegment.width) {
          bestSegment = { left, right, width };
        }
      }

      if (bestSegment) {
        return [(bestSegment.left + bestSegment.right) * 0.5, scanY];
      }
    }

    return getContourCentroid(points);
  }

  function classifyContoursByNesting(contours) {
    const nestingLevel = contours.map(() => 0);
    for (let i = 0; i < contours.length; i++) {
      const [cx, cy] = getContourInteriorPoint(contours[i].points);
      for (let j = 0; j < contours.length; j++) {
        if (i === j) {
          continue;
        }
        if (pointInContour(cx, cy, contours[j].points)) {
          nestingLevel[i] += 1;
        }
      }
    }

    const windingContours = contours
      .map((contour, index) => ({ contour, index }))
      .filter(({ contour }) => contour.useWindingRole && contour.points.length >= 6);
    let outerWindingSign = 1;
    if (windingContours.length) {
      const minNestingLevel = windingContours.reduce(
        (best, entry) => Math.min(best, nestingLevel[entry.index]),
        Infinity,
      );
      let signBalance = 0;
      for (const entry of windingContours) {
        if (nestingLevel[entry.index] === minNestingLevel) {
          signBalance += entry.contour.windingSign || 1;
        }
      }
      if (signBalance !== 0) {
        outerWindingSign = signBalance > 0 ? 1 : -1;
      } else {
        outerWindingSign = windingContours[0].contour.windingSign || 1;
      }
    }

    return contours.map((contour, index) => ({
      ...contour,
      nestingLevel: nestingLevel[index],
      role: contour.useWindingRole
        ? ((contour.windingSign || 1) === outerWindingSign ? "outer" : "hole")
        : (nestingLevel[index] % 2 === 0 ? "outer" : "hole"),
    }));
  }

  function orientContourPoints(points, role) {
    let oriented = deduplicateContour(points.slice(), SVG_CONTOUR_EPSILON);
    if (oriented.length < 6) {
      return oriented;
    }

    const area = contourSignedArea(oriented);
    if (role === "hole") {
      if (area > 0) {
        oriented = reverseContour(oriented);
      }
    } else if (area < 0) {
      oriented = reverseContour(oriented);
    }

    return oriented;
  }

  function orientContourPointsForTriangulation(points, role) {
    let oriented = deduplicateContour(points.slice(), SVG_CONTOUR_EPSILON);
    if (oriented.length < 6) {
      return oriented;
    }

    const area = contourSignedArea(oriented);
    // The hole-bridge routine adapted from old three.js expects outer contours
    // to be clockwise and holes counter-clockwise before it merges them.
    if (role === "hole") {
      if (area < 0) {
        oriented = reverseContour(oriented);
      }
    } else if (area > 0) {
      oriented = reverseContour(oriented);
    }

    return oriented;
  }

  function contourPointsToVec2List(points) {
    const out = [];
    for (let i = 0; i < points.length; i += 2) {
      out.push({ x: points[i], y: points[i + 1] });
    }
    return out;
  }

  function triangulateSimplePolygon(points) {
    const contour = points.slice();
    const vertexCount = contour.length;
    if (vertexCount < 3) {
      return [];
    }

    function signedArea(polygon) {
      let area = 0;
      for (let p = polygon.length - 1, q = 0; q < polygon.length; p = q++) {
        area += polygon[p].x * polygon[q].y - polygon[q].x * polygon[p].y;
      }
      return area * 0.5;
    }

    // Compute a scale-relative epsilon for the cross-product test.
    // Using an absolute epsilon fails for large-coordinate font outlines.
    let maxExtent = 0;
    for (const pt of contour) {
      maxExtent = Math.max(maxExtent, Math.abs(pt.x), Math.abs(pt.y));
    }
    const EPSILON = Math.max(1e-10, maxExtent * maxExtent * 1e-12);

    function snip(u, v, w, n, verts) {
      const ax = contour[verts[u]].x;
      const ay = contour[verts[u]].y;
      const bx = contour[verts[v]].x;
      const by = contour[verts[v]].y;
      const cx = contour[verts[w]].x;
      const cy = contour[verts[w]].y;

      const cross = ((bx - ax) * (cy - ay)) - ((by - ay) * (cx - ax));
      if (cross < EPSILON) {
        return false;
      }

      const aX = cx - bx;
      const aY = cy - by;
      const bX = ax - cx;
      const bY = ay - cy;
      const cX = bx - ax;
      const cY = by - ay;

      for (let p = 0; p < n; p++) {
        if (p === u || p === v || p === w) continue;
        const px = contour[verts[p]].x;
        const py = contour[verts[p]].y;

        // Skip vertices that coincide with any triangle vertex — bridge edges
        // in removeHoles create duplicate points at different indices that
        // would otherwise falsely block ear detection.
        if ((px === ax && py === ay) || (px === bx && py === by) || (px === cx && py === cy)) continue;

        const apx = px - ax;
        const apy = py - ay;
        const bpx = px - bx;
        const bpy = py - by;
        const cpx = px - cx;
        const cpy = py - cy;

        const aCrossBp = aX * bpy - aY * bpx;
        const cCrossAp = cX * apy - cY * apx;
        const bCrossCp = bX * cpy - bY * cpx;

        if (aCrossBp >= -EPSILON && bCrossCp >= -EPSILON && cCrossAp >= -EPSILON) {
          return false;
        }
      }

      return true;
    }

    const verts = new Array(vertexCount);
    if (signedArea(contour) > 0) {
      for (let i = 0; i < vertexCount; i++) {
        verts[i] = i;
      }
    } else {
      for (let i = 0; i < vertexCount; i++) {
        verts[i] = (vertexCount - 1) - i;
      }
    }

    const triangles = [];
    let nv = vertexCount;
    let count = nv * 3;

    for (let v = nv - 1; nv > 2;) {
      if ((count--) <= 0) {
        // Desperate pass: try to snip any ear, including degenerate ones
        let rescued = false;
        for (let attempt = 0; attempt < nv && nv > 2; attempt++) {
          let du = (v + attempt) % nv;
          let dv = (du + 1) % nv;
          let dw = (dv + 1) % nv;
          // Accept any non-zero-area triangle
          const ax = contour[verts[du]].x, ay = contour[verts[du]].y;
          const bx = contour[verts[dv]].x, by = contour[verts[dv]].y;
          const cx = contour[verts[dw]].x, cy = contour[verts[dw]].y;
          const cross = ((bx - ax) * (cy - ay)) - ((by - ay) * (cx - ax));
          if (Math.abs(cross) > EPSILON * 0.001) {
            triangles.push([verts[du], verts[dv], verts[dw]]);
            for (let s = dv, t = dv + 1; t < nv; s++, t++) verts[s] = verts[t];
            nv--;
            count = nv * 3;
            v = du >= nv ? 0 : du;
            rescued = true;
            break;
          }
          // Degenerate edge — just remove the middle vertex
          if (Math.abs(cross) <= EPSILON * 0.001) {
            for (let s = dv, t = dv + 1; t < nv; s++, t++) verts[s] = verts[t];
            nv--;
            count = nv * 3;
            v = du >= nv ? 0 : du;
            rescued = true;
            break;
          }
        }
        if (!rescued) {
          throw new Error("Triangulation failed for a contour. The SVG may be self-intersecting or too complex to triangulate safely.");
        }
        continue;
      }

      let u = v;
      if (nv <= u) {
        u = 0;
      }
      v = u + 1;
      if (nv <= v) {
        v = 0;
      }
      let w = v + 1;
      if (nv <= w) {
        w = 0;
      }

      if (!snip(u, v, w, nv, verts)) {
        continue;
      }

      triangles.push([verts[u], verts[v], verts[w]]);
      for (let s = v, t = v + 1; t < nv; s++, t++) {
        verts[s] = verts[t];
      }
      nv--;
      count = nv * 3;
    }

    return triangles;
  }

  function triangulateShapeWithHoles(contour, holes) {
    function pointInSegmentColinear(segPt1, segPt2, otherPt) {
      if (segPt1.x !== segPt2.x) {
        if (segPt1.x < segPt2.x) {
          return segPt1.x <= otherPt.x && otherPt.x <= segPt2.x;
        }
        return segPt2.x <= otherPt.x && otherPt.x <= segPt1.x;
      }
      if (segPt1.y < segPt2.y) {
        return segPt1.y <= otherPt.y && otherPt.y <= segPt2.y;
      }
      return segPt2.y <= otherPt.y && otherPt.y <= segPt1.y;
    }

    function intersectSegments2D(seg1Pt1, seg1Pt2, seg2Pt1, seg2Pt2, excludeAdjacentSegs) {
      const EPSILON = 1e-10;
      const seg1dx = seg1Pt2.x - seg1Pt1.x;
      const seg1dy = seg1Pt2.y - seg1Pt1.y;
      const seg2dx = seg2Pt2.x - seg2Pt1.x;
      const seg2dy = seg2Pt2.y - seg2Pt1.y;

      const seg1seg2dx = seg1Pt1.x - seg2Pt1.x;
      const seg1seg2dy = seg1Pt1.y - seg2Pt1.y;

      const limit = seg1dy * seg2dx - seg1dx * seg2dy;
      const perpSeg1 = seg1dy * seg1seg2dx - seg1dx * seg1seg2dy;

      if (Math.abs(limit) > EPSILON) {
        let perpSeg2;
        if (limit > 0) {
          if (perpSeg1 < 0 || perpSeg1 > limit) {
            return [];
          }
          perpSeg2 = seg2dy * seg1seg2dx - seg2dx * seg1seg2dy;
          if (perpSeg2 < 0 || perpSeg2 > limit) {
            return [];
          }
        } else {
          if (perpSeg1 > 0 || perpSeg1 < limit) {
            return [];
          }
          perpSeg2 = seg2dy * seg1seg2dx - seg2dx * seg1seg2dy;
          if (perpSeg2 > 0 || perpSeg2 < limit) {
            return [];
          }
        }

        if (perpSeg2 === 0) {
          if (excludeAdjacentSegs && (perpSeg1 === 0 || perpSeg1 === limit)) {
            return [];
          }
          return [seg1Pt1];
        }
        if (perpSeg2 === limit) {
          if (excludeAdjacentSegs && (perpSeg1 === 0 || perpSeg1 === limit)) {
            return [];
          }
          return [seg1Pt2];
        }
        if (perpSeg1 === 0) {
          return [seg2Pt1];
        }
        if (perpSeg1 === limit) {
          return [seg2Pt2];
        }

        const factorSeg1 = perpSeg2 / limit;
        return [{
          x: seg1Pt1.x + factorSeg1 * seg1dx,
          y: seg1Pt1.y + factorSeg1 * seg1dy,
        }];
      }

      if (perpSeg1 !== 0 || seg2dy * seg1seg2dx !== seg2dx * seg1seg2dy) {
        return [];
      }

      const seg1Pt = seg1dx === 0 && seg1dy === 0;
      const seg2Pt = seg2dx === 0 && seg2dy === 0;
      if (seg1Pt && seg2Pt) {
        if (seg1Pt1.x !== seg2Pt1.x || seg1Pt1.y !== seg2Pt1.y) {
          return [];
        }
        return [seg1Pt1];
      }
      if (seg1Pt) {
        return pointInSegmentColinear(seg2Pt1, seg2Pt2, seg1Pt1) ? [seg1Pt1] : [];
      }
      if (seg2Pt) {
        return pointInSegmentColinear(seg1Pt1, seg1Pt2, seg2Pt1) ? [seg2Pt1] : [];
      }

      let seg1min;
      let seg1max;
      let seg1minVal;
      let seg1maxVal;
      let seg2min;
      let seg2max;
      let seg2minVal;
      let seg2maxVal;
      if (seg1dx !== 0) {
        if (seg1Pt1.x < seg1Pt2.x) {
          seg1min = seg1Pt1; seg1minVal = seg1Pt1.x;
          seg1max = seg1Pt2; seg1maxVal = seg1Pt2.x;
        } else {
          seg1min = seg1Pt2; seg1minVal = seg1Pt2.x;
          seg1max = seg1Pt1; seg1maxVal = seg1Pt1.x;
        }
        if (seg2Pt1.x < seg2Pt2.x) {
          seg2min = seg2Pt1; seg2minVal = seg2Pt1.x;
          seg2max = seg2Pt2; seg2maxVal = seg2Pt2.x;
        } else {
          seg2min = seg2Pt2; seg2minVal = seg2Pt2.x;
          seg2max = seg2Pt1; seg2maxVal = seg2Pt1.x;
        }
      } else {
        if (seg1Pt1.y < seg1Pt2.y) {
          seg1min = seg1Pt1; seg1minVal = seg1Pt1.y;
          seg1max = seg1Pt2; seg1maxVal = seg1Pt2.y;
        } else {
          seg1min = seg1Pt2; seg1minVal = seg1Pt2.y;
          seg1max = seg1Pt1; seg1maxVal = seg1Pt1.y;
        }
        if (seg2Pt1.y < seg2Pt2.y) {
          seg2min = seg2Pt1; seg2minVal = seg2Pt1.y;
          seg2max = seg2Pt2; seg2maxVal = seg2Pt2.y;
        } else {
          seg2min = seg2Pt2; seg2minVal = seg2Pt2.y;
          seg2max = seg2Pt1; seg2maxVal = seg2Pt1.y;
        }
      }

      if (seg1minVal <= seg2minVal) {
        if (seg1maxVal < seg2minVal) {
          return [];
        }
        if (seg1maxVal === seg2minVal) {
          return excludeAdjacentSegs ? [] : [seg2min];
        }
        if (seg1maxVal <= seg2maxVal) {
          return [seg2min, seg1max];
        }
        return [seg2min, seg2max];
      }

      if (seg1minVal > seg2maxVal) {
        return [];
      }
      if (seg1minVal === seg2maxVal) {
        return excludeAdjacentSegs ? [] : [seg1min];
      }
      if (seg1maxVal <= seg2maxVal) {
        return [seg1min, seg1max];
      }
      return [seg1min, seg2max];
    }

    function isPointInsideAngle(vertex, legFromPt, legToPt, otherPt) {
      const EPSILON = 1e-10;
      const legFromPtX = legFromPt.x - vertex.x;
      const legFromPtY = legFromPt.y - vertex.y;
      const legToPtX = legToPt.x - vertex.x;
      const legToPtY = legToPt.y - vertex.y;
      const otherPtX = otherPt.x - vertex.x;
      const otherPtY = otherPt.y - vertex.y;

      const fromToAngle = legFromPtX * legToPtY - legFromPtY * legToPtX;
      const fromOtherAngle = legFromPtX * otherPtY - legFromPtY * otherPtX;

      if (Math.abs(fromToAngle) <= EPSILON) {
        return fromOtherAngle > 0;
      }

      const otherToAngle = otherPtX * legToPtY - otherPtY * legToPtX;
      if (fromToAngle > 0) {
        return fromOtherAngle >= 0 && otherToAngle >= 0;
      }
      return fromOtherAngle >= 0 || otherToAngle >= 0;
    }

    function removeHoles(shapeContour, holesList) {
      let shape = shapeContour.concat();
      let activeHole = null;
      const independentHoles = holesList.map((_, index) => index);

      function isCutLineInsideAngles(shapeIndex, holeIndex) {
        const lastShapeIdx = shape.length - 1;
        let prevShapeIdx = shapeIndex - 1;
        if (prevShapeIdx < 0) {
          prevShapeIdx = lastShapeIdx;
        }
        let nextShapeIdx = shapeIndex + 1;
        if (nextShapeIdx > lastShapeIdx) {
          nextShapeIdx = 0;
        }

        if (!isPointInsideAngle(shape[shapeIndex], shape[prevShapeIdx], shape[nextShapeIdx], activeHole[holeIndex])) {
          return false;
        }

        const lastHoleIdx = activeHole.length - 1;
        let prevHoleIdx = holeIndex - 1;
        if (prevHoleIdx < 0) {
          prevHoleIdx = lastHoleIdx;
        }
        let nextHoleIdx = holeIndex + 1;
        if (nextHoleIdx > lastHoleIdx) {
          nextHoleIdx = 0;
        }

        return isPointInsideAngle(activeHole[holeIndex], activeHole[prevHoleIdx], activeHole[nextHoleIdx], shape[shapeIndex]);
      }

      function intersectsShapeEdge(shapePt, holePt) {
        for (let sIdx = 0; sIdx < shape.length; sIdx++) {
          const nextIdx = (sIdx + 1) % shape.length;
          if (intersectSegments2D(shapePt, holePt, shape[sIdx], shape[nextIdx], true).length > 0) {
            return true;
          }
        }
        return false;
      }

      function intersectsHoleEdge(shapePt, holePt) {
        for (let i = 0; i < independentHoles.length; i++) {
          const holeContour = holesList[independentHoles[i]];
          for (let hIdx = 0; hIdx < holeContour.length; hIdx++) {
            const nextIdx = (hIdx + 1) % holeContour.length;
            if (intersectSegments2D(shapePt, holePt, holeContour[hIdx], holeContour[nextIdx], true).length > 0) {
              return true;
            }
          }
        }
        return false;
      }

      const failedCuts = new Set();
      let minShapeIndex = 0;
      let counter = independentHoles.length * 4 + 2;

      while (independentHoles.length > 0) {
        counter--;
        if (counter < 0) {
          throw new Error("Triangulation failed while connecting holes to the outer contour.");
        }

        let connected = false;
        for (let shapeIndex = minShapeIndex; shapeIndex < shape.length; shapeIndex++) {
          const shapePt = shape[shapeIndex];

          for (let holeListIndex = 0; holeListIndex < independentHoles.length; holeListIndex++) {
            const holeIdx = independentHoles[holeListIndex];
            const cutKey = `${shapePt.x}:${shapePt.y}:${holeIdx}`;
            if (failedCuts.has(cutKey)) {
              continue;
            }

            activeHole = holesList[holeIdx];
            let connectedHoleIndex = -1;
            for (let holeIndex = 0; holeIndex < activeHole.length; holeIndex++) {
              const holePt = activeHole[holeIndex];
              if (!isCutLineInsideAngles(shapeIndex, holeIndex)) {
                continue;
              }
              if (intersectsShapeEdge(shapePt, holePt)) {
                continue;
              }
              if (intersectsHoleEdge(shapePt, holePt)) {
                continue;
              }

              connectedHoleIndex = holeIndex;
              independentHoles.splice(holeListIndex, 1);

              const tmpShape1 = shape.slice(0, shapeIndex + 1);
              const tmpShape2 = shape.slice(shapeIndex);
              const tmpHole1 = activeHole.slice(connectedHoleIndex);
              const tmpHole2 = activeHole.slice(0, connectedHoleIndex + 1);
              shape = tmpShape1.concat(tmpHole1, tmpHole2, tmpShape2);
              minShapeIndex = shapeIndex;
              connected = true;
              break;
            }

            if (connected) {
              break;
            }
            failedCuts.add(cutKey);
          }

          if (connected) {
            break;
          }
        }

        if (!connected) {
          // Retry from the beginning of the shape
          if (minShapeIndex > 0) {
            minShapeIndex = 0;
            failedCuts.clear();
          } else {
            throw new Error("Triangulation failed while connecting holes to the outer contour.");
          }
        }
      }

      return shape;
    }

    const allPoints = contour.concat(...holes);
    const allPointsMap = new Map();
    allPoints.forEach((point, index) => {
      allPointsMap.set(`${point.x}:${point.y}`, index);
    });

    const mergedShape = holes.length ? removeHoles(contour, holes) : contour.slice();
    const triangles = triangulateSimplePolygon(mergedShape);

    return triangles.map((triangle) => triangle.map((mergedIndex) => {
      const point = mergedShape[mergedIndex];
      const originalIndex = allPointsMap.get(`${point.x}:${point.y}`);
      if (originalIndex === undefined) {
        throw new Error("Triangulation produced a point not present in the source contours.");
      }
      return originalIndex;
    }));
  }

  function triangulatePlanarContours(contours, earcutFn = null) {
    const classifiedContours = contours.length && contours[0]?.role
      ? contours
      : classifyContoursByNesting(contours);

    const outers = classifiedContours.filter((contour) => contour.role === "outer");
    const holes = classifiedContours.filter((contour) => contour.role === "hole");

    if (!outers.length) {
      throw new Error("No outer contours found for triangulation");
    }

    const allVertices = [];
    const allIndices = [];

    for (const outer of outers) {
      const outerPoints = orientContourPointsForTriangulation(outer.points, "outer");
      if (outerPoints.length < 6) continue;

      const myHoles = [];
      for (const hole of holes) {
        const [hcx, hcy] = getContourInteriorPoint(hole.points);
        if (pointInContour(hcx, hcy, outerPoints)) {
          const holePoints = orientContourPointsForTriangulation(hole.points, "hole");
          if (holePoints.length < 6) continue;
          myHoles.push(holePoints);
        }
      }

      const baseIndex = allVertices.length / 2;
      for (let i = 0; i < outerPoints.length; i += 2) {
        allVertices.push(outerPoints[i], outerPoints[i + 1]);
      }
      myHoles.forEach((holePoints) => {
        for (let i = 0; i < holePoints.length; i += 2) {
          allVertices.push(holePoints[i], holePoints[i + 1]);
        }
      });

      if (typeof earcutFn === "function") {
        const holeIndices = [];
        let vertexCursor = outerPoints.length / 2;
        for (const holePoints of myHoles) {
          holeIndices.push(vertexCursor);
          vertexCursor += holePoints.length / 2;
        }
        const triangleIndices = earcutFn(allVertices.slice(baseIndex * 2), holeIndices, 2);
        if (!triangleIndices.length || triangleIndices.length % 3 !== 0) {
          throw new Error("Triangulation failed for a contour. The SVG may be self-intersecting or too complex to triangulate safely.");
        }
        for (let i = 0; i < triangleIndices.length; i += 3) {
          allIndices.push(
            baseIndex + triangleIndices[i],
            baseIndex + triangleIndices[i + 1],
            baseIndex + triangleIndices[i + 2],
          );
        }
      } else {
        const triangleIndices = triangulateShapeWithHoles(
          contourPointsToVec2List(outerPoints),
          myHoles.map((holePoints) => contourPointsToVec2List(holePoints))
        );
        for (const triangle of triangleIndices) {
          allIndices.push(baseIndex + triangle[0], baseIndex + triangle[1], baseIndex + triangle[2]);
        }
      }
    }

    return { vertices: allVertices, indices: allIndices };
  }

  function reverseContour(pts) {
    const result = new Array(pts.length);
    const n = pts.length / 2;
    for (let i = 0; i < n; i++) {
      result[i * 2] = pts[(n - 1 - i) * 2];
      result[i * 2 + 1] = pts[(n - 1 - i) * 2 + 1];
    }
    return result;
  }

  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  // ── Extrusion and bevel ─────────────────────────────────────────────────────

  function computeContourNormals2D(pts) {
    const n = pts.length / 2;
    const normals = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const k = (i - 1 + n) % n;
      const ex1 = pts[j * 2] - pts[i * 2], ey1 = pts[j * 2 + 1] - pts[i * 2 + 1];
      const ex2 = pts[i * 2] - pts[k * 2], ey2 = pts[i * 2 + 1] - pts[k * 2 + 1];
      let nx = ey1 + ey2, ny = -(ex1 + ex2);
      const len = Math.hypot(nx, ny);
      if (len > 1e-12) { nx /= len; ny /= len; }
      normals[i * 2] = nx;
      normals[i * 2 + 1] = ny;
    }
    return normals;
  }

  function offsetContour2D(pts, normals, distance) {
    const n = pts.length / 2;
    const out = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      out[i * 2] = pts[i * 2] + normals[i * 2] * distance;
      out[i * 2 + 1] = pts[i * 2 + 1] + normals[i * 2 + 1] * distance;
    }
    return out;
  }

  function buildInsetContours(classifiedContours, insetAmount) {
    return classifiedContours.map((contour) => {
      const pts = orientContourPoints(contour.points, contour.role);
      if (pts.length < 6) {
        throw new Error(`Bevel width collapses a ${contour.role} contour.`);
      }

      const normals = computeContourNormals2D(pts);
      const insetPoints = deduplicateContour(offsetContour2D(pts, normals, -insetAmount), SVG_CONTOUR_EPSILON);
      if (insetPoints.length !== pts.length || insetPoints.length < 6 || Math.abs(contourSignedArea(insetPoints)) <= 1e-3) {
        throw new Error(`Bevel width collapses a ${contour.role} contour.`);
      }

      return {
        ...contour,
        points: insetPoints,
      };
    });
  }

  function extrudeContours(contours, triangulation, options) {
    const { thickness, bevelWidth, bevelSegments } = options;
    const halfThick = thickness / 2;
    const bevelActual = (bevelSegments > 0 && bevelWidth > 0) ? bevelWidth : 0;
    if (bevelActual * 2 >= thickness) {
      throw new Error("Bevel width must be less than half the model thickness.");
    }

    const positions = [];
    const uvs = [];
    const indices = [];
    const surfaceKinds = [];

    const triVerts = triangulation.vertices;
    const triIndices = triangulation.indices;
    const numCapVerts = triVerts.length / 2;
    const classifiedContours = contours.length && contours[0]?.role
      ? contours
      : classifyContoursByNesting(contours);

    function addVertex(x, y, z, u, v, surfaceKind) {
      const idx = positions.length / 3;
      positions.push(x, y, z);
      uvs.push(u, v);
      surfaceKinds.push(surfaceKind || "cap");
      return idx;
    }

    const bevelSteps = bevelActual > 0 ? bevelSegments : 0;

    const frontCapZ = halfThick;
    const backCapZ = -halfThick;
    const sideTopZ = halfThick - bevelActual;
    const sideBotZ = -halfThick + bevelActual;

    // Cap triangulation is already built from the inset silhouette when beveling
    // is enabled, so front/back faces stay on the true outer planes.
    const frontCapBase = positions.length / 3;
    for (let i = 0; i < numCapVerts; i++) {
      addVertex(triVerts[i * 2], triVerts[i * 2 + 1], frontCapZ, 0, 0, "cap");
    }
    for (let i = 0; i < triIndices.length; i += 3) {
      indices.push(frontCapBase + triIndices[i + 2], frontCapBase + triIndices[i + 1], frontCapBase + triIndices[i]);
    }

    const backCapBase = positions.length / 3;
    for (let i = 0; i < numCapVerts; i++) {
      addVertex(triVerts[i * 2], triVerts[i * 2 + 1], backCapZ, 0, 0, "cap");
    }
    for (let i = 0; i < triIndices.length; i += 3) {
      indices.push(backCapBase + triIndices[i], backCapBase + triIndices[i + 1], backCapBase + triIndices[i + 2]);
    }

    for (const contour of classifiedContours.filter((entry) => entry.points.length >= 6)) {
      const pts = orientContourPoints(contour.points, contour.role);
      const n = pts.length / 2;
      if (n < 3) continue;

      const normals = computeContourNormals2D(pts);
      const baseReverseWind = contour.role === "hole";

      if (bevelSteps > 0 && bevelActual > 0) {
        const rings = [];
        rings.push({ pts, z: sideTopZ });

        for (let step = 1; step <= bevelSteps; step++) {
          const t = step / bevelSteps;
          const angle = (Math.PI / 2) * t;
          const insetDist = bevelActual * Math.sin(angle);
          const zOff = bevelActual * (1 - Math.cos(angle));
          const ringPts = deduplicateContour(offsetContour2D(pts, normals, -insetDist), SVG_CONTOUR_EPSILON);
          if (ringPts.length !== pts.length || Math.abs(contourSignedArea(ringPts)) <= 1e-3) {
            throw new Error(`Bevel width collapses a ${contour.role} contour.`);
          }
          rings.push({ pts: ringPts, z: sideTopZ + zOff });
        }

        for (let step = 0; step < rings.length - 1; step++) {
          const ringA = rings[step], ringB = rings[step + 1];
          buildSideStrip(ringA.pts, ringA.z, ringB.pts, ringB.z, n, baseReverseWind, addVertex, indices);
        }

        buildSideStrip(pts, sideTopZ, pts, sideBotZ, n, baseReverseWind, addVertex, indices);

        const backRings = [];
        backRings.push({ pts, z: sideBotZ });
        for (let step = 1; step <= bevelSteps; step++) {
          const t = step / bevelSteps;
          const angle = (Math.PI / 2) * t;
          const insetDist = bevelActual * Math.sin(angle);
          const zOff = bevelActual * (1 - Math.cos(angle));
          const ringPts = deduplicateContour(offsetContour2D(pts, normals, -insetDist), SVG_CONTOUR_EPSILON);
          if (ringPts.length !== pts.length || Math.abs(contourSignedArea(ringPts)) <= 1e-3) {
            throw new Error(`Bevel width collapses a ${contour.role} contour.`);
          }
          backRings.push({ pts: ringPts, z: sideBotZ - zOff });
        }
        for (let step = 0; step < backRings.length - 1; step++) {
          const ringA = backRings[step], ringB = backRings[step + 1];
          buildSideStrip(ringA.pts, ringA.z, ringB.pts, ringB.z, n, !baseReverseWind, addVertex, indices);
        }
      } else {
        buildSideStrip(pts, frontCapZ, pts, backCapZ, n, baseReverseWind, addVertex, indices);
      }
    }

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices,
      surfaceKinds,
      vertexCount: positions.length / 3,
      triangleCount: indices.length / 3,
    };
  }

  function buildSideStrip(ptsTop, zTop, ptsBot, zBot, n, reverseWind, addVertex, indices) {
    const baseTop = [];
    const baseBot = [];
    for (let i = 0; i < n; i++) {
      baseTop.push(addVertex(ptsTop[i * 2], ptsTop[i * 2 + 1], zTop, 0, 0, "side"));
      baseBot.push(addVertex(ptsBot[i * 2], ptsBot[i * 2 + 1], zBot, 0, 0, "side"));
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (reverseWind) {
        indices.push(baseTop[i], baseBot[i], baseBot[j]);
        indices.push(baseTop[i], baseBot[j], baseTop[j]);
      } else {
        indices.push(baseTop[i], baseBot[j], baseBot[i]);
        indices.push(baseTop[i], baseTop[j], baseBot[j]);
      }
    }
  }

  // ── Skin generation from SVG ────────────────────────────────────────────────

  function generateSvgSkin(svgText, viewBox, skinWidth, skinHeight, palette, sideFillRgb24 = 0x000000) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const rgba = drawSvgImageToRgba(img, viewBox, skinWidth, skinHeight, sideFillRgb24);
        const indexed = rgbaToIndexedQuakePalette(rgba, palette);
        resolve(indexed);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to rasterize SVG for skin"));
      };
      img.src = url;
    });
  }

  function computeSvgSkinLayout(viewBox, skinWidth, skinHeight) {
    const padding = Math.max(2, Math.round(Math.min(skinWidth, skinHeight) * 0.02));
    const swatchSize = Math.max(6, Math.round(Math.min(skinWidth, skinHeight) * 0.08));
    const swatchGap = padding;

    const contentWidth = Math.max(1, skinWidth - padding * 2 - swatchSize - swatchGap);
    const contentHeight = Math.max(1, skinHeight - padding * 2);
    const fit = Math.min(contentWidth / Math.max(viewBox.w, 1), contentHeight / Math.max(viewBox.h, 1));
    const drawWidth = viewBox.w * fit;
    const drawHeight = viewBox.h * fit;
    const drawX = padding + (contentWidth - drawWidth) / 2;
    const drawY = padding + (contentHeight - drawHeight) / 2;
    const offsetX = drawX - viewBox.x * fit;
    const offsetY = drawY - viewBox.y * fit;

    const sideSwatch = {
      x: skinWidth - padding - swatchSize,
      y: skinHeight - padding - swatchSize,
      w: swatchSize,
      h: swatchSize,
    };

    return {
      fit,
      drawX,
      drawY,
      offsetX,
      offsetY,
      sideSwatch,
      sideSampleS: Math.round(sideSwatch.x + sideSwatch.w / 2),
      sideSampleT: Math.round(sideSwatch.y + sideSwatch.h / 2),
    };
  }

  function computeContoursViewBox(contours) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const contour of contours) {
      if (!contour?.points || contour.points.length < 2) {
        continue;
      }
      for (let i = 0; i < contour.points.length; i += 2) {
        minX = Math.min(minX, contour.points[i]);
        minY = Math.min(minY, contour.points[i + 1]);
        maxX = Math.max(maxX, contour.points[i]);
        maxY = Math.max(maxY, contour.points[i + 1]);
      }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return { x: 0, y: 0, w: 1, h: 1 };
    }

    return {
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 1),
      h: Math.max(maxY - minY, 1),
    };
  }

  function drawSvgImageToRgba(image, viewBox, width, height, sideFillRgb24 = 0x000000) {
    const oversample = 4;
    const hiCanvas = document.createElement("canvas");
    hiCanvas.width = width * oversample;
    hiCanvas.height = height * oversample;
    const hiContext = hiCanvas.getContext("2d", { alpha: true });
    if (!hiContext) {
      throw new Error("Could not create a high-resolution SVG raster canvas.");
    }

    hiContext.clearRect(0, 0, hiCanvas.width, hiCanvas.height);
    hiContext.imageSmoothingEnabled = true;

    const layout = computeSvgSkinLayout(viewBox, width, height);
    hiContext.drawImage(
      image,
      layout.drawX * oversample,
      layout.drawY * oversample,
      viewBox.w * layout.fit * oversample,
      viewBox.h * layout.fit * oversample
    );

    hiContext.fillStyle = rgb24ToCssHex(sideFillRgb24);
    hiContext.fillRect(
      layout.sideSwatch.x * oversample,
      layout.sideSwatch.y * oversample,
      layout.sideSwatch.w * oversample,
      layout.sideSwatch.h * oversample
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Could not create an SVG raster canvas.");
    }

    context.imageSmoothingEnabled = true;
    context.clearRect(0, 0, width, height);
    context.drawImage(hiCanvas, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  function drawContourSkinToRgba(contours, viewBox, width, height, fillRgb24 = 0x000000) {
    const oversample = 4;
    const hiCanvas = document.createElement("canvas");
    hiCanvas.width = width * oversample;
    hiCanvas.height = height * oversample;
    const hiContext = hiCanvas.getContext("2d", { alpha: true });
    if (!hiContext) {
      throw new Error("Could not create a high-resolution contour raster canvas.");
    }

    hiContext.clearRect(0, 0, hiCanvas.width, hiCanvas.height);
    hiContext.save();
    hiContext.scale(oversample, oversample);
    hiContext.fillStyle = rgb24ToCssHex(fillRgb24);
    hiContext.beginPath();

    const layout = computeSvgSkinLayout(viewBox, width, height);
    for (const contour of contours) {
      if (!contour?.points || contour.points.length < 6) {
        continue;
      }
      const pts = orientContourPoints(contour.points, contour.role);
      hiContext.moveTo(pts[0] * layout.fit + layout.offsetX, pts[1] * layout.fit + layout.offsetY);
      for (let i = 2; i < pts.length; i += 2) {
        hiContext.lineTo(pts[i] * layout.fit + layout.offsetX, pts[i + 1] * layout.fit + layout.offsetY);
      }
      hiContext.closePath();
    }
    hiContext.fill("nonzero");
    hiContext.fillRect(
      layout.sideSwatch.x,
      layout.sideSwatch.y,
      layout.sideSwatch.w,
      layout.sideSwatch.h
    );
    hiContext.restore();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Could not create a contour raster canvas.");
    }

    context.imageSmoothingEnabled = true;
    context.clearRect(0, 0, width, height);
    context.drawImage(hiCanvas, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  function generateContourSkin(contours, viewBox, skinWidth, skinHeight, palette, fillRgb24 = 0x000000) {
    const rgba = drawContourSkinToRgba(contours, viewBox, skinWidth, skinHeight, fillRgb24);
    return rgbaToIndexedQuakePalette(rgba, palette);
  }

  async function ensureEarcutLibrary() {
    const existing = window.earcut;
    if (typeof existing === "function") {
      return existing;
    }
    if (typeof existing?.default === "function") {
      return existing.default;
    }
    if (!earcutLoadPromise) {
      earcutLoadPromise = loadExternalScript(EARCUT_CDN_URL).then(() => {
        const resolved = typeof window.earcut === "function"
          ? window.earcut
          : window.earcut?.default;
        if (typeof resolved !== "function") {
          throw new Error("earcut did not initialize.");
        }
        return resolved;
      });
    }
    return earcutLoadPromise;
  }

  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-external-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.externalSrc = src;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureOpentypeLibrary() {
    if (window.opentype?.parse) {
      return window.opentype;
    }
    if (!opentypeLoadPromise) {
      opentypeLoadPromise = loadExternalScript(OPENTYPE_CDN_URL).then(() => {
        if (!window.opentype?.parse) {
          throw new Error("opentype.js did not initialize.");
        }
        return window.opentype;
      });
    }
    return opentypeLoadPromise;
  }

  async function ensureWoff2Decoder() {
    if (window.Module?.decompress) {
      return window.Module;
    }
    if (!woff2LoadPromise) {
      woff2LoadPromise = (async () => {
        const existingModule = (window.Module && typeof window.Module === "object") ? window.Module : {};
        const previousInit = existingModule.onRuntimeInitialized;
        let readyResolve;
        const ready = new Promise((resolve) => {
          readyResolve = resolve;
        });
        existingModule.onRuntimeInitialized = () => {
          if (typeof previousInit === "function") {
            previousInit();
          }
          readyResolve();
        };
        window.Module = existingModule;
        await loadExternalScript(WAWOFF2_CDN_URL);
        await ready;
        if (!window.Module?.decompress) {
          throw new Error("WOFF2 decoder did not initialize.");
        }
        return window.Module;
      })();
    }
    return woff2LoadPromise;
  }

  function normalizeFontFamilyKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function rgb24ToCssHex(value) {
    return `#${(value >>> 0).toString(16).padStart(6, "0").slice(-6)}`;
  }

  function guessFontWeightFromStyle(style) {
    const normalized = String(style || "").toLowerCase();
    if (!normalized) return 400;
    if (/\bthin\b|\bhairline\b/.test(normalized)) return 100;
    if (/\bextra[- ]?light\b|\bultra[- ]?light\b/.test(normalized)) return 200;
    if (/\blight\b/.test(normalized)) return 300;
    if (/\bmedium\b/.test(normalized)) return 500;
    if (/\bsemi[- ]?bold\b|\bdemi[- ]?bold\b/.test(normalized)) return 600;
    if (/\bextra[- ]?bold\b|\bultra[- ]?bold\b/.test(normalized)) return 800;
    if (/\bblack\b|\bheavy\b/.test(normalized)) return 900;
    if (/\bbold\b/.test(normalized)) return 700;
    return 400;
  }

  function isItalicFontStyle(style) {
    return /\bitalic\b|\boblique\b/i.test(String(style || ""));
  }

  function buildLocalFontEntry(fontData) {
    const family = String(fontData?.family || "").trim();
    const fullName = String(fontData?.fullName || "").trim();
    const postscriptName = String(fontData?.postscriptName || "").trim();
    const style = String(fontData?.style || "").trim();
    const queryName = fullName || postscriptName || family;
    const weight = guessFontWeightFromStyle(style);
    const italic = isItalicFontStyle(style);
    const key = `local:${normalizeFontFamilyKey(postscriptName || queryName)}:${normalizeFontFamilyKey(style)}`;

    return {
      key,
      provider: "local",
      family: family || queryName,
      queryName,
      fullName,
      postscriptName,
      style,
      category: style ? `installed • ${style}` : "installed",
      weights: [weight],
      italic,
      terms: [family, fullName, postscriptName, style, "installed", "local", "system"]
        .join(" ")
        .toLowerCase(),
    };
  }

  function findBuiltinFontSource(family) {
    const normalized = normalizeFontFamilyKey(family);
    if (!normalized) return null;
    return BUILTIN_FONT_SOURCES.find((entry) => {
      if (normalizeFontFamilyKey(entry.family) === normalized) {
        return true;
      }
      return (entry.aliases || []).some((alias) => normalizeFontFamilyKey(alias) === normalized);
    }) || null;
  }

  function buildBuiltinFontIndexEntries() {
    return BUILTIN_FONT_SOURCES.map((entry) => ({
      key: `builtin:${normalizeFontFamilyKey(entry.family)}`,
      provider: "builtin",
      family: entry.family,
      queryName: entry.family,
      category: entry.category,
      weights: Array.isArray(entry.weights) && entry.weights.length ? entry.weights.slice() : [400],
      terms: [entry.family, ...(entry.aliases || []), entry.category, "local", "ttf"]
        .join(" ")
        .toLowerCase(),
    }));
  }

  function sanitizeLocalFontCacheEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const queryName = String(entry.queryName || entry.fullName || entry.postscriptName || entry.family || "").trim();
    if (!queryName) {
      return null;
    }
    const weight = clamp(parseInt(entry.weights?.[0], 10) || 400, 100, 900);
    const style = String(entry.style || "").trim();
    const family = String(entry.family || queryName).trim();
    const postscriptName = String(entry.postscriptName || "").trim();
    const fullName = String(entry.fullName || "").trim();
    const key = entry.key
      ? String(entry.key)
      : `local:${normalizeFontFamilyKey(postscriptName || queryName)}:${normalizeFontFamilyKey(style)}`;
    return {
      key,
      provider: "local",
      family,
      queryName,
      fullName,
      postscriptName,
      style,
      category: style ? `installed • ${style}` : "installed",
      weights: [weight],
      italic: !!entry.italic,
      terms: [family, fullName, postscriptName, style, "installed", "local", "system"]
        .join(" ")
        .toLowerCase(),
    };
  }

  function saveCachedLocalFonts(entries) {
    try {
      const payload = {
        savedAt: Date.now(),
        entries: Array.isArray(entries) ? entries.map((entry) => sanitizeLocalFontCacheEntry(entry)).filter(Boolean) : [],
      };
      localStorage.setItem(LOCAL_FONTS_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to cache installed font metadata:", error);
    }
  }

  function clearCachedLocalFonts() {
    try {
      localStorage.removeItem(LOCAL_FONTS_CACHE_KEY);
      localStorage.removeItem(LOCAL_FONTS_ENABLED_KEY);
    } catch (error) {
      console.warn("Failed to clear installed font cache:", error);
    }
  }

  function setLocalFontsEnabled(enabled) {
    try {
      if (enabled) {
        localStorage.setItem(LOCAL_FONTS_ENABLED_KEY, "true");
      } else {
        localStorage.removeItem(LOCAL_FONTS_ENABLED_KEY);
      }
    } catch (error) {
      console.warn("Failed to persist installed font preference:", error);
    }
  }

  function areLocalFontsEnabled() {
    try {
      return localStorage.getItem(LOCAL_FONTS_ENABLED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function restoreCachedLocalFonts() {
    updateLocalFontsButtonState();
    if (typeof window.queryLocalFonts !== "function" || !areLocalFontsEnabled()) {
      return;
    }
    try {
      const raw = localStorage.getItem(LOCAL_FONTS_CACHE_KEY);
      if (!raw) {
        return;
      }
      const payload = JSON.parse(raw);
      const entries = Array.isArray(payload?.entries)
        ? payload.entries.map((entry) => sanitizeLocalFontCacheEntry(entry)).filter(Boolean)
        : [];
      if (!entries.length) {
        return;
      }
      state.localFontsIndex = entries;
      state.localFontsHydrated = false;
      updateLocalFontsButtonState();
    } catch (error) {
      console.warn("Failed to restore installed font cache:", error);
      clearCachedLocalFonts();
    }
  }

  async function getLocalFontsPermissionState() {
    try {
      if (!navigator.permissions?.query) {
        return null;
      }
      const status = await navigator.permissions.query({ name: "local-fonts" });
      return status?.state || null;
    } catch {
      return null;
    }
  }

  async function maybeWarmLocalFontsCache() {
    if (!areLocalFontsEnabled() || typeof window.queryLocalFonts !== "function") {
      updateLocalFontsButtonState();
      return;
    }
    const permissionState = await getLocalFontsPermissionState();
    if (permissionState === "denied") {
      state.localFontsIndex = null;
      state.localFontsHydrated = false;
      state.localFontFaces = new Map();
      clearCachedLocalFonts();
      updateLocalFontsButtonState();
      return;
    }
    if (permissionState === "granted") {
      try {
        await ensureLocalFontsIndex({ requireLiveData: true, forceRefresh: true });
      } catch (error) {
        console.warn("Failed to warm installed font cache:", error);
      }
    } else {
      updateLocalFontsButtonState();
    }
  }

  function updateLocalFontsButtonState() {
    if (!dom.svgLocalFontsEnable) {
      return;
    }
    if (typeof window.queryLocalFonts !== "function") {
      dom.svgLocalFontsEnable.textContent = "Installed Fonts Unsupported";
      return;
    }
    const count = state.localFontsIndex?.length || 0;
    dom.svgLocalFontsEnable.textContent = count
      ? `Reload Installed Fonts (${count})`
      : "Load Installed Fonts";
  }

  function getCombinedFontIndex(baseIndex) {
    return [...(state.localFontsIndex || []), ...(baseIndex || [])];
  }

  function getFontEntryDisplayName(entry) {
    return entry?.queryName || entry?.family || "";
  }

  function resolveLocalFontEntry(family, requestedWeight, italic) {
    if (!state.localFontsIndex?.length) {
      return null;
    }

    const normalized = normalizeFontFamilyKey(family);
    if (!normalized) {
      return null;
    }

    const selected = state.selectedFontEntry;
    if (selected?.provider === "local") {
      const selectedNames = [
        selected.queryName,
        selected.family,
        selected.fullName,
        selected.postscriptName,
      ].map(normalizeFontFamilyKey);
      if (selectedNames.includes(normalized)) {
        return selected;
      }
    }

    const candidates = state.localFontsIndex.filter((entry) => {
      return [
        entry.queryName,
        entry.family,
        entry.fullName,
        entry.postscriptName,
      ].some((value) => normalizeFontFamilyKey(value) === normalized);
    });

    if (!candidates.length) {
      return null;
    }

    const targetWeight = Number.isFinite(requestedWeight) ? requestedWeight : 400;
    const italicWanted = !!italic;
    return candidates
      .slice()
      .sort((a, b) => {
        const italicDeltaA = (a.italic ? 1 : 0) === (italicWanted ? 1 : 0) ? 0 : 1;
        const italicDeltaB = (b.italic ? 1 : 0) === (italicWanted ? 1 : 0) ? 0 : 1;
        if (italicDeltaA !== italicDeltaB) return italicDeltaA - italicDeltaB;
        const weightDeltaA = Math.abs((a.weights?.[0] || 400) - targetWeight);
        const weightDeltaB = Math.abs((b.weights?.[0] || 400) - targetWeight);
        if (weightDeltaA !== weightDeltaB) return weightDeltaA - weightDeltaB;
        return getFontEntryDisplayName(a).localeCompare(getFontEntryDisplayName(b));
      })[0];
  }

  async function ensureLocalFontsIndex(options = {}) {
    const {
      requireLiveData = false,
      forceRefresh = false,
    } = options;

    if (state.localFontsIndex && !forceRefresh && (!requireLiveData || state.localFontsHydrated)) {
      return state.localFontsIndex;
    }
    if (state.localFontsLoading) {
      while (state.localFontsLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (state.localFontsIndex && (!requireLiveData || state.localFontsHydrated)) {
        return state.localFontsIndex;
      }
    }
    if (typeof window.queryLocalFonts !== "function") {
      throw new Error("Installed font access is not supported in this browser.");
    }

    state.localFontsLoading = true;
    try {
      const fonts = await window.queryLocalFonts();
      const faceMap = new Map();
      const entries = [];
      for (const fontData of fonts) {
        const entry = buildLocalFontEntry(fontData);
        if (!entry.queryName || faceMap.has(entry.key)) {
          continue;
        }
        faceMap.set(entry.key, fontData);
        entries.push(entry);
      }

      entries.sort((a, b) => getFontEntryDisplayName(a).localeCompare(getFontEntryDisplayName(b)));
      state.localFontsIndex = entries;
      state.localFontsHydrated = true;
      state.localFontFaces = faceMap;
      setLocalFontsEnabled(true);
      saveCachedLocalFonts(entries);
      return entries;
    } catch (error) {
      if (error?.name === "NotAllowedError") {
        const permissionState = await getLocalFontsPermissionState();
        if (permissionState === "denied") {
          state.localFontsIndex = null;
          state.localFontsHydrated = false;
          state.localFontFaces = new Map();
          clearCachedLocalFonts();
        }
      }
      throw error;
    } finally {
      state.localFontsLoading = false;
      updateLocalFontsButtonState();
    }
  }

  function buildGoogleFontCssUrl(family, weight, italic, text) {
    const familySpec = `${family.trim().replace(/\s+/g, "+")}:ital,wght@${italic ? 1 : 0},${weight}`;
    const encodedFamily = encodeURIComponent(familySpec)
      .replace(/%2B/g, "+")
      .replace(/%3A/gi, ":")
      .replace(/%2C/gi, ",")
      .replace(/%40/gi, "@")
      .replace(/%3B/gi, ";");
    const url = new URL(`${GOOGLE_FONTS_CSS2_URL}?family=${encodedFamily}`);
    if (text) {
      url.searchParams.set("text", text);
    }
    url.searchParams.set("display", "block");
    return url.toString();
  }

  async function fetchGoogleFontAsset(family, weight, italic, text) {
    const cssUrl = buildGoogleFontCssUrl(family, weight, italic, text);
    const response = await fetch(cssUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Google Fonts request failed (${response.status}).`);
    }

    const css = await response.text();
    const matches = Array.from(css.matchAll(/url\(([^)]+)\)\s+format\(['"]?([^'")]+)['"]?\)/g));
    if (!matches.length) {
      throw new Error("No font file URL was found in the Google Fonts response.");
    }

    const preferredMatch = matches.find((match) => match[2].toLowerCase() === "woff")
      || matches.find((match) => match[2].toLowerCase() === "woff2")
      || matches[0];
    const fontUrl = new URL(preferredMatch[1].trim().replace(/^['"]|['"]$/g, ""), cssUrl).toString();

    return {
      cssUrl,
      fontUrl,
      format: preferredMatch[2].toLowerCase(),
    };
  }

  async function loadGoogleFont(family, weight, italic, text) {
    const opentype = await ensureOpentypeLibrary();
    const asset = await fetchGoogleFontAsset(family, weight, italic, text);
    const fontResponse = await fetch(asset.fontUrl, { mode: "cors" });
    if (!fontResponse.ok) {
      throw new Error(`Font download failed (${fontResponse.status}).`);
    }

    let buffer = await fontResponse.arrayBuffer();
    if (asset.format === "woff2") {
      const decoder = await ensureWoff2Decoder();
      const decompressed = decoder.decompress(buffer);
      if (decompressed instanceof ArrayBuffer) {
        buffer = decompressed;
      } else {
        buffer = decompressed.buffer.slice(
          decompressed.byteOffset,
          decompressed.byteOffset + decompressed.byteLength,
        );
      }
    }

    return {
      font: opentype.parse(buffer),
      asset,
    };
  }

  async function loadBuiltinFont(source) {
    const opentype = await ensureOpentypeLibrary();
    const fontResponse = await fetch(source.url, { mode: "cors" });
    if (!fontResponse.ok) {
      throw new Error(`Built-in font download failed (${fontResponse.status}).`);
    }

    const buffer = await fontResponse.arrayBuffer();
    return {
      font: opentype.parse(buffer),
      asset: {
        fontUrl: source.url,
        format: "ttf",
        builtin: true,
      },
      source,
    };
  }

  async function loadInstalledFont(entry) {
    const opentype = await ensureOpentypeLibrary();
    if (!state.localFontsHydrated || !state.localFontFaces.has(entry.key)) {
      await ensureLocalFontsIndex({ requireLiveData: true, forceRefresh: true });
    }
    const fontData = state.localFontFaces.get(entry.key);
    if (!fontData || typeof fontData.blob !== "function") {
      throw new Error("The selected installed font is no longer available. Load installed fonts again.");
    }

    const blob = await fontData.blob();
    const buffer = await blob.arrayBuffer();
    return {
      font: opentype.parse(buffer),
      asset: {
        format: blob.type || "font",
        local: true,
      },
      entry,
    };
  }

  async function loadModelFont(family, weight, italic, text, selectedEntry = null) {
    if (selectedEntry?.provider === "local") {
      const loaded = await loadInstalledFont(selectedEntry);
      return {
        ...loaded,
        family: selectedEntry.family,
        weight: selectedEntry.weights?.[0] || weight,
        italic: !!selectedEntry.italic,
        sourceKind: "local",
      };
    }

    const builtin = findBuiltinFontSource(family);
    if (builtin) {
      const loaded = await loadBuiltinFont(builtin);
      return {
        ...loaded,
        family: builtin.family,
        weight: builtin.weights?.[0] || 400,
        italic: false,
        sourceKind: "builtin",
      };
    }

    const loaded = await loadGoogleFont(family, weight, italic, text);
    return {
      ...loaded,
      family,
      weight,
      italic: !!italic,
      sourceKind: "google",
    };
  }

  function formatSvgNumber(value) {
    return Number.parseFloat(Number(value).toFixed(3)).toString();
  }

  function buildSvgPathDataFromCommands(commands) {
    return commands.map((command) => {
      switch (command.type) {
        case "M":
        case "L":
          return `${command.type}${formatSvgNumber(command.x)} ${formatSvgNumber(command.y)}`;
        case "C":
          return `C${formatSvgNumber(command.x1)} ${formatSvgNumber(command.y1)} ${formatSvgNumber(command.x2)} ${formatSvgNumber(command.y2)} ${formatSvgNumber(command.x)} ${formatSvgNumber(command.y)}`;
        case "Q":
          return `Q${formatSvgNumber(command.x1)} ${formatSvgNumber(command.y1)} ${formatSvgNumber(command.x)} ${formatSvgNumber(command.y)}`;
        case "Z":
          return "Z";
        default:
          return "";
      }
    }).join("");
  }

  function measureSvgCommandBounds(commands) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    function includePoint(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    for (const command of commands) {
      includePoint(command.x, command.y);
      includePoint(command.x1, command.y1);
      includePoint(command.x2, command.y2);
    }

    if (minX === Infinity) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }

  function buildFontSourceName(text, family) {
    const familySlug = family.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "font";
    const textSlug = text.trim().replace(/\s+/g, "-").replace(/[^a-z0-9_-]+/gi, "").replace(/^-+|-+$/g, "").toLowerCase() || "text";
    return `${familySlug}-${textSlug.slice(0, 32)}.svg`;
  }

  async function buildSvgFromFontText(options) {
    const {
      text,
      family,
      weight,
      italic,
      selectedEntry = null,
    } = options;

    const normalizedText = text.replace(/\r\n?/g, "\n");
    const subsetText = normalizedText.replace(/\n/g, "");
    const { font } = await loadModelFont(family, weight, italic, subsetText, selectedEntry);
    const fontSize = 512;
    const padding = Math.max(32, fontSize * 0.18);
    const ascender = (font.ascender / Math.max(font.unitsPerEm, 1)) * fontSize;
    const descender = Math.abs((font.descender / Math.max(font.unitsPerEm, 1)) * fontSize);
    const lineHeight = Math.max(fontSize * 1.12, ascender + descender + fontSize * 0.16);
    const lines = normalizedText.split("\n");
    const lineMetrics = lines.map((line) => ({
      text: line,
      width: font.getAdvanceWidth(line || " ", fontSize, { kerning: true }),
    }));
    const maxWidth = Math.max(fontSize * 0.25, ...lineMetrics.map((line) => line.width));
    const commands = [];

    lineMetrics.forEach((line, index) => {
      const baselineY = padding + ascender + index * lineHeight;
      const originX = padding + (maxWidth - line.width) / 2;
      const path = font.getPath(line.text, originX, baselineY, fontSize, {
        kerning: true,
        hinting: false,
      });
      commands.push(...path.commands);
    });

    const bounds = measureSvgCommandBounds(commands);
    if (!bounds) {
      throw new Error("The selected font did not produce any path outlines for the entered text.");
    }

    const margin = Math.max(16, fontSize * 0.12);
    const viewBoxX = Math.floor(bounds.minX - margin);
    const viewBoxY = Math.floor(bounds.minY - margin);
    const viewBoxWidth = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) + margin * 2));
    const viewBoxHeight = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) + margin * 2));
    const pathData = buildSvgPathDataFromCommands(commands);

    const fillColor = rgb24ToCssHex(GENERATED_FONT_ICON_FILL_RGB24);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" fill="none" data-mdl-contour-rule="winding"><path d="${pathData}" fill="${fillColor}" fill-rule="nonzero" clip-rule="nonzero" data-mdl-contour-rule="winding"/></svg>`;
  }

  function projectSvgContourToSkinLoop(points, skinLayout, skinWidth, skinHeight) {
    const loop = [];
    for (let i = 0; i < points.length; i += 2) {
      const s = Math.max(0, Math.min(skinWidth - 1, Math.round(points[i] * skinLayout.fit + skinLayout.offsetX)));
      const t = Math.max(0, Math.min(skinHeight - 1, Math.round(points[i + 1] * skinLayout.fit + skinLayout.offsetY)));
      loop.push([s + 0.5, t + 0.5]);
    }
    return loop;
  }

  function buildSvgSkinOverlayLoops(contours, skinLayout, skinWidth, skinHeight) {
    const loops = [];
    for (const contour of contours) {
      if (!contour?.points || contour.points.length < 6) {
        continue;
      }
      loops.push(projectSvgContourToSkinLoop(contour.points, skinLayout, skinWidth, skinHeight));
    }

    const swatch = skinLayout.sideSwatch;
    loops.push([
      [swatch.x + 0.5, swatch.y + 0.5],
      [swatch.x + swatch.w - 0.5, swatch.y + 0.5],
      [swatch.x + swatch.w - 0.5, swatch.y + swatch.h - 0.5],
      [swatch.x + 0.5, swatch.y + swatch.h - 0.5],
    ]);

    return loops;
  }

  // Simplify each contour to the resolution the MDL format can actually store.
  // Final vertices are packed to one byte per axis, so detail finer than
  // (axisRange / 255) is lost on export. Removing it up front cuts redundant
  // vertices and the degenerate sliver triangles that over-tessellated outlines
  // produce.
  function simplifyContoursToQuantization(contours, strengthMultiplier = 1) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const contour of contours) {
      const pts = contour.points;
      for (let i = 0; i < pts.length; i += 2) {
        if (pts[i] < minX) minX = pts[i];
        if (pts[i] > maxX) maxX = pts[i];
        if (pts[i + 1] < minY) minY = pts[i + 1];
        if (pts[i + 1] > maxY) maxY = pts[i + 1];
      }
    }
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    if (!(rangeX > 0) || !(rangeY > 0)) {
      return null;
    }
    // Half the smaller per-axis quantization step is the lossless floor: anything
    // closer to its chord than this is below the model's packed output resolution.
    // The strength multiplier (>= 1) scales past that floor to trade detail for a
    // lower polycount when the user asks for it.
    const tolerance = Math.min(rangeX, rangeY) / 255 * 0.5 * Math.max(1, strengthMultiplier);
    const stats = {
      beforePoints: 0,
      afterPoints: 0,
      simplifiedContours: 0,
      contourCount: contours.length,
    };
    for (const contour of contours) {
      const originalPoints = contour.points;
      const beforeCount = originalPoints.length / 2;
      const simplified = simplifyClosedContour(originalPoints, tolerance, getContourFeatureIndices(originalPoints));
      let nextPoints = originalPoints;
      if (simplified.length < originalPoints.length && isSafeSimplifiedContour(originalPoints, simplified)) {
        nextPoints = simplified;
        contour.points = simplified;
        contour.windingSign = contourSignedArea(simplified) >= 0 ? 1 : -1;
        stats.simplifiedContours++;
      }

      stats.beforePoints += beforeCount;
      stats.afterPoints += nextPoints.length / 2;
    }
    stats.removedPoints = stats.beforePoints - stats.afterPoints;
    return stats.removedPoints > 0 ? stats : null;
  }

  function getPackedPosition(positions, vertexIndex, scale, origin) {
    const offset = vertexIndex * 3;
    return [
      packAliasCoord(positions[offset + 0], scale[0], origin[0]),
      packAliasCoord(positions[offset + 1], scale[1], origin[1]),
      packAliasCoord(positions[offset + 2], scale[2], origin[2]),
    ];
  }

  function packedPositionsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  function isRenderablePackedTriangle(triangle, positions, scale, origin) {
    const [ia, ib, ic] = triangle.vertIndex;
    const a = getPackedPosition(positions, ia, scale, origin);
    const b = getPackedPosition(positions, ib, scale, origin);
    const c = getPackedPosition(positions, ic, scale, origin);
    if (packedPositionsEqual(a, b) || packedPositionsEqual(a, c) || packedPositionsEqual(b, c)) {
      return false;
    }

    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    return cx !== 0 || cy !== 0 || cz !== 0;
  }

  function removePackedDegenerateTriangles(triangles, positions, scale, origin, frontCapTriangleCount = 0) {
    const frontCapTriangles = [];
    const restTriangles = [];
    let removedFrontCapTriangles = 0;
    let removedTriangles = 0;

    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];
      if (isRenderablePackedTriangle(triangle, positions, scale, origin)) {
        if (i < frontCapTriangleCount) {
          frontCapTriangles.push(triangle);
        } else {
          restTriangles.push(triangle);
        }
      } else {
        removedTriangles++;
        if (i < frontCapTriangleCount) {
          removedFrontCapTriangles++;
        }
      }
    }

    if (!removedTriangles) {
      return {
        triangles,
        frontCapTriangleCount,
        cleanup: null,
      };
    }

    const nextTriangles = frontCapTriangles.concat(restTriangles);
    return {
      triangles: nextTriangles,
      frontCapTriangleCount: frontCapTriangles.length,
      cleanup: {
        beforeTriangles: triangles.length,
        afterTriangles: nextTriangles.length,
        removedTriangles,
        removedFrontCapTriangles,
      },
    };
  }

  // ── Model assembly from SVG ─────────────────────────────────────────────────

  async function buildModelFromSvg(svgText, options) {
    const {
      thickness = 16,
      bevelWidth = 0,
      bevelSegments = 0,
      skinWidth = 1024,
      skinHeight = 1024,
      modelScale = 64,
      useContourSkin = false,
      preferEarcut = false,
      skinFillRgb24 = 0x000000,
      simplifyContours = false,
      simplifyStrength = 1,
    } = options;

    const { contours, viewBox } = parseSvgToContours(svgText);
    let contourOptimization = null;
    if (simplifyContours) {
      contourOptimization = simplifyContoursToQuantization(contours, simplifyStrength);
    }
    const classifiedContours = classifyContoursByNesting(contours);
    const sourceContours = classifiedContours;
    const sourceViewBox = useContourSkin
      ? computeContoursViewBox(sourceContours)
      : viewBox;
    const earcutFn = preferEarcut ? await ensureEarcutLibrary() : null;
    const bevelActual = (bevelSegments > 0 && bevelWidth > 0) ? bevelWidth : 0;
    if (bevelActual * 2 >= thickness) {
      throw new Error("Bevel width must be less than half the model thickness.");
    }

    const capContours = bevelActual > 0
      ? buildInsetContours(sourceContours, bevelActual)
      : sourceContours;

    let geometryContours = sourceContours;
    let capTriangulation;
    let importWarning = "";

    try {
      capTriangulation = triangulatePlanarContours(capContours, earcutFn);
    } catch (error) {
      const holeContours = sourceContours.filter((contour) => contour.role === "hole");
      if (!holeContours.length || !/hole|triangulation/i.test(error.message)) {
        throw error;
      }

      // Fallback for complex even-odd SVGs: build the solid outer silhouette
      // and preserve interior cutouts through transparent skin pixels.
      geometryContours = sourceContours.filter((contour) => contour.role === "outer");
      const outerCapContours = capContours.filter((contour) => contour.role === "outer");
      capTriangulation = triangulatePlanarContours(outerCapContours, earcutFn);
      importWarning = "Inner SVG cutouts were preserved in the skin as transparent pixels because the contour holes could not be triangulated into solid geometry.";
    }

    const extrusion = extrudeContours(geometryContours, capTriangulation, {
      thickness,
      bevelWidth: bevelActual,
      bevelSegments,
    });

    // Compute bounding box of generated geometry
    const pos = extrusion.positions;
    const gMin = [Infinity, Infinity, Infinity];
    const gMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) {
      gMin[0] = Math.min(gMin[0], pos[i]);     gMax[0] = Math.max(gMax[0], pos[i]);
      gMin[1] = Math.min(gMin[1], pos[i + 1]); gMax[1] = Math.max(gMax[1], pos[i + 1]);
      gMin[2] = Math.min(gMin[2], pos[i + 2]); gMax[2] = Math.max(gMax[2], pos[i + 2]);
    }

    // Scale to fit modelScale Quake units, center at origin
    const rangeX = gMax[0] - gMin[0] || 1;
    const rangeY = gMax[1] - gMin[1] || 1;
    const rangeZ = gMax[2] - gMin[2] || 1;
    const scaleFactor = modelScale / Math.max(rangeX, rangeY, rangeZ);
    const centerX = (gMin[0] + gMax[0]) * 0.5;
    const centerY = (gMin[1] + gMax[1]) * 0.5;
    const centerZ = (gMin[2] + gMax[2]) * 0.5;

    const numVerts = extrusion.vertexCount;
    const positions = new Float32Array(numVerts * 3);
    for (let i = 0; i < numVerts; i++) {
      const srcX = pos[i * 3 + 0];
      const srcY = pos[i * 3 + 1];
      const srcZ = pos[i * 3 + 2];

      // Stand imported SVGs upright by default:
      // SVG X -> model X, extrusion depth -> model Y, SVG Y -> model Z (flipped so "up" stays up).
      positions[i * 3 + 0] = (srcX - centerX) * scaleFactor;
      positions[i * 3 + 1] = (srcZ - centerZ) * scaleFactor;
      positions[i * 3 + 2] = -(srcY - centerY) * scaleFactor;
    }

    // Build stVerts with UV mapping: front/back faces get SVG projection,
    // side walls use a dedicated opaque swatch to avoid transparent holes.
    const stVerts = [];
    const skinLayout = computeSvgSkinLayout(sourceViewBox, skinWidth, skinHeight);

    for (let i = 0; i < numVerts; i++) {
      let s;
      let t;
      if (extrusion.surfaceKinds[i] === "side") {
        s = skinLayout.sideSampleS;
        t = skinLayout.sideSampleT;
      } else {
        const origX = pos[i * 3 + 0];
        const origY = pos[i * 3 + 1];
        s = Math.round(origX * skinLayout.fit + skinLayout.offsetX);
        t = Math.round(origY * skinLayout.fit + skinLayout.offsetY);
      }
      stVerts.push({
        onseam: 0,
        s: Math.max(0, Math.min(skinWidth - 1, s)),
        t: Math.max(0, Math.min(skinHeight - 1, t)),
      });
    }

    const skinOverlayContours = importWarning ? sourceContours : capContours;
    const skinOverlayLoops = buildSvgSkinOverlayLoops(
      skinOverlayContours,
      skinLayout,
      skinWidth,
      skinHeight,
    );

    // Build raw triangles; the exported MDL stores packed byte coordinates, so
    // a final cleanup pass runs after export scale/origin are known.
    const rawTriangles = [];
    for (let i = 0; i < extrusion.indices.length; i += 3) {
      rawTriangles.push({
        facesfront: 1,
        vertIndex: [extrusion.indices[i], extrusion.indices[i + 1], extrusion.indices[i + 2]],
      });
    }

    // Generate skin
    const skinPixels = useContourSkin
      ? generateContourSkin(sourceContours, sourceViewBox, skinWidth, skinHeight, state.paletteRGBA, skinFillRgb24)
      : await generateSvgSkin(svgText, viewBox, skinWidth, skinHeight, state.paletteRGBA, skinFillRgb24);

    // Compute export packing (scale/origin for 0-255 vertex range)
    const pMin = [Infinity, Infinity, Infinity];
    const pMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      pMin[0] = Math.min(pMin[0], positions[i]);     pMax[0] = Math.max(pMax[0], positions[i]);
      pMin[1] = Math.min(pMin[1], positions[i + 1]); pMax[1] = Math.max(pMax[1], positions[i + 1]);
      pMin[2] = Math.min(pMin[2], positions[i + 2]); pMax[2] = Math.max(pMax[2], positions[i + 2]);
    }
    const mdlScale = [1, 1, 1];
    for (let axis = 0; axis < 3; axis++) {
      const range = pMax[axis] - pMin[axis];
      mdlScale[axis] = range > 1e-9 ? range / 255 : 1;
    }

    const boundingRadius = Math.hypot(
      (pMax[0] - pMin[0]) / 2,
      (pMax[1] - pMin[1]) / 2,
      (pMax[2] - pMin[2]) / 2,
    );
    const triangleCleanupResult = removePackedDegenerateTriangles(
      rawTriangles,
      positions,
      mdlScale,
      pMin,
      capTriangulation.indices.length / 3,
    );
    const triangles = triangleCleanupResult.triangles;
    const geometryCleanup = triangleCleanupResult.cleanup;
    const mapExportData = bevelActual === 0
      ? {
          kind: "flat-prism",
          capVertexCount: capTriangulation.vertices.length / 2,
          capTriangleCount: triangleCleanupResult.frontCapTriangleCount,
          textureName: "__TB_empty",
        }
      : null;

    return {
      path: "svg-import.mdl",
      version: 6,
      scale: mdlScale,
      scaleOrigin: pMin.slice(),
      boundingRadius,
      eyePosition: [0, 0, pMax[2]],
      numSkins: 1,
      skinWidth,
      skinHeight,
      numVerts,
      numTris: triangles.length,
      numFrames: 1,
      synctype: 0,
      syncType: 0,
      flags: importWarning ? (1 << 14) : 0,
      size: 0,
      importWarning,
      contourOptimization,
      geometryCleanup,
      mapExportData,
      skinOverlayLoops,
      skins: [{
        type: "single",
        frames: [skinPixels],
        intervals: [0.1],
      }],
      stVerts,
      triangles,
      topFrames: [{
        type: "single",
        name: "frame0",
        poseIndices: [0],
        intervals: [0.1],
      }],
      poses: [{
        name: "frame0",
        positions,
      }],
    };
  }

  // ── SVG file loading and model activation ───────────────────────────────────

  function resolveGoogleFontWeight(family, requestedWeight) {
    const index = state.gfFontsIndex;
    if (!index) return requestedWeight;
    const entry = index.find((f) => f.family.toLowerCase() === family.toLowerCase());
    if (!entry || !entry.weights.length) return requestedWeight;
    if (entry.weights.includes(requestedWeight)) return requestedWeight;
    return entry.weights.reduce((best, w) =>
      Math.abs(w - requestedWeight) < Math.abs(best - requestedWeight) ? w : best,
    );
  }

  async function generateModelFromGoogleFontText() {
    const text = dom.svgTextContent.value || "";
    const inputFamily = dom.svgFontFamily.value.trim();
    const rawWeight = parseEditableNumber(dom.svgFontWeight.value, 700);
    const requestedWeight = clamp(Math.round(rawWeight / 100) * 100, 100, 900);
    let italic = dom.svgFontItalic.checked;
    const localFontEntry = resolveLocalFontEntry(inputFamily, requestedWeight, italic);
    const builtinFont = localFontEntry ? null : findBuiltinFontSource(inputFamily);
    let family = localFontEntry
      ? getFontEntryDisplayName(localFontEntry)
      : (builtinFont ? builtinFont.family : inputFamily);

    if (!family) {
      dom.svgImportStatus.textContent = "Enter a font family name.";
      return;
    }
    if (!text.trim()) {
      dom.svgImportStatus.textContent = "Enter some text to generate.";
      return;
    }

    let weight = requestedWeight;
    if (localFontEntry) {
      weight = localFontEntry.weights?.[0] || requestedWeight;
      italic = !!localFontEntry.italic;
      state.selectedFontEntry = localFontEntry;
      dom.svgFontFamily.value = getFontEntryDisplayName(localFontEntry);
      dom.svgFontWeight.value = weight;
      dom.svgFontItalic.checked = italic;
    } else if (builtinFont) {
      weight = builtinFont.weights?.[0] || 400;
      italic = false;
      state.selectedFontEntry = null;
      dom.svgFontFamily.value = family;
      dom.svgFontWeight.value = weight;
      dom.svgFontItalic.checked = false;
    } else {
      await ensureGoogleFontsIndex();
      weight = resolveGoogleFontWeight(family, requestedWeight);
      state.selectedFontEntry = null;
      if (weight !== requestedWeight) {
        dom.svgFontWeight.value = weight;
      }
    }

    dom.svgTextGenerate.disabled = true;
    dom.svgImportGenerate.disabled = true;
    dom.svgImportStatus.textContent = localFontEntry
      ? `Loading installed font ${getFontEntryDisplayName(localFontEntry)}...`
      : builtinFont
      ? `Loading built-in font ${family}...`
      : `Loading ${family} (weight ${weight}) from Google Fonts...`;

    try {
      const svgText = await buildSvgFromFontText({
        text,
        family,
        weight,
        italic,
        selectedEntry: localFontEntry,
      });
      const sourceName = buildFontSourceName(text, family);
      await loadSvgText(svgText, sourceName, {
        sourceKind: "font",
        useContourSkin: true,
        skinFillRgb24: GENERATED_FONT_ICON_FILL_RGB24,
      });
    } catch (error) {
      console.error(error);
      dom.svgImportStatus.textContent = `Font generation failed: ${error.message}`;
      dom.svgImportGenerate.disabled = !state.svgPendingText;
    } finally {
      dom.svgTextGenerate.disabled = false;
    }
  }

  // ── Google Fonts search ──────────────────────────────────────────────────────

  async function ensureGoogleFontsIndex() {
    if (state.gfFontsIndex) return state.gfFontsIndex;
    if (state.gfFontsLoading) {
      while (state.gfFontsLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return state.gfFontsIndex;
    }

    state.gfFontsLoading = true;
    try {
      const builtinEntries = buildBuiltinFontIndexEntries();
      const response = await fetch(GOOGLE_FONTS_INDEX_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const list = data.map((entry) => ({
        family: entry.f,
        category: entry.c || "",
        weights: entry.w || [400],
        terms: `${entry.f} ${entry.c || ""}`.toLowerCase(),
      }));

      state.gfFontsIndex = [...builtinEntries, ...list];
      return state.gfFontsIndex;
    } catch (error) {
      console.error("Failed to load Google Fonts index:", error);
      state.gfFontsIndex = buildBuiltinFontIndexEntries();
      return state.gfFontsIndex;
    } finally {
      state.gfFontsLoading = false;
    }
  }

  async function searchGoogleFonts() {
    const query = dom.svgFontFamily.value.trim().toLowerCase();
    if (!query) {
      closeGoogleFontResults();
      return;
    }

    const baseIndex = await ensureGoogleFontsIndex();
    const index = getCombinedFontIndex(baseIndex);
    if (!index) {
      closeGoogleFontResults();
      return;
    }

    const terms = query.split(/\s+/);
    const matches = index.filter((font) =>
      terms.every((term) => font.terms.includes(term)),
    );

    const maxResults = 30;
    const shown = matches.slice(0, maxResults);

    if (!shown.length) {
      closeGoogleFontResults();
      return;
    }

    state.gfSearchResults = shown;
    state.gfActiveIndex = -1;
    const currentWeight = parseInt(dom.svgFontWeight.value, 10) || 700;
    dom.gfResults.innerHTML = shown.map((font, i) => {
      const displayName = escapeHtml(getFontEntryDisplayName(font));
      const category = font.category ? `<span class="gf-font-category">${escapeHtml(font.category)}</span>` : "";
      const hasWeight = font.weights.includes(currentWeight);
      const weightHint = font.provider === "local" || hasWeight
        ? ""
        : ` <span class="gf-font-weight-hint">${escapeHtml(font.weights.join("/"))}</span>`;
      return `<div class="gf-font-item" data-index="${i}">${displayName}${category}${weightHint}</div>`;
    }).join("");

    dom.gfResults.classList.add("is-open");
  }

  function pickGoogleFont(index) {
    const entry = state.gfSearchResults[index];
    if (!entry) {
      return;
    }

    state.selectedFontEntry = entry.provider === "local" ? entry : null;
    dom.svgFontFamily.value = getFontEntryDisplayName(entry);
    closeGoogleFontResults();

    // Auto-adjust weight to nearest available for this font
    if (entry.weights.length) {
      const currentWeight = parseInt(dom.svgFontWeight.value, 10) || 700;
      if (entry.provider === "local") {
        dom.svgFontWeight.value = entry.weights[0];
        dom.svgFontItalic.checked = !!entry.italic;
      } else if (!entry.weights.includes(currentWeight)) {
        const nearest = entry.weights.reduce((best, w) =>
          Math.abs(w - currentWeight) < Math.abs(best - currentWeight) ? w : best,
        );
        dom.svgFontWeight.value = nearest;
      }
    }
  }

  function closeGoogleFontResults() {
    dom.gfResults.classList.remove("is-open");
    dom.gfResults.innerHTML = "";
    state.gfActiveIndex = -1;
    state.gfSearchResults = [];
  }

  function handleGoogleFontKeydown(event) {
    const items = dom.gfResults.querySelectorAll(".gf-font-item");
    if (!items.length || !dom.gfResults.classList.contains("is-open")) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.gfActiveIndex = Math.min(state.gfActiveIndex + 1, items.length - 1);
      updateGoogleFontActive(items);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      state.gfActiveIndex = Math.max(state.gfActiveIndex - 1, 0);
      updateGoogleFontActive(items);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (state.gfActiveIndex >= 0 && state.gfActiveIndex < items.length) {
        pickGoogleFont(state.gfActiveIndex);
      } else {
        closeGoogleFontResults();
      }
    } else if (event.key === "Escape") {
      closeGoogleFontResults();
    }
  }

  function updateGoogleFontActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-active", i === state.gfActiveIndex);
    }
    if (state.gfActiveIndex >= 0 && items[state.gfActiveIndex]) {
      items[state.gfActiveIndex].scrollIntoView({ block: "nearest" });
    }
  }

  // ── Font Awesome icon support ───────────────────────────────────────────────

  async function ensureFontAwesomeIndex() {
    if (state.faIconsIndex) return state.faIconsIndex;
    if (state.faIconsLoading) {
      // Wait for an in-flight fetch
      while (state.faIconsLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return state.faIconsIndex;
    }

    state.faIconsLoading = true;
    dom.faResults.dataset.empty = "Loading icon library...";
    try {
      const response = await fetch(FONTAWESOME_ICONS_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();

      // Build a flat searchable index of free icons
      const index = [];
      for (const [name, entry] of Object.entries(raw)) {
        const freeStyles = entry.free;
        if (!freeStyles || !freeStyles.length) continue;

        for (const style of freeStyles) {
          const svgData = entry.svg?.[style];
          if (!svgData?.path) continue;

          const searchTerms = [
            name,
            ...(name.split("-")),
            entry.label || "",
            ...(entry.search?.terms || []),
          ].join(" ").toLowerCase();

          index.push({
            name,
            style,
            label: entry.label || name,
            terms: searchTerms,
            path: svgData.path,
            width: svgData.width || 512,
            height: svgData.height || 512,
            viewBox: svgData.viewBox
              ? svgData.viewBox.join(" ")
              : `0 0 ${svgData.width || 512} ${svgData.height || 512}`,
          });
        }
      }

      state.faIconsIndex = index;
      dom.faResults.dataset.empty = "Type to search icons.";
      return index;
    } catch (error) {
      console.error("Failed to load Font Awesome metadata:", error);
      dom.faResults.dataset.empty = "Failed to load icon library.";
      return null;
    } finally {
      state.faIconsLoading = false;
    }
  }

  async function searchFontAwesomeIcons() {
    const query = dom.faSearch.value.trim().toLowerCase();
    const style = dom.faStyle.value;

    if (!query) {
      dom.faResults.innerHTML = "";
      dom.faResults.dataset.empty = "Type to search icons.";
      return;
    }

    const index = await ensureFontAwesomeIndex();
    if (!index) return;

    const terms = query.split(/\s+/);
    const matches = index.filter((icon) => {
      if (icon.style !== style) return false;
      return terms.every((term) => icon.terms.includes(term));
    });

    const maxResults = 60;
    const shown = matches.slice(0, maxResults);

    if (!shown.length) {
      dom.faResults.innerHTML = "";
      dom.faResults.dataset.empty = `No ${style} icons match "${query}".`;
      return;
    }

    dom.faResults.dataset.empty = "";
    dom.faResults.innerHTML = shown.map((icon) => {
      const selected = state.faSelectedIcon
        && state.faSelectedIcon.name === icon.name
        && state.faSelectedIcon.style === icon.style;
      return `<div class="fa-icon-cell${selected ? " is-selected" : ""}" data-icon-name="${icon.name}" data-icon-style="${icon.style}" title="${icon.label}"><svg viewBox="${icon.viewBox}"><path d="${icon.path}"/></svg></div>`;
    }).join("");
  }

  function selectFontAwesomeIcon(name, style) {
    const index = state.faIconsIndex;
    if (!index) return;

    const icon = index.find((entry) => entry.name === name && entry.style === style);
    if (!icon) return;

    state.faSelectedIcon = icon;
    dom.faSelectedLabel.textContent = `${icon.label} (${icon.style})`;
    dom.faGenerate.disabled = false;

    // Update selection highlight
    for (const cell of dom.faResults.querySelectorAll(".fa-icon-cell")) {
      cell.classList.toggle(
        "is-selected",
        cell.dataset.iconName === name && cell.dataset.iconStyle === style,
      );
    }

    // Auto-generate on click
    generateModelFromFontAwesomeIcon();
  }

  function buildSvgFromFontAwesomeIcon(icon) {
    const pathData = Array.isArray(icon.path) ? icon.path.join(" ") : icon.path;
    const fillColor = rgb24ToCssHex(GENERATED_FONT_ICON_FILL_RGB24);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}"><path d="${pathData}" fill="${fillColor}" fill-rule="nonzero"/></svg>`;
  }

  async function generateModelFromFontAwesomeIcon() {
    const icon = state.faSelectedIcon;
    if (!icon) return;

    dom.faGenerate.disabled = true;
    dom.svgImportStatus.textContent = `Generating ${icon.label}...`;

    try {
      const svgText = buildSvgFromFontAwesomeIcon(icon);
      const sourceName = `fa-${icon.style}-${icon.name}`;
      await loadSvgText(svgText, sourceName, {
        sourceKind: "icon",
        skinFillRgb24: GENERATED_FONT_ICON_FILL_RGB24,
      });
    } catch (error) {
      console.error(error);
      dom.svgImportStatus.textContent = `Icon generation failed: ${error.message}`;
    } finally {
      dom.faGenerate.disabled = !state.faSelectedIcon;
    }
  }

  function isSvgManualGenerateSource(pendingOptions) {
    const sourceKind = pendingOptions?.sourceKind || "svg";
    return sourceKind === "svg";
  }

  // Maps the 0-100 "Simplify" slider to a multiplier on the lossless tolerance
  // floor. 0 stays at 1x (nothing visible removed); higher values scale the
  // tolerance geometrically up to SIMPLIFY_MAX_MULTIPLIER for low-poly output.
  const SIMPLIFY_MAX_MULTIPLIER = 32;

  function getSimplifyStrength() {
    if (!dom.svgSimplify) return 1;
    const raw = clamp(parseFloat(dom.svgSimplify.value) || 0, 0, 100);
    if (raw <= 0) return 1;
    return Math.pow(SIMPLIFY_MAX_MULTIPLIER, raw / 100);
  }

  function updateSimplifyLabel() {
    if (!dom.svgSimplifyValue) return;
    const strength = getSimplifyStrength();
    dom.svgSimplifyValue.textContent = strength <= 1.0001 ? "Lossless" : `${strength.toFixed(1)}×`;
  }

  function describeContourOptimization(stats) {
    if (!stats?.removedPoints) {
      return "";
    }
    const before = Math.round(stats.beforePoints);
    const after = Math.round(stats.afterPoints);
    const removed = Math.round(stats.removedPoints);
    const percent = before > 0 ? Math.round((removed / before) * 100) : 0;
    return ` Outline cleanup reduced source points ${before} -> ${after} (-${percent}%).`;
  }

  function describeGeometryCleanup(stats) {
    if (!stats?.removedTriangles) {
      return "";
    }
    return ` Mesh cleanup removed ${Math.round(stats.removedTriangles)} collapsed ${stats.removedTriangles === 1 ? "triangle" : "triangles"}.`;
  }

  async function loadSvgText(text, sourceName, pendingOptions = null) {
    try {
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) throw new Error("No <svg> element found");
      state.svgPendingText = text;
      state.svgPendingName = sourceName;
      state.svgPendingOptions = pendingOptions ? { ...pendingOptions } : null;
      dom.svgImportGenerate.disabled = !isSvgManualGenerateSource(state.svgPendingOptions);
      dom.svgImportStatus.textContent = `Loaded ${sourceName}. Generating...`;
      dom.svgImportPanel.open = true;
      await generateModelFromPendingSvg();
    } catch (error) {
      state.svgPendingText = null;
      state.svgPendingName = "";
      state.svgPendingOptions = null;
      dom.svgImportGenerate.disabled = true;
      dom.svgImportStatus.textContent = `Failed to load SVG: ${error.message}`;
    }
  }

  async function loadSvgFile(file) {
    const text = await file.text();
    await loadSvgText(text, file.name, { sourceKind: "svg" });
  }

  async function generateModelFromPendingSvg() {
    if (!state.svgPendingText) return;
    if (!state.paletteRGBA) {
      dom.svgImportStatus.textContent = "No palette available for skin generation.";
      dom.svgImportGenerate.disabled = !isSvgManualGenerateSource(state.svgPendingOptions);
      return;
    }

    dom.svgImportGenerate.disabled = true;
    dom.svgImportStatus.textContent = "Generating...";

    try {
      const pendingOptions = state.svgPendingOptions ? { ...state.svgPendingOptions } : {};
      const simplifyStrength = getSimplifyStrength();

      const options = {
        thickness: parseFloat(dom.svgThickness.value) || 16,
        bevelWidth: parseFloat(dom.svgBevelWidth.value) || 0,
        bevelSegments: Math.max(0, Math.min(2, parseInt(dom.svgBevelSegments.value, 10) || 0)),
        skinWidth: Math.max(16, Math.min(1024, parseInt(dom.svgSkinWidth.value, 10) || 1024)),
        skinHeight: Math.max(16, Math.min(1024, parseInt(dom.svgSkinHeight.value, 10) || 1024)),
        modelScale: parseFloat(dom.svgModelScale.value) || 64,
        useContourSkin: !!pendingOptions.useContourSkin,
        preferEarcut: pendingOptions.sourceKind === "font",
        simplifyContours: true,
        simplifyStrength,
        skinFillRgb24: Number.isFinite(pendingOptions.skinFillRgb24) ? pendingOptions.skinFillRgb24 : 0x000000,
      };
      state.svgPendingOptions = pendingOptions;

      const model = await buildModelFromSvg(state.svgPendingText, options);
      activateGeneratedModel(model, state.svgPendingName);
      const contourNote = describeContourOptimization(model.contourOptimization);
      const geometryNote = describeGeometryCleanup(model.geometryCleanup);
      dom.svgImportStatus.textContent = model.importWarning
        ? `\nGenerated MDL with fallback: ${model.numVerts} verts, ${model.numTris} tris. ${model.importWarning}${contourNote}${geometryNote}`
        : `\nGenerated MDL: ${model.numVerts} verts, ${model.numTris} tris.${contourNote}${geometryNote}`;
      dom.svgImportGenerate.disabled = !isSvgManualGenerateSource(pendingOptions);
    } catch (error) {
      console.error(error);
      dom.svgImportStatus.textContent = `Generation failed: ${error.message}`;
      dom.svgImportGenerate.disabled = !isSvgManualGenerateSource(state.svgPendingOptions);
    }
  }

  function activateGeneratedModel(model, sourceName) {
    model.render = buildRenderData(model);
    model.frameGroups = buildFrameGroups(model);
    model.importSourceKind = state.svgPendingOptions?.sourceKind || "svg";

    const syntheticKey = `svg:${sourceName || "import"}.mdl`;
    state.assets.set(syntheticKey, {
      key: syntheticKey,
      path: model.path,
      source: "svg-import",
      kind: "mdl",
      bytes: null,
    });
    refreshModelList();

    state.model = model;
    state.currentModelKey = syntheticKey;
    dom.modelSelect.value = syntheticKey;
    dom.modelStatus.textContent = model.path;
    state.frameTreeOpen = new Set(model.frameGroups.map((_, index) => index));

    populateFrameGroupList(model);
    renderFrameTree(model);
    populateSkinList(model);
    populateProperties(model);
    updateValidationPanel();
    setSaveStatus(model.importWarning
      ? `SVG model generated with fallback. ${model.importWarning}`
      : canExportModelAsMap(model)
        ? "SVG model generated. Edit properties and save as .mdl or .map."
        : "SVG model generated. Edit properties and save as .mdl.");

    const defaultFrameGroupIndex = findFirstPlayableFrameGroupIndex(model);
    state.selectedFrameGroupIndex = defaultFrameGroupIndex >= 0 ? defaultFrameGroupIndex : 0;
    dom.frameGroupSelect.value = String(state.selectedFrameGroupIndex);
    state.selectedSkinIndex = 0;
    dom.skinSelect.value = "0";
    clearSkinPaletteSelection(true);
    state.recolorEnabled = false;
    dom.recolorToggle.checked = false;
    syncPlayerColorControls();
    state.playhead = 0;
    state.manualFrameIndex = 0;
    state.playing = false;
    if (model.importSourceKind === "font") {
      state.renderMode = "textured";
      state.modelOpacity = 1;
      state.wireframeOverlay = false;
    }
    updateTimelineRange();
    resetCamera(model.importSourceKind);
    updatePlaybackControls();
    syncModelDependentPanels();
    syncDisplayControls();
    updateSkinStatus();
    syncFrameTreeSelection(0);
    state.textureDirty = true;
    state.geometryDirty = true;
    uploadModelBuffers();
    hideOverlay();
  }

  // ── End SVG-to-MDL ──────────────────────────────────────────────────────────

  function parseMDL(bytes, path) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;

    const ident = readASCII(view, offset, 4);
    offset += 4;
    if (ident !== "IDPO") {
      throw new Error(`Expected IDPO header, got ${ident}`);
    }

    const version = view.getInt32(offset, true);
    offset += 4;
    if (version !== 6) {
      throw new Error(`Unsupported MDL version ${version}`);
    }

    const scale = readVec3(view, offset);
    offset += 12;
    const scaleOrigin = readVec3(view, offset);
    offset += 12;
    const boundingRadius = view.getFloat32(offset, true);
    offset += 4;
    const eyePosition = readVec3(view, offset);
    offset += 12;
    const numSkins = view.getInt32(offset, true);
    offset += 4;
    const skinWidth = view.getInt32(offset, true);
    offset += 4;
    const skinHeight = view.getInt32(offset, true);
    offset += 4;
    const numVerts = view.getInt32(offset, true);
    offset += 4;
    const numTris = view.getInt32(offset, true);
    offset += 4;
    const numFrames = view.getInt32(offset, true);
    offset += 4;
    const syncType = view.getInt32(offset, true);
    offset += 4;
    const flags = view.getInt32(offset, true);
    offset += 4;
    const size = view.getFloat32(offset, true);
    offset += 4;

    const skinPixelCount = skinWidth * skinHeight;
    const skins = [];
    for (let skinIndex = 0; skinIndex < numSkins; skinIndex++) {
      const skinType = view.getInt32(offset, true);
      offset += 4;

      if (skinType === 0) {
        const skinBytes = bytes.slice(offset, offset + skinPixelCount);
        offset += skinPixelCount;
        skins.push({
          type: "single",
          frames: [skinBytes],
          intervals: [DEFAULT_FRAME_DURATION],
        });
      } else {
        const groupCount = view.getInt32(offset, true);
        offset += 4;
        const intervals = [];
        for (let i = 0; i < groupCount; i++) {
          intervals.push(view.getFloat32(offset, true));
          offset += 4;
        }

        const frames = [];
        for (let i = 0; i < groupCount; i++) {
          frames.push(bytes.slice(offset, offset + skinPixelCount));
          offset += skinPixelCount;
        }

        skins.push({
          type: "group",
          frames,
          intervals,
        });
      }
    }

    const stVerts = new Array(numVerts);
    for (let vertexIndex = 0; vertexIndex < numVerts; vertexIndex++) {
      stVerts[vertexIndex] = {
        onseam: view.getInt32(offset, true),
        s: view.getInt32(offset + 4, true),
        t: view.getInt32(offset + 8, true),
      };
      offset += 12;
    }

    const triangles = new Array(numTris);
    for (let triIndex = 0; triIndex < numTris; triIndex++) {
      triangles[triIndex] = {
        facesfront: view.getInt32(offset, true),
        vertIndex: [
          view.getInt32(offset + 4, true),
          view.getInt32(offset + 8, true),
          view.getInt32(offset + 12, true),
        ],
      };
      offset += 16;
    }

    const poses = [];
    const topFrames = [];

    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      const frameType = view.getInt32(offset, true);
      offset += 4;

      if (frameType === 0) {
        const parsed = parseSimpleFrame(view, bytes, offset, numVerts, scale, scaleOrigin);
        poses.push({
          name: parsed.name,
          positions: parsed.positions,
        });
        topFrames.push({
          type: "single",
          name: parsed.name || `frame_${frameIndex}`,
          poseIndices: [poses.length - 1],
          intervals: [DEFAULT_FRAME_DURATION],
        });
        offset = parsed.offset;
      } else {
        const groupCount = view.getInt32(offset, true);
        offset += 4;

        // bbox min + max, not needed for rendering.
        offset += 8;

        const intervals = [];
        for (let i = 0; i < groupCount; i++) {
          intervals.push(view.getFloat32(offset, true));
          offset += 4;
        }

        const poseIndices = [];
        const poseNames = [];
        for (let i = 0; i < groupCount; i++) {
          const parsed = parseSimpleFrame(view, bytes, offset, numVerts, scale, scaleOrigin);
          poses.push({
            name: parsed.name,
            positions: parsed.positions,
          });
          poseIndices.push(poses.length - 1);
          poseNames.push(parsed.name);
          offset = parsed.offset;
        }

        topFrames.push({
          type: "group",
          name: poseNames.find(Boolean) || `group_${frameIndex}`,
          poseIndices,
          intervals,
        });
      }
    }

    return {
      path,
      version,
      scale,
      scaleOrigin,
      boundingRadius,
      eyePosition,
      numSkins,
      skinWidth,
      skinHeight,
      numVerts,
      numTris,
      numFrames,
      synctype: syncType,
      syncType,
      flags,
      size,
      skins,
      stVerts,
      triangles,
      topFrames,
      poses,
    };
  }

  function parseSimpleFrame(view, bytes, offset, numVerts, scale, scaleOrigin) {
    offset += 4; // bbox min
    offset += 4; // bbox max
    const name = readASCII(view, offset, 16).replace(/\0.*$/, "");
    offset += 16;

    const positions = new Float32Array(numVerts * 3);
    for (let i = 0; i < numVerts; i++) {
      const packedX = bytes[offset++];
      const packedY = bytes[offset++];
      const packedZ = bytes[offset++];
      offset += 1; // lightnormalindex

      positions[i * 3 + 0] = scale[0] * packedX + scaleOrigin[0];
      positions[i * 3 + 1] = scale[1] * packedY + scaleOrigin[1];
      positions[i * 3 + 2] = scale[2] * packedZ + scaleOrigin[2];
    }

    return {
      name,
      positions,
      offset,
    };
  }

  function serializeMDL(model) {
    const chunks = [];
    const topFrames = model.topFrames && model.topFrames.length
      ? model.topFrames
      : model.poses.map((pose, index) => ({
          type: "single",
          name: pose.name || `frame_${index}`,
          poseIndices: [index],
          intervals: [DEFAULT_FRAME_DURATION],
        }));
    const packedPoses = model.poses.map((pose) => packPoseVertices(pose.positions, model.scale, model.scaleOrigin));

    appendFixedASCII(chunks, "IDPO", 4);
    appendInt32LE(chunks, model.version || 6);
    model.scale.forEach((value) => appendFloat32LE(chunks, value));
    model.scaleOrigin.forEach((value) => appendFloat32LE(chunks, value));
    appendFloat32LE(chunks, Number.isFinite(model.boundingRadius) ? model.boundingRadius : model.render.bounds.radius);
    model.eyePosition.forEach((value) => appendFloat32LE(chunks, value));
    appendInt32LE(chunks, model.skins.length);
    appendInt32LE(chunks, model.skinWidth);
    appendInt32LE(chunks, model.skinHeight);
    appendInt32LE(chunks, model.numVerts);
    appendInt32LE(chunks, model.numTris);
    appendInt32LE(chunks, topFrames.length);
    appendInt32LE(chunks, model.synctype | 0);
    appendInt32LE(chunks, model.flags | 0);
    appendFloat32LE(chunks, Number.isFinite(model.size) ? model.size : 0);

    model.skins.forEach((skin) => {
      const isGroup = skin.frames.length > 1 || skin.type === "group";
      appendInt32LE(chunks, isGroup ? 1 : 0);
      if (!isGroup) {
        chunks.push(new Uint8Array(skin.frames[0]));
        return;
      }

      appendInt32LE(chunks, skin.frames.length);
      const skinIntervals = deriveIntervalsFromDurations(deriveDurations(skin.intervals, skin.frames.length));
      for (let i = 0; i < skin.frames.length; i++) {
        appendFloat32LE(chunks, skinIntervals[i] ?? ((i + 1) * DEFAULT_FRAME_DURATION));
      }
      skin.frames.forEach((frameBytes) => {
        chunks.push(new Uint8Array(frameBytes));
      });
    });

    model.stVerts.forEach((st) => {
      appendInt32LE(chunks, st.onseam | 0);
      appendInt32LE(chunks, st.s | 0);
      appendInt32LE(chunks, st.t | 0);
    });

    model.triangles.forEach((triangle) => {
      appendInt32LE(chunks, triangle.facesfront | 0);
      triangle.vertIndex.forEach((index) => appendInt32LE(chunks, index | 0));
    });

    topFrames.forEach((frame, frameIndex) => {
      const poseIndices = frame.poseIndices && frame.poseIndices.length ? frame.poseIndices : [frameIndex];
      const isGroup = frame.type === "group" || poseIndices.length > 1;

      appendInt32LE(chunks, isGroup ? 1 : 0);
      if (!isGroup) {
        writeSimpleFrameChunk(chunks, packedPoses[poseIndices[0]], model.poses[poseIndices[0]]?.name || frame.name || `frame_${frameIndex}`);
        return;
      }

      appendInt32LE(chunks, poseIndices.length);
      const groupBounds = computePackedGroupBounds(poseIndices.map((poseIndex) => packedPoses[poseIndex]));
      appendPackedBounds(chunks, groupBounds.min);
      appendPackedBounds(chunks, groupBounds.max);

      const intervals = frame.intervals && frame.intervals.length
        ? frame.intervals
        : deriveIntervalsFromDurations(deriveDurations(frame.intervals, poseIndices.length));
      for (let i = 0; i < poseIndices.length; i++) {
        appendFloat32LE(chunks, intervals[i] ?? intervals[intervals.length - 1] ?? ((i + 1) * DEFAULT_FRAME_DURATION));
      }

      poseIndices.forEach((poseIndex, poseOffset) => {
        writeSimpleFrameChunk(
          chunks,
          packedPoses[poseIndex],
          model.poses[poseIndex]?.name || frame.name || `frame_${frameIndex}_${poseOffset}`
        );
      });
    });

    return concatChunks(chunks);
  }

  function packPoseVertices(positions, scale, scaleOrigin) {
    const packed = new Uint8Array((positions.length / 3) * 4);
    for (let i = 0, out = 0; i < positions.length; i += 3, out += 4) {
      packed[out + 0] = packAliasCoord(positions[i + 0], scale[0], scaleOrigin[0]);
      packed[out + 1] = packAliasCoord(positions[i + 1], scale[1], scaleOrigin[1]);
      packed[out + 2] = packAliasCoord(positions[i + 2], scale[2], scaleOrigin[2]);
      packed[out + 3] = 0;
    }
    return packed;
  }

  function packAliasCoord(value, scale, origin) {
    if (!Number.isFinite(scale) || Math.abs(scale) < 1e-6) {
      return 0;
    }
    return clamp(Math.round((value - origin) / scale), 0, 255);
  }

  function writeSimpleFrameChunk(chunks, packedPose, name) {
    const bounds = computePackedBounds(packedPose);
    appendPackedBounds(chunks, bounds.min);
    appendPackedBounds(chunks, bounds.max);
    appendFixedASCII(chunks, name || "", 16);
    chunks.push(packedPose);
  }

  function computePackedBounds(packedPose) {
    const min = [255, 255, 255];
    const max = [0, 0, 0];

    for (let i = 0; i < packedPose.length; i += 4) {
      min[0] = Math.min(min[0], packedPose[i + 0]);
      min[1] = Math.min(min[1], packedPose[i + 1]);
      min[2] = Math.min(min[2], packedPose[i + 2]);
      max[0] = Math.max(max[0], packedPose[i + 0]);
      max[1] = Math.max(max[1], packedPose[i + 1]);
      max[2] = Math.max(max[2], packedPose[i + 2]);
    }

    return { min, max };
  }

  function computePackedGroupBounds(packedPoses) {
    const min = [255, 255, 255];
    const max = [0, 0, 0];

    packedPoses.forEach((packedPose) => {
      const bounds = computePackedBounds(packedPose);
      min[0] = Math.min(min[0], bounds.min[0]);
      min[1] = Math.min(min[1], bounds.min[1]);
      min[2] = Math.min(min[2], bounds.min[2]);
      max[0] = Math.max(max[0], bounds.max[0]);
      max[1] = Math.max(max[1], bounds.max[1]);
      max[2] = Math.max(max[2], bounds.max[2]);
    });

    return { min, max };
  }

  function appendPackedBounds(chunks, vector) {
    const bytes = new Uint8Array(4);
    bytes[0] = vector[0] | 0;
    bytes[1] = vector[1] | 0;
    bytes[2] = vector[2] | 0;
    bytes[3] = 0;
    chunks.push(bytes);
  }

  function deriveIntervalsFromDurations(durations) {
    const intervals = [];
    let total = 0;
    durations.forEach((duration) => {
      total += Math.max(duration || DEFAULT_FRAME_DURATION, 0.001);
      intervals.push(total);
    });
    return intervals;
  }

  function appendInt32LE(chunks, value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value | 0, true);
    chunks.push(bytes);
  }

  function appendFloat32LE(chunks, value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setFloat32(0, Number(value) || 0, true);
    chunks.push(bytes);
  }

  function appendFixedASCII(chunks, text, length) {
    const bytes = new Uint8Array(length);
    const safe = String(text || "");
    for (let i = 0; i < Math.min(length, safe.length); i++) {
      bytes[i] = safe.charCodeAt(i) & 0xff;
    }
    chunks.push(bytes);
  }

  function concatChunks(chunks) {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(totalLength);
    let offset = 0;
    chunks.forEach((chunk) => {
      out.set(chunk, offset);
      offset += chunk.length;
    });
    return out;
  }

  function buildRenderData(model) {
    const vertexMap = new Map();
    const expanded = [];
    const indexList = [];

    for (const triangle of model.triangles) {
      for (let i = 0; i < 3; i++) {
        const originalIndex = triangle.vertIndex[i];
        const st = model.stVerts[originalIndex];
        let s = st.s;
        let t = st.t;

        if (!triangle.facesfront && st.onseam) {
          s += model.skinWidth / 2;
        }

        const key = `${originalIndex}:${s}:${t}`;
        let renderIndex = vertexMap.get(key);
        if (renderIndex === undefined) {
          renderIndex = expanded.length;
          vertexMap.set(key, renderIndex);
          expanded.push({
            originalIndex,
            s,
            t,
          });
        }

        indexList.push(renderIndex);
      }
    }

    if (expanded.length > 65535) {
      throw new Error(`Render mesh exceeds WebGL uint16 index limit: ${expanded.length}`);
    }

    const vertexCount = expanded.length;
    const uvs = new Float32Array(vertexCount * 2);
    const originalIndices = new Uint32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const vertex = expanded[i];
      originalIndices[i] = vertex.originalIndex;
      uvs[i * 2 + 0] = (vertex.s + 0.5) / model.skinWidth;
      uvs[i * 2 + 1] = (vertex.t + 0.5) / model.skinHeight;
    }

    const positionsByPose = model.poses.map((pose) => {
      const positions = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount; i++) {
        const sourceIndex = originalIndices[i] * 3;
        positions[i * 3 + 0] = pose.positions[sourceIndex + 0];
        positions[i * 3 + 1] = pose.positions[sourceIndex + 1];
        positions[i * 3 + 2] = pose.positions[sourceIndex + 2];
      }
      return positions;
    });

    const indices = new Uint16Array(indexList);
    const wireframeIndices = buildWireframeIndices(indices);
    const normalsByPose = positionsByPose.map((positions) => computeSmoothNormals(positions, indices));
    const bounds = computeBounds(positionsByPose);

    return {
      vertexCount,
      indices,
      wireframeIndices,
      uvs,
      originalIndices,
      positionsByPose,
      normalsByPose,
      bounds,
    };
  }

  function buildTimeline(model) {
    const timeline = [];

    model.topFrames.forEach((frame, frameIndex) => {
      const durations = deriveDurations(frame.intervals, frame.poseIndices.length);
      frame.poseIndices.forEach((poseIndex, poseOffset) => {
        const poseName = model.poses[poseIndex].name || `${frame.name}_${poseOffset}`;
        timeline.push({
          frameIndex,
          poseIndex,
          name: poseName,
          duration: durations[poseOffset],
        });
      });
    });

    if (!timeline.length && model.poses.length) {
      timeline.push({
        frameIndex: 0,
        poseIndex: 0,
        name: model.poses[0].name || "pose_0",
        duration: DEFAULT_FRAME_DURATION,
      });
    }

    timeline.totalDuration = timeline.reduce((sum, entry) => sum + entry.duration, 0);
    return timeline;
  }

  function buildFrameGroups(model) {
    const poseEntries = buildPoseEntries(model);
    if (!poseEntries.length) {
      return [];
    }

    const groups = [];
    if (poseEntries.length > 1) {
      groups.push(finalizeFrameGroup({
        type: "all",
        name: "all",
        treeLabel: "All",
        poseIndices: poseEntries.map((entry) => entry.poseIndex),
        durations: poseEntries.map((entry) => entry.duration),
        poseNames: poseEntries.map((entry) => entry.name),
        topFrameIndices: poseEntries.map((entry) => entry.topFrameIndex),
        topFramePoseOffsets: poseEntries.map((entry) => entry.topFramePoseOffset),
      }));
    }

    let currentGroup = null;
    poseEntries.forEach((entry, entryIndex) => {
      const sequenceName = inferSequenceName(entry.name, entryIndex);
      if (!currentGroup || currentGroup.name !== sequenceName) {
        if (currentGroup) {
          groups.push(finalizeFrameGroup(currentGroup));
        }
        currentGroup = {
          type: "sequence",
          name: sequenceName,
          treeLabel: sequenceName,
          poseIndices: [],
          durations: [],
          poseNames: [],
          topFrameIndices: [],
          topFramePoseOffsets: [],
        };
      }

      currentGroup.poseIndices.push(entry.poseIndex);
      currentGroup.durations.push(entry.duration);
      currentGroup.poseNames.push(entry.name);
      currentGroup.topFrameIndices.push(entry.topFrameIndex);
      currentGroup.topFramePoseOffsets.push(entry.topFramePoseOffset);
    });

    if (currentGroup) {
      groups.push(finalizeFrameGroup(currentGroup));
    }

    return groups;
  }

  function buildPoseEntries(model) {
    if (!model.topFrames.length) {
      return model.poses.map((pose, poseIndex) => ({
        poseIndex,
        name: pose.name || `pose_${poseIndex}`,
        duration: DEFAULT_FRAME_DURATION,
        topFrameIndex: -1,
        topFramePoseOffset: 0,
      }));
    }

    const entries = [];
    model.topFrames.forEach((frame, frameIndex) => {
      const durations = deriveDurations(frame.intervals, frame.poseIndices.length);
      frame.poseIndices.forEach((poseIndex, poseOffset) => {
        entries.push({
          poseIndex,
          name: model.poses[poseIndex]?.name || frame.name || `frame_${frameIndex}_${poseOffset}`,
          duration: Math.max(durations[poseOffset] || DEFAULT_FRAME_DURATION, 0.001),
          topFrameIndex: frameIndex,
          topFramePoseOffset: poseOffset,
        });
      });
    });
    return entries;
  }

  function finalizeFrameGroup(group) {
    const poseCount = Math.max(group.poseIndices.length, 1);
    const baseLabel = group.type === "all"
      ? "all"
      : (group.treeLabel || group.name || group.poseNames?.[0] || "group");
    const poseName = group.poseNames?.[0] || baseLabel;

    return {
      ...group,
      label: poseCount > 1 ? `${baseLabel} (${poseCount} poses)` : poseName,
      poseName,
      totalDuration: group.durations.reduce((sum, value) => sum + value, 0) || DEFAULT_FRAME_DURATION,
    };
  }

  function inferSequenceName(name, fallbackIndex) {
    const cleanName = (name || `frame_${fallbackIndex}`).trim();
    const stripped = cleanName.replace(/[0-9]+$/, "");
    return stripped || cleanName;
  }

  function deriveDurations(intervals, count) {
    if (!intervals || !intervals.length) {
      return new Array(count).fill(DEFAULT_FRAME_DURATION);
    }

    const durations = new Array(count);
    let increasing = true;
    for (let i = 1; i < intervals.length; i++) {
      if (!(intervals[i] > intervals[i - 1])) {
        increasing = false;
        break;
      }
    }

    if (increasing && intervals[0] > 0) {
      durations[0] = intervals[0];
      for (let i = 1; i < count; i++) {
        const current = intervals[i] ?? intervals[intervals.length - 1];
        const previous = intervals[i - 1] ?? 0;
        durations[i] = Math.max(current - previous, 0.001);
      }
      return durations;
    }

    for (let i = 0; i < count; i++) {
      durations[i] = Math.max(intervals[i] || DEFAULT_FRAME_DURATION, 0.001);
    }
    return durations;
  }

  function computePoseStartTime(group, poseIndex) {
    if (!group || !group.durations || !group.durations.length) {
      return 0;
    }

    let time = 0;
    const limit = clamp(poseIndex, 0, group.durations.length - 1);
    for (let i = 0; i < limit; i++) {
      time += Math.max(group.durations[i] || DEFAULT_FRAME_DURATION, 0.001);
    }
    return time;
  }

  function buildWireframeIndices(indices) {
    const edgeSet = new Set();
    const lineIndices = [];

    function addEdge(a, b) {
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      const key = `${min}:${max}`;
      if (edgeSet.has(key)) {
        return;
      }
      edgeSet.add(key);
      lineIndices.push(min, max);
    }

    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i + 0];
      const b = indices[i + 1];
      const c = indices[i + 2];
      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }

    return new Uint16Array(lineIndices);
  }

  function computeSmoothNormals(positions, indices) {
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      const ax = positions[i1 + 0] - positions[i0 + 0];
      const ay = positions[i1 + 1] - positions[i0 + 1];
      const az = positions[i1 + 2] - positions[i0 + 2];
      const bx = positions[i2 + 0] - positions[i0 + 0];
      const by = positions[i2 + 1] - positions[i0 + 1];
      const bz = positions[i2 + 2] - positions[i0 + 2];

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;

      normals[i0 + 0] += nx;
      normals[i0 + 1] += ny;
      normals[i0 + 2] += nz;
      normals[i1 + 0] += nx;
      normals[i1 + 1] += ny;
      normals[i1 + 2] += nz;
      normals[i2 + 0] += nx;
      normals[i2 + 1] += ny;
      normals[i2 + 2] += nz;
    }

    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i + 0];
      const ny = normals[i + 1];
      const nz = normals[i + 2];
      const length = Math.hypot(nx, ny, nz) || 1;
      normals[i + 0] = nx / length;
      normals[i + 1] = ny / length;
      normals[i + 2] = nz / length;
    }

    return normals;
  }

  function computeBounds(positionsByPose) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (const positions of positionsByPose) {
      for (let i = 0; i < positions.length; i += 3) {
        min[0] = Math.min(min[0], positions[i + 0]);
        min[1] = Math.min(min[1], positions[i + 1]);
        min[2] = Math.min(min[2], positions[i + 2]);
        max[0] = Math.max(max[0], positions[i + 0]);
        max[1] = Math.max(max[1], positions[i + 1]);
        max[2] = Math.max(max[2], positions[i + 2]);
      }
    }

    const center = [
      (min[0] + max[0]) * 0.5,
      (min[1] + max[1]) * 0.5,
      (min[2] + max[2]) * 0.5,
    ];
    let radius = 1;
    for (const positions of positionsByPose) {
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i + 0] - center[0];
        const dy = positions[i + 1] - center[1];
        const dz = positions[i + 2] - center[2];
        radius = Math.max(radius, Math.hypot(dx, dy, dz));
      }
    }

    return {
      min,
      max,
      center,
      radius,
    };
  }

  function resetObjectToolsInputs() {
    dom.objMoveX.value = 0;
    dom.objMoveY.value = 0;
    dom.objMoveZ.value = 0;
    dom.objRotateX.value = 0;
    dom.objRotateY.value = 0;
    dom.objRotateZ.value = 0;
    dom.objScaleX.value = 1;
    dom.objScaleY.value = 1;
    dom.objScaleZ.value = 1;
  }

  function getScopedPoseIndices(render, scope) {
    const poseIndices = [];
    if (scope === "all") {
      for (let i = 0; i < render.positionsByPose.length; i++) {
        poseIndices.push(i);
      }
    } else {
      const sample = getCurrentPoseSample();
      if (sample) {
        poseIndices.push(sample.poseA);
        if (sample.poseB !== sample.poseA) {
          poseIndices.push(sample.poseB);
        }
      }
    }

    return [...new Set(poseIndices)];
  }

  function computeScopedBounds(render, poseIndices) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    poseIndices.forEach((poseIndex) => {
      const positions = render.positionsByPose[poseIndex];
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i + 0];
        const y = positions[i + 1];
        const z = positions[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
    });

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    };
  }

  function translateScopedPoses(render, poseIndices, tx, ty, tz) {
    poseIndices.forEach((poseIndex) => {
      const positions = render.positionsByPose[poseIndex];
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 0] += tx;
        positions[i + 1] += ty;
        positions[i + 2] += tz;
      }
    });
  }

  function finalizeGeometryEdit(message) {
    syncRenderGeometryToModel(state.model);
    rebuildRenderBounds(state.model.render);
    populateProperties(state.model);
    updateValidationPanel();
    state.geometryDirty = true;
    setSaveStatus(message);
    resetObjectToolsInputs();
  }

  function centerModelOnOrigin() {
    if (!state.model) {
      return;
    }

    const render = state.model.render;
    const poseIndices = getScopedPoseIndices(render, dom.objToolsScope.value);
    if (!poseIndices.length) {
      return;
    }

    const bounds = computeScopedBounds(render, poseIndices);
    translateScopedPoses(render, poseIndices, -bounds.center[0], -bounds.center[1], -bounds.center[2]);
    finalizeGeometryEdit("Centered selected scope on origin. Save .mdl to export changes.");
  }

  function alignModelToGround() {
    if (!state.model) {
      return;
    }

    const render = state.model.render;
    const poseIndices = getScopedPoseIndices(render, dom.objToolsScope.value);
    if (!poseIndices.length) {
      return;
    }

    const bounds = computeScopedBounds(render, poseIndices);
    translateScopedPoses(render, poseIndices, 0, 0, -bounds.min[2]);
    finalizeGeometryEdit("Aligned selected scope to ground. Save .mdl to export changes.");
  }

  function applyObjectTransform() {
    if (!state.model) {
      return;
    }

    const tx = parseFloat(dom.objMoveX.value) || 0;
    const ty = parseFloat(dom.objMoveY.value) || 0;
    const tz = parseFloat(dom.objMoveZ.value) || 0;
    const rx = (parseFloat(dom.objRotateX.value) || 0) * Math.PI / 180;
    const ry = (parseFloat(dom.objRotateY.value) || 0) * Math.PI / 180;
    const rz = (parseFloat(dom.objRotateZ.value) || 0) * Math.PI / 180;
    const sx = parseFloat(dom.objScaleX.value) || 1;
    const sy = parseFloat(dom.objScaleY.value) || 1;
    const sz = parseFloat(dom.objScaleZ.value) || 1;

    const isIdentity = tx === 0 && ty === 0 && tz === 0 &&
      rx === 0 && ry === 0 && rz === 0 &&
      sx === 1 && sy === 1 && sz === 1;
    if (isIdentity) {
      return;
    }

    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

    const scope = dom.objToolsScope.value;
    const render = state.model.render;
    const poseIndices = getScopedPoseIndices(render, scope);
    if (!poseIndices.length) {
      return;
    }

    const bounds = computeScopedBounds(render, poseIndices);
    const cx = bounds.center[0];
    const cy = bounds.center[1];
    const cz = bounds.center[2];

    for (const poseIndex of poseIndices) {
      const positions = render.positionsByPose[poseIndex];
      const normals = render.normalsByPose[poseIndex];

      for (let i = 0; i < positions.length; i += 3) {
        let px = (positions[i + 0] - cx) * sx;
        let py = (positions[i + 1] - cy) * sy;
        let pz = (positions[i + 2] - cz) * sz;

        // Rotate X
        let t = py;
        py = t * cosX - pz * sinX;
        pz = t * sinX + pz * cosX;
        // Rotate Y
        t = px;
        px = t * cosY + pz * sinY;
        pz = -t * sinY + pz * cosY;
        // Rotate Z
        t = px;
        px = t * cosZ - py * sinZ;
        py = t * sinZ + py * cosZ;

        positions[i + 0] = px + cx + tx;
        positions[i + 1] = py + cy + ty;
        positions[i + 2] = pz + cz + tz;

        // Rotate normals (no translate/scale)
        let nx = normals[i + 0];
        let ny = normals[i + 1];
        let nz = normals[i + 2];

        t = ny;
        ny = t * cosX - nz * sinX;
        nz = t * sinX + nz * cosX;
        t = nx;
        nx = t * cosY + nz * sinY;
        nz = -t * sinY + nz * cosY;
        t = nx;
        nx = t * cosZ - ny * sinZ;
        ny = t * sinZ + ny * cosZ;

        const len = Math.hypot(nx, ny, nz) || 1;
        normals[i + 0] = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }

    finalizeGeometryEdit("Transform applied. Save .mdl to export changes.");
  }

  function rebuildRenderBounds(render) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const positions of render.positionsByPose) {
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
    }
    render.bounds.min = [minX, minY, minZ];
    render.bounds.max = [maxX, maxY, maxZ];
    render.bounds.center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
    render.bounds.radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2;
  }

  function resetCamera(sourceKind = "") {
    if (!state.model) {
      return;
    }
    const bounds = state.model.render.bounds;
    state.camera.target = bounds.center.slice();
    if (sourceKind === "font") {
      state.camera.distance = Math.max(bounds.radius * 2.5, 24);
      state.camera.yaw = 0.1;
      state.camera.pitch = 0.24;
      return;
    }
    state.camera.distance = Math.max(bounds.radius * 2.8, 24);
    state.camera.yaw = -0.8;
    state.camera.pitch = 0.55;
  }

  function initRenderer() {
    const gl = dom.canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      updateOverlay("WebGL is not available in this browser.");
      throw new Error("WebGL not available");
    }

    const program = createProgram(gl, `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      attribute vec2 a_uv;

      uniform mat4 u_mvp;
      uniform vec3 u_light_dir;
      uniform float u_ambient;
      uniform float u_direct;
      uniform float u_hemi;

      varying vec2 v_uv;
      varying float v_light;

      void main(void) {
        vec3 normal = normalize(a_normal);
        float direct = max(dot(normal, normalize(u_light_dir)), 0.0);
        float hemi = normal.z * 0.5 + 0.5;
        v_light = u_ambient + direct * u_direct + hemi * u_hemi;
        v_uv = a_uv;
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `, `
      precision mediump float;

      uniform sampler2D u_texture;
      uniform sampler2D u_fullbright_texture;
      uniform vec4 u_flat_color;
      uniform float u_alpha;
      uniform float u_use_texture;
      uniform float u_use_fullbright;

      varying vec2 v_uv;
      varying float v_light;

      void main(void) {
        vec4 base = u_use_texture > 0.5
          ? texture2D(u_texture, v_uv)
          : u_flat_color;
        vec4 fullbright = (u_use_texture > 0.5 && u_use_fullbright > 0.5)
          ? texture2D(u_fullbright_texture, v_uv)
          : vec4(0.0);

        float alpha = max(base.a, fullbright.a);
        if (alpha < 0.01) {
          discard;
        }

        vec3 lit = base.rgb * v_light;
        vec3 color = mix(lit, fullbright.rgb, fullbright.a);
        gl_FragColor = vec4(color, alpha * u_alpha);
      }
    `);

    gl.useProgram(program);

    const buffers = {
      position: gl.createBuffer(),
      shadowPosition: gl.createBuffer(),
      normal: gl.createBuffer(),
      uv: gl.createBuffer(),
      index: gl.createBuffer(),
      wireframeIndex: gl.createBuffer(),
      flatPosition: gl.createBuffer(),
      flatNormal: gl.createBuffer(),
      texture: gl.createTexture(),
      fullbrightTexture: gl.createTexture(),
    };

    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    uploadSolidTexture(gl, buffers.texture, [180, 180, 180, 255]);

    gl.bindTexture(gl.TEXTURE_2D, buffers.fullbrightTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    uploadSolidTexture(gl, buffers.fullbrightTexture, [0, 0, 0, 0]);

    const gridProgram = createProgram(gl, `
      attribute vec3 a_position;
      attribute vec4 a_color;
      uniform mat4 u_mvp;
      varying vec4 v_color;
      void main(void) {
        v_color = a_color;
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `, `
      precision mediump float;
      varying vec4 v_color;
      void main(void) {
        if (v_color.a < 0.01) discard;
        gl_FragColor = v_color;
      }
    `);

    const gridData = buildGroundPlaneGeometry();
    const gridPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gridData.positions, gl.STATIC_DRAW);
    const gridColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gridData.colors, gl.STATIC_DRAW);

    const overlayProgram = createProgram(gl, `
      attribute vec3 a_position;
      uniform mat4 u_mvp;
      uniform float u_point_size;
      void main(void) {
        gl_Position = u_mvp * vec4(a_position, 1.0);
        gl_PointSize = u_point_size;
      }
    `, `
      precision mediump float;
      uniform vec4 u_color;
      void main(void) {
        if (u_color.a < 0.01) discard;
        gl_FragColor = u_color;
      }
    `);
    const overlayPositionBuffer = gl.createBuffer();

    state.gl = {
      gl,
      program,
      attribs: {
        position: gl.getAttribLocation(program, "a_position"),
        normal: gl.getAttribLocation(program, "a_normal"),
        uv: gl.getAttribLocation(program, "a_uv"),
      },
      uniforms: {
        mvp: gl.getUniformLocation(program, "u_mvp"),
        lightDir: gl.getUniformLocation(program, "u_light_dir"),
        ambient: gl.getUniformLocation(program, "u_ambient"),
        direct: gl.getUniformLocation(program, "u_direct"),
        hemi: gl.getUniformLocation(program, "u_hemi"),
        texture: gl.getUniformLocation(program, "u_texture"),
        fullbrightTexture: gl.getUniformLocation(program, "u_fullbright_texture"),
        flatColor: gl.getUniformLocation(program, "u_flat_color"),
        alpha: gl.getUniformLocation(program, "u_alpha"),
        useTexture: gl.getUniformLocation(program, "u_use_texture"),
        useFullbright: gl.getUniformLocation(program, "u_use_fullbright"),
      },
      buffers,
      grid: {
        program: gridProgram,
        attribs: {
          position: gl.getAttribLocation(gridProgram, "a_position"),
          color: gl.getAttribLocation(gridProgram, "a_color"),
        },
        uniforms: {
          mvp: gl.getUniformLocation(gridProgram, "u_mvp"),
        },
        positionBuffer: gridPositionBuffer,
        colorBuffer: gridColorBuffer,
        vertexCount: gridData.vertexCount,
        gridVertexCount: gridData.gridVertexCount,
      },
      overlay: {
        program: overlayProgram,
        attribs: {
          position: gl.getAttribLocation(overlayProgram, "a_position"),
        },
        uniforms: {
          mvp: gl.getUniformLocation(overlayProgram, "u_mvp"),
          color: gl.getUniformLocation(overlayProgram, "u_color"),
          pointSize: gl.getUniformLocation(overlayProgram, "u_point_size"),
        },
        positionBuffer: overlayPositionBuffer,
      },
      scratchPositions: null,
      shadowScratchPositions: null,
      scratchNormals: null,
      flatScratchPositions: null,
      flatScratchNormals: null,
      currentTextureKey: "",
      currentTextureFrame: -1,
    };
  }

  function buildGroundPlaneGeometry() {
    const gridLines = 21;
    const spacing = 10;
    const half = ((gridLines - 1) / 2) * spacing;
    const axisLen = 8;
    const axisThick = 0.4;

    // Grid: gridLines*2 lines, 2 verts each
    // Axes: 3 axes, each rendered as two crossed quads = 12 verts
    const gridVerts = gridLines * 2 * 2;
    const axisVerts = 3 * 12;
    const totalVerts = gridVerts + axisVerts;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 4);
    let vi = 0;

    function addVertex(x, y, z, r, g, b, a) {
      positions[vi * 3] = x; positions[vi * 3 + 1] = y; positions[vi * 3 + 2] = z;
      colors[vi * 4] = r; colors[vi * 4 + 1] = g; colors[vi * 4 + 2] = b; colors[vi * 4 + 3] = a;
      vi++;
    }

    function addLine(x0, y0, z0, x1, y1, z1, r, g, b, a) {
      addVertex(x0, y0, z0, r, g, b, a);
      addVertex(x1, y1, z1, r, g, b, a);
    }

    // Grid on XY plane at Z=0
    const gridAlpha = 0.25;
    for (let i = 0; i < gridLines; i++) {
      const offset = -half + i * spacing;
      addLine(offset, -half, 0, offset, half, 0, 1, 1, 1, gridAlpha);
      addLine(-half, offset, 0, half, offset, 0, 1, 1, 1, gridAlpha);
    }

    const gridVertexCount = vi;

    // Axis quads (two triangles each for thickness)
    function addAxisQuad(x0, y0, z0, x1, y1, z1, offX, offY, offZ, r, g, b) {
      // Two triangles forming a quad offset perpendicular to the axis
      addVertex(x0 - offX, y0 - offY, z0 - offZ, r, g, b, 1);
      addVertex(x1 - offX, y1 - offY, z1 - offZ, r, g, b, 1);
      addVertex(x1 + offX, y1 + offY, z1 + offZ, r, g, b, 1);
      addVertex(x0 - offX, y0 - offY, z0 - offZ, r, g, b, 1);
      addVertex(x1 + offX, y1 + offY, z1 + offZ, r, g, b, 1);
      addVertex(x0 + offX, y0 + offY, z0 + offZ, r, g, b, 1);
    }

    function addAxisBeam(x0, y0, z0, x1, y1, z1, offAX, offAY, offAZ, offBX, offBY, offBZ, r, g, b) {
      addAxisQuad(x0, y0, z0, x1, y1, z1, offAX, offAY, offAZ, r, g, b);
      addAxisQuad(x0, y0, z0, x1, y1, z1, offBX, offBY, offBZ, r, g, b);
    }

    const h = axisThick / 2;
    // X axis: give it thickness in both Y and Z so it stays visible edge-on.
    addAxisBeam(0, 0, 0, axisLen, 0, 0, 0, h, 0, 0, 0, h, 1, 0.3, 0.3);
    // Y axis: give it thickness in both X and Z.
    addAxisBeam(0, 0, 0, 0, axisLen, 0, h, 0, 0, 0, 0, h, 0.3, 1, 0.3);
    // Z axis: give it thickness in both X and Y.
    addAxisBeam(0, 0, 0, 0, 0, axisLen, h, 0, 0, 0, h, 0, 0.3, 0.5, 1);

    return { positions, colors, vertexCount: vi, gridVertexCount };
  }

  function uploadModelBuffers() {
    if (!state.model || !state.gl) {
      return;
    }

    const { gl, buffers, attribs, uniforms } = state.gl;
    const render = state.model.render;

    state.gl.scratchPositions = new Float32Array(render.vertexCount * 3);
    state.gl.shadowScratchPositions = new Float32Array(render.vertexCount * 3);
    state.gl.scratchNormals = new Float32Array(render.vertexCount * 3);
    state.gl.flatScratchPositions = new Float32Array(render.indices.length * 3);
    state.gl.flatScratchNormals = new Float32Array(render.indices.length * 3);

    gl.useProgram(state.gl.program);
    gl.uniform1i(uniforms.texture, 0);
    gl.uniform1i(uniforms.fullbrightTexture, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    gl.bufferData(gl.ARRAY_BUFFER, render.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribs.uv);
    gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, render.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframeIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, render.wireframeIndices, gl.STATIC_DRAW);
  }

  function frame(now) {
    const seconds = now * 0.001;
    if (!frame.previousTime) {
      frame.previousTime = seconds;
    }
    const delta = seconds - frame.previousTime;
    frame.previousTime = seconds;

    if (state.model && state.playing) {
      state.playhead += delta * state.playbackSpeed;
    }

    draw();
    requestAnimationFrame(frame);
  }

  function draw() {
    const glState = state.gl;
    if (!glState) {
      return;
    }

    resizeCanvas(glState.gl, dom.canvas);

    const { gl } = glState;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    if (state.bgMode === "white") {
      gl.clearColor(1, 1, 1, 1);
    } else if (state.bgMode === "grid") {
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0.09, 0.1, 0.12, 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const hasModel = !!state.model;
    let overlayGeometry = null;

    if (hasModel) {
      const sample = getCurrentPoseSample();
      uploadInterpolatedGeometry(sample);
      updateTextureIfNeeded();
      updatePlaybackLabels(sample);
      overlayGeometry = buildOverlayGeometry(glState);
    }

    const viewports = getViewportDescriptors(gl.canvas);

    // Draw ground plane and/or world axes first.
    if (state.showGroundPlane || state.showWorldAxes) {
      drawGroundPlane(glState, viewports);
    }

    if (hasModel) {
      viewports.forEach((viewport) => {
        renderViewport(glState, viewport, overlayGeometry);
      });
    }
  }

  function drawGroundPlane(glState, viewports) {
    const { gl, grid } = glState;
    gl.useProgram(grid.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindBuffer(gl.ARRAY_BUFFER, grid.positionBuffer);
    gl.enableVertexAttribArray(grid.attribs.position);
    gl.vertexAttribPointer(grid.attribs.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, grid.colorBuffer);
    gl.enableVertexAttribArray(grid.attribs.color);
    gl.vertexAttribPointer(grid.attribs.color, 4, gl.FLOAT, false, 0, 0);

    viewports.forEach((viewport) => {
      if (!viewport || viewport.width < 2 || viewport.height < 2) return;
      const aspect = viewport.width / Math.max(viewport.height, 1);
      const projection = mat4Perspective(viewport.fovDegrees * Math.PI / 180, aspect, 0.1, Math.max(state.camera.distance * 8, 1000));
      const eye = orbitEye(state.camera.target, state.camera.distance * viewport.distanceScale, viewport.yaw, viewport.pitch);
      const view = mat4LookAt(eye, state.camera.target, [0, 0, 1]);
      const mvp = mat4Multiply(projection, view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.uniformMatrix4fv(grid.uniforms.mvp, false, mvp);
      if (state.showGroundPlane) {
        gl.drawArrays(gl.LINES, 0, grid.gridVertexCount);
      }
      if (state.showWorldAxes) {
        gl.drawArrays(gl.TRIANGLES, grid.gridVertexCount, grid.vertexCount - grid.gridVertexCount);
      }
    });

    gl.disableVertexAttribArray(grid.attribs.color);
    gl.disable(gl.BLEND);
  }

  function buildOverlayGeometry(glState) {
    const geometry = {};
    if (state.renderMode === "flat") {
      updateFlatShadedBuffers(glState);
    }
    if (state.showBoundsOverlay) {
      geometry.boundsLines = buildBoundsLinePositions(computePositionsBounds(glState.scratchPositions));
    }
    if (state.showBoundingRadius) {
      geometry.radiusLines = buildBoundingRadiusRingPositions(getModelBoundingRadius(state.model));
    }
    if (state.showEyePosition) {
      geometry.eyeLines = buildEyeMarkerPositions(state.model.eyePosition, state.model.render.bounds.radius);
    }
    if (state.showNormals) {
      geometry.normalLines = buildNormalLinePositions(glState.scratchPositions, glState.scratchNormals, state.model.render.bounds.radius);
    }
    return geometry;
  }

  function renderViewport(glState, viewport, overlayGeometry) {
    const { gl } = glState;
    if (!viewport || viewport.width < 2 || viewport.height < 2) {
      return;
    }

    const aspect = viewport.width / Math.max(viewport.height, 1);
    const projection = mat4Perspective(viewport.fovDegrees * Math.PI / 180, aspect, 0.1, Math.max(state.camera.distance * 8, 1000));
    const eye = orbitEye(state.camera.target, state.camera.distance * viewport.distanceScale, viewport.yaw, viewport.pitch);
    const view = mat4LookAt(eye, state.camera.target, [0, 0, 1]);
    const mvp = mat4Multiply(projection, view);

    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
    const lightDir = getCurrentLightDirection();

    if (state.drawShadows && updateShadowBuffer(glState, lightDir)) {
      drawShadowPass(glState, mvp);
    }

    if (state.renderMode === "wireframe") {
      drawWireframePass(glState, mvp, [0.95, 0.97, 1.0, Math.max(state.modelOpacity, 0.5)]);
    } else {
      drawMeshPass(glState, mvp, lightDir, state.wireframeOverlay);
      if (state.wireframeOverlay) {
        drawWireframePass(glState, mvp, [0.52, 0.92, 1.0, 0.92]);
      }
    }

    if (overlayGeometry?.boundsLines?.length) {
      drawOverlayLines(glState, mvp, overlayGeometry.boundsLines, [1.0, 0.88, 0.28, 0.92], false);
    }
    if (overlayGeometry?.radiusLines?.length) {
      drawOverlayLines(glState, mvp, overlayGeometry.radiusLines, [0.82, 0.7, 1.0, 0.88], false);
    }
    if (overlayGeometry?.eyeLines?.length) {
      drawOverlayLines(glState, mvp, overlayGeometry.eyeLines, [1.0, 0.36, 0.78, 0.95], false);
    }
    if (overlayGeometry?.normalLines?.length) {
      drawOverlayLines(glState, mvp, overlayGeometry.normalLines, [0.42, 0.96, 0.86, 0.72], true);
    }
  }

  function getCurrentLightDirection() {
    const azRad = state.lightAzimuth * Math.PI / 180;
    const elRad = state.lightElevation * Math.PI / 180;
    return [
      Math.cos(elRad) * Math.cos(azRad),
      Math.cos(elRad) * Math.sin(azRad),
      Math.sin(elRad),
    ];
  }

  function drawMeshPass(glState, mvp, lightDir, offsetMesh) {
    const { gl, program, attribs, uniforms, buffers } = glState;
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, buffers.fullbrightTexture);
    gl.uniformMatrix4fv(uniforms.mvp, false, mvp);
    gl.uniform3f(uniforms.lightDir, lightDir[0], lightDir[1], lightDir[2]);
    gl.uniform1f(uniforms.ambient, state.lightAmbient);
    gl.uniform1f(uniforms.direct, state.lightDirect);
    gl.uniform1f(uniforms.hemi, state.lightHemi);
    gl.uniform4f(uniforms.flatColor, 0.76, 0.78, 0.82, 1);
    gl.uniform1f(uniforms.alpha, state.modelOpacity);
    gl.uniform1f(uniforms.useTexture, state.renderMode === "textured" && state.paletteRGBA ? 1 : 0);
    gl.uniform1f(uniforms.useFullbright, state.renderMode === "textured" && state.paletteRGBA && state.previewFullbrights ? 1 : 0);

    if (state.backfaceCulling) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
    } else {
      gl.disable(gl.CULL_FACE);
    }

    if (state.modelOpacity < 0.999) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
    } else {
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    if (offsetMesh) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1, 1);
    }

    if (state.renderMode === "flat") {
      gl.disableVertexAttribArray(attribs.uv);
      gl.vertexAttrib2f(attribs.uv, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.flatPosition);
      gl.enableVertexAttribArray(attribs.position);
      gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.flatNormal);
      gl.enableVertexAttribArray(attribs.normal);
      gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, state.model.render.indices.length);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
      gl.enableVertexAttribArray(attribs.uv);
      gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(attribs.position);
      gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.enableVertexAttribArray(attribs.normal);
      gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      gl.drawElements(gl.TRIANGLES, state.model.render.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    if (offsetMesh) {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    gl.disable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function updateShadowBuffer(glState, lightDir) {
    if (lightDir[2] <= 0.05) {
      return false;
    }

    const source = glState.scratchPositions;
    const out = glState.shadowScratchPositions;
    const castX = -lightDir[0];
    const castY = -lightDir[1];
    const castZ = -lightDir[2];
    const safeCastZ = Math.abs(castZ) < 0.05 ? (castZ < 0 ? -0.05 : 0.05) : castZ;
    const groundZ = 0.03;

    for (let i = 0; i < source.length; i += 3) {
      const px = source[i + 0];
      const py = source[i + 1];
      const pz = source[i + 2];
      const t = (groundZ - pz) / safeCastZ;
      out[i + 0] = px + castX * t;
      out[i + 1] = py + castY * t;
      out[i + 2] = groundZ;
    }

    glState.gl.bindBuffer(glState.gl.ARRAY_BUFFER, glState.buffers.shadowPosition);
    glState.gl.bufferData(glState.gl.ARRAY_BUFFER, out, glState.gl.DYNAMIC_DRAW);
    return true;
  }

  function drawShadowPass(glState, mvp) {
    const { gl, program, attribs, uniforms, buffers } = glState;
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, buffers.fullbrightTexture);
    gl.uniformMatrix4fv(uniforms.mvp, false, mvp);
    gl.uniform3f(uniforms.lightDir, 0, 0, 1);
    gl.uniform1f(uniforms.ambient, 1);
    gl.uniform1f(uniforms.direct, 0);
    gl.uniform1f(uniforms.hemi, 0);
    gl.uniform4f(uniforms.flatColor, 0.03, 0.04, 0.06, 1);
    gl.uniform1f(uniforms.alpha, 0.26);
    gl.uniform1f(uniforms.useTexture, 0);
    gl.uniform1f(uniforms.useFullbright, 0);

    gl.disableVertexAttribArray(attribs.uv);
    gl.vertexAttrib2f(attribs.uv, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.shadowPosition);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.enableVertexAttribArray(attribs.normal);
    gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawElements(gl.TRIANGLES, state.model.render.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function drawWireframePass(glState, mvp, color) {
    const { gl, overlay, buffers } = glState;
    gl.useProgram(overlay.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(overlay.attribs.position);
    gl.vertexAttribPointer(overlay.attribs.position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframeIndex);
    gl.uniformMatrix4fv(overlay.uniforms.mvp, false, mvp);
    gl.uniform4f(overlay.uniforms.color, color[0], color[1], color[2], color[3]);
    gl.uniform1f(overlay.uniforms.pointSize, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.drawElements(gl.LINES, state.model.render.wireframeIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function drawOverlayLines(glState, mvp, positions, color, depthTest) {
    if (!positions?.length) {
      return;
    }

    const { gl, overlay } = glState;
    gl.useProgram(overlay.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, overlay.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(overlay.attribs.position);
    gl.vertexAttribPointer(overlay.attribs.position, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(overlay.uniforms.mvp, false, mvp);
    gl.uniform4f(overlay.uniforms.color, color[0], color[1], color[2], color[3]);
    gl.uniform1f(overlay.uniforms.pointSize, 1);
    if (depthTest) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.LINES, 0, positions.length / 3);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  function updateFlatShadedBuffers(glState) {
    const render = state.model.render;
    const outPositions = glState.flatScratchPositions;
    const outNormals = glState.flatScratchNormals;
    const sourcePositions = glState.scratchPositions;
    const indices = render.indices;

    for (let tri = 0, out = 0; tri < indices.length; tri += 3) {
      const i0 = indices[tri + 0] * 3;
      const i1 = indices[tri + 1] * 3;
      const i2 = indices[tri + 2] * 3;

      const ax = sourcePositions[i1 + 0] - sourcePositions[i0 + 0];
      const ay = sourcePositions[i1 + 1] - sourcePositions[i0 + 1];
      const az = sourcePositions[i1 + 2] - sourcePositions[i0 + 2];
      const bx = sourcePositions[i2 + 0] - sourcePositions[i0 + 0];
      const by = sourcePositions[i2 + 1] - sourcePositions[i0 + 1];
      const bz = sourcePositions[i2 + 2] - sourcePositions[i0 + 2];
      const nxRaw = ay * bz - az * by;
      const nyRaw = az * bx - ax * bz;
      const nzRaw = ax * by - ay * bx;
      const length = Math.hypot(nxRaw, nyRaw, nzRaw) || 1;
      const nx = nxRaw / length;
      const ny = nyRaw / length;
      const nz = nzRaw / length;

      for (const sourceIndex of [i0, i1, i2]) {
        outPositions[out + 0] = sourcePositions[sourceIndex + 0];
        outPositions[out + 1] = sourcePositions[sourceIndex + 1];
        outPositions[out + 2] = sourcePositions[sourceIndex + 2];
        outNormals[out + 0] = nx;
        outNormals[out + 1] = ny;
        outNormals[out + 2] = nz;
        out += 3;
      }
    }

    glState.gl.bindBuffer(glState.gl.ARRAY_BUFFER, glState.buffers.flatPosition);
    glState.gl.bufferData(glState.gl.ARRAY_BUFFER, outPositions, glState.gl.DYNAMIC_DRAW);
    glState.gl.bindBuffer(glState.gl.ARRAY_BUFFER, glState.buffers.flatNormal);
    glState.gl.bufferData(glState.gl.ARRAY_BUFFER, outNormals, glState.gl.DYNAMIC_DRAW);
  }

  function computePositionsBounds(positions) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i + 0];
      const y = positions[i + 1];
      const z = positions[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    };
  }

  function buildBoundsLinePositions(bounds) {
    const [minX, minY, minZ] = bounds.min;
    const [maxX, maxY, maxZ] = bounds.max;
    return new Float32Array([
      minX, minY, minZ, maxX, minY, minZ,
      maxX, minY, minZ, maxX, maxY, minZ,
      maxX, maxY, minZ, minX, maxY, minZ,
      minX, maxY, minZ, minX, minY, minZ,

      minX, minY, maxZ, maxX, minY, maxZ,
      maxX, minY, maxZ, maxX, maxY, maxZ,
      maxX, maxY, maxZ, minX, maxY, maxZ,
      minX, maxY, maxZ, minX, minY, maxZ,

      minX, minY, minZ, minX, minY, maxZ,
      maxX, minY, minZ, maxX, minY, maxZ,
      maxX, maxY, minZ, maxX, maxY, maxZ,
      minX, maxY, minZ, minX, maxY, maxZ,
    ]);
  }

  function buildBoundingRadiusRingPositions(radius) {
    if (!(radius > 0)) {
      return new Float32Array(0);
    }

    const segments = 48;
    const vertices = [];

    function pushSegment(x0, y0, z0, x1, y1, z1) {
      vertices.push(x0, y0, z0, x1, y1, z1);
    }

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const c0 = Math.cos(a0) * radius;
      const s0 = Math.sin(a0) * radius;
      const c1 = Math.cos(a1) * radius;
      const s1 = Math.sin(a1) * radius;

      pushSegment(c0, s0, 0, c1, s1, 0);
      pushSegment(c0, 0, s0, c1, 0, s1);
      pushSegment(0, c0, s0, 0, c1, s1);
    }

    return new Float32Array(vertices);
  }

  function buildEyeMarkerPositions(eyePosition, radius) {
    const x = eyePosition[0] || 0;
    const y = eyePosition[1] || 0;
    const z = eyePosition[2] || 0;
    const length = Math.max(radius * 0.06, 2.5);
    return new Float32Array([
      x - length, y, z, x + length, y, z,
      x, y - length, z, x, y + length, z,
      x, y, z - length, x, y, z + length,
    ]);
  }

  function buildNormalLinePositions(positions, normals, radius) {
    const vertexStride = positions.length > 24000 ? 2 : 1;
    const lineLength = Math.max(radius * 0.035, 1.5);
    const lineCount = Math.ceil((positions.length / 3) / vertexStride);
    const out = new Float32Array(lineCount * 6);
    let outIndex = 0;

    for (let i = 0; i < positions.length; i += 3 * vertexStride) {
      const px = positions[i + 0];
      const py = positions[i + 1];
      const pz = positions[i + 2];
      const nx = normals[i + 0];
      const ny = normals[i + 1];
      const nz = normals[i + 2];

      out[outIndex + 0] = px;
      out[outIndex + 1] = py;
      out[outIndex + 2] = pz;
      out[outIndex + 3] = px + nx * lineLength;
      out[outIndex + 4] = py + ny * lineLength;
      out[outIndex + 5] = pz + nz * lineLength;
      outIndex += 6;
    }

    return out;
  }

  function getViewportDescriptors(canvas) {
    const viewports = [
      makeViewportDescriptor(canvas, dom.mainViewPane, {
        yaw: state.camera.yaw,
        pitch: state.camera.pitch,
        distanceScale: 1,
        fovDegrees: 50,
      }),
    ];

    if (state.viewportMode === "multi") {
      viewports.push(
        makeViewportDescriptor(canvas, dom.frontViewPane, {
          yaw: 0,
          pitch: 0.14,
          distanceScale: 1.05,
          fovDegrees: 38,
        }),
        makeViewportDescriptor(canvas, dom.leftViewPane, {
          yaw: Math.PI * 0.5,
          pitch: 0.2,
          distanceScale: 1.08,
          fovDegrees: 38,
        })
      );
    }

    return viewports.filter(Boolean);
  }

  function makeViewportDescriptor(canvas, element, camera) {
    if (!canvas || !element) {
      return null;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(canvasRect.width, 1);
    const scaleY = canvas.height / Math.max(canvasRect.height, 1);

    const left = clamp(Math.round((elementRect.left - canvasRect.left) * scaleX), 0, canvas.width);
    const top = clamp(Math.round((elementRect.top - canvasRect.top) * scaleY), 0, canvas.height);
    const width = clamp(Math.round(elementRect.width * scaleX), 1, Math.max(canvas.width - left, 1));
    const height = clamp(Math.round(elementRect.height * scaleY), 1, Math.max(canvas.height - top, 1));
    const y = clamp(canvas.height - top - height, 0, canvas.height);

    return {
      x: left,
      y,
      width,
      height,
      ...camera,
    };
  }

  function getCurrentPoseSample() {
    const model = state.model;
    const activeGroup = getActiveFrameGroup();
    if (!activeGroup) {
      return {
        poseA: 0,
        poseB: 0,
        blend: 0,
        frameIndex: 0,
        frameName: model.poses[0]?.name || "pose_0",
        groupLabel: "Frame",
        poseCount: 1,
      };
    }

    const poseCount = Math.max(activeGroup.poseIndices.length, 1);
    if (!state.playing || poseCount <= 1) {
      const frameIndex = clamp(state.manualFrameIndex, 0, poseCount - 1);
      const poseIndex = activeGroup.poseIndices[frameIndex];
      return {
        poseA: poseIndex,
        poseB: poseIndex,
        blend: 0,
        frameIndex,
        frameName: model.poses[poseIndex]?.name || activeGroup.name || activeGroup.label,
        groupLabel: activeGroup.label,
        poseCount,
      };
    }

    const totalDuration = Math.max(activeGroup.totalDuration || 0, 0.001);
    let localTime = state.playhead % totalDuration;
    let accumulated = 0;

    for (let index = 0; index < poseCount; index++) {
      const duration = Math.max(activeGroup.durations[index] || DEFAULT_FRAME_DURATION, 0.001);
      if (localTime < accumulated + duration) {
        const poseIndex = activeGroup.poseIndices[index];
        const nextPoseIndex = activeGroup.poseIndices[(index + 1) % poseCount];
        const blend = state.interpolate ? (localTime - accumulated) / duration : 0;
        return {
          poseA: poseIndex,
          poseB: nextPoseIndex,
          blend,
          frameIndex: index,
          frameName: model.poses[poseIndex]?.name || activeGroup.name || activeGroup.label,
          groupLabel: activeGroup.label,
          poseCount,
        };
      }
      accumulated += duration;
    }

    const lastIndex = poseCount - 1;
    const lastPoseIndex = activeGroup.poseIndices[lastIndex];
    return {
      poseA: lastPoseIndex,
      poseB: lastPoseIndex,
      blend: 0,
      frameIndex: lastIndex,
      frameName: model.poses[lastPoseIndex]?.name || activeGroup.name || activeGroup.label,
      groupLabel: activeGroup.label,
      poseCount,
    };
  }

  function uploadInterpolatedGeometry(sample) {
    if (!state.model || !state.gl) {
      return;
    }

    const cache = state.sampleCache;
    const blendQuantized = Math.round(sample.blend * 10000);
    const cacheBlendQuantized = Math.round(cache.blend * 10000);
    if (!state.geometryDirty &&
        cache.poseA === sample.poseA &&
        cache.poseB === sample.poseB &&
        cache.frameIndex === sample.frameIndex &&
        cacheBlendQuantized === blendQuantized) {
      return;
    }

    const render = state.model.render;
    const positionsA = render.positionsByPose[sample.poseA];
    const positionsB = render.positionsByPose[sample.poseB];
    const normalsA = render.normalsByPose[sample.poseA];
    const normalsB = render.normalsByPose[sample.poseB];
    const outPositions = state.gl.scratchPositions;
    const outNormals = state.gl.scratchNormals;

    if (sample.blend === 0 || sample.poseA === sample.poseB || !state.interpolate) {
      outPositions.set(positionsA);
      outNormals.set(normalsA);
    } else {
      const invBlend = 1 - sample.blend;
      for (let i = 0; i < outPositions.length; i += 3) {
        outPositions[i + 0] = positionsA[i + 0] * invBlend + positionsB[i + 0] * sample.blend;
        outPositions[i + 1] = positionsA[i + 1] * invBlend + positionsB[i + 1] * sample.blend;
        outPositions[i + 2] = positionsA[i + 2] * invBlend + positionsB[i + 2] * sample.blend;

        const nx = normalsA[i + 0] * invBlend + normalsB[i + 0] * sample.blend;
        const ny = normalsA[i + 1] * invBlend + normalsB[i + 1] * sample.blend;
        const nz = normalsA[i + 2] * invBlend + normalsB[i + 2] * sample.blend;
        const length = Math.hypot(nx, ny, nz) || 1;
        outNormals[i + 0] = nx / length;
        outNormals[i + 1] = ny / length;
        outNormals[i + 2] = nz / length;
      }
    }

    const { gl, buffers } = state.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, outPositions, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, outNormals, gl.DYNAMIC_DRAW);

    cache.poseA = sample.poseA;
    cache.poseB = sample.poseB;
    cache.blend = sample.blend;
    cache.frameIndex = sample.frameIndex;
    cache.frameName = sample.frameName;
    state.geometryDirty = false;
  }

  function updateTextureIfNeeded() {
    if (!state.model || !state.gl) {
      return;
    }

    const skinFrameIndex = getCurrentSkinFrameIndex();
    const textureKey = `${state.currentModelKey}:${state.selectedSkinIndex}:${skinFrameIndex}:${state.recolorEnabled}:${state.topColor}:${state.bottomColor}:${state.paletteLabel}`;
    if (!state.textureDirty &&
        state.gl.currentTextureKey === textureKey &&
        state.gl.currentTextureFrame === skinFrameIndex) {
      return;
    }

    const { gl, buffers } = state.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, buffers.fullbrightTexture);

    if (!state.paletteRGBA) {
      uploadSolidTexture(gl, buffers.texture, [180, 180, 180, 255]);
      uploadSolidTexture(gl, buffers.fullbrightTexture, [0, 0, 0, 0]);
      clearSkinPreview();
      dom.skinStatus.textContent = "Palette not loaded, rendering with flat gray";
      state.gl.currentTextureKey = textureKey;
      state.gl.currentTextureFrame = skinFrameIndex;
      state.textureDirty = false;
      return;
    }

    const skin = state.model.skins[state.selectedSkinIndex];
    const indexed = skin.frames[skinFrameIndex];
    const translatedPalette = buildDisplayPalette(state.paletteRGBA, state.recolorEnabled, state.topColor, state.bottomColor);
    const textures = indexedToPreviewTextures(indexed, translatedPalette);

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      state.model.skinWidth,
      state.model.skinHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textures.base
    );

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, buffers.fullbrightTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      state.model.skinWidth,
      state.model.skinHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textures.fullbright
    );

    drawSkinPreview(textures.base, state.model.skinWidth, state.model.skinHeight);
    updateSkinStatus();

    state.gl.currentTextureKey = textureKey;
    state.gl.currentTextureFrame = skinFrameIndex;
    state.textureDirty = false;
  }

  function getCurrentSkinFrameIndex() {
    if (!state.model) {
      return 0;
    }

    const skin = state.model.skins[state.selectedSkinIndex];
    if (skin.frames.length <= 1) {
      return 0;
    }

    if (!state.playing) {
      return 0;
    }

    const durations = deriveDurations(skin.intervals, skin.frames.length);
    const totalDuration = durations.reduce((sum, value) => sum + value, 0) || DEFAULT_FRAME_DURATION;
    let localTime = state.playhead % totalDuration;

    for (let i = 0; i < durations.length; i++) {
      if (localTime < durations[i]) {
        return i;
      }
      localTime -= durations[i];
    }

    return 0;
  }

  function updatePlaybackLabels(sample) {
    dom.frameRange.value = String(sample.frameIndex);
    dom.frameInput.max = String(sample.poseCount);
    if (document.activeElement !== dom.frameInput) {
      dom.frameInput.value = String(sample.frameIndex + 1);
    }
    dom.frameValue.textContent = `${sample.frameIndex + 1} / ${sample.poseCount}`;
    dom.frameName.textContent = `${sample.groupLabel}: ${sample.frameName}`;
    if (!state.playing) {
      state.manualFrameIndex = sample.frameIndex;
    }
    syncFrameTreeSelection(sample.frameIndex);
  }

  function buildDisplayPalette(basePalette, recolorEnabled, topColor, bottomColor) {
    const out = new Uint8Array(basePalette);
    if (!recolorEnabled) {
      return out;
    }

    remapPaletteBand(basePalette, out, TOP_RANGE, topColor);
    remapPaletteBand(basePalette, out, BOTTOM_RANGE, bottomColor);
    return out;
  }

  function remapPaletteBand(sourcePalette, outPalette, destinationStart, colorIndex) {
    const base = (colorIndex & 15) * 16;
    if (base < 128) {
      for (let i = 0; i < 16; i++) {
        copyPaletteEntry(sourcePalette, outPalette, base + i, destinationStart + i);
      }
    } else {
      for (let i = 0; i < 16; i++) {
        copyPaletteEntry(sourcePalette, outPalette, base + 15 - i, destinationStart + i);
      }
    }
  }

  function copyPaletteEntry(sourcePalette, outPalette, sourceIndex, destinationIndex) {
    outPalette[destinationIndex * 4 + 0] = sourcePalette[sourceIndex * 4 + 0];
    outPalette[destinationIndex * 4 + 1] = sourcePalette[sourceIndex * 4 + 1];
    outPalette[destinationIndex * 4 + 2] = sourcePalette[sourceIndex * 4 + 2];
    outPalette[destinationIndex * 4 + 3] = sourcePalette[sourceIndex * 4 + 3];
  }

  function indexedToPreviewTextures(indexed, palette) {
    const base = new Uint8Array(indexed.length * 4);
    const fullbright = new Uint8Array(indexed.length * 4);
    for (let i = 0; i < indexed.length; i++) {
      const paletteIndex = indexed[i];
      const offset = i * 4;
      base[offset + 0] = palette[paletteIndex * 4 + 0];
      base[offset + 1] = palette[paletteIndex * 4 + 1];
      base[offset + 2] = palette[paletteIndex * 4 + 2];
      base[offset + 3] = palette[paletteIndex * 4 + 3];

      if (paletteIndex >= 224 && paletteIndex <= 254 && base[offset + 3] > 0) {
        fullbright[offset + 0] = base[offset + 0];
        fullbright[offset + 1] = base[offset + 1];
        fullbright[offset + 2] = base[offset + 2];
        fullbright[offset + 3] = 255;
      }
    }
    return { base, fullbright };
  }

  function drawSkinPreview(rgba, width, height) {
    const scale = state.showSkinPolys && state.model ? Math.max(1, Math.ceil(512 / Math.max(width, height))) : 1;
    dom.skinPreview.width = width * scale;
    dom.skinPreview.height = height * scale;
    const skinImage = new ImageData(new Uint8ClampedArray(rgba), width, height);
    if (scale === 1) {
      skinPreviewContext.putImageData(skinImage, 0, 0);
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = width;
      tmp.height = height;
      tmp.getContext("2d").putImageData(skinImage, 0, 0);
      skinPreviewContext.imageSmoothingEnabled = false;
      skinPreviewContext.drawImage(tmp, 0, 0, width * scale, height * scale);
    }
    if (state.showSkinPolys && state.model) {
      drawSkinPolyOverlay(state.model, scale, skinPreviewContext);
    }
    updateSkinPaletteEditor();
  }

  function drawSkinPolyOverlay(model, scale, context, options = {}) {
    if ((!model.triangles?.length || !model.stVerts?.length) && !model.skinOverlayLoops?.length) {
      return;
    }

    const target = context || skinPreviewContext;
    const shadowColor = options.shadowColor || "rgba(7, 10, 14, 0.95)";
    const lineColor = options.lineColor || "rgba(248, 250, 252, 0.92)";
    const shadowScale = options.shadowScale || 1.2;
    const lineScale = options.lineScale || 0.7;
    const shadowWidth = Math.max(1.5, scale * shadowScale);
    const lineWidth = Math.max(0.9, scale * lineScale);

    target.save();
    target.scale(scale, scale);
    target.lineJoin = "round";
    target.lineCap = "round";

    target.strokeStyle = shadowColor;
    target.lineWidth = shadowWidth / scale;
    appendSkinPolyPath(target, model);
    target.stroke();

    target.strokeStyle = lineColor;
    target.lineWidth = lineWidth / scale;
    appendSkinPolyPath(target, model);
    target.stroke();

    target.restore();
  }

  function appendSkinPolyPath(context, model) {
    context.beginPath();
    if (model.skinOverlayLoops?.length) {
      for (const loop of model.skinOverlayLoops) {
        if (!loop?.length) {
          continue;
        }
        context.moveTo(loop[0][0], loop[0][1]);
        for (let i = 1; i < loop.length; i++) {
          context.lineTo(loop[i][0], loop[i][1]);
        }
        context.closePath();
      }
      return;
    }

    for (const triangle of model.triangles) {
      const a = getSkinPolyVertex(model, triangle, 0);
      const b = getSkinPolyVertex(model, triangle, 1);
      const c = getSkinPolyVertex(model, triangle, 2);
      context.moveTo(a[0], a[1]);
      context.lineTo(b[0], b[1]);
      context.lineTo(c[0], c[1]);
      context.closePath();
    }
  }

  function getSkinPolyVertex(model, triangle, vertexSlot) {
    const vertexIndex = triangle.vertIndex[vertexSlot];
    const st = model.stVerts[vertexIndex];
    let s = st.s;
    if (!triangle.facesfront && st.onseam) {
      s += model.skinWidth / 2;
    }
    return [s + 0.5, st.t + 0.5];
  }

  function clearSkinPreview() {
    dom.skinPreview.width = 256;
    dom.skinPreview.height = 256;
    skinPreviewContext.clearRect(0, 0, dom.skinPreview.width, dom.skinPreview.height);
    updateSkinPaletteEditor();
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "Unknown program link error";
      gl.deleteProgram(program);
      throw new Error(message);
    }

    return program;
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
      gl.deleteShader(shader);
      throw new Error(message);
    }

    return shader;
  }

  function uploadSolidTexture(gl, texture, rgba) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(rgba)
    );
  }

  function resizeCanvas(gl, canvas) {
    const width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function mat4Perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const rangeInv = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ]);
  }

  function mat4LookAt(eye, target, up) {
    const zx = eye[0] - target[0];
    const zy = eye[1] - target[1];
    const zz = eye[2] - target[2];
    let zLength = Math.hypot(zx, zy, zz) || 1;
    const z0 = zx / zLength;
    const z1 = zy / zLength;
    const z2 = zz / zLength;

    let xx = up[1] * z2 - up[2] * z1;
    let xy = up[2] * z0 - up[0] * z2;
    let xz = up[0] * z1 - up[1] * z0;
    let xLength = Math.hypot(xx, xy, xz) || 1;
    xx /= xLength;
    xy /= xLength;
    xz /= xLength;

    const y0 = z1 * xz - z2 * xy;
    const y1 = z2 * xx - z0 * xz;
    const y2 = z0 * xy - z1 * xx;

    return new Float32Array([
      xx, y0, z0, 0,
      xy, y1, z1, 0,
      xz, y2, z2, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
      -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]),
      1,
    ]);
  }

  function mat4Multiply(a, b) {
    const out = new Float32Array(16);

    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return out;
  }

  function orbitEye(target, distance, yaw, pitch) {
    const cp = Math.cos(pitch);
    return [
      target[0] + distance * Math.cos(yaw) * cp,
      target[1] + distance * Math.sin(yaw) * cp,
      target[2] + distance * Math.sin(pitch),
    ];
  }

  function isEventInsideElement(event, element) {
    if (!element) {
      return true;
    }
    const rect = element.getBoundingClientRect();
    return event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
  }

  function normalizePath(path) {
    return path.replace(/\\/g, "/");
  }

  function getActiveFrameGroup() {
    if (!state.model || !state.model.frameGroups || !state.model.frameGroups.length) {
      return null;
    }
    const index = clamp(state.selectedFrameGroupIndex, 0, state.model.frameGroups.length - 1);
    return state.model.frameGroups[index];
  }

  function loadSidebarWidth() {
    const stored = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || "", 10);
    if (Number.isFinite(stored)) {
      return clampSidebarWidth(stored);
    }
    return 360;
  }

  function applySidebarWidth(width) {
    const clamped = clampSidebarWidth(width);
    document.documentElement.style.setProperty("--sidebar-width", `${clamped}px`);
  }

  function resizeSidebarTo(clientX) {
    applySidebarWidth(clientX);
  }

  function finishSidebarResize() {
    if (!state.resizingSidebar) {
      return;
    }
    persistSidebarWidth(getCurrentSidebarWidth());
    state.resizingSidebar = null;
    document.body.classList.remove("is-resizing");
  }

  function persistSidebarWidth(width) {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clampSidebarWidth(width)));
  }

  function getCurrentSidebarWidth() {
    const computed = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width");
    const parsed = parseInt(computed, 10);
    if (Number.isFinite(parsed)) {
      return clampSidebarWidth(parsed);
    }
    return 360;
  }

  function clampSidebarWidth(width) {
    const maxWidth = Math.min(Math.floor(window.innerWidth * 0.7), 760);
    return clamp(Math.round(width), 280, Math.max(320, maxWidth));
  }

  function readASCII(view, offset, length) {
    let text = "";
    for (let i = 0; i < length; i++) {
      text += String.fromCharCode(view.getUint8(offset + i));
    }
    return text;
  }

  function readVec3(view, offset) {
    return [
      view.getFloat32(offset + 0, true),
      view.getFloat32(offset + 4, true),
      view.getFloat32(offset + 8, true),
    ];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  init();
})();
