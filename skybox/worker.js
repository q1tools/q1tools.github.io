"use strict";

importScripts("app.js");

var core = self.SkyboxCore;

self.onmessage = function (event) {
    var message = event.data || {};
    if (message.type !== "renderFaces")
        return;

    try {
        var source = rehydrateSource(message.source);
        var cfg = message.cfg;
        var size = Number(message.size) || 1024;
        var sampling = message.sampling || "1";

        core.FACE_ORDER.forEach(function (face, faceIndex) {
            var faceData = core.renderFacePixels(source, cfg, face, size, sampling, function (row, totalRows) {
                self.postMessage({
                    type: "progress",
                    jobId: message.jobId,
                    faceIndex: faceIndex,
                    row: row,
                    totalRows: totalRows
                });
            });

            self.postMessage({
                type: "face",
                jobId: message.jobId,
                suffix: face.suffix,
                width: faceData.width,
                height: faceData.height,
                buffer: faceData.data.buffer,
                doneFaces: faceIndex + 1
            }, [faceData.data.buffer]);
        });

        self.postMessage({
            type: "done",
            jobId: message.jobId
        });
    } catch (error) {
        self.postMessage({
            type: "error",
            jobId: message.jobId,
            message: error && error.message ? error.message : "Worker renderer failed."
        });
    }
};

function rehydrateSource(source) {
    return {
        kind: source.kind,
        width: source.width,
        height: source.height,
        data: source.kind === "hdr" ? new Float32Array(source.data) : new Uint8ClampedArray(source.data),
        filename: source.filename
    };
}
