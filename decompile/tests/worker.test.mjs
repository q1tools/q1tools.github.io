import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";

const encoder = new TextEncoder();

function align4(value) {
  return (value + 3) & ~3;
}

function makeMinimalBsp29() {
  const headerSize = 124;
  const entities = encoder.encode('{\n"classname" "worldspawn"\n}\n\0');
  const entityOffset = headerSize;
  const leafOffset = align4(entityOffset + entities.length);
  const modelOffset = align4(leafOffset + 28);
  const buffer = new ArrayBuffer(modelOffset + 64);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setInt32(0, 29, true);

  const setLump = (index, offset, length) => {
    view.setInt32(4 + index * 8, offset, true);
    view.setInt32(8 + index * 8, length, true);
  };
  setLump(0, entityOffset, entities.length);
  setLump(10, leafOffset, 28);
  setLump(14, modelOffset, 64);
  bytes.set(entities, entityOffset);

  view.setInt32(leafOffset, -2, true);
  view.setInt32(leafOffset + 4, -1, true);
  for (let axis = 0; axis < 3; axis++) {
    view.setInt16(leafOffset + 8 + axis * 2, -32, true);
    view.setInt16(leafOffset + 14 + axis * 2, 32, true);
    view.setFloat32(modelOffset + axis * 4, -32, true);
    view.setFloat32(modelOffset + 12 + axis * 4, 32, true);
  }
  for (let hull = 0; hull < 4; hull++) view.setInt32(modelOffset + 36 + hull * 4, -1, true);
  return buffer;
}

function startWebWorkerShim() {
  const moduleUrl = new URL("../src/decompile.worker.js", import.meta.url).href;
  const bootstrap = `
    const { parentPort } = require("node:worker_threads");
    globalThis.self = {
      postMessage(message) { parentPort.postMessage(message); }
    };
    import(${JSON.stringify(moduleUrl)}).then(() => {
      parentPort.on("message", (data) => globalThis.self.onmessage({ data }));
    }).catch((error) => {
      parentPort.postMessage({ type: "bootstrap-error", message: error.message });
    });
  `;
  return new Worker(bootstrap, { eval: true });
}

function terminalMessage(worker) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Worker protocol test timed out.")), 5_000);
    worker.on("message", (message) => {
      if (message.type === "complete" || message.type === "error" || message.type === "bootstrap-error") {
        clearTimeout(timeout);
        resolve(message);
      }
    });
    worker.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

test("the module worker accepts a transferred BSP and returns a MAP result", async (t) => {
  const worker = startWebWorkerShim();
  t.after(() => worker.terminate());
  const terminal = terminalMessage(worker);
  const buffer = makeMinimalBsp29();
  worker.postMessage({ buffer, fileName: "worker.bsp", options: {} }, [buffer]);
  assert.equal(buffer.byteLength, 0);

  const message = await terminal;
  assert.equal(message.type, "complete");
  assert.equal(message.result.diagnostics.outputBrushes, 1);
  assert.match(message.result.mapText, /^\/\/ Game: Quake\n\/\/ Format: Valve\n/);
});

test("the module worker fails closed on an invalid message", async (t) => {
  const worker = startWebWorkerShim();
  t.after(() => worker.terminate());
  const terminal = terminalMessage(worker);
  worker.postMessage(null);
  const message = await terminal;
  assert.equal(message.type, "error");
  assert.match(message.error.message, /expected an ArrayBuffer/);
});
