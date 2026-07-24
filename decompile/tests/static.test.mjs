import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

test("the static entry point has a restrictive policy and no inline code", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /worker-src 'self'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\sstyle="/i);
});

test("all relative HTML assets and JavaScript imports resolve", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const entryAssets = [...html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g)].map((match) => match[1]);
  for (const asset of entryAssets) {
    await access(new URL(asset, root));
  }

  const modules = ["src/app.js", "src/decompile.worker.js", "src/bsp-decompiler.js"];
  for (const modulePath of modules) {
    const moduleUrl = new URL(modulePath, root);
    const source = await readFile(moduleUrl, "utf8");
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^"']+\s+from\s+)?["'](\.\/[^"']+)["']/g)) {
      await access(new URL(match[1], moduleUrl));
    }
  }
});

test("HTML ids are unique and interactive output has accessible relationships", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(html, /role="progressbar"[^>]+aria-valuenow="0"/);
  assert.match(html, /id="diagnosticsTab"[^>]+aria-controls="diagnosticsPanel"/);
  assert.match(html, /id="sourcePanel"[^>]+aria-labelledby="sourceTab"/);
  assert.match(html, /id="mapCanvas"[^>]+tabindex="0"/);
});

test("the complete redistributable GPL text is included", async () => {
  const copying = await readFile(new URL("COPYING", root), "utf8");
  assert.match(copying, /GNU GENERAL PUBLIC LICENSE\s+Version 2, June 1991/);
  assert.match(copying, /END OF TERMS AND CONDITIONS/);
  assert.ok(copying.length > 17_000, `${fileURLToPath(new URL("COPYING", root))} is unexpectedly short`);
});
