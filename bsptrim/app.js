'use strict';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileChip = document.getElementById('fileChip');
const dropTitle = document.getElementById('dropTitle');
const dropHint = document.getElementById('dropHint');
const trimButton = document.getElementById('trimButton');
const buttonLabel = document.getElementById('buttonLabel');
const spinner = document.getElementById('spinner');
const status = document.getElementById('status');
const results = document.getElementById('results');

let selectedFile = null;
let outputBuffer = null;
let outputName = '';
let activeWorker = null;
let isBusy = false;

dropZone.addEventListener('click', event => {
  if (event.target !== fileInput && !isBusy) fileInput.click();
});
dropZone.addEventListener('keydown', event => {
  if (!isBusy && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    fileInput.click();
  }
});
dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  chooseFile(event.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => chooseFile(fileInput.files[0]));
trimButton.addEventListener('click', runTrimmer);

function chooseFile(file) {
  if (!file) return;
  if (isBusy) {
    setStatus('Wait for the current map to finish before selecting another one.');
    return;
  }
  if (!/\.bsp$/i.test(file.name)) {
    setStatus('Choose a file whose name ends in .bsp.', true);
    return;
  }
  selectedFile = file;
  outputBuffer = null;
  results.hidden = true;
  results.innerHTML = '';
  dropZone.classList.add('loaded');
  dropTitle.textContent = 'BSP ready';
  dropHint.textContent = 'Drop another map to replace it';
  fileChip.hidden = false;
  fileChip.textContent = `${file.name} · ${formatBytes(file.size)}`;
  trimButton.disabled = false;
  setStatus('');
}

async function runTrimmer() {
  if (!selectedFile || isBusy) return;
  const sourceFile = selectedFile;
  setBusy(true);
  setStatus('Reading map…');
  outputBuffer = null;
  results.hidden = true;

  try {
    const input = await sourceFile.arrayBuffer();
    setStatus('Inspecting faces and repacking eligible textures…');
    activeWorker = new Worker('worker.js');
    const response = await new Promise((resolve, reject) => {
      activeWorker.onmessage = event => resolve(event.data);
      activeWorker.onerror = event => reject(new Error(event.message || 'The BSP worker stopped unexpectedly'));
      activeWorker.postMessage({
        buffer: input,
        options: {
          padding: Number(document.getElementById('padding').value),
          renameTextures: document.getElementById('renameTextures').checked
        }
      }, [input]);
    });
    activeWorker.terminate();
    activeWorker = null;
    if (!response.ok) throw new Error(response.error);

    outputBuffer = response.buffer;
    outputName = sourceFile.name.replace(/\.bsp$/i, '') + '_trimmed.bsp';
    renderResults(response.report);
    setStatus(response.report.savedBytes > 0
      ? `Finished. The output is ${formatBytes(response.report.savedBytes)} smaller.`
      : 'Finished. No safely trimmable texture space was found.');
  } catch (error) {
    if (activeWorker) activeWorker.terminate();
    activeWorker = null;
    setStatus(error && error.message ? error.message : String(error), true);
  } finally {
    setBusy(false);
  }
}

function setBusy(value) {
  isBusy = value;
  dropZone.setAttribute('aria-busy', String(value));
  trimButton.disabled = value || !selectedFile;
  buttonLabel.textContent = value ? 'Working…' : 'Analyze & trim BSP';
  spinner.hidden = !value;
}

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function renderResults(report) {
  const changed = report.changes.filter(item => item.action === 'cropped');
  const removed = report.changes.filter(item => item.action === 'removed');
  const reasonCounts = new Map();
  for (const item of report.skipped) {
    reasonCounts.set(item.reason, (reasonCounts.get(item.reason) || 0) + 1);
  }
  const skipText = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${count} ${reason}`)
    .join(' · ');

  const rows = report.changes.slice(0, 250).map(item => {
    const dimensions = item.action === 'cropped'
      ? `${item.oldWidth}×${item.oldHeight} → ${item.newWidth}×${item.newHeight}`
      : `${item.oldWidth}×${item.oldHeight} → removed`;
    const name = item.outputName && item.outputName !== item.name
      ? `${escapeHTML(item.name)} → ${escapeHTML(item.outputName)}`
      : escapeHTML(item.name);
    return `<tr>
      <td>${name}</td>
      <td>${item.action === 'cropped' ? 'cropped' : 'unused'}</td>
      <td>${dimensions}</td>
      <td class="savings">−${formatBytes(item.savedBytes)}</td>
    </tr>`;
  }).join('');

  const hasSavings = report.savedBytes > 0;
  results.className = 'panel result-panel';
  results.innerHTML = `
    <div class="result-top">
      <div>
        <div class="kicker ${hasSavings ? 'success-label' : ''}">${hasSavings ? 'Output ready' : 'Analysis complete'}</div>
        <h2>${hasSavings ? escapeHTML(outputName) : 'Nothing changed'}</h2>
      </div>
      ${hasSavings ? '<button class="download-button" id="downloadButton">Download trimmed BSP</button>' : ''}
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Original</div>
        <div class="stat-value">${formatBytes(report.inputBytes)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Output</div>
        <div class="stat-value">${formatBytes(report.outputBytes)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Raw saving</div>
        <div class="stat-value savings">${hasSavings ? '−' : ''}${formatBytes(Math.max(0, report.savedBytes))}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Reduction</div>
        <div class="stat-value savings">${Math.max(0, report.savedPercent).toFixed(2)}%</div>
      </div>
    </div>
    <p class="result-note">
      ${escapeHTML(report.format)} · ${report.faceCount.toLocaleString()} faces ·
      ${report.textureCount.toLocaleString()} texture slots ·
      ${changed.length.toLocaleString()} cropped · ${removed.length.toLocaleString()} unused removed ·
      ${report.bspxCount.toLocaleString()} BSPX lumps preserved
    </p>
    ${rows ? `<div class="table-wrap">
      <table>
        <thead><tr><th>Texture</th><th>Action</th><th>Dimensions</th><th>Saved</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` : '<p class="empty-result">Every texture was either fully used or excluded by the conservative safety rules.</p>'}
    ${report.changes.length > 250
      ? `<p class="result-note">Showing the first 250 of ${report.changes.length.toLocaleString()} changes.</p>`
      : ''}
    ${skipText ? `<p class="skip-summary"><strong>Skipped:</strong> ${escapeHTML(skipText)}</p>` : ''}
  `;
  results.hidden = false;

  const downloadButton = document.getElementById('downloadButton');
  if (downloadButton) downloadButton.addEventListener('click', downloadOutput);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadOutput() {
  if (!outputBuffer) return;
  const blob = new Blob([outputBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = outputName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const absolute = Math.abs(bytes);
  if (absolute < 1024) return `${absolute} B`;
  if (absolute < 1024 * 1024) return `${(absolute / 1024).toFixed(1)} KB`;
  if (absolute < 1024 * 1024 * 1024) return `${(absolute / (1024 * 1024)).toFixed(2)} MB`;
  return `${(absolute / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
