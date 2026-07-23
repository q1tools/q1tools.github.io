"use strict";

importScripts("./print-export.js");

self.addEventListener("message", (event) => {
  const request = event.data || {};
  try {
    if (!self.QuakePrintExport) {
      throw new Error("The 3D print exporter did not load in the background worker.");
    }

    const mesh = self.QuakePrintExport.prepareMesh(
      request.positions,
      request.triangles,
      request.options || {}
    );
    const bytes = request.format === "stl"
      ? self.QuakePrintExport.serializeBinaryStl(mesh, request.label)
      : self.QuakePrintExport.serialize3mf(mesh, request.metadata || {});

    self.postMessage({
      ok: true,
      bytes,
      mesh: {
        bounds: mesh.bounds,
        options: mesh.options,
        stats: mesh.stats,
      },
    }, [bytes.buffer]);
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
