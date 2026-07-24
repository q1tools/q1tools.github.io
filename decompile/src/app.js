import { MAX_FILE_BYTES } from "./limits.js";

const $ = (selector) => document.querySelector(selector);

const elements = {
  fileInput: $("#fileInput"),
  dropZone: $("#dropZone"),
  fileCard: $("#fileCard"),
  fileName: $("#fileName"),
  fileMeta: $("#fileMeta"),
  fileStatus: $("#fileStatus"),
  resetButton: $("#resetButton"),
  decompileButton: $("#decompileButton"),
  geometrySource: $("#geometrySource"),
  hullNumber: $("#hullNumber"),
  precision: $("#precision"),
  recoverTextures: $("#recoverTextures"),
  splitTextures: $("#splitTextures"),
  extractTextures: $("#extractTextures"),
  writeComments: $("#writeComments"),
  progress: $("#progress"),
  progressBar: $("#progressBar"),
  progressText: $("#progressText"),
  emptyResult: $("#emptyResult"),
  result: $("#result"),
  outputName: $("#outputName"),
  stats: $("#stats"),
  warningCount: $("#warningCount"),
  diagnosticsPanel: $("#diagnosticsPanel"),
  sourcePanel: $("#sourcePanel"),
  diagnosticsTab: $("#diagnosticsTab"),
  sourceTab: $("#sourceTab"),
  downloadButton: $("#downloadButton"),
  downloadWadButton: $("#downloadWadButton"),
  copyButton: $("#copyButton"),
  mapCanvas: $("#mapCanvas"),
  canvasReset: $("#canvasReset")
};

const state = {
  file: null,
  worker: null,
  running: false,
  result: null,
  downloadUrl: null
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}

function setResultActions(enabled) {
  elements.downloadButton.disabled = !enabled;
  elements.copyButton.disabled = !enabled;
  const hasWad = enabled && !!state.result?.wad;
  elements.downloadWadButton.hidden = !hasWad;
  elements.downloadWadButton.disabled = !hasWad;
}

async function sniffFormat(file) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (bytes.length < 4) return "TOO SMALL";
  const text = String.fromCharCode(...bytes.slice(0, 4));
  const version = new DataView(bytes.buffer).getInt32(0, true);
  if (version === 28) return "PRERELEASE BSP28";
  if (version === 29) return "BSP29 / H2";
  if (version === 30) return "HALF-LIFE 30";
  if (text === " 46Q") return "QUAKE 64 BSP";
  if (text === "BSP2") return "BSP2";
  if (text === "2PSB") return "BSP2-RMQ";
  if (text === "IBSP" && bytes.length >= 8) return `IBSP ${new DataView(bytes.buffer).getInt32(4, true)}`;
  if (text === "QBSP" && bytes.length >= 8) return `QBSP ${new DataView(bytes.buffer).getInt32(4, true)}`;
  return `UNKNOWN ${text.replace(/[^\x20-\x7e]/g, "?")}`;
}

async function setFile(file) {
  if (!file) return;
  cancelWorker();
  clearResult();
  state.file = file;
  elements.fileName.textContent = file.name;
  elements.fileMeta.textContent = `${formatBytes(file.size)} · detecting…`;
  elements.fileStatus.textContent = "READY";
  elements.fileCard.hidden = false;
  elements.dropZone.hidden = true;
  elements.resetButton.hidden = false;
  elements.decompileButton.disabled = false;
  elements.emptyResult.hidden = false;
  elements.result.hidden = true;
  if (file.size > MAX_FILE_BYTES) {
    state.file = null;
    elements.fileMeta.textContent = `${formatBytes(file.size)} · exceeds safety limit`;
    elements.fileStatus.textContent = "REJECTED";
    elements.decompileButton.disabled = true;
    renderError({ message: `This BSP is larger than the ${formatBytes(MAX_FILE_BYTES)} browser safety limit.` });
    return;
  }
  try {
    const format = await sniffFormat(file);
    if (state.file === file) elements.fileMeta.textContent = `${formatBytes(file.size)} · ${format}`;
  } catch {
    elements.fileMeta.textContent = `${formatBytes(file.size)} · unreadable header`;
  }
}

