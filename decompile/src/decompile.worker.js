import { decompileBsp } from "./bsp-decompiler.js";

self.onmessage = (event) => {
  try {
    const { buffer, fileName, options } = event.data || {};
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError("The decompiler worker expected an ArrayBuffer.");
    }
    const result = decompileBsp(buffer, {
      ...options,
      fileName,
      onProgress(progress, message) {
        self.postMessage({ type: "progress", progress, message });
      }
    });
    const transfer = result.wad?.buffer instanceof ArrayBuffer ? [result.wad.buffer] : [];
    self.postMessage({ type: "complete", result }, transfer);
  } catch (error) {
    self.postMessage({
      type: "error",
      error: {
        name: error?.name || "Error",
        message: error?.message || String(error),
        details: error?.details || null
      }
    });
  }
};
