var QuakeWebTools = QuakeWebTools || {};

/**
* Minimal MD3 file representation for rendering within Quake Web Tools.
* @constructor
* @param {String} path File path/name.
* @param {ArrayBuffer} arraybuffer Raw file data.
*/
QuakeWebTools.MD3 = function(path, arraybuffer) {
  this.filename = QuakeWebTools.FileUtil.getFilename(path);
  this.ab = arraybuffer;
  this.scale = 1;
  this.boundingRadius = 1;

  this._parse();
};

QuakeWebTools.MD3.prototype._parse = function() {
  var data = new DataView(this.ab);
  this.header = this._parseHeader(data);

  if (this.header.ident !== "IDP3") {
    throw new Error("Invalid MD3 file '" + this.filename + "': missing IDP3 header.");
  }

  this.frames = this._parseFrames(data, this.header);
  this.tags = this._parseTags(data, this.header);
  var surfaceResult = this._parseSurfaces(data, this.header);
  this.surfaces = surfaceResult.surfaces;
  this.boundingRadius = surfaceResult.boundingRadius || this.boundingRadius;
};

QuakeWebTools.MD3.prototype._parseHeader = function(data) {
  return {
    ident: this._readString(data, 0, 4),
    version: data.getInt32(4, true),
    name: this._readString(data, 8, 64),
    flags: data.getInt32(72, true),
    numFrames: data.getInt32(76, true),
    numTags: data.getInt32(80, true),
    numSurfaces: data.getInt32(84, true),
    numSkins: data.getInt32(88, true),
    ofsFrames: data.getInt32(92, true),
    ofsTags: data.getInt32(96, true),
    ofsSurfaces: data.getInt32(100, true),
    ofsEnd: data.getInt32(104, true)
  };
};

QuakeWebTools.MD3.prototype._parseFrames = function(data, header) {
  var frames = [];
  var offset = header.ofsFrames;

  for (var i = 0; i < header.numFrames; ++i) {
    frames.push({
      minBounds: this._readVector3(data, offset),
      maxBounds: this._readVector3(data, offset + 12),
      localOrigin: this._readVector3(data, offset + 24),
      radius: data.getFloat32(offset + 36, true),
      name: this._readString(data, offset + 40, 16)
    });
    offset += 56;
  }

  return frames;
};

QuakeWebTools.MD3.prototype._parseTags = function(data, header) {
  var tags = [];
  var offset = header.ofsTags;
  var total = header.numTags * header.numFrames;

  for (var i = 0; i < total; ++i) {
    tags.push({
      name: this._readString(data, offset, 64),
      origin: this._readVector3(data, offset + 64),
      axis: [
        this._readVector3(data, offset + 76),
        this._readVector3(data, offset + 88),
        this._readVector3(data, offset + 100)
      ]
    });
    offset += 112;
  }

  return tags;
};

QuakeWebTools.MD3.prototype._parseSurfaces = function(data, header) {
  var offset = header.ofsSurfaces;
  var surfaces = [];
  var maxRadiusSq = 0;

  for (var i = 0; i < header.numSurfaces; ++i) {
    var surfaceHeader = this._parseSurfaceHeader(data, offset);
    var surface = {
      header: surfaceHeader,
      vertices: new Float32Array(surfaceHeader.numVerts * 3),
      normals: new Float32Array(surfaceHeader.numVerts * 3),
      uvs: new Float32Array(surfaceHeader.numVerts * 2),
      indices: new Uint32Array(surfaceHeader.numTriangles * 3)
    };

    // triangles
    var triOffset = offset + surfaceHeader.ofsTriangles;
    for (var t = 0; t < surfaceHeader.numTriangles; ++t) {
      var triIndex = t * 3;
      surface.indices[triIndex] = data.getInt32(triOffset, true);
      surface.indices[triIndex + 1] = data.getInt32(triOffset + 4, true);
      surface.indices[triIndex + 2] = data.getInt32(triOffset + 8, true);
      triOffset += 12;
    }

    // uvs
    var uvOffset = offset + surfaceHeader.ofsSt;
    for (var v = 0; v < surfaceHeader.numVerts; ++v) {
      var uvIndex = v * 2;
      surface.uvs[uvIndex] = data.getFloat32(uvOffset, true);
      surface.uvs[uvIndex + 1] = data.getFloat32(uvOffset + 4, true);
      uvOffset += 8;
    }

    // vertices & normals - take first frame for static preview
    var vertOffset = offset + surfaceHeader.ofsXyzNormal;
    for (var frame = 0; frame < surfaceHeader.numFrames; ++frame) {
      for (var vert = 0; vert < surfaceHeader.numVerts; ++vert) {
        if (frame === 0) {
          var baseIndex = vert * 3;
          var x = data.getInt16(vertOffset, true) * this.scale;
          var y = data.getInt16(vertOffset + 2, true) * this.scale;
          var z = data.getInt16(vertOffset + 4, true) * this.scale;
          var normal = data.getInt16(vertOffset + 6, true);
          var decoded = this._decodeNormal(normal);

          surface.vertices[baseIndex] = x;
          surface.vertices[baseIndex + 1] = y;
          surface.vertices[baseIndex + 2] = z;
          surface.normals[baseIndex] = decoded[0];
          surface.normals[baseIndex + 1] = decoded[1];
          surface.normals[baseIndex + 2] = decoded[2];

          var radiusSq = x * x + y * y + z * z;
          if (radiusSq > maxRadiusSq) {
            maxRadiusSq = radiusSq;
          }
        }
        vertOffset += 8;
      }
    }

    surfaces.push(surface);
    if (!surfaceHeader.ofsEnd) {
      break;
    }
    offset += surfaceHeader.ofsEnd;
  }

  return {
    surfaces: surfaces,
    boundingRadius: Math.sqrt(maxRadiusSq)
  };
};