function clearResult() {
  state.result = null;
  setResultActions(false);
  elements.emptyResult.hidden = false;
  elements.result.hidden = true;
  if (state.downloadUrl) {
    URL.revokeObjectURL(state.downloadUrl);
    state.downloadUrl = null;
  }
  preview.setData(null);
}

function reset() {
  cancelWorker();
  state.file = null;
  elements.fileInput.value = "";
  elements.fileCard.hidden = true;
  elements.dropZone.hidden = false;
  elements.resetButton.hidden = true;
  elements.decompileButton.disabled = true;
  elements.fileStatus.textContent = "READY";
  elements.progress.hidden = true;
  clearResult();
}

function setRunning(running) {
  state.running = running;
  elements.decompileButton.disabled = !state.file;
  elements.decompileButton.querySelector("span:first-child").textContent = running ? "Cancel decompile" : "Decompile BSP";
  elements.decompileButton.querySelector("span:last-child").textContent = running ? "×" : "→";
  elements.fileStatus.textContent = running ? "WORKING" : "READY";
  elements.progress.hidden = !running;
  for (const control of [
    elements.geometrySource,
    elements.hullNumber,
    elements.precision,
    elements.recoverTextures,
    elements.splitTextures,
    elements.writeComments
  ]) {
    control.disabled = running;
  }
  if (!running) {
    elements.progressBar.style.width = "0%";
    elements.progressBar.setAttribute("aria-valuenow", "0");
  }
}

function cancelWorker() {
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
  if (state.running) {
    setRunning(false);
    elements.progressText.textContent = "Cancelled.";
  }
}

function optionValues() {
  return {
    geometrySource: elements.geometrySource.value,
    hullNumber: Number(elements.hullNumber.value),
    precision: Number(elements.precision.value),
    recoverTextures: elements.recoverTextures.checked,
    splitTextures: elements.splitTextures.checked,
    extractTextures: elements.extractTextures.checked,
    writeComments: elements.writeComments.checked
  };
}

async function startDecompile() {
  if (state.running) {
    cancelWorker();
    return;
  }
  if (!state.file) return;

  const file = state.file;
  const options = optionValues();
  clearResult();
  setRunning(true);
  elements.progressText.textContent = "Reading local file…";
  elements.progressBar.style.width = "2%";
  elements.progressBar.setAttribute("aria-valuenow", "2");

  try {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`This BSP is larger than the ${formatBytes(MAX_FILE_BYTES)} browser safety limit.`);
    }
    const buffer = await file.arrayBuffer();
    if (!state.running || state.file !== file) return;
    const worker = new Worker("./src/decompile.worker.js", { type: "module" });
    state.worker = worker;
    worker.onmessage = (event) => {
      if (worker !== state.worker) return;
      const message = event.data;
      if (message.type === "progress") {
        const percent = Math.max(1, Math.min(100, Math.round(message.progress * 100)));
        elements.progressBar.style.width = `${percent}%`;
        elements.progressBar.setAttribute("aria-valuenow", String(percent));
        elements.progressText.textContent = message.message;
      } else if (message.type === "complete") {
        state.worker = null;
        worker.terminate();
        setRunning(false);
        state.result = message.result;
        renderResult(message.result);
      } else if (message.type === "error") {
        state.worker = null;
        worker.terminate();
        setRunning(false);
        renderError(message.error);
      } else {
        state.worker = null;
        worker.terminate();
        setRunning(false);
        renderError({ message: "The decompiler worker returned an invalid response." });
      }
    };
    worker.onerror = (event) => {
      if (worker !== state.worker) return;
      state.worker = null;
      worker.terminate();
      setRunning(false);
      renderError({ message: event.message || "The decompiler worker stopped unexpectedly." });
    };
    worker.postMessage({
      buffer,
      fileName: file.name,
      options
    }, [buffer]);
  } catch (error) {
    setRunning(false);
    renderError({ message: error?.message || String(error) });
  }
}

