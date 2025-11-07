var QuakeWebTools = QuakeWebTools || {};

/**
* PK3 (zip) archive representation.
* @constructor
* @param {String} path - The path and filename.
* @param {ArrayBuffer} arraybuffer - The file data as an ArrayBuffer.
*/
QuakeWebTools.PK3 = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.path = path;
  this.ab = arraybuffer;
  this.entries = null;
  this._zipPromise = null;
  this._entriesPromise = null;
};

QuakeWebTools.PK3.prototype._ensureZip = function() {
  if (typeof JSZip === "undefined") {
    return Promise.reject(new Error("JSZip library not loaded"));
  }
  if (!this._zipPromise) {
    this._zipPromise = JSZip.loadAsync(this.ab);
  }
  return this._zipPromise;
};

/**
* Load all entries within the PK3 archive. The result is cached.
* @return {Promise<Array<QuakeWebTools.PK3.Entry>>}
*/
QuakeWebTools.PK3.prototype.loadEntries = function() {
  var self = this;
  if (!this._entriesPromise) {
    this._entriesPromise = this._ensureZip().then(function(zip) {
      var entries = [];
      zip.forEach(function(relativePath, zipEntry) {
        if (zipEntry.dir) {
          return;
        }
        entries.push(new QuakeWebTools.PK3.Entry(zipEntry));
      });
      entries.sort(function(a, b) {
        return a.path.localeCompare(b.path, undefined, {sensitivity: "base"});
      });
      self.entries = entries;
      return entries;
    });
  }
  return this._entriesPromise;
};

/**
* Create an anchor element that downloads the specified entry when activated.
* @param {QuakeWebTools.PK3.Entry} entry The PK3 entry to export.
*/
QuakeWebTools.PK3.prototype.getDownloadLink = function(entry) {
  var a = document.createElement("a");
  a.href = "#" + entry.path;
  a.textContent = entry.path;
  var filename = entry.getDownloadName();
  var archiveName = this.filename;

  a.onclick = function(event) {
    event.preventDefault();
    entry.getBlob().then(function(blob) {
      var href = window.URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function() { window.URL.revokeObjectURL(href); }, 1000);
    }).catch(function(err) {
      console.error("[QWT][PK3] Failed to export entry:", entry.path, err);
      alert("Unable to export " + entry.path + " from '" + archiveName + "'.");
    });
  };

  return a;
};

QuakeWebTools.PK3.prototype.toString = function() {
  return "PK3: '" + this.filename + "'";
};

/**
* Representation of a single entry inside a PK3 archive.
* @constructor
* @param {Object} zipEntry JSZip entry object.
*/
QuakeWebTools.PK3.Entry = function(zipEntry) {
  this.path = zipEntry.name;
  this.zipEntry = zipEntry;
  this.uncompressedSize = (zipEntry._data && zipEntry._data.uncompressedSize) ||
                          zipEntry.uncompressedSize || null;
  this.compressedSize = (zipEntry._data && zipEntry._data.compressedSize) ||
                        zipEntry.compressedSize || null;
};

QuakeWebTools.PK3.Entry.prototype.getArrayBuffer = function() {
  return this.zipEntry.async("arraybuffer");
};

QuakeWebTools.PK3.Entry.prototype.getBlob = function() {
  return this.zipEntry.async("blob");
};

QuakeWebTools.PK3.Entry.prototype.getDownloadName = function() {
  var name = this.path;
  var slash = name.lastIndexOf("/");
  if (slash !== -1) {
    name = name.substring(slash + 1);
  }
  return name || this.path || "entry";
};
