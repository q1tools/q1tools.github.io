/**
* Quake Web Tools Application.
*
* @module QuakeWebTools
*/
var QuakeWebTools = QuakeWebTools || {};

/*
TODO:

Start to think about creating various parts of the app as web components.
Initially the app is going to be a viewer for various types, which will then
later be built upon so that files opened in the app can be modified and saved,
and eventually created from scratch.

component ideas:
MDL viewer
WAD viewer
File tree

LARGE TASKS
+ file manager class for dealing with files more cleanly
+ animated image support
+ support for sprite frames in image loader

SMALLER TASKS



GOAL:
To make a simple web-based Quake editing suite. To start with, it should be able to handle all of the
various file types used by Quake.

LIBRARIES:
dropzone.js - file uploading (drag and drop)
datastream.js - handle binary file data in a more c like manner
filesaver.js - save files in a simple and cross-browser (should all work the same, but...)

C++?
Is it best to handle this in C, then get it working on the web via asm.js?
If so, it might be worth trying to port trenchbroom as long as it uses asm.js compatible libraries

ROUGH PLAN:
Read binary files in a generic and flexible manner
support reading basic quake file types
PAK first
list PAK contents
extract PAK contents
modify PAK contents (delete, move, rename)
add to PAK contents

preview wav in page
preview lmp in page (as png)
preview txt types in page
preview images inside bsp and wad
 
LIST OF TYPES:
.WAV    Sound files (RIFF/WAVE)
.BSP    levels (map and textures)
.MDL    3D models (Alias)
.SPR    Sprite models
.DAT    Pseudo-code
.RC     Resources
.CFG    Config Files
.LMP    Lump files
.BIN    End screen
.WAD    WAD2 file


PAK
[DONE] Load existing PAK files
[DONE] Save modified PAK files
[DONE] Show a list of contained files/data
[DONE] Extract entries as files
Insert new entries
Delete entries
Rename entries
Move entries
Create, rename, delete and move folders (note: folders don't exist as actual entries)

Should also be able to preview files in the PAK

WAD
[DONE] Load existing WAD files
Save modified WAD files
[DONE] Show a list of textures in the WAD
[DONE] Extract textures as files/data
Insert new textures, with appropriate color conversion
Delete textures
Rename textures

Should be able to preview and edit textures easily.
Texture editing operations should be limited to simple, texmex style things like remove fullbrites, rotate, flip etc.
Should be able to paste textures or drag files and have the correct colour conversion and mip-mapping performed
*/


/**
* Globals objects.
*/
QuakeWebTools.GLOBAL = {
  "FILEMANAGER": null,
  "ACTIVE_MD3_VIEWER": null,
  "PENDING_MD3_TEXTURE": null
};

/**
* Important application paths.
*/
QuakeWebTools.PATH = {
  BASE: "QuakeWebTools/",
  DATA: "QuakeWebTools/data/",
  CFG: "QuakeWebTools/config/"
};

function app_init() {
  console.log("app_init...");

  var QWT = QuakeWebTools;
  var G = QWT.GLOBAL;
  var PATH = QWT.PATH;

  G.FILEMANAGER = new QuakeWebTools.FileManager();

  var pal_file = PATH.DATA + "quake.pal";
  G.FILEMANAGER.queueFile(pal_file, [function() {
      QWT.DEFAULT_PALETTE = G.FILEMANAGER.getFile(pal_file, "obj");
      app_main();
    }]);

/*
  var files = [
    "id1/pak0.pak",
    "id1/pak1.pak",
  ];
  G.FILEMANAGER.queueFiles(files, [function() {
      console.log("GROUP 1 LOADED");
    }]);
  var files = [
    "quoth/pak0.pak",
    "quoth/pak1.pak",
    "quoth/pak2.pak"
  ];
  G.FILEMANAGER.queueFiles(files, [function() {
      console.log("GROUP 2 LOADED");
    }]);
*/

  G.FILEMANAGER.loadAllQueued();
}