function stat(label, value) {
  const item = document.createElement("div");
  item.className = "stat";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  return item;
}

function diagnostic(label, value) {
  const item = document.createElement("div");
  item.className = "diagnostic-item";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  item.append(labelNode, valueNode);
  return item;
}

function describeWadTextures(d) {
  if (d.wadTextures) {
    const extra = d.texturesExternal ? `, ${formatNumber(d.texturesExternal)} external` : "";
    return `${formatNumber(d.wadTextures)} (${formatBytes(d.wadBytes)})${extra}`;
  }
  if (d.texturesExternal) return "external references only";
  return "none";
}

function renderDiagnostics(result) {
  const d = result.diagnostics;
  elements.diagnosticsPanel.replaceChildren();
  const summary = document.createElement("div");
  summary.className = "diagnostic-summary";
  summary.append(
    diagnostic("Container", d.format),
    diagnostic("Geometry path", d.geometryPath),
    diagnostic("BSP size", formatBytes(d.fileBytes)),
    diagnostic("MAP size", formatBytes(d.mapBytes)),
    diagnostic("Planes / faces", `${formatNumber(d.planes)} / ${formatNumber(d.faces)}`),
    diagnostic("Models / entities", `${formatNumber(d.models)} / ${formatNumber(d.entities)}`),
    diagnostic("BSPX lumps", d.bspxLumps.length ? d.bspxLumps.join(", ") : "none"),
    diagnostic("Exact stored brushes", formatNumber(d.exactBrushes)),
    diagnostic("Clipped sides pruned", formatNumber(d.geometrySideRepairs)),
    diagnostic("UV repairs", formatNumber(d.textureProjectionRepairs)),
    diagnostic("WAD textures", describeWadTextures(d))
  );
  elements.diagnosticsPanel.append(summary);

  if (result.warnings.length) {
    const list = document.createElement("ul");
    list.className = "warning-list";
    for (const warning of result.warnings) {
      const item = document.createElement("li");
      item.textContent = warning;
      list.append(item);
    }
    elements.diagnosticsPanel.append(list);
  } else {
    const note = document.createElement("p");
    note.className = "success-note";
    note.textContent = "All parsed references were internally consistent; no recovery warnings were raised.";
    elements.diagnosticsPanel.append(note);
  }
}