QuakeWebTools.MD3.prototype._parseSurfaceHeader = function(data, offset) {
  return {
    ident: this._readString(data, offset, 4),
    name: this._readString(data, offset + 4, 64),
    flags: data.getInt32(offset + 68, true),
    numFrames: data.getInt32(offset + 72, true),
    numShaders: data.getInt32(offset + 76, true),
    numVerts: data.getInt32(offset + 80, true),
    numTriangles: data.getInt32(offset + 84, true),
    ofsTriangles: data.getInt32(offset + 88, true),
    ofsShaders: data.getInt32(offset + 92, true),
    ofsSt: data.getInt32(offset + 96, true),
    ofsXyzNormal: data.getInt32(offset + 100, true),
    ofsEnd: data.getInt32(offset + 104, true)
  };
};

QuakeWebTools.MD3.prototype._readString = function(data, offset, length) {
  var str = "";
  for (var i = 0; i < length; ++i) {
    var charCode = data.getUint8(offset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str;
};

QuakeWebTools.MD3.prototype._readVector3 = function(data, offset) {
  return [
    data.getFloat32(offset, true),
    data.getFloat32(offset + 4, true),
    data.getFloat32(offset + 8, true)
  ];
};

QuakeWebTools.MD3.prototype._decodeNormal = function(normal) {
  var lat = (normal >> 8) & 0xff;
  var lng = normal & 0xff;

  var latRad = lat * Math.PI / 128;
  var lngRad = lng * Math.PI / 128;

  var x = Math.cos(latRad) * Math.sin(lngRad);
  var y = Math.sin(latRad) * Math.sin(lngRad);
  var z = Math.cos(lngRad);

  return [x, y, z];
};

/**
* Build a THREE.Group representing all MD3 surfaces.
* @param {THREE.Texture=} texture Optional shared texture.
*/
QuakeWebTools.MD3.prototype.toThreeGroup = function(texture) {
  var group = new THREE.Object3D();
  var meshCount = 0;

  for (var i = 0; i < this.surfaces.length; ++i) {
    var surface = this.surfaces[i];
    var geometry = new THREE.BufferGeometry();

    var positionAttr = new THREE.Float32Attribute(surface.vertices.length / 3, 3);
    positionAttr.array.set(surface.vertices);
    geometry.addAttribute("position", positionAttr);

    var normalAttr = new THREE.Float32Attribute(surface.normals.length / 3, 3);
    normalAttr.array.set(surface.normals);
    geometry.addAttribute("normal", normalAttr);

    var uvAttr = new THREE.Float32Attribute(surface.uvs.length / 2, 2);
    uvAttr.array.set(surface.uvs);
    geometry.addAttribute("uv", uvAttr);

    var indexAttrCtor = (surface.indices.length > 65535) ? THREE.Uint32Attribute : THREE.Uint16Attribute;
    var indexAttr = new indexAttrCtor(surface.indices.length, 1);
    indexAttr.array.set(surface.indices);
    geometry.attributes.index = indexAttr;
    geometry.computeBoundingSphere();

    var material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.NoBlending
    });

    if (texture) {
      material.map = texture;
    }

    var mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    meshCount++;
  }

  try { console.log('[QWT][MD3] toThreeGroup: created meshes =', meshCount); } catch(e) {}
  return group;
};
