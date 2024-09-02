// createEntity in initializeScene for height
// lights.push(createLight in init for lighting
// gl.clearColor(0.0, 0.0, 0.0, 1.0); in init for back, but hazzy?
// var swivelSpeed = 0.0002;  // Slower swivel speed
// var verticalSpeed = 0.0001; // Slower vertical movement

Application = function () {
    var PI_DIV_180 = Math.PI / 180;

    var PITCH = 0;
    var YAW = 1;
    var ROLL = 2;

    var canvas;

    var gl_extensions;
    var gl_maxTextureSize = 0;
    var gl_maxTextureImageUnits = 0;
    var gl_maxVertexTextureImageUnits = 0;
    var gl_maxVertexUniformVectors = 0;
    var gl_maxFragmentUniformVectors = 0;

    var requestAnimationFrameImpl;
    var getAnimationTimeImpl;

    var pendingTextureLoads = 0;

    var lastFrameMsec;

    var mouse = { x: 0, y: 0, pressed: 0 };

    var camera = {};

    var lights = [];
    var entities = [];

    var defaultTexture;

    var floorModel;
    var boxModel;
    var zombieModel;
    var pinkyModel;
    var impModel;
    var impAnims = [];

    var depthPassProgram;
    var lightingPassProgram;

    function initGL(canvas) {
        if (!canvas.getContext) {
            document.writeln("browser doesn't support canvas");
        }

        if (!window.WebGLRenderingContext) {
            document.writeln("browser doesn't support WebGL");
        }

        var names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
        var context = null;

        for (var i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i], { antialias: false, depth: true, stencil: false });
            } catch (e) {}
            if (context) {
                break;
            }
        }

        if (!context) {
            alert("Couldn't fetch WebGL rednering context for canvas");
        }

        gl = context;

        if (gl.getSupportedExtensions) {
            gl_extensions = gl.getSupportedExtensions();
        }
        else {
            gl_extensions = [];
        }
        
        gl_maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        gl_maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        gl_maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        gl_maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
        gl_maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    }

    function checkGLError(msg) {
        var err = gl.getError();
        var err_str;

        if (err === gl.NO_ERROR)
            return;

        switch (err) {
        case gl.INVALID_ENUM:
            err_str = "INVALID_ENUM";
            break;
        case gl.INVALID_VALUE:
            err_str = "INVALID_VALUE";
            break;
        case gl.INVALID_OPERATION:
            err_str = "INVALID_OPERATION";
            break;
        case gl.OUT_OF_MEMORY:
            err_str = "OUT_OF_MEMORY";
            break;
        default:
            err_str = "unknown " + err.toString;
            break;
        }

        console.log("checkGLError: " + err_str + " on " + msg);
    }

    function getFrameMsec() {
        if (!getAnimationTimeImpl) {
            var attribNames = ["animationTime", "webkitAnimationTime", "mozAnimationTime", "oAnimationTime", "msAnimationTime"];
            var i;
            for (i = 0; i < attribNames.length; i++) {
                var name = attribNames[i];
                if (window[name]) {
                    getAnimationTimeImpl = function () { return window[name]; };
                    break;
                }
            }

            if (i == attribNames.length)
                getAnimationTimeImpl = function() { return (new Date()).getTime(); };
        }

        return getAnimationTimeImpl();
    }

    function setNextFrame(element, callback) {
        if (!requestAnimationFrameImpl) {
            var functionNames = ["requestAnimationFrame", "webkitRequestAnimationFrame", "Mozrequestanimationframe", "Operarequestanimationframe"];
            var i;
            for (i = 0; i < functionNames.length; i++) {
                var name = functionNames[i];
                if (window[name]) {
                    requestAnimationFrameImpl = function(element, callback) { window[name].call(window, callback, element); };
                    break;
                }
            }

            if (i == functionNames.length)
                requestAnimationFrameImpl = function(element, callback) { window.setTimeout(callback, 1000 / 58); };
        }

        return requestAnimationFrameImpl(element, callback);
    }

    function isPowerOfTwo(x) {
        return (x & (x - 1)) == 0;
    }
    
    function nextHighestPowerOfTwo(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    }

    function createDefaultTexture() {
        defaultTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        var canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        var context = canvas.getContext("2d");
        var imageData = context.createImageData(32, 32);
        for (var i = 0; i < 32*4; i += 4) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 255;
            imageData.data[i + 2] = 255;
            imageData.data[i + 3] = 255;
            imageData.data[32*31*4 + i] = 255;
            imageData.data[32*31*4 + i + 1] = 255;
            imageData.data[32*31*4 + i + 2] = 255;
            imageData.data[32*31*4 + i + 3] = 255;
        }

        for (var i = 0; i < 32*32*4; i += 32*4) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 255;
            imageData.data[i + 2] = 255;
            imageData.data[i + 3] = 255;
            imageData.data[31*4 + i] = 255;
            imageData.data[31*4 + i + 1] = 255;
            imageData.data[31*4 + i + 2] = 255;
            imageData.data[31*4 + i + 3] = 255;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    function loadTexture(src) {
        var texture = {};
        texture.image = new Image;

        pendingTextureLoads++;
        
        texture.image.onload = function () {    
            if (!isPowerOfTwo(texture.image.width) || !isPowerOfTwo(texture.image.height)) {
                var canvas = document.createElement("canvas");
                canvas.width = nextHighestPowerOfTwo(texture.image.width);
                canvas.height = nextHighestPowerOfTwo(texture.image.height);
                var ctx = canvas.getContext("2d");
                ctx.drawImage(texture.image, 0, 0, texture.image.width, texture.image.height, 0, 0, canvas.width, canvas.height);
                texture.image = canvas;
            }
            
            texture.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
            
            gl.generateMipmap(gl.TEXTURE_2D);

            //checkGLError("error loading texture: " + src);

            pendingTextureLoads--;
        }

        texture.image.onerror = function () {
            //alert(texture.image.src);
            pendingTextureLoads--;
        }

        texture.texture = defaultTexture;
        texture.image.src = src;
        
        return texture;
    }

    function createShader(type, text) {
        var shader = gl.createShader(type);

        while (text.search(/^\#include/m) >= 0) {
            text = text.replace(/^\#include\s+"([^"]+)"/mg, function ($0, filename) { 
                var includedText;
                var request = new XMLHttpRequest();

                request.onreadystatechange = function () {
                    if (request.readyState == 4 && request.status == 200) {
                        includedText = request.responseText;
                    }
                }

                request.open('GET', filename, false);
                request.send(null);

                return includedText;
            });
        }

        //console.log(text);
        gl.shaderSource(shader, text);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("shader compile error:\n" + gl.getShaderInfoLog(shader) + "source:\n" + text);
            return null;
        }

        return shader;
    }

    function createProgram(text_vs, text_fs, oncreate) {
        var program = gl.createProgram();

        program.vertexShader = createShader(gl.VERTEX_SHADER, "#ifdef GL_ES\nprecision mediump float;\n#endif\n" + text_vs);
        if (!program.vertexShader) {
            gl.deleteProgram(program);
            return null;
        }
       
        program.fragmentShader = createShader(gl.FRAGMENT_SHADER, "#ifdef GL_ES\nprecision mediump float;\n#endif\n" + text_fs);
        if (!program.fragmentShader) {
            gl.deleteShader(program.vertexShader);
            gl.deleteProgram(program);
            return null;
        }
        
        gl.attachShader(program, program.vertexShader);
        gl.attachShader(program, program.fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("program link error:\n" + gl.getProgramInfoLog(program) + "\n\nvertex shader source:\n" + text_vs + "\n\nfragment shader source:\n" + text_fs);
            gl.deleteProgram(program);
            gl.deleteShader(program.vertexShader);
            gl.deleteShader(program.fragmentShader);
            return null;
        }

        oncreate(program);

        return program;
    }

    function init() {
        initGL(canvas);
    
        var extensionString = "";
        for (var i = 0; i < gl_extensions.length; i++) {
            extensionString += " " + gl_extensions[i];
        }
        console.log("Supported Extensions: " + extensionString + "\n");
        console.log("MAX_TEXTURE_SIZE: " + gl_maxTextureSize + "\n");
        console.log("MAX_TEXTURE_IMAGE_UNITS: " + gl_maxTextureImageUnits + "\n");
        console.log("MAX_VERTEX_TEXTURE_IMAGE_UNITS: " + gl_maxVertexTextureImageUnits + "\n");
        console.log("MAX_VERTEX_UNIFORM_VECTORS: " + gl_maxVertexUniformVectors + "\n");
        console.log("MAX_FRAGMENT_UNIFORM_VECTORS: " + gl_maxFragmentUniformVectors + "\n");
    
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.frontFace(gl.CW);
        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);
    
        createDefaultTexture();
    
       // floorModel = createFloorModel("models/floor/tilefloor_d.png", "models/floor/tilefloor_local.png", "models/floor/tilefloor_s.png");
    
        // The impModel and impAnims will be loaded dynamically via drag-and-drop or file input
        /*
        impModel = loadModelMD5mesh("models/md5/imp/imp.md5mesh");
        impAnims.push(loadMD5anim("models/md5/imp/idle1.md5anim"));
        */
    
        onCreateProgram = function (program) {
            program.attrib = {};
            program.attrib.pos = gl.getAttribLocation(program, "pos");
            program.attrib.texCoord = gl.getAttribLocation(program, "texCoord");
            program.attrib.normal = gl.getAttribLocation(program, "normal");
            program.attrib.tangent = gl.getAttribLocation(program, "tangent");
            program.attrib.weightIndex0 = gl.getAttribLocation(program, "weightIndex0");
            program.attrib.weightIndex1 = gl.getAttribLocation(program, "weightIndex1");
            program.attrib.weightValue0 = gl.getAttribLocation(program, "weightValue0"); 
            program.attrib.weightValue1 = gl.getAttribLocation(program, "weightValue1");
    
            program.uniform = {};
            program.uniform.diffuseMap = gl.getUniformLocation(program, "diffuseMap");
            program.uniform.bumpMap = gl.getUniformLocation(program, "bumpMap");
            program.uniform.specularMap = gl.getUniformLocation(program, "specularMap");
            program.uniform.modelViewProjectionMatrix = gl.getUniformLocation(program, "modelViewProjectionMatrix");
            program.uniform.worldMatrixS = gl.getUniformLocation(program, "worldMatrixS");
            program.uniform.worldMatrixT = gl.getUniformLocation(program, "worldMatrixT");
            program.uniform.worldMatrixR = gl.getUniformLocation(program, "worldMatrixR");
            program.uniform.localViewOrigin = gl.getUniformLocation(program, "localViewOrigin");
            program.uniform.localLightOrigin = gl.getUniformLocation(program, "localLightOrigin");
            program.uniform.specularExponent = gl.getUniformLocation(program, "specularExponent");
            program.uniform.lightColor = gl.getUniformLocation(program, "lightColor");
            program.uniform.lightFallOffExponent = gl.getUniformLocation(program, "lightFallOffExponent");
            program.uniform.lightInvRadius = gl.getUniformLocation(program, "lightInvRadius");
            program.uniform.joints = gl.getUniformLocation(program, "joints");
        };
    
        // Set up shaders and programs
        depthProgram = createProgram(
            '#include "shaders/depth_vertex.inc"',
            '#include "shaders/depth_fragment.inc"', 
            onCreateProgram
        );
    
        depthProgram.skinnedVersion = [];
        depthProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix1.inc"\n' + '#include "shaders/depth_vertex.inc"',
            '#include "shaders/depth_fragment.inc"',
            onCreateProgram
        ));
    
        depthProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix4.inc"\n' + '#include "shaders/depth_vertex.inc"',
            '#include "shaders/depth_fragment.inc"',
            onCreateProgram
        ));
    
        depthProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix8.inc"\n' + '#include "shaders/depth_vertex.inc"',
            '#include "shaders/depth_fragment.inc"',
            onCreateProgram
        ));
    
        lightingProgram = createProgram(
            '#include "shaders/lighting_vertex.inc"', 
            '#define HALF_LAMBERT_DIFFUSE\n' + '#include "shaders/lighting_fragment.inc"',
            onCreateProgram
        );
    
        lightingProgram.skinnedVersion = [];
        lightingProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix1.inc"\n' + '#include "shaders/lighting_vertex.inc"',
            '#define HALF_LAMBERT_DIFFUSE\n' + '#include "shaders/lighting_fragment.inc"',
            onCreateProgram
        ));
    
        lightingProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix4.inc"\n' + '#include "shaders/lighting_vertex.inc"',
            '#define HALF_LAMBERT_DIFFUSE\n' + '#include "shaders/lighting_fragment.inc"',
            onCreateProgram
        ));
    
        lightingProgram.skinnedVersion.push(createProgram(
            '#define HW_SKINNING\n' + '#include "shaders/skinning_matrix8.inc"\n' + '#include "shaders/lighting_vertex.inc"',
            '#define HALF_LAMBERT_DIFFUSE\n' + '#include "shaders/lighting_fragment.inc"',
            onCreateProgram
        ));
    
        camera.origin = vec3.create([0, 0, 14]);
        camera.angles = vec3.create([15, 180, 0]);
        camera.axis = [vec3.create(), vec3.create(), vec3.create()];
        camera.viewMatrix = mat4.create();
        camera.projectionMatrix = mat4.create();
        camera.viewProjectionMatrix = mat4.create();

        lights.push(createLight([100, 100, 100], 800, 8, [1.0, 1.0, 1.0]));  // White light
        lights.push(createLight([100, -100, 100], 800, 8, [1.0, 1.0, 1.0])); // White light
        lights.push(createLight([0, 0, 500], 800, 8, [1.0, 1.0, 1.0]));      // Sunlight from above

        // Additional lights to reduce shadows and brighten the scene
        lights.push(createLight([-100, 100, 100], 800, 8, [1.0, 1.0, 1.0])); // Light from another direction
        lights.push(createLight([100, 100, -100], 800, 8, [1.0, 1.0, 1.0])); // Light from below
        lights.push(createLight([-100, -100, 100], 800, 8, [1.0, 1.0, 1.0])); // Light from the opposite direction
        lights.push(createLight([0, 0, -500], 800, 8, [1.0, 1.0, 1.0]));      // Light from below