function renderResult(result) {
  elements.emptyResult.hidden = true;
  elements.result.hidden = false;
  elements.outputName.textContent = result.fileName;
  elements.fileStatus.textContent = "DONE";
  setResultActions(true);
  elements.warningCount.textContent = String(result.warnings.length);
  elements.stats.replaceChildren(
    stat("Output brushes", formatNumber(result.diagnostics.outputBrushes)),
    stat("Brush sides", formatNumber(result.diagnostics.outputSides)),
    stat("Entities", formatNumber(result.diagnostics.entities)),
    stat("Warnings", formatNumber(result.warnings.length))
  );
  renderDiagnostics(result);
  const previewText = result.mapText.length > 220_000
    ? `${result.mapText.slice(0, 220_000)}\n\n// … preview truncated; download contains the complete MAP.\n`
    : result.mapText;
  elements.sourcePanel.querySelector("code").textContent = previewText;
  showTab("diagnostics");
  preview.setData(result.preview);
  elements.outputName.focus({ preventScroll: true });
  elements.result.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function renderError(error) {
  elements.emptyResult.hidden = true;
  elements.result.hidden = false;
  elements.outputName.textContent = "Recovery failed";
  if (state.file) elements.fileStatus.textContent = "FAILED";
  setResultActions(false);
  elements.stats.replaceChildren(
    stat("Status", "ERROR"),
    stat("Output brushes", "0"),
    stat("Entities", "—"),
    stat("Warnings", "1")
  );
  elements.warningCount.textContent = "1";
  elements.diagnosticsPanel.replaceChildren();
  const list = document.createElement("ul");
  list.className = "warning-list";
  const item = document.createElement("li");
  item.textContent = error?.message || "Unknown decompiler error.";
  list.append(item);
  elements.diagnosticsPanel.append(list);
  elements.sourcePanel.querySelector("code").textContent = "";
  showTab("diagnostics");
  elements.outputName.focus({ preventScroll: true });
  elements.result.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function showTab(tab, focus = false) {
  const diagnostics = tab === "diagnostics";
  elements.diagnosticsTab.classList.toggle("active", diagnostics);
  elements.sourceTab.classList.toggle("active", !diagnostics);
  elements.diagnosticsTab.setAttribute("aria-selected", String(diagnostics));
  elements.sourceTab.setAttribute("aria-selected", String(!diagnostics));
  elements.diagnosticsTab.tabIndex = diagnostics ? 0 : -1;
  elements.sourceTab.tabIndex = diagnostics ? -1 : 0;
  elements.diagnosticsPanel.hidden = !diagnostics;
  elements.sourcePanel.hidden = diagnostics;
  if (focus) (diagnostics ? elements.diagnosticsTab : elements.sourceTab).focus();
}

function downloadResult() {
  if (!state.result) return;
  if (state.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
  state.downloadUrl = URL.createObjectURL(new Blob([state.result.mapText], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = state.downloadUrl;
  anchor.download = state.result.fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  const url = state.downloadUrl;
  setTimeout(() => {
    if (state.downloadUrl === url) state.downloadUrl = null;
    URL.revokeObjectURL(url);
  }, 1000);
}

function downloadWad() {
  const wad = state.result?.wad;
  if (!wad) return;
  const url = URL.createObjectURL(new Blob([wad.buffer], { type: "application/octet-stream" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = wad.fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyResult() {
  if (!state.result) return;
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(state.result.mapText);
    } else {
      if (state.result.mapText.length > 10 * 1024 * 1024) {
        throw new Error("Legacy clipboard fallback is unsafe for a MAP this large.");
      }
      const textarea = document.createElement("textarea");
      textarea.value = state.result.mapText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Clipboard copy was rejected.");
    }
    const original = elements.copyButton.textContent;
    elements.copyButton.textContent = "Copied ✓";
    setTimeout(() => { elements.copyButton.textContent = original; }, 1400);
  } catch {
    showTab("source", true);
    const original = elements.copyButton.textContent;
    elements.copyButton.textContent = "Copy unavailable";
    setTimeout(() => { elements.copyButton.textContent = original; }, 1800);
  }
}

class MapPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.data = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.drag = null;
    this.devicePixelRatio = 1;

    canvas.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
    canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    canvas.addEventListener("pointerup", () => this.onPointerUp());
    canvas.addEventListener("pointercancel", () => this.onPointerUp());
    canvas.addEventListener("keydown", (event) => this.onKeyDown(event));
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => this.resize()).observe(canvas);
    } else {
      window.addEventListener("resize", () => this.resize());
    }
    requestAnimationFrame(() => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.devicePixelRatio = ratio;
      if (this.data) this.fit();
      else this.draw();
    }
  }

  setData(data) {
    this.data = data;
    this.fit();
  }

  fit() {
    const width = this.canvas.width || 1;
    const height = this.canvas.height || 1;
    if (!this.data?.segments?.length) {
      this.scale = 1;
      this.offsetX = width / 2;
      this.offsetY = height / 2;
      this.draw();
      return;
    }
    const spanX = Math.max(1, this.data.maxs[0] - this.data.mins[0]);
    const spanY = Math.max(1, this.data.maxs[1] - this.data.mins[1]);
    this.scale = Math.min((width * 0.86) / spanX, (height * 0.82) / spanY);
    this.offsetX = width / 2 - ((this.data.mins[0] + this.data.maxs[0]) / 2) * this.scale;
    this.offsetY = height / 2 + ((this.data.mins[1] + this.data.maxs[1]) / 2) * this.scale;
    this.draw();
  }

  project(x, y) {
    return [x * this.scale + this.offsetX, -y * this.scale + this.offsetY];
  }

  draw() {
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    if (!this.data?.segments?.length) return;

    ctx.lineWidth = Math.max(0.7, this.devicePixelRatio * 0.65);
    ctx.globalAlpha = 0.58;
    for (const exact of [0, 1]) {
      ctx.strokeStyle = exact ? "#c6f04d" : "#6bc9c5";
      ctx.beginPath();
      for (const segment of this.data.segments) {
        if (segment[4] !== exact) continue;
        const a = this.project(segment[0], segment[1]);
        const b = this.project(segment[2], segment[3]);
        if ((a[0] < -100 && b[0] < -100) || (a[0] > width + 100 && b[0] > width + 100) ||
            (a[1] < -100 && b[1] < -100) || (a[1] > height + 100 && b[1] > height + 100)) continue;
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  onWheel(event) {
    if (!this.data) return;
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const ratio = this.devicePixelRatio;
    const mouseX = (event.clientX - rect.left) * ratio;
    const mouseY = (event.clientY - rect.top) * ratio;
    this.zoomAt(Math.exp(-event.deltaY * 0.0012), mouseX, mouseY);
  }

  zoomAt(factor, screenX, screenY) {
    const worldX = (screenX - this.offsetX) / this.scale;
    const worldY = -(screenY - this.offsetY) / this.scale;
    this.scale = Math.max(0.0001, Math.min(1000, this.scale * factor));
    this.offsetX = screenX - worldX * this.scale;
    this.offsetY = screenY + worldY * this.scale;
    this.draw();
  }

  onKeyDown(event) {
    if (!this.data) return;
    const step = 32 * this.devicePixelRatio;
    if (event.key === "ArrowLeft") this.offsetX -= step;
    else if (event.key === "ArrowRight") this.offsetX += step;
    else if (event.key === "ArrowUp") this.offsetY -= step;
    else if (event.key === "ArrowDown") this.offsetY += step;
    else if (event.key === "+" || event.key === "=") {
      this.zoomAt(1.2, this.canvas.width / 2, this.canvas.height / 2);
      event.preventDefault();
      return;
    } else if (event.key === "-" || event.key === "_") {
      this.zoomAt(1 / 1.2, this.canvas.width / 2, this.canvas.height / 2);
      event.preventDefault();
      return;
    } else if (event.key === "0" || event.key === "Home") {
      this.fit();
      event.preventDefault();
      return;
    } else {
      return;
    }
    event.preventDefault();
    this.draw();
  }

  onPointerDown(event) {
    this.canvas.setPointerCapture(event.pointerId);
    this.drag = { x: event.clientX, y: event.clientY, offsetX: this.offsetX, offsetY: this.offsetY };
  }

  onPointerMove(event) {
    if (!this.drag) return;
    this.offsetX = this.drag.offsetX + (event.clientX - this.drag.x) * this.devicePixelRatio;
    this.offsetY = this.drag.offsetY + (event.clientY - this.drag.y) * this.devicePixelRatio;
    this.draw();
  }

  onPointerUp() {
    this.drag = null;
  }
}

const preview = new MapPreview(elements.mapCanvas);

elements.fileInput.addEventListener("change", () => setFile(elements.fileInput.files[0]));
elements.resetButton.addEventListener("click", reset);
elements.decompileButton.addEventListener("click", startDecompile);
elements.downloadButton.addEventListener("click", downloadResult);
elements.downloadWadButton.addEventListener("click", downloadWad);
elements.copyButton.addEventListener("click", copyResult);
elements.diagnosticsTab.addEventListener("click", () => showTab("diagnostics"));
elements.sourceTab.addEventListener("click", () => showTab("source"));
for (const tab of [elements.diagnosticsTab, elements.sourceTab]) {
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const source = event.key === "ArrowRight" || event.key === "End";
    showTab(source ? "source" : "diagnostics", true);
  });
}
elements.canvasReset.addEventListener("click", () => preview.fit());

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
}
elements.dropZone.addEventListener("drop", (event) => {
  const file = [...event.dataTransfer.files].find((candidate) => candidate.name.toLowerCase().endsWith(".bsp"))
    || event.dataTransfer.files[0];
  setFile(file);
});

window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => event.preventDefault());

window.addEventListener("beforeunload", () => {
  cancelWorker();
  if (state.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
});