function app_main() {
  console.log("app_main...");

  var QWT = QuakeWebTools;
  var G = QuakeWebTools.GLOBAL;

  // tests
  var path = "id1/pak0.pak|maps/e1m1.bsp|CLIP";
  var path_info = QuakeWebTools.FileUtil.getPathInfo(path);
  //console.log(path_info);
}


// TODO: move this functionality to suitable place and tidy up code
function viewPAK(pak) {
  var header = pak.header;
  var directory = pak.directory;

  var div_content = document.getElementById("file-content");
  
  // create div of links to files in the pak
  var div = document.createElement("div");
  div.style = "padding: 0; margin: 0; text-align: left";
  var ul = document.createElement("ol");

  for (var j = 0; j < directory.length; ++j) {
    var li = document.createElement("li");
    var a = pak.getDownloadLink(directory[j]);
    li.appendChild(a);
    ul.appendChild(li);
  }

  div.appendChild(ul);
  div_content.appendChild(div);
}

function viewBSP(bsp) {
  var clock;
  var scene, camera, renderer;
  var light_ambient, light_directional;
  var controls;

  var animate_id = 0;
  var frame_id = 0;

  function init() {
    var div_content = document.getElementById("file-content");
    var width = div_content.offsetWidth;
    var height = 300;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);

    var materials = bsp.getThreeMaterialDirectory();
    var models = bsp.geometry.models;

    for (var i = 0; i < models.length; ++i) {
      var geometries = models[i].geometries;

      for (var j = 0; j < geometries.length; ++j) {
        var geometry = geometries[j].geometry;
        var mat_id = geometries[j].tex_id;
        var mesh = new THREE.Mesh(geometry, materials[mat_id]);
        scene.add(mesh);
        mesh.rotation.x = -90 * Math.PI / 180;
        mesh.rotation.z = -90 * Math.PI / 180;

        // wfh is temporary
        var wfh = new THREE.WireframeHelper(mesh, 0x666666);
        wfh.material.linewidth = 2;
        scene.add(wfh);
        wfh.rotation.x = -90 * Math.PI / 180;
        wfh.rotation.z = -90 * Math.PI / 180;
      }
    }

    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    div_content.appendChild(renderer.domElement);

    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 500;
    controls.lookSpeed = 0.5;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    var QWT = QuakeWebTools;
    if (QWT.STATS !== undefined) stats.begin();

    animate_id = requestAnimationFrame(animate);
    controls.update( clock.getDelta() );
    render();

    if(QWT.STATS !== undefined) stats.end();
  }

  init();
  animate();

  // need a way to deal with all these kind of "threads"
  return animate_id;
}

function viewMDL(mdl) {
  var scene, camera, renderer;
  var box, model, material, mesh, boxmesh;
  var controls;

  var animate_id = 0;
  var frame_id = 0;

  function init() {
    var div_content = document.getElementById("file-content");
    var width = div_content.offsetWidth;
    var height = 300;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
    // 12 (player head)
    // 230 (cthon)

    box = new THREE.BoxGeometry(50, 50, 50);
    model = mdl.toThreeBufferGeometry(0);
    material = mdl.toThreeMaterial();

    // Basic wireframe materials.
    // var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
    // var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true } ); 
    // var multiMaterial = [ material, wireframeMaterial ];
    // mesh = THREE.SceneUtils.createMultiMaterialObject(model, multiMaterial);
    mesh = new THREE.Mesh(model, material);

    // console.log(mesh);

    scene.add(mesh);
    //scene.add(boxmesh);

    var radius = model.boundingSphere.radius;

    camera.position.z = radius * 2;
    mesh.rotation.x = -90 * Math.PI / 180;
    mesh.rotation.z = -90 * Math.PI / 180;
    mesh.position.y -= radius / 3;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    div_content.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener( 'change', render );
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    var QWT = QuakeWebTools;
    if (QWT.STATS !== undefined) stats.begin();

    animate_id = requestAnimationFrame(animate);

    mdl.blendBufferGeometryFrame(model, frame_id);
    frame_id = (frame_id + 1/6) % mdl.geometry.frames.length; // assuming 60fps

    render();

    if(QWT.STATS !== undefined) stats.end();
  }

  init();
  animate();

  // need a way to deal with all these kind of "threads"
  return animate_id;
}

