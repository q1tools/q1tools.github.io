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
    self.postMessage({ type: "complete", result });
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
