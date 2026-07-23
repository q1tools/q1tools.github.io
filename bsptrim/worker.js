'use strict';

importScripts('core.js');

self.onmessage = function (event) {
  try {
    const result = self.BSPTextureTrimmer.trimBSP(event.data.buffer, event.data.options);
    self.postMessage({ ok: true, buffer: result.buffer, report: result.report }, [result.buffer]);
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
};
