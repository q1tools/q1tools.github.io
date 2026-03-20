(function () {
  "use strict";

  const TOP_RANGE = 16;
  const BOTTOM_RANGE = 96;
  const DEFAULT_FRAME_DURATION = 0.1;
  const SIDEBAR_WIDTH_KEY = "qss-mdl-viewer-sidebar-width";
  const PALETTE_GRID_DIMENSION = 16;
  const PALETTE_CANVAS_SIZE = 256;
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
    interpolateToggle: document.getElementById("interpolate-toggle"),
    importSkinButton: document.getElementById("import-skin-button"),
    importSkinInput: document.getElementById("import-skin-input"),
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
    objToolsMode: document.getElementById("obj-tools-mode"),
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
    groundPlaneToggle: document.getElementById("ground-plane-toggle"),
    axisToggle: document.getElementById("axis-toggle"),
    bgDark: document.getElementById("bg-dark"),
    bgWhite: document.getElementById("bg-white"),
    bgGrid: document.getElementById("bg-grid"),
  };

  const skinPreviewContext = dom.skinPreview.getContext("2d", { alpha: true });
  const skinPaletteContext = dom.skinPaletteCanvas.getContext("2d", { alpha: true });

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
    updateSkinPaletteEditor();
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
      }
    });

    dom.saveModelButton.addEventListener("click", async () => {
      await saveCurrentModel();
    });

    dom.objToolsApply.addEventListener("click", () => {
      applyObjectTransform();
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

      state.camera.yaw += dx * 0.01;
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

        if (lowerName.endsWith(".pak")) {
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
      max: 512,
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

  function buildSyncTypeEditor(model) {
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
    input.checked = model.synctype === 1;

    const text = document.createElement("span");
    text.textContent = "Rand";

    checkbox.appendChild(input);
    checkbox.appendChild(text);
    section.appendChild(checkbox);

    const hint = document.createElement("p");
    hint.className = "hint property-hint";
    hint.textContent = `Unchecked = Sync (0), checked = Rand (1). Current value: ${describeSyncType(model.synctype)}.`;
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

  function syncModelDependentPanels() {
    const hasModel = !!state.model;
    const panels = [
      dom.framesPanel,
      dom.playbackPanel,
      dom.skinsPanel,
      dom.detailsPanel,
      dom.objectToolsPanel,
      dom.lightingPanel,
      dom.savePanel,
    ];

    panels.forEach((panel) => {
      panel.classList.toggle("is-hidden", !hasModel);
      panel.setAttribute("aria-hidden", hasModel ? "false" : "true");
    });
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

    switch (target.id) {
      case "prop-eye-x":
        state.model.eyePosition[0] = parseEditableNumber(target.value, state.model.eyePosition[0]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        break;
      case "prop-eye-y":
        state.model.eyePosition[1] = parseEditableNumber(target.value, state.model.eyePosition[1]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        break;
      case "prop-eye-z":
        state.model.eyePosition[2] = parseEditableNumber(target.value, state.model.eyePosition[2]);
        setSaveStatus("Eye position updated. Save .mdl to export changes.");
        break;
      case "prop-sync-rand":
        state.model.synctype = target.checked ? 1 : 0;
        populateProperties(state.model);
        setSaveStatus("Sync type updated. Save .mdl to export changes.");
        break;
      default:
        if (target.dataset.flagMask) {
          updateModelFlag(parseInt(target.dataset.flagMask, 10), target.checked);
          populateProperties(state.model);
          setSaveStatus("Flags updated. Save .mdl to export changes.");
        }
        break;
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
    const nextHeight = clamp(Math.round(parseEditableNumber(heightInput.value, state.model.skinHeight)), 1, 512);
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
    const draftHeight = clamp(Math.round(parseEditableNumber(heightInput.value, state.model.skinHeight)), 1, 512);
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
      setSaveStatus(`Imported ${file.name} into skin ${state.selectedSkinIndex}, frame ${skinFrameIndex}.`);
    } catch (error) {
      console.error(error);
      setSaveStatus(`Skin import failed: ${error.message}`);
    }
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

  async function saveCurrentModel() {
    if (!state.model) {
      return;
    }

    try {
      syncPendingSkinSizeDraft();
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
    const normalsByPose = positionsByPose.map((positions) => computeSmoothNormals(positions, indices));
    const bounds = computeBounds(positionsByPose);

    return {
      vertexCount,
      indices,
      uvs,
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
        };
      }

      currentGroup.poseIndices.push(entry.poseIndex);
      currentGroup.durations.push(entry.duration);
      currentGroup.poseNames.push(entry.name);
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
    const bounds = render.bounds;
    const cx = bounds.center[0];
    const cy = bounds.center[1];
    const cz = bounds.center[2];

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

    const seen = new Set();
    for (const poseIndex of poseIndices) {
      if (seen.has(poseIndex)) continue;
      seen.add(poseIndex);

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

    rebuildRenderBounds(render);
    state.geometryDirty = true;
    resetObjectToolsInputs();
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

  function resetCamera() {
    if (!state.model) {
      return;
    }
    const bounds = state.model.render.bounds;
    state.camera.target = bounds.center.slice();
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
      uniform vec4 u_flat_color;
      uniform float u_use_texture;

      varying vec2 v_uv;
      varying float v_light;

      void main(void) {
        vec4 base = u_use_texture > 0.5
          ? texture2D(u_texture, v_uv)
          : u_flat_color;

        if (base.a < 0.01) {
          discard;
        }

        gl_FragColor = vec4(base.rgb * v_light, base.a);
      }
    `);

    gl.useProgram(program);

    const buffers = {
      position: gl.createBuffer(),
      normal: gl.createBuffer(),
      uv: gl.createBuffer(),
      index: gl.createBuffer(),
      texture: gl.createTexture(),
    };

    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    uploadSolidTexture(gl, buffers.texture, [180, 180, 180, 255]);

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
        flatColor: gl.getUniformLocation(program, "u_flat_color"),
        useTexture: gl.getUniformLocation(program, "u_use_texture"),
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
      scratchPositions: null,
      scratchNormals: null,
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
    state.gl.scratchNormals = new Float32Array(render.vertexCount * 3);

    gl.useProgram(state.gl.program);
    gl.uniform1i(uniforms.texture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    gl.bufferData(gl.ARRAY_BUFFER, render.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribs.uv);
    gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, render.indices, gl.STATIC_DRAW);
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

    const { gl, buffers, attribs, uniforms } = glState;
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

    if (hasModel) {
      const sample = getCurrentPoseSample();
      uploadInterpolatedGeometry(sample);
      updateTextureIfNeeded();
      updatePlaybackLabels(sample);
    }

    const viewports = getViewportDescriptors(gl.canvas);

    // Draw ground plane and/or world axes first.
    if (state.showGroundPlane || state.showWorldAxes) {
      drawGroundPlane(glState, viewports);
    }

    if (hasModel) {
      gl.useProgram(glState.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, buffers.texture);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(attribs.position);
      gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.enableVertexAttribArray(attribs.normal);
      gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
      gl.enableVertexAttribArray(attribs.uv);
      gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

      viewports.forEach((viewport) => {
        renderViewport(glState, uniforms, viewport);
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

  function renderViewport(glState, uniforms, viewport) {
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
    gl.uniformMatrix4fv(uniforms.mvp, false, mvp);
    const azRad = state.lightAzimuth * Math.PI / 180;
    const elRad = state.lightElevation * Math.PI / 180;
    const lx = Math.cos(elRad) * Math.cos(azRad);
    const ly = Math.cos(elRad) * Math.sin(azRad);
    const lz = Math.sin(elRad);
    gl.uniform3f(uniforms.lightDir, lx, ly, lz);
    gl.uniform1f(uniforms.ambient, state.lightAmbient);
    gl.uniform1f(uniforms.direct, state.lightDirect);
    gl.uniform1f(uniforms.hemi, state.lightHemi);
    gl.uniform4f(uniforms.flatColor, 0.72, 0.72, 0.72, 1);
    gl.uniform1f(uniforms.useTexture, state.paletteRGBA ? 1 : 0);
    gl.drawElements(gl.TRIANGLES, state.model.render.indices.length, gl.UNSIGNED_SHORT, 0);
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
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);

    if (!state.paletteRGBA) {
      uploadSolidTexture(gl, buffers.texture, [180, 180, 180, 255]);
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
    const rgba = indexedToRgba(indexed, translatedPalette);

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      state.model.skinWidth,
      state.model.skinHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba
    );

    drawSkinPreview(rgba, state.model.skinWidth, state.model.skinHeight);
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

  function indexedToRgba(indexed, palette) {
    const rgba = new Uint8Array(indexed.length * 4);
    for (let i = 0; i < indexed.length; i++) {
      const paletteIndex = indexed[i];
      rgba[i * 4 + 0] = palette[paletteIndex * 4 + 0];
      rgba[i * 4 + 1] = palette[paletteIndex * 4 + 1];
      rgba[i * 4 + 2] = palette[paletteIndex * 4 + 2];
      rgba[i * 4 + 3] = palette[paletteIndex * 4 + 3];
    }
    return rgba;
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
      drawSkinPolyOverlay(state.model, scale);
    }
    updateSkinPaletteEditor();
  }

  function drawSkinPolyOverlay(model, scale) {
    if (!model.triangles?.length || !model.stVerts?.length) {
      return;
    }

    const shadowWidth = Math.max(1.5, scale * 1.2);
    const lineWidth = Math.max(0.9, scale * 0.7);

    skinPreviewContext.save();
    skinPreviewContext.scale(scale, scale);
    skinPreviewContext.lineJoin = "round";
    skinPreviewContext.lineCap = "round";

    skinPreviewContext.strokeStyle = "rgba(7, 10, 14, 0.95)";
    skinPreviewContext.lineWidth = shadowWidth / scale;
    appendSkinPolyPath(skinPreviewContext, model);
    skinPreviewContext.stroke();

    skinPreviewContext.strokeStyle = "rgba(248, 250, 252, 0.92)";
    skinPreviewContext.lineWidth = lineWidth / scale;
    appendSkinPolyPath(skinPreviewContext, model);
    skinPreviewContext.stroke();

    skinPreviewContext.restore();
  }

  function appendSkinPolyPath(context, model) {
    context.beginPath();
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