/*    
        var entity  = createEntity([0, 0, 0]);
        entities.push(entity);
        vec3.set([1, 0, 0], entity.axis[0]);
        vec3.set([0, 1, 0], entity.axis[1]);
        vec3.set([0, 0, 1], entity.axis[2]);
        entity.model = floorModel;
    
*/

        // Do not add impModel to entities until it's loaded
    }

    function runFrame() {
        setNextFrame(gl.canvas, arguments.callee);

        var currentFrameMsec = getFrameMsec();
        var frametime = (currentFrameMsec - lastFrameMsec) / 1000;

        //$('div#info').text(mouse.x + ' ' + mouse.y + ' ' + mouse.pressed);
        //$('div#info').text("" + vec3.str(camera.axis[0]) + vec3.str(camera.axis[1]) + vec3.str(camera.axis[2]));
        //$('div#info').text(vec3.str(camera.axis[2]));

        var swivelSpeed = 0.0002;  // Slower swivel speed
        var verticalSpeed = 0.0001; // Slower vertical movement

        camera.origin[0] = Math.sin(currentFrameMsec * swivelSpeed) * (120 + Math.cos(currentFrameMsec * swivelSpeed) * 50);
        camera.origin[1] = Math.cos(currentFrameMsec * swivelSpeed) * (120 + Math.cos(currentFrameMsec * swivelSpeed) * 50);
        camera.origin[2] = 50 + Math.sin(currentFrameMsec * verticalSpeed) * 30;

        var forward = vec3.create();
        vec3.subtract([0, 0, 50], camera.origin, forward);
        vec3.normalize(forward, camera.axis[0]);
        vec3.set([0, 0, 1], camera.axis[2]);
        vec3.cross(camera.axis[2], camera.axis[0], camera.axis[1]);
        vec3.normalize(camera.axis[1]);
        vec3.cross(camera.axis[0], camera.axis[1], camera.axis[2]);
        vec3.normalize(camera.axis[2]);

	    for (var i = 0; i < entities.length; i++) {
	        entities[i].runFrame.call(entities[i], frametime);
	    }

        updateScreen();

        lastFrameMsec = currentFrameMsec;
    }

    function updateScreen() {
        // projection matrix
        mat4.perspective(60, gl.canvas.width / gl.canvas.height, 1, 4096, camera.projectionMatrix);

        // view matrix
        //var mouseOffsetX = 2 * mouse.x / (gl.canvas.width - 1) - 1;
        //var mouseOffsetY = 2 * mouse.y / (gl.canvas.height - 1) - 1;
        //camera.angles[1] = -mouseOffsetX * 360;
        //camera.angles[0] = mouseOffsetY * 360;
        //anglesToVectors(camera.angles, camera.axis[0], camera.axis[1], camera.axis[2]);
        setViewMatrix(camera.axis[0], camera.axis[1], camera.axis[2], camera.origin, camera.viewMatrix);

        // projection * view matrix
        mat4.multiply(camera.projectionMatrix, camera.viewMatrix, camera.viewProjectionMatrix);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        updateSkinningJoints();

        renderDepthPass();

        renderLightingPass();

        gl.flush();

        //checkGLError("updateScreen");
    }

    function updateSkinningJoints() {
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            var model = entity.model;

            if (model.meshes.length > 0 && entity.joints) {
                for (var j = 0; j < entity.joints.length; j++) {
                    var baseIndex = j * 12;
                    var m1 = entity.joints[j];
                    var m2 = model.inverseDefaultMats[j];
                    var dest = entity.skinningJoints;

                    dest[baseIndex + 0] = m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8];
                    dest[baseIndex + 1] = m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9];
                    dest[baseIndex + 2] = m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10];
                    dest[baseIndex + 3] = m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3];

                    dest[baseIndex + 4] = m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8];
                    dest[baseIndex + 5] = m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9];
                    dest[baseIndex + 6] = m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10];
                    dest[baseIndex + 7] = m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7];

                    dest[baseIndex + 8] = m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8];
                    dest[baseIndex + 9] = m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9];
                    dest[baseIndex + 10] = m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10];
                    dest[baseIndex + 11] = m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11];
                }
            }
        }
    }

    function renderDepthPass() {
        gl.colorMask(false, false, false, false);
        gl.depthMask(true);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.model.meshes.length > 0) {
                entity.updateModelMatrix(entity.axis, entity.origin);
                renderDepthPassEntity(entity);
            }
        }
    }

    function renderLightingPass() {
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.enable(gl.BLEND);

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.model.meshes.length > 0) {
                entity.updateModelMatrix(entity.axis, entity.origin);
                renderLightingPassEntity(entity);
            }
        }
    }

    function renderDepthPassEntity(entity) {
        var modelViewProjectionMatrix = mat4.create();
        mat4.multiply(camera.viewProjectionMatrix, entity.modelMatrix, modelViewProjectionMatrix);
        
        for (var i = 0; i < entity.model.meshes.length; i++) {
            var mesh = entity.model.meshes[i];
            var program = depthProgram;

            if (mesh.vertexWeightData) {
                program = program.skinnedVersion[mesh.skinningShaderIndex];
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            
            gl.enableVertexAttribArray(program.attrib.pos);
            gl.vertexAttribPointer(program.attrib.pos, mesh.vertexComponents[0].count, gl.FLOAT, false, mesh.vertexSize, mesh.vertexComponents[0].offset);

            if (mesh.vertexWeightData) {
                if (mesh.skinningShaderIndex == 2) {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);

                    gl.enableVertexAttribArray(program.attrib.weightIndex1);
                    gl.vertexAttribPointer(program.attrib.weightIndex1, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 4);

                    gl.enableVertexAttribArray(program.attrib.weightValue0);
                    gl.vertexAttribPointer(program.attrib.weightValue0, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 8);

                    gl.enableVertexAttribArray(program.attrib.weightValue1);
                    gl.vertexAttribPointer(program.attrib.weightValue1, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 12);
                }
                else if (mesh.skinningShaderIndex == 1) {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);

                    gl.enableVertexAttribArray(program.attrib.weightValue0);
                    gl.vertexAttribPointer(program.attrib.weightValue0, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 4);
                }
                else {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 1, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);
                }
            }

            gl.useProgram(program);

            gl.uniformMatrix4fv(program.uniform.modelViewProjectionMatrix, false, modelViewProjectionMatrix);

            if (entity.skinningJoints) {
                /*var vec = new Float32Array(4);
                for (var i = 0; i < entity.skinningJoints.length; i++) {
                    vec[0] = entity.skinningJoints[i*4 + 0];
                    vec[1] = entity.skinningJoints[i*4 + 1];
                    vec[2] = entity.skinningJoints[i*4 + 2];
                    vec[3] = entity.skinningJoints[i*4 + 3];
                    gl.uniform4fv(program.uniform.joints[i], vec);
                }*/
                gl.uniform4fv(program.uniform.joints, entity.skinningJoints);
            }

            gl.drawElements(gl.TRIANGLES, mesh.numIndexes, gl.UNSIGNED_SHORT, 0);

            gl.disableVertexAttribArray(program.attrib.pos);

            if (mesh.vertexWeightData) {
                if (mesh.skinningShaderIndex == 2) {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                    gl.disableVertexAttribArray(program.attrib.weightIndex1);
                    gl.disableVertexAttribArray(program.attrib.weightValue0);
                    gl.disableVertexAttribArray(program.attrib.weightValue1);
                }
                else if (mesh.skinningShaderIndex == 1) {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                    gl.disableVertexAttribArray(program.attrib.weightValue0);
                }
                else {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                }
            }
        }        
    }

    function renderLightingPassEntity(entity) {
        for (var i = 0; i < lights.length; i++) {
            renderLightInteraction(lights[i], entity);
        }
    }

    function renderLightInteraction(light, entity) {
        var modelViewProjectionMatrix = mat4.create();
        mat4.multiply(camera.viewProjectionMatrix, entity.modelMatrix, modelViewProjectionMatrix);

        var d = vec3.create();

        var localViewOrigin = vec3.create();
        vec3.subtract(camera.origin, entity.origin, d);
        localViewOrigin[0] = vec3.dot(entity.axis[0], d);
        localViewOrigin[1] = vec3.dot(entity.axis[1], d);
        localViewOrigin[2] = vec3.dot(entity.axis[2], d);

        var localLightOrigin = new Float32Array(4);
        vec3.subtract(light.origin, entity.origin, d);
        localLightOrigin[0] = vec3.dot(entity.axis[0], d);
        localLightOrigin[1] = vec3.dot(entity.axis[1], d);
        localLightOrigin[2] = vec3.dot(entity.axis[2], d);
        localLightOrigin[3] = 0;

        var lightInvRadius = 1 / light.radius;
        var lightInvRadiusVec = vec3.create([lightInvRadius, lightInvRadius, lightInvRadius]);

        for (var i = 0; i < entity.model.meshes.length; i++) {
            var mesh = entity.model.meshes[i];
            var program = lightingProgram;

            if (mesh.vertexWeightData) {
                program = program.skinnedVersion[mesh.skinningShaderIndex];
            }
            
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

            gl.enableVertexAttribArray(program.attrib.pos);
            gl.vertexAttribPointer(program.attrib.pos, mesh.vertexComponents[0].count, gl.FLOAT, false, mesh.vertexSize, mesh.vertexComponents[0].offset);

            gl.enableVertexAttribArray(program.attrib.texCoord);
            gl.vertexAttribPointer(program.attrib.texCoord, mesh.vertexComponents[1].count, gl.FLOAT, false, mesh.vertexSize, mesh.vertexComponents[1].offset);

            gl.enableVertexAttribArray(program.attrib.normal);
            gl.vertexAttribPointer(program.attrib.normal, mesh.vertexComponents[2].count, gl.FLOAT, false, mesh.vertexSize, mesh.vertexComponents[2].offset);

            gl.enableVertexAttribArray(program.attrib.tangent);
            gl.vertexAttribPointer(program.attrib.tangent, mesh.vertexComponents[3].count, gl.FLOAT, false, mesh.vertexSize, mesh.vertexComponents[3].offset);

            if (mesh.vertexWeightData) {
                if (mesh.skinningShaderIndex == 2) {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);

                    gl.enableVertexAttribArray(program.attrib.weightIndex1);
                    gl.vertexAttribPointer(program.attrib.weightIndex1, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 4);

                    gl.enableVertexAttribArray(program.attrib.weightValue0);
                    gl.vertexAttribPointer(program.attrib.weightValue0, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 8);

                    gl.enableVertexAttribArray(program.attrib.weightValue1);
                    gl.vertexAttribPointer(program.attrib.weightValue1, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 12);
                }
                else if (mesh.skinningShaderIndex == 1) {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 4, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);

                    gl.enableVertexAttribArray(program.attrib.weightValue0);
                    gl.vertexAttribPointer(program.attrib.weightValue0, 4, gl.UNSIGNED_BYTE, true, mesh.vertexWeightSize, mesh.vertexData.byteLength + 4);
                }
                else {
                    gl.enableVertexAttribArray(program.attrib.weightIndex0);
                    gl.vertexAttribPointer(program.attrib.weightIndex0, 1, gl.UNSIGNED_BYTE, false, mesh.vertexWeightSize, mesh.vertexData.byteLength + 0);
                }
            }

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mesh.diffuseTexture.texture);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, mesh.bumpTexture.texture);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, mesh.specularTexture.texture);

            gl.useProgram(program);

            gl.uniform1i(program.uniform.diffuseMap, 0);
            gl.uniform1i(program.uniform.bumpMap, 1);
            gl.uniform1i(program.uniform.specularMap, 2);
            gl.uniformMatrix4fv(program.uniform.modelViewProjectionMatrix, false, modelViewProjectionMatrix);
            gl.uniform3fv(program.uniform.localViewOrigin, localViewOrigin);
            gl.uniform4fv(program.uniform.localLightOrigin, localLightOrigin);
            gl.uniform1f(program.uniform.specularExponent, 32);
            gl.uniform3fv(program.uniform.lightColor, light.color);
            gl.uniform1f(program.uniform.lightFallOffExponent, light.fallOffExponent);
            gl.uniform3fv(program.uniform.lightInvRadius, lightInvRadiusVec);

            if (entity.skinningJoints) {
                /*var vec = new Float32Array(4);
                for (var i = 0; i < entity.skinningJoints.length; i++) {
                    vec[0] = entity.skinningJoints[i*4 + 0];
                    vec[1] = entity.skinningJoints[i*4 + 1];
                    vec[2] = entity.skinningJoints[i*4 + 2];
                    vec[3] = entity.skinningJoints[i*4 + 3];
                    gl.uniform4fv(program.uniform.joints[i], vec);
                }*/
                gl.uniform4fv(program.uniform.joints, entity.skinningJoints);
            }

            gl.drawElements(gl.TRIANGLES, mesh.numIndexes, gl.UNSIGNED_SHORT, 0);

            gl.disableVertexAttribArray(program.attrib.pos);
            gl.disableVertexAttribArray(program.attrib.texCoord);
            gl.disableVertexAttribArray(program.attrib.normal);
            gl.disableVertexAttribArray(program.attrib.tangent);

            if (mesh.vertexWeightData) {
                if (mesh.skinningShaderIndex == 2) {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                    gl.disableVertexAttribArray(program.attrib.weightIndex1);
                    gl.disableVertexAttribArray(program.attrib.weightValue0);
                    gl.disableVertexAttribArray(program.attrib.weightValue1);
                }
                else if (mesh.skinningShaderIndex == 1) {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                    gl.disableVertexAttribArray(program.attrib.weightValue0);
                }
                else {
                    gl.disableVertexAttribArray(program.attrib.weightIndex0);
                }
            }
        }
    }

    function toRadian(degree) {
        return degree * PI_DIV_180;
    }

    function toDegree(radian) {
        return radian / PI_DIV_180;
    }

    function anglesToVectors(angles, forward, left, up) {
        var rad_y = toRadian(angles[YAW]);
        var rad_p = toRadian(angles[PITCH]);
        var rad_r = toRadian(angles[ROLL]);

        sy = Math.sin(rad_y);
        cy = Math.cos(rad_y);
        sp = Math.sin(rad_p);
        cp = Math.cos(rad_p);
        sr = Math.sin(rad_r);
        cr = Math.cos(rad_r);
        srsp = sr * sp;
        crsp = cr * sp;

	    forward.set([cp * cy, cp * sy, -sp]);
	    left.set([srsp * cy - cr * sy, srsp * sy + cr * cy, sr * cp]);
	    up.set([crsp * cy + sr * sy, crsp * sy - sr * cy, cr * cp]);
    }

    function setViewMatrix(forward, left, up, viewOrigin, mat) {
        var back = vec3.create();
        vec3.negate(forward, back);

        var right = vec3.create();
        vec3.negate(left, right);

        mat[0] = right[0];
        mat[1] = up[0];
        mat[2] = back[0];
        mat[3] = 0;

        mat[4] = right[1];
        mat[5] = up[1];
        mat[6] = back[1];
        mat[7] = 0;

        mat[8] = right[2];
        mat[9] = up[2];
        mat[10] = back[2]
        mat[11] = 0;
        
        mat[12] = -(vec3.dot(viewOrigin, right));
        mat[13] = -(vec3.dot(viewOrigin, up));
        mat[14] = -(vec3.dot(viewOrigin, back));
        mat[15] = 1;
    }

    /*function allocMesh(numVerts, numIndexes, diffuseSrc, bumpSrc, specularSrc) {
        var mesh = {};
        
        mesh.vertexComponents = [
            { name: "pos",     offset: 0,  typeSize: 4, count: 3 },
            { name: "st",      offset: 12, typeSize: 4, count: 2 },
            { name: "normal",  offset: 20, typeSize: 4, count: 3 },
            { name: "tangent", offset: 32, typeSize: 4, count: 4 }
        ];
        mesh.vertexSize = 0;
        for (var i = 0; i < mesh.vertexComponents.length; i++) {
            mesh.vertexSize += mesh.vertexComponents[i].typeSize * mesh.vertexComponents[i].count;
        }

        mesh.numVerts = numVerts;
        mesh.vertexData = new ArrayBuffer(mesh.numVerts * mesh.vertexSize);
        mesh.verts = new Array(mesh.numVerts);
        for (var i = 0; i < mesh.numVerts; i++) {
            mesh.verts[i] = {
                pos:     new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[0].offset, 3),
                st:      new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[1].offset, 2),
                normal:  new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[2].offset, 3),
                tangent: new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[3].offset, 4),
            };
        }

        mesh.numIndexes = numIndexes;
        mesh.indexData = new Uint16Array(numIndexes);
        mesh.indexes = mesh.indexData;

        mesh.diffuseTexture = loadTexture(diffuseSrc);
        mesh.bumpTexture = loadTexture(bumpSrc);
        mesh.specularTexture = loadTexture(specularSrc);

        return mesh;
    }*/

        function allocMesh(numVerts, numIndexes, diffuseSrc, bumpSrc, specularSrc) {
            var mesh = {};
            
            mesh.vertexComponents = [
                { name: "pos",     offset: 0,  typeSize: 4, count: 3 },
                { name: "st",      offset: 12, typeSize: 4, count: 2 },
                { name: "normal",  offset: 20, typeSize: 4, count: 3 },
                { name: "tangent", offset: 32, typeSize: 4, count: 4 }
            ];
            mesh.vertexSize = 0;
            for (var i = 0; i < mesh.vertexComponents.length; i++) {
                mesh.vertexSize += mesh.vertexComponents[i].typeSize * mesh.vertexComponents[i].count;
            }
    
            mesh.numVerts = numVerts;
            mesh.vertexData = new ArrayBuffer(mesh.numVerts * mesh.vertexSize);
            mesh.verts = new Array(mesh.numVerts);
            for (var i = 0; i < mesh.numVerts; i++) {
                mesh.verts[i] = {
                    pos:     new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[0].offset, 3),
                    st:      new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[1].offset, 2),
                    normal:  new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[2].offset, 3),
                    tangent: new Float32Array(mesh.vertexData, mesh.vertexSize * i + mesh.vertexComponents[3].offset, 4),
                };
            }
    
            mesh.numIndexes = numIndexes;
            mesh.indexData = new Uint16Array(numIndexes);
            mesh.indexes = mesh.indexData;
    
            mesh.diffuseTexture = loadTexture(diffuseSrc);
            mesh.bumpTexture = loadTexture(bumpSrc);
            mesh.specularTexture = loadTexture(specularSrc);
    
            return mesh;
        }
    
    function computeMeshBounds(mesh) {
        var mins = vec3.create([+Infinity, +Infinity, +Infinity]);
        var maxs = vec3.create([-Infinity, -Infinity, -Infinity]);

        for (var i = 0; i < mesh.numVerts; i++) {
            var pos = mesh.verts[i].pos;

            mins[0] = Math.min(mins[0], pos[0]);
            mins[1] = Math.min(mins[1], pos[1]);
            mins[2] = Math.min(mins[2], pos[2]);

            maxs[0] = Math.max(maxs[0], pos[0]);
            maxs[1] = Math.max(maxs[1], pos[1]);
            maxs[2] = Math.max(maxs[2], pos[2]);
        }

        mesh.mins = mins;
        mesh.maxs = maxs;
    }

    function computeMeshNormals(mesh) {
        var side0 = vec3.create();
        var side1 = vec3.create();
        var n = vec3.create();

        for (var i = 0; i < mesh.numVerts; i++) {
            vec3.set([0, 0, 0], mesh.verts[i].normal);
        }

        for (var i = 0; i < mesh.numIndexes; i += 3) {
            var v0 = mesh.verts[mesh.indexes[i]];
            var v1 = mesh.verts[mesh.indexes[i + 1]];
            var v2 = mesh.verts[mesh.indexes[i + 2]];

            vec3.subtract(v1.pos, v0.pos, side0);
            vec3.subtract(v2.pos, v0.pos, side1);

            vec3.cross(side1, side0, n);
            vec3.normalize(n);

            vec3.add(v0.normal, n);
            vec3.add(v1.normal, n);
            vec3.add(v2.normal, n);
        }

        for (var i = 0; i < mesh.numVerts; i++) {
            vec3.normalize(mesh.verts[i].normal);
        }
    }

    function computeMeshUnsmootedTangents(mesh) {
        var v0, v1, v2;
        var t = [vec3.create(), vec3.create()];
        var n = vec3.create();
	    var p0 = vec3.create();
        var p1 = vec3.create();
        var vec = vec3.create();
        var side0 = vec3.create();
        var side1 = vec3.create();

        mesh.dominantTris = new Array(mesh.numVerts);

        // 각 버텍스 별로 dominant(가장 큰 면적의) triangle 을 구한다
	    for (var i = 0; i < mesh.numVerts; i++) {
	        var dominantTriArea = -1;
	        var dominantTriVertex2 = -1;
	        var dominantTriVertex3 = -1;

	        for (var j = 0; j < mesh.numIndexes; j += 3) {
		        if (mesh.indexes[j] == i || mesh.indexes[j+1] == i || mesh.indexes[j+2] == i) {
                    vec3.subtract(mesh.verts[mesh.indexes[j+1]].pos, mesh.verts[mesh.indexes[j]].pos, p0);
		            vec3.subtract(mesh.verts[mesh.indexes[j+2]].pos, mesh.verts[mesh.indexes[j]].pos, p1);

		            // 삼각형 면적 구하기
		            // var area = vec3.length(vec3.cross(p0, p1, vec)) / 2;
		            var area = vec3.length(vec3.cross(p0, p1, vec));

		            if (area > dominantTriArea) {
			            dominantTriArea = area;

			            if (mesh.indexes[j] == i) {
			                dominantTriVertex2 = mesh.indexes[j + 1];
			                dominantTriVertex3 = mesh.indexes[j + 2];
			            } else if (mesh.indexes[j+1] == i) {
			                dominantTriVertex2 = mesh.indexes[j + 2];
			                dominantTriVertex3 = mesh.indexes[j];
			            } else {
			                dominantTriVertex2 = mesh.indexes[j];
			                dominantTriVertex3 = mesh.indexes[j + 1];
			            }
		            }
		        }
	        }

	        if (dominantTriVertex2 == -1 || dominantTriVertex3 == -1) {
		        alert("computeMeshTangents: dominant triangle is not exist");
            }

            mesh.dominantTris[i] = {
                v2: dominantTriVertex2,
                v3: dominantTriVertex3,
                normalizationScale: new Array(3)
            };

	        v0 = mesh.verts[i];
	        v1 = mesh.verts[dominantTriVertex2];
	        v2 = mesh.verts[dominantTriVertex3];

	        vec3.subtract(v1.pos, v0.pos, side0);
	        vec3.subtract(v2.pos, v0.pos, side1);

	        var ds1 = v1.st[0] - v0.st[0];
	        var dt1 = v1.st[1] - v0.st[1];

	        var ds2 = v2.st[0] - v0.st[0];
	        var dt2 = v2.st[1] - v0.st[1];

	        var det = ds1 * dt2 - ds2 * dt1;
	        var sign = det < 0 ? -1 : 1;

	        t[0][0] = dt2 * side0[0] - dt1 * side1[0];
	        t[0][1] = dt2 * side0[1] - dt1 * side1[1];
	        t[0][2] = dt2 * side0[2] - dt1 * side1[2];

	        f = 1 / Math.sqrt(t[0][0] * t[0][0] + t[0][1] * t[0][1] + t[0][2] * t[0][2]);
	        f *= sign;
	        mesh.dominantTris[i].normalizationScale[0] = f;

	        t[1][0] = ds1 * side1[0] - ds2 * side0[0];
	        t[1][1] = ds1 * side1[1] - ds2 * side0[1];
	        t[1][2] = ds1 * side1[2] - ds2 * side0[2];

	        f = 1 / Math.sqrt(t[1][0] * t[1][0] + t[1][1] * t[1][1] + t[1][2] * t[1][2]);
	        f *= sign;
	        mesh.dominantTris[i].normalizationScale[1] = f;

	        n[0] = side1[1] * side0[2] - side1[2] * side0[1];
	        n[1] = side1[2] * side0[0] - side1[0] * side0[2];
	        n[2] = side1[0] * side0[1] - side1[1] * side0[0];

	        f = 1 / Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
	        mesh.dominantTris[i].normalizationScale[2] = f;
	    }

	    deriveUnsmoothedTangents(mesh.verts, mesh.dominantTris, mesh.numVerts);

	    normalizeTangents(mesh.verts);
    }

    function bitangent_sign(n, t0, t1) {
        var bitangent = vec3.create();
        vec3.cross(n, t0, bitangent);
	    return vec3.dot(bitangent, t1) > 0 ? 1 : -1;
    }

    function deriveUnsmoothedTangents(verts, dominantTris, numVerts) {
	    for (var i = 0; i < numVerts; i++)
	    {
	        var dt = dominantTris[i];

	        var a = verts[i];
	        var b = verts[dt.v2];
	        var c = verts[dt.v3]

	        var d0 = b.pos[0] - a.pos[0];
	        var d1 = b.pos[1] - a.pos[1];
	        var d2 = b.pos[2] - a.pos[2];
	        var d3 = b.st[0] - a.st[0];
	        var d4 = b.st[1] - a.st[1];

	        var d5 = c.pos[0] - a.pos[0];
	        var d6 = c.pos[1] - a.pos[1];
	        var d7 = c.pos[2] - a.pos[2];
	        var d8 = c.st[0] - a.st[0];
	        var d9 = c.st[1] - a.st[1];

	        var s0 = dt.normalizationScale[0];
	        var s1 = dt.normalizationScale[1];
	        var s2 = dt.normalizationScale[2];

	        var n0 = s2 * (d6 * d2 - d7 * d1);
	        var n1 = s2 * (d7 * d0 - d5 * d2);
	        var n2 = s2 * (d5 * d1 - d6 * d0);

	        var t0 = s0 * (d0 * d9 - d4 * d5);
	        var t1 = s0 * (d1 * d9 - d4 * d6);
	        var t2 = s0 * (d2 * d9 - d4 * d7);

	        var t3 = s1 * (n2 * t1 - n1 * t2);
	        var t4 = s1 * (n0 * t2 - n2 * t0);
	        var t5 = s1 * (n1 * t0 - n0 * t1);

	        a.normal[0] = n0;
	        a.normal[1] = n1;
	        a.normal[2] = n2;

	        a.tangent[0] = t0;
	        a.tangent[1] = t1;
	        a.tangent[2] = t2;
	        a.tangent[3] = bitangent_sign(a.normal, vec3.create([t0, t1, t2]), vec3.create([t3, t4, t5]));
        }
    }

    function normalizeTangents(verts, numVerts) {
        for (var i = 0; i < numVerts; i++)
	    {
	        var n = verts[i].normal;
	        var f = 1 / Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
	        n[0] *= f; n[1] *= f; n[2] *= f;

	        var t = vec3.create([verts[i].tangent[0], verts[i].tangent[1], verts[i].tangent[2]]);
            var vec = vec3.create();
            vec3.scale(n, vec3.dot(t, n), vec);
	        vec3.subtract(t, vec);
	        f = 1 / Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
	        t[0] *= f; t[1] *= f; t[2] *= f;
        }
    }

    function finishMesh(mesh) {
        computeMeshBounds(mesh);

        computeMeshUnsmootedTangents(mesh);

        if (!mesh.vertexBuffer) {
            mesh.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);

            if (mesh.vertexWeightData) {
                gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexData.byteLength + mesh.vertexWeightData.byteLength, gl.STATIC_DRAW);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.vertexData);
                gl.bufferSubData(gl.ARRAY_BUFFER, mesh.vertexData.byteLength, mesh.vertexWeightData);
            }
            else {
                gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexData, gl.STATIC_DRAW);
            }
        }
        
        if (!mesh.indexBuffer) {
            mesh.indexBuffer = gl.createBuffer(); 
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indexData, gl.STATIC_DRAW);
        }
    }

    function allocModel() {
        var model = {};
        model.meshes = [];
        
        return model;
    }

    function createBoxModel(diffuseSrc, bumpSrc, specularSrc) {
        var model = allocModel();
        var mesh = allocMesh(24, 36, diffuseSrc, bumpSrc, specularSrc);
        model.meshes.push(mesh);
        
        var v = mesh.verts;

        // bottom
        v[ 0].pos.set([-10, -10,   0]); v[ 0].st.set([0, 0]); v[ 0].normal.set([0, 0, -1]);
        v[ 1].pos.set([ 10, -10,   0]); v[ 1].st.set([0, 1]); v[ 1].normal.set([0, 0, -1]);
        v[ 2].pos.set([ 10,  10,   0]); v[ 2].st.set([1, 1]); v[ 2].normal.set([0, 0, -1]);
        v[ 3].pos.set([-10,  10,   0]); v[ 3].st.set([1, 0]); v[ 3].normal.set([0, 0, -1]);
	    
        // up
        v[ 4].pos.set([ 10, -10,  20]); v[ 4].st.set([0, 0]); v[ 4].normal.set([0, 0, 1]);
        v[ 5].pos.set([-10, -10,  20]); v[ 5].st.set([0, 1]); v[ 5].normal.set([0, 0, 1]);
        v[ 6].pos.set([-10,  10,  20]); v[ 6].st.set([1, 1]); v[ 6].normal.set([0, 0, 1]);
        v[ 7].pos.set([ 10,  10,  20]); v[ 7].st.set([1, 0]); v[ 7].normal.set([0, 0, 1]);

        // front
        v[ 8].pos.set([ 10, -10,   0]); v[ 8].st.set([0, 0]); v[ 8].normal.set([1, 0, 0]); 
        v[ 9].pos.set([ 10, -10,  20]); v[ 9].st.set([0, 1]); v[ 9].normal.set([1, 0, 0]); 
        v[10].pos.set([ 10,  10,  20]); v[10].st.set([1, 1]); v[10].normal.set([1, 0, 0]);
        v[11].pos.set([ 10,  10,   0]); v[11].st.set([1, 0]); v[11].normal.set([1, 0, 0]);
	    
        // right
        v[12].pos.set([ 10,  10,   0]); v[12].st.set([0, 0]); v[12].normal.set([0, 1, 0]);
        v[13].pos.set([ 10,  10,  20]); v[13].st.set([0, 1]); v[13].normal.set([0, 1, 0]);
        v[14].pos.set([-10,  10,  20]); v[14].st.set([1, 1]); v[14].normal.set([0, 1, 0]);
        v[15].pos.set([-10,  10,   0]); v[15].st.set([1, 0]); v[15].normal.set([0, 1, 0]);
	    
        // back
        v[16].pos.set([-10,  10,   0]); v[16].st.set([0, 0]); v[16].normal.set([-1, 0, 0]);
        v[17].pos.set([-10,  10,  20]); v[17].st.set([0, 1]); v[17].normal.set([-1, 0, 0]);
        v[18].pos.set([-10, -10,  20]); v[18].st.set([1, 1]); v[18].normal.set([-1, 0, 0]);
        v[19].pos.set([-10, -10,   0]); v[19].st.set([1, 0]); v[19].normal.set([-1, 0, 0]);
	    
        // left
        v[20].pos.set([-10, -10,   0]); v[20].st.set([0, 0]); v[20].normal.set([0, -1, 0]);
        v[21].pos.set([-10, -10,  20]); v[21].st.set([0, 1]); v[21].normal.set([0, -1, 0]);
        v[22].pos.set([ 10, -10,  20]); v[22].st.set([1, 1]); v[22].normal.set([0, -1, 0]);
        v[23].pos.set([ 10, -10,   0]); v[23].st.set([1, 0]); v[23].normal.set([0, -1, 0]);

        mesh.indexes.set([
            0,  1,  2,  2,  3,  0,
            4,  5,  6,  6,  7,  4,
            8,  9,  10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20
        ]);        

        finishMesh(mesh);

        return model;
    }

    function createFloorModel(diffuseSrc, bumpSrc, specularSrc) {
        var model = allocModel();
        var mesh = allocMesh(24, 36, diffuseSrc, bumpSrc, specularSrc);
        model.meshes.push(mesh);
        
        var v = mesh.verts;

        // bottom
        v[ 0].pos.set([-1024, -1024, -10]); v[ 0].st.set([ 0,  0]); v[ 0].normal.set([0, 0, -1]);
        v[ 1].pos.set([ 1024, -1024, -10]); v[ 1].st.set([ 0, 10]); v[ 1].normal.set([0, 0, -1]);
        v[ 2].pos.set([ 1024,  1024, -10]); v[ 2].st.set([10, 10]); v[ 2].normal.set([0, 0, -1]);
        v[ 3].pos.set([-1024,  1024, -10]); v[ 3].st.set([10,  0]); v[ 3].normal.set([0, 0, -1]);
	    
        // up
        v[ 4].pos.set([ 1024, -1024,   0]); v[ 4].st.set([ 0,  0]); v[ 4].normal.set([0, 0, 1]);
        v[ 5].pos.set([-1024, -1024,   0]); v[ 5].st.set([ 0, 10]); v[ 5].normal.set([0, 0, 1]);
        v[ 6].pos.set([-1024,  1024,   0]); v[ 6].st.set([10, 10]); v[ 6].normal.set([0, 0, 1]);
        v[ 7].pos.set([ 1024,  1024,   0]); v[ 7].st.set([10,  0]); v[ 7].normal.set([0, 0, 1]);

        // front
        v[ 8].pos.set([ 1024, -1024, -10]); v[ 8].st.set([ 0,  0]); v[ 8].normal.set([1, 0, 0]); 
        v[ 9].pos.set([ 1024, -1024,   0]); v[ 9].st.set([ 0, 10]); v[ 9].normal.set([1, 0, 0]); 
        v[10].pos.set([ 1024,  1024,   0]); v[10].st.set([10, 10]); v[10].normal.set([1, 0, 0]);
        v[11].pos.set([ 1024,  1024, -10]); v[11].st.set([10,  0]); v[11].normal.set([1, 0, 0]);
	    
        // right
        v[12].pos.set([ 1024,  1024, -10]); v[12].st.set([ 0,  0]); v[12].normal.set([0, 1, 0]);
        v[13].pos.set([ 1024,  1024,   0]); v[13].st.set([ 0, 10]); v[13].normal.set([0, 1, 0]);
        v[14].pos.set([-1024,  1024,   0]); v[14].st.set([10, 10]); v[14].normal.set([0, 1, 0]);
        v[15].pos.set([-1024,  1024, -10]); v[15].st.set([10,  0]); v[15].normal.set([0, 1, 0]);
	    
        // back
        v[16].pos.set([-1024,  1024, -10]); v[16].st.set([ 0,  0]); v[16].normal.set([-1, 0, 0]);
        v[17].pos.set([-1024,  1024,   0]); v[17].st.set([ 0, 10]); v[17].normal.set([-1, 0, 0]);
        v[18].pos.set([-1024, -1024,   0]); v[18].st.set([10, 10]); v[18].normal.set([-1, 0, 0]);
        v[19].pos.set([-1024, -1024, -10]); v[19].st.set([10,  0]); v[19].normal.set([-1, 0, 0]);
	    
        // left
        v[20].pos.set([-1024, -1024, -10]); v[20].st.set([ 0,  0]); v[20].normal.set([0, -1, 0]);
        v[21].pos.set([-1024, -1024,   0]); v[21].st.set([ 0, 10]); v[21].normal.set([0, -1, 0]);
        v[22].pos.set([ 1024, -1024,   0]); v[22].st.set([10, 10]); v[22].normal.set([0, -1, 0]);
        v[23].pos.set([ 1024, -1024, -10]); v[23].st.set([10,  0]); v[23].normal.set([0, -1, 0]);

        mesh.indexes.set([
            0,  1,  2,  2,  3,  0,
            4,  5,  6,  6,  7,  4,
            8,  9,  10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20
        ]);        

        finishMesh(mesh);

        return model;
    }

    function loadModelMD5mesh(src) {
        var model = allocModel();
        model.joints = [];
        model.defaultPose = [];

        var request = new XMLHttpRequest();
	    request.onreadystatechange = function () {
	        if (request.readyState == 4 && request.status == 200) {
		        var text = request.responseText;

                text.replace(/joints \{([^}]*)\}/m, function($0, jointSrc) {
		            jointSrc.replace(/\"(.+)\"\s+(.+) \( (.+) (.+) (.+) \) \( (.+) (.+) (.+) \)/g, function($0, name, parent, x, y, z, qx, qy, qz) {
			            model.joints.push({
			                name: name,
			                parent: parseInt(parent),				            
			            });

                        model.defaultPose.push({
                            t: [parseFloat(x), parseFloat(y), parseFloat(z)],
			                q: quat4.calculateW([parseFloat(qx), parseFloat(qy), parseFloat(qz), 0])
                        });                        
		            });
	            });

                console.log(src + " - joints: " + model.joints.length + "\n");

                model.inverseDefaultMats = new Array(model.defaultPose.length);
                for (var i = 0; i < model.defaultPose.length; i++) {
                    var joint = model.defaultPose[i];

                    var mat = quat4.toMat4(joint.q);
                    mat4.transpose(mat);
                    mat[12] = joint.t[0];
                    mat[13] = joint.t[1];
                    mat[14] = joint.t[2];

                    mat4.inverse(mat);
                    /*mat4.transpose(mat);
                      var tx = mat[3];
                      var ty = mat[7];
                      var tz = mat[11];
                      mat[12] = -(mat[0] * tx + mat[4] * ty + mat[8] * tz);
                      mat[13] = -(mat[1] * tx + mat[5] * ty + mat[9] * tz);
                      mat[14] = -(mat[2] * tx + mat[6] * ty + mat[10] * tz);*/

                    // 4x3 matrix
                    var idm = model.inverseDefaultMats[i] = new Float32Array(12);
                    idm[0] = mat[0];
                    idm[1] = mat[4];
                    idm[2] = mat[8];
                    idm[3] = mat[12];
                    idm[4] = mat[1];
                    idm[5] = mat[5];
                    idm[6] = mat[9];
                    idm[7] = mat[13];
                    idm[8] = mat[2];
                    idm[9] = mat[6];
                    idm[10] = mat[10];
                    idm[11] = mat[14];
                }

                text.replace(/mesh \{([^}]*)\}/mg, function($0, meshSrc) {
                    var shaderName;
                    var numVerts;

		            meshSrc.replace(/shader \"(.+)\"/, function($0, shader) {
			            shaderName = shader;
		            });

                    verts = [];
		            meshSrc.replace(/vert .+ \( (.+) (.+) \) (.+) (.+)/g, function($0, s, t, weightIndex, weightCount) {
			            verts.push({
			                st: [parseFloat(s), parseFloat(t)],
			                weight: {
				                index: parseInt(weightIndex), 
				                count: parseInt(weightCount)
			                }
			            });
		            });
		            
		            tris = [];
		            meshSrc.replace(/tri .+ (.+) (.+) (.+)/g, function($0, i1, i2, i3) {
			            tris.push(parseInt(i1));
			            tris.push(parseInt(i2));
			            tris.push(parseInt(i3));
		            });                   
		            
                    weights = [];
		            meshSrc.replace(/weight .+ (.+) (.+) \( (.+) (.+) (.+) \)/g, function($0, jointIndex, jointWeight, x, y, z) {
			            weights.push({
			                jointIndex: parseInt(jointIndex),
			                jointWeight: parseFloat(jointWeight),
			                xyz: [parseFloat(x), parseFloat(y), parseFloat(z)],
			            });
		            });

                  //  diffuseSrc = shaderName + "_d" + ".png";
                   // bumpSrc = shaderName + "_local" + ".png";
                    //specularSrc = shaderName + "_s" + ".png";

                   // var mesh = allocMesh(verts.length, tris.length, diffuseSrc, bumpSrc, specularSrc);
                   var mesh = allocMesh(verts.length, tris.length, textureSrc, textureSrc, textureSrc);

                    model.meshes.push(mesh);

                    // determine maximum bones
                    var maxWeightCount = 0
                    for (var i = 0; i < verts.length; i++) {
                        maxWeightCount = Math.max(verts[i].weight.count, maxWeightCount);
                    }

                    console.log(src + " - maxWeightCount: " + maxWeightCount + "\n");

                    if (maxWeightCount == 1) {
                        mesh.vertexWeightSize = 1;
                        mesh.skinningShaderIndex = 0;
                    }
                    else if (maxWeightCount <= 4) {
                        mesh.vertexWeightSize = 8;
                        mesh.skinningShaderIndex = 1;
                    }
                    else {
                        mesh.vertexWeightSize = 16;
                        mesh.skinningShaderIndex = 2;
                    }

                    mesh.vertexWeightData = new Uint8Array(mesh.vertexWeightSize * mesh.numVerts);

                    for (var i = 0; i < mesh.numVerts; i++) {
                        var pos = vec3.create(0, 0, 0);

                        var weightStart = verts[i].weight.index;
                        var weightCount = verts[i].weight.count;

                        for (var j = 0; j < weightCount; j++) {
                            var w = weights[weightStart + j];
                            var jointQuat = model.defaultPose[w.jointIndex];

                            var wpos = vec3.create();

                            //var mat = quat4.toMat4(jointQuat.q);
                            //mat4.transpose(mat);
                            //mat[12] = jointQuat.t[0];
                            //mat[13] = jointQuat.t[1];
                            //mat[14] = jointQuat.t[2];
                            //mat4.multiplyVec3(mat, w.xyz, wpos);

                            quat4.multiplyVec3(jointQuat.q, w.xyz, wpos);
                            vec3.add(wpos, jointQuat.t);
                            vec3.scale(wpos, w.jointWeight);

                            vec3.add(pos, wpos);

                            var offset = mesh.vertexWeightSize * i + j;
                            if (maxWeightCount == 1) {
                                mesh.vertexWeightData[offset] = w.jointIndex;
                            }
                            else if (j < maxWeightCount) {
                                mesh.vertexWeightData[offset] = w.jointIndex;
                                mesh.vertexWeightData[offset + mesh.vertexWeightSize / 2] = Math.round(w.jointWeight * 255);
                            }
                        }

                        mesh.verts[i].pos.set(pos);
                        mesh.verts[i].st.set(verts[i].st);
                    }

                    mesh.indexes.set(tris);

                    computeMeshNormals(mesh);

                    finishMesh(mesh);
	            });
	        }
	    };
	    
	    request.open('GET', src, false);
	    request.overrideMimeType('text/plain');
	    request.setRequestHeader('Content-Type', 'text/plain');
	    request.send(null);

        return model;
    }

    function loadMD5anim(src) {
        var anim = {};
        anim.jointInfo = [];
        anim.baseFrame = [];
        anim.frames = [];

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
	        if (request.readyState == 4 && request.status == 200) {
		        var text = request.responseText;

                text.replace(/frameRate (.+)/, function($0, frameRate) {
		            anim.frameRate = parseInt(frameRate);
	            });
	            
	            text.replace(/hierarchy \{([^}]*)\}/m, function($0, hierarchySrc) {
		            hierarchySrc.replace(/\"(.+)\"\s([-\d]+) (\d+) (\d+)\s/g, function($0, name, parent, animBits, firstComponent) {
			            anim.jointInfo.push({
			                name: name,
			                parent: parseInt(parent), 
			                animBits: parseInt(animBits), 
			                firstComponent: parseInt(firstComponent)
			            });
		            });
	            });
	            
	            text.replace(/baseframe \{([^}]*)\}/m, function($0, baseframeSrc) {
		            baseframeSrc.replace(/\( (.+) (.+) (.+) \) \( (.+) (.+) (.+) \)/g, function($0, x, y, z, qx, qy, qz) {
			            anim.baseFrame.push({
			                t: [parseFloat(x), parseFloat(y), parseFloat(z)], 
                            q: quat4.calculateW([parseFloat(qx), parseFloat(qy), parseFloat(qz), 0])
			            });
		            });
	            });	    
	            
	            text.replace(/frame \d+ \{([^}]*)\}/mg, function($0, frameSrc) {
		            var frameData = [];
		            frameSrc.replace(/([-\.\d]+)/g, function($0, value) {
			            frameData.push(parseFloat(value));
		            });
		            
		            anim.frames.push(frameData);
	            });
            }
        }

	    request.open('GET', src, false);
	    request.overrideMimeType('text/plain');
	    request.setRequestHeader('Content-Type', 'text/plain');
	    request.send(null);

	    return anim;
    }

    function getSingleFrame(anim, frame, joints) {
	    var frameData = anim.frames[frame];
	    
	    for (var i = 0; i < anim.baseFrame.length; i++) {
	        var baseJoint = anim.baseFrame[i];
            var jointInfo = anim.jointInfo[i];
	        var animBits = jointInfo.animBits;

            var joint = joints[i];
	        joint.t = [baseJoint.t[0], baseJoint.t[1], baseJoint.t[2]];
	        joint.q = [baseJoint.q[0], baseJoint.q[1], baseJoint.q[2], baseJoint.q[3]];
	        
 	        var jointFrame = jointInfo.firstComponent;

            if (animBits & 7) { // TX | TY | TZ
		        if (animBits & 1) // TX
		            joint.t[0] = frameData[jointFrame++];
		        
		        if (animBits & 2) // TY
		            joint.t[1] = frameData[jointFrame++];
		        
		        if (animBits & 4) // TZ
		            joint.t[2] = frameData[jointFrame++];
            }
	        
            if (animBits & 56) { // QX | QY | QZ
		        if (animBits & 8) // QX
		            joint.q[0] = frameData[jointFrame++];
		        
		        if (animBits & 16) // QY
		            joint.q[1] = frameData[jointFrame++];
		        
		        if (animBits & 32) // QZ
		            joint.q[2] = frameData[jointFrame++];

		        quat4.calculateW(joint.q);
            }
	    }
    }

    function getInterpolatedFrame(anim, frame1, frame2, lerp, joints) {
        var frameData1 = anim.frames[frame1];
        var frameData2 = anim.frames[frame2];

	    for (var i = 0; i < anim.baseFrame.length; i++) {
	        var baseJoint = anim.baseFrame[i];
            var jointInfo = anim.jointInfo[i];
	        var animBits = jointInfo.animBits;

            var joint = joints[i];
	        joint.t = [baseJoint.t[0], baseJoint.t[1], baseJoint.t[2]];
	        joint.q = [baseJoint.q[0], baseJoint.q[1], baseJoint.q[2], baseJoint.q[3]];

            var blend = {};
	        blend.t = [baseJoint.t[0], baseJoint.t[1], baseJoint.t[2]];
	        blend.q = [baseJoint.q[0], baseJoint.q[1], baseJoint.q[2], baseJoint.q[3]];
	        
	        var jointFrame = jointInfo.firstComponent;
	        
            if (animBits & 7) { // TX | TY | TZ
		        if (animBits & 1) { // TX
		            joint.t[0] = frameData1[jointFrame];
                    blend.t[0] = frameData2[jointFrame];
                    jointFrame++;
                }
		        
		        if (animBits & 2) { // TY
		            joint.t[1] = frameData1[jointFrame];
                    blend.t[1] = frameData2[jointFrame];
                    jointFrame++;
                }
		        
		        if (animBits & 4) { // TZ
		            joint.t[2] = frameData1[jointFrame];
                    blend.t[2] = frameData2[jointFrame];
                    jointFrame++;
                }
            }
	        
            if (animBits & 56) { // QX | QY | QZ
		        if (animBits & 8) { // QX
		            joint.q[0] = frameData1[jointFrame];
                    blend.q[0] = frameData2[jointFrame];
                    jointFrame++;
                }
		        
		        if (animBits & 16) { // QY
		            joint.q[1] = frameData1[jointFrame];
                    blend.q[1] = frameData2[jointFrame];
                    jointFrame++;
                }
		        
		        if (animBits & 32) { // QZ
		            joint.q[2] = frameData1[jointFrame];
                    blend.q[2] = frameData2[jointFrame];
                    jointFrame++;
                }

		        quat4.calculateW(joint.q);
		        quat4.calculateW(blend.q);
            }

            //quat4.slerp(joint.q, blend.q, lerp);
            //vec3.lerp(joint.t, blend.t, lerp);           

            lerp = Math.min(lerp, 1.0);
            lerp = Math.max(lerp, 0.0);

            var cosom = joint.q[0] * blend.q[0] + joint.q[1] * blend.q[1] + joint.q[2] * blend.q[2] + joint.q[3] * blend.q[3];
            var scale0 = 1 - lerp;
            var scale1 = (cosom >= 0) ? lerp : -lerp;

            joint.q[0] = scale0 * joint.q[0] + scale1 * blend.q[0];
            joint.q[1] = scale0 * joint.q[1] + scale1 * blend.q[1];
            joint.q[2] = scale0 * joint.q[2] + scale1 * blend.q[2];
            joint.q[3] = scale0 * joint.q[3] + scale1 * blend.q[3];

            var s = 1.0 / quat4.length(joint.q);
            joint.q[0] *= s;
            joint.q[1] *= s;
            joint.q[2] *= s;
            joint.q[3] *= s;
            
            joint.t[0] = joint.t[0] + (blend.t[0] - joint.t[0]) * lerp;
            joint.t[1] = joint.t[1] + (blend.t[1] - joint.t[1]) * lerp;
            joint.t[2] = joint.t[2] + (blend.t[2] - joint.t[2]) * lerp;
	    }
    }

    function buildAnimFrame(anim, animTime, jointMats) {
	    var frame = animTime * anim.frameRate;
	    var lerp = frame - Math.floor(frame);
	    var frame1 = parseInt(frame) % anim.frames.length;
	    var frame2 = (frame1 + 1) % anim.frames.length;

        var joints = new Array(anim.baseFrame.length);
        for (var i = 0; i < joints.length; i++) {
            joints[i] = { q: quat4.create(), t: vec3.create() };
        }

        getInterpolatedFrame(anim, frame1, frame2, lerp, joints);
        //getSingleFrame(anim, 0, joints);

        var r = mat3.create();

        for (var i = 0; i < joints.length; i++) {
            var joint = joints[i];
            var jointMat = jointMats[i];
            
            quat4.toMat3(joint.q, r);

            jointMat[0] = r[0];
            jointMat[1] = r[1];
            jointMat[2] = r[2];
            jointMat[3] = joint.t[0];

            jointMat[4] = r[3];
            jointMat[5] = r[4];
            jointMat[6] = r[5];
            jointMat[7] = joint.t[1];

            jointMat[8] = r[6];
            jointMat[9] = r[7];
            jointMat[10] = r[8];
            jointMat[11] = joint.t[2];
            
            parentIndex = anim.jointInfo[i].parent;
            if (parentIndex >= 0) {
                var parentMat = jointMats[parentIndex];

                var m00 = jointMat[0]; var m01 = jointMat[1]; var m02 = jointMat[2]; var m03 = jointMat[3];
                var m10 = jointMat[4]; var m11 = jointMat[5]; var m12 = jointMat[6]; var m13 = jointMat[7];
                var m20 = jointMat[8]; var m21 = jointMat[9]; var m22 = jointMat[10]; var m23 = jointMat[11];

                jointMat[0] = m00 * parentMat[0] + m10 * parentMat[1] + m20 * parentMat[2];
                jointMat[1] = m01 * parentMat[0] + m11 * parentMat[1] + m21 * parentMat[2];
                jointMat[2] = m02 * parentMat[0] + m12 * parentMat[1] + m22 * parentMat[2];
                jointMat[3] = m03 * parentMat[0] + m13 * parentMat[1] + m23 * parentMat[2] + parentMat[3];
                
                jointMat[4] = m00 * parentMat[4] + m10 * parentMat[5] + m20 * parentMat[6];
                jointMat[5] = m01 * parentMat[4] + m11 * parentMat[5] + m21 * parentMat[6];
                jointMat[6] = m02 * parentMat[4] + m12 * parentMat[5] + m22 * parentMat[6];
                jointMat[7] = m03 * parentMat[4] + m13 * parentMat[5] + m23 * parentMat[6] + parentMat[7];

                jointMat[8] = m00 * parentMat[8] + m10 * parentMat[9] + m20 * parentMat[10];
                jointMat[9] = m01 * parentMat[8] + m11 * parentMat[9] + m21 * parentMat[10];
                jointMat[10] = m02 * parentMat[8] + m12 * parentMat[9] + m22 * parentMat[10];
                jointMat[11] = m03 * parentMat[8] + m13 * parentMat[9] + m23 * parentMat[10] + parentMat[11];
            }
        }
    }

    function createEntity(origin) {
        var entity = {};
        entity.origin = vec3.create(origin);
        entity.axis = [vec3.create(), vec3.create(), vec3.create()];
        entity.modelMatrix = mat4.create();
        entity.updateModelMatrix = function (axis, origin) {
            mat4.set([axis[0][0], axis[0][1], axis[0][2], 0,
                      axis[1][0], axis[1][1], axis[1][2], 0,
                      axis[2][0], axis[2][1], axis[2][2], 0,
                      origin[0], origin[1], origin[2], 1], entity.modelMatrix);
        };
	    entity.runFrame = function (frametime) {
	    };

        return entity;
    }

    function createLight(origin, radius, fallOffExponent, color) {
        var light = {};
        light.origin = vec3.create(origin);
        light.radius = radius;
        light.fallOffExponent = fallOffExponent;
        light.color = vec3.create(color);
        return light;
    }

    let textureSrc = ''; // Global variable to store the selected texture file name

    function resetScene() {
        entities.length = 0;
        textureSrc = 0;
        // Reset the impModel and impAnims arrays to ensure no leftover data from previous models
        impModel = null;
        impAnims.length = 0;
        document.getElementById('dropZone').style.backgroundColor = "#000";
    }

    function handleFiles(files) {

        resetScene(); // Reset the scene for new models

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            console.log("Processing file:", file.name);
    
            if (file.name.endsWith(".md5mesh")) {
                console.log("Loading MD5 model:", file.name);
                let model = loadModelMD5mesh(URL.createObjectURL(file), textureSrc);
                if (model) {
                    impModel = model;
                    console.log("MD5 model loaded successfully:", file.name);
                } else {
                    console.warn("Failed to load MD5 model:", file.name);
                }
            } else if (file.name.endsWith(".md5anim")) {
                console.log("Loading MD5 animation:", file.name);
                let anim = loadMD5anim(URL.createObjectURL(file));
                if (anim) {
                    impAnims.push(anim);
                    console.log("MD5 animation loaded successfully:", file.name);
                } else {
                    console.warn("Failed to load MD5 animation:", file.name);
                }
            } else if (file.name.endsWith(".png") || file.name.endsWith(".jpg")) {
                console.log("Texture file selected:", file.name);
                textureSrc = URL.createObjectURL(file); // Store the selected texture file
            } else {
                console.warn("Unsupported file type:", file.name);
                alert(`Unsupported file type: ${file.name}. Only .png, .md5anim, and .md5mesh files are allowed.`);
                document.getElementById('dropZone').style.backgroundColor = "#000"; // Reset background color after error
                return; // Exit the function to prevent further processing
            }
        }
    
        if (impModel && impAnims.length > 0) {
            console.log("All assets loaded successfully, initializing scene...");
            initializeScene();
        }
    }
    
    
    
    
    
    function initializeScene() {
        // Initialize the scene after all necessary assets are loaded
        var entity = createEntity([0, 0, 50]); // model height
        entities.push(entity);
        vec3.set([1, 0, 0], entity.axis[0]);
        vec3.set([0, 1, 0], entity.axis[1]);
        vec3.set([0, 0, 1], entity.axis[2]);
        entity.model = impModel;
        entity.joints = new Array(entity.model.joints.length);
        for (var j = 0; j < entity.joints.length; j++) {
            entity.joints[j] = new Float32Array(12);
        }
        entity.skinningJoints = new Float32Array(entity.model.joints.length * 12);
        entity.time = Math.random() * 10;



   




        entity.runFrame = function (frametime) {
            const animationSpeedMultiplier = 0.5; // Adjust this value to slow down the animation (0.5 for half speed)
        
            this.time += frametime * animationSpeedMultiplier;
            if (impAnims.length > 0 && impAnims[0]) {
                buildAnimFrame(impAnims[0], this.time, this.joints);
            } else {
                console.warn("No animation found to run frame for model:", this.model);
            }
        };

        document.getElementById('dropZone').style.backgroundColor = "#000";


    }
    
    
    function setupDropZone(dropZone, fileInput) {
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = "#272727";
        });
    
        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = "#000";
        });
    
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = "#3e3e3e";
            handleFiles(e.dataTransfer.files);
        });
    
        dropZone.addEventListener('click', function () {
            fileInput.click();
        });
    
        fileInput.addEventListener('change', function (e) {
            handleFiles(fileInput.files);
        });
    }
    


    function main() {
        canvas = document.getElementById("canvas");
        
        var dropZone = document.getElementById('dropZone');
        var fileInput = document.getElementById('fileInput');
        setupDropZone(dropZone, fileInput);
    
        $(canvas).mousedown(function (ev) {
            if (ev.button == 0) {
                mouse.pressed = true;
            }
        }).mouseup(function (ev) {
            if (ev.button == 0) {
                mouse.pressed = false;
            }
        }).mousemove(function (ev) {
            mouse.x = ev.clientX - canvas.offsetLeft;
            mouse.y = ev.clientY - canvas.offsetTop;
        }).mouseenter(function (ev) {
            //$(this).css({cursor: 'none'});
        }).mouseleave(function (ev) {
            //$(this).css({cursor: 'default'});
        });
    
        $(document).keydown(function (ev) {
            var keynum;
            if (window.event) { // IE
                keynum = ev.keyCode;
            } else {
                keynum = ev.which;
            }
        }).keyup(function (ev) {
            var keynum;
            if (window.event) { // IE
                keynum = ev.keyCode;
            } else {
                keynum = ev.which;
            }
        });
    
        init();
    
        lastFrameMsec = getFrameMsec();
        runFrame(); 
    }
    

    return {
        main: main
    };
}();

// window.onload = Application.main;
//$(document).ready(function () {
//    Application.main();
//})