function viewMD3(md3) {
  var viewer = {
    animationId: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    modelGroup: null,
    texture: null,
    _textureLoader: null,
    _pendingTextureUrl: null,
    _onWindowResize: null,
    loadTextureFromFile: null,
    setTexture: null,
    dispose: null
  };

  var div_content = document.getElementById("file-content");
  var width = div_content.offsetWidth || 540;
  var height = Math.max(360, Math.min(600, Math.round(width * 0.75)));

  viewer.scene = new THREE.Scene();
  viewer.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  var renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x333333, 1);
  div_content.appendChild(renderer.domElement);
  viewer.renderer = renderer;

  viewer.controls = new THREE.OrbitControls(viewer.camera, renderer.domElement);
  viewer.controls.enableDamping = true;
  viewer.controls.dampingFactor = 0.25;
  viewer.controls.screenSpacePanning = false;
  viewer.controls.maxPolarAngle = Math.PI / 2;

  var ambientLight = new THREE.AmbientLight(0x404040, 2);
  viewer.scene.add(ambientLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  viewer.scene.add(directionalLight);

  viewer.modelGroup = md3.toThreeGroup();
  viewer.modelGroup.scale.set(0.0015, 0.0015, 0.0015);
  viewer.modelGroup.rotation.set(Math.PI / 2, Math.PI, 0);
  viewer.scene.add(viewer.modelGroup);
  try {
    var childTotal = 0;
    viewer.modelGroup.traverse(function(o){ if (o && (o.isMesh || (typeof THREE.Mesh !== 'undefined' && o instanceof THREE.Mesh))) childTotal++; });
    console.log('[QWT][MD3] viewer modelGroup ready; mesh children =', childTotal);
  } catch (e) {}

  var radius = Math.max(md3.boundingRadius || 500, 1);
  var scaledRadius = radius * 0.0015;
  viewer.camera.position.set(0, 0, scaledRadius * 4);
  viewer.controls.update();

  function animate() {
    viewer.animationId = requestAnimationFrame(animate);
    viewer.controls.update();
    viewer.renderer.render(viewer.scene, viewer.camera);
  }
  animate();

  function onWindowResize() {
    if (!viewer.renderer || !viewer.camera) return;
    var newWidth = div_content.offsetWidth || width;
    var newHeight = Math.max(360, Math.min(600, Math.round(newWidth * 0.75)));
    viewer.camera.aspect = newWidth / newHeight;
    viewer.camera.updateProjectionMatrix();
    viewer.renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener("resize", onWindowResize);
  viewer._onWindowResize = onWindowResize;

  viewer._revokeTextureUrl = function() {
    if (viewer._pendingTextureUrl) {
      URL.revokeObjectURL(viewer._pendingTextureUrl);
      viewer._pendingTextureUrl = null;
    }
  };

  viewer.setTexture = function(texture) {
    try { console.log('[QWT][MD3] setTexture invoked'); } catch(e) {}
    viewer.texture = texture;
    if (!texture || !viewer.modelGroup) {
      try { console.log('[QWT][MD3] setTexture: missing texture or modelGroup'); } catch(e) {}
      return;
    }
    // Support both modern and legacy Three.js builds: some older builds
    // do not set child.isMesh. Fall back to instanceof check.
    var updatedMeshes = 0;
    viewer.modelGroup.traverse(function(child) {
      var isMesh = (child && (child.isMesh === true || (typeof THREE.Mesh !== 'undefined' && child instanceof THREE.Mesh)));
      if (isMesh && child.material) {
        if (Array.isArray(child.material)) {
          for (var i = 0; i < child.material.length; i++) {
            var mat = child.material[i];
            if (!mat) continue;
            mat.map = texture;
            mat.transparent = false;
            mat.opacity = 1;
            mat.needsUpdate = true;
          }
        } else {
          child.material.map = texture;
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.needsUpdate = true;
        }
        updatedMeshes++;
      }
    });
    try {
      console.log('[QWT][MD3] setTexture: applied to meshes =', updatedMeshes);
      if (!updatedMeshes) {
        var debugCount = 0;
        viewer.modelGroup.traverse(function(child){
          var matInfo = '';
          if (child && child.material) {
            if (Array.isArray(child.material)) { matInfo = 'materials[' + child.material.length + ']'; }
            else { matInfo = 'material: ' + (child.material.type || 'unknown'); }
          }
          console.log('[QWT][MD3] traverse node ->', (child && child.type) || typeof child, 'isMesh:', (child && child.isMesh), matInfo);
          if (++debugCount > 10) return; // avoid flooding
        });
      }
    } catch(e) {}
  };

  viewer.loadTextureFromFile = function(file) {
    if (!file) return;
    var name = file.name || file.originalName || 'texture';
    try { console.log('[QWT][MD3] loadTextureFromFile:', name, 'type:', file.type || (file.dataUrl ? 'data-url' : 'unknown')); } catch(e) {}
    viewer._revokeTextureUrl();

    function applyDataUrl(dataUrl) {
      try {
        var img = new Image();
        img.onload = function() {
          try {
            var tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            tex.flipY = false;
            if (typeof THREE.ClampToEdgeWrapping !== 'undefined') {
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
            }
            if (typeof THREE.LinearFilter !== 'undefined') {
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
            }
            console.log('[QWT][MD3] Texture ready (data URL); applying');
            viewer.setTexture(tex);
          } catch (applyErr) {
            console.error('[QWT][MD3] Failed to apply texture:', applyErr);
          }
        };
        img.onerror = function(err) {
          console.error('[QWT][MD3] Image decode failed:', err);
          alert("Unable to load texture '" + name + "'.");
        };
        img.src = dataUrl;
      } catch (err) {
        console.error('[QWT][MD3] Unable to start image load from data URL:', err);
      }
    }

    if (file.dataUrl) {
      try { console.log('[QWT][MD3] loadTextureFromFile detected dataUrl (length=', (file.dataUrl && file.dataUrl.length) || 0, ')'); } catch (e) {}
      applyDataUrl(file.dataUrl);
      return;
    }

    var blobSource = null;
    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      blobSource = file;
    } else if (file && file._blob instanceof Blob) {
      blobSource = file._blob;
    }
    if (!blobSource && file && typeof file.blob === 'function') {
      try {
        blobSource = file.blob();
      } catch (err) {
        console.warn('[QWT][MD3] Failed to extract blob from file-like object:', err);
      }
    }

    try {
      var reader = new FileReader();
      reader.onload = function(ev) {
        applyDataUrl(ev.target.result);
      };
      reader.onerror = function(err) {
        console.error('[QWT][MD3] FileReader error:', err);
      };
      if (blobSource) {
        reader.readAsDataURL(blobSource);
      } else if (typeof Blob !== 'undefined' && file instanceof Blob === false && typeof file !== 'object') {
        reader.readAsDataURL(new Blob([file], { type: 'application/octet-stream' }));
      } else {
        reader.readAsDataURL(file);
      }
    } catch (e) {
      console.error('[QWT][MD3] loadTextureFromFile exception:', e);
    }
  };

  viewer.dispose = function() {
    if (viewer.animationId != null) {
      cancelAnimationFrame(viewer.animationId);
      viewer.animationId = null;
    }
    viewer._revokeTextureUrl();
    if (viewer._onWindowResize) {
      window.removeEventListener("resize", viewer._onWindowResize);
      viewer._onWindowResize = null;
    }
  };

  return viewer;
}
