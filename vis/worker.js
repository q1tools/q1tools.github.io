'use strict';

importScripts('app.js');

const core = self.VisPatchCore;

function postLog(message) {
    self.postMessage({ type: 'log', message });
}

function postProgress(percent, text) {
    self.postMessage({ type: 'progress', percent, text });
}

function postOutput(filename, bytes) {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    self.postMessage({ type: 'done', filename, buffer }, [buffer]);
}

self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type !== 'run') return;

    try {
        const result = core.runVisPatchJob({
            bspBuffer: data.bspBuffer,
            bspName: data.bspName,
            prt: data.prt,
            outputMode: data.outputMode,
            logFn: postLog,
            progressFn: postProgress
        });
        postOutput(result.filename, result.bytes);
    } catch (e) {
        self.postMessage({
            type: 'error',
            message: e && e.message ? e.message : String(e)
        });
    }
});
