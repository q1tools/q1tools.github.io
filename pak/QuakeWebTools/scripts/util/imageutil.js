var QuakeWebTools = QuakeWebTools || {};

/*
* A Library of tools for manipulating Quake's paletized images.
* @static
*/
QuakeWebTools.ImageUtil = {};

// values correspond to byte size of header
QuakeWebTools.ImageUtil.HEADER_NONE = 0;
QuakeWebTools.ImageUtil.HEADER_SIMPLE = 8;
QuakeWebTools.ImageUtil.HEADER_MIPTEX = 40;

// number of bytes per pixel
QuakeWebTools.ImageUtil.PIXELTYPE_PALETISED = 1;
QuakeWebTools.ImageUtil.PIXELTYPE_RGB = 3;

QuakeWebTools.ImageUtil.SPECIAL_CASE = {
  "CONCHARS": {size: 16384, width: 128, height: 128, header_type: QuakeWebTools.ImageUtil.HEADER_NONE},
  "pop.lmp": {size: 256, width: 16, height: 16, header_type: QuakeWebTools.ImageUtil.HEADER_NONE},
  "colormap.lmp": {size: 16385, width: 256, height: 64, header_type: QuakeWebTools.ImageUtil.HEADER_NONE}
};

QuakeWebTools.ImageUtil.newImageData = function(name, width, height) {
  return {
    name: name || "",
    width: width || 0,
    height: height || 0,
    pixels: null,
    pixel_type: QuakeWebTools.ImageUtil.PIXELTYPE_PALETISED,
  };
};

QuakeWebTools.ImageUtil.isPCXPath = function(name) {
  return /\.pcx$/i.test(name || "");
};

QuakeWebTools.ImageUtil.decodePCXRLE = function(bytes, start_offset, expected_length, end_offset) {
  var decoded = new Uint8Array(expected_length);
  var decoded_index = 0;
  var offset = start_offset;

  while (decoded_index < expected_length && offset < end_offset) {
    var value = bytes[offset++];
    var count = 1;

    if ((value & 0xC0) === 0xC0) {
      count = value & 0x3F;
      if (offset >= end_offset) {
        throw new Error("Unexpected end of PCX data while decoding run");
      }
      value = bytes[offset++];
    }

    while (count > 0 && decoded_index < expected_length) {
      decoded[decoded_index++] = value;
      count -= 1;
    }
  }

  if (decoded_index !== expected_length) {
    throw new Error("PCX data ended before the image was fully decoded");
  }

  return decoded;
};

QuakeWebTools.ImageUtil.getPCXImageData = function(name, arraybuffer, header_only) {
  var IU = QuakeWebTools.ImageUtil;
  var data = new DataView(arraybuffer);
  var bytes = new Uint8Array(arraybuffer);
  var image_data = IU.newImageData(name);

  if (arraybuffer.byteLength < 128) {
    throw new Error("PCX header is incomplete");
  }

  var manufacturer = data.getUint8(0);
  var encoding = data.getUint8(2);
  var bits_per_pixel = data.getUint8(3);
  var xmin = data.getUint16(4, true);
  var ymin = data.getUint16(6, true);
  var xmax = data.getUint16(8, true);
  var ymax = data.getUint16(10, true);
  var color_planes = data.getUint8(65);
  var bytes_per_line = data.getUint16(66, true);
  var width = xmax - xmin + 1;
  var height = ymax - ymin + 1;

  if (manufacturer !== 0x0A) {
    throw new Error("Not a ZSoft PCX file");
  }
  if (encoding !== 1) {
    throw new Error("Unsupported PCX encoding");
  }
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid PCX dimensions");
  }

  image_data.width = width;
  image_data.height = height;
  if (header_only) {
    return image_data;
  }

  var decoded_stride = bytes_per_line * color_planes;
  var decoded = IU.decodePCXRLE(bytes, 128, decoded_stride * height, bytes.length);

  if (bits_per_pixel === 8 && color_planes === 1) {
    if (bytes.length < 769 || bytes[bytes.length - 769] !== 0x0C) {
      throw new Error("8-bit PCX palette marker not found");
    }

    var palette = bytes.subarray(bytes.length - 768);
    var rgb_pixels = new Uint8Array(width * height * 3);

    for (var y = 0; y < height; ++y) {
      var row_offset = y * decoded_stride;
      for (var x = 0; x < width; ++x) {
        var color_index = decoded[row_offset + x] * 3;
        var pixel_offset = (y * width + x) * 3;
        rgb_pixels[pixel_offset    ] = palette[color_index];
        rgb_pixels[pixel_offset + 1] = palette[color_index + 1];
        rgb_pixels[pixel_offset + 2] = palette[color_index + 2];
      }
    }

    image_data.pixel_type = IU.PIXELTYPE_RGB;
    image_data.pixels = rgb_pixels;
    return image_data;
  }

  if (bits_per_pixel === 8 && color_planes === 3) {
    var rgb_data = new Uint8Array(width * height * 3);

    for (var row = 0; row < height; ++row) {
      var base_offset = row * decoded_stride;
      for (var col = 0; col < width; ++col) {
        var rgb_offset = (row * width + col) * 3;
        rgb_data[rgb_offset    ] = decoded[base_offset + col];
        rgb_data[rgb_offset + 1] = decoded[base_offset + bytes_per_line + col];
        rgb_data[rgb_offset + 2] = decoded[base_offset + (bytes_per_line * 2) + col];
      }
    }

    image_data.pixel_type = IU.PIXELTYPE_RGB;
    image_data.pixels = rgb_data;
    return image_data;
  }

  throw new Error("Unsupported PCX format: " + bits_per_pixel + " bpp x " + color_planes + " planes");
};

//TODO: remove header_only?
/**
* Gets image data in the form { name, width, height, pixels, pixel_type }
* where pixels is an arraybuffer containing paletised image data.
* The 'entry' parameter is required when extracting image data from WAD or
* BSP files, and should be undefined or null when working with lmp files.
* @param {String} name - Name of the file or directory entry.
* @param {ArrayBuffer} arraybuffer - An array buffer that represents the file containing the image.
* @param {WADEntry} entry - A WAD or BSP directory entry containing detailed information about the image.
* @param {Boolean} header_only Set to true to retrieve only the image header
* @return {QuakeImageData} Returns the image data.
* @static
*/
QuakeWebTools.ImageUtil.getImageData = function(name, arraybuffer, entry, header_only) {
  var IU = QuakeWebTools.ImageUtil;
  var WAD = QuakeWebTools.WAD;

  if (IU.isPCXPath(name)) {
    try {
      return IU.getPCXImageData(name, arraybuffer, header_only);
    } catch (err) {
      console.error("Error reading PCX image data '" + name + "':", err);
      return null;
    }
  }

  // turning this on will stop the image data from being returned
  header_only = header_only || false;

  // most non-miptex and non-special case are this format
  var header_type = IU.HEADER_SIMPLE;

  // basic image data structure
  var image_data = IU.newImageData(name);

  // define simple entry for dealing seemlessly with single files (TYPE_STATUS is same format as HEADER_SIMPLE)
  entry = (!entry) ? { offset: 0, size: arraybuffer.byteLength, type: WAD.TYPE_STATUS} : entry;

  var data = new DataView(arraybuffer);
  var le = true; //little endian

  var special_case_info = IU.SPECIAL_CASE[name];
  if (special_case_info !== undefined) {
    // special cases
    console.log(`Special case found for ${name}`, special_case_info);
    image_data.width = special_case_info.width;
    image_data.height = special_case_info.height;
    header_type = special_case_info.header_type;
  } else if (entry.size == 768 && entry.type !== WAD.TYPE_MIPTEX) {
    // palette file signature detected
    // 768 bytes of pixels is common, but not without a header (776 bytes or more)
    console.log(`No special case for ${name}`);
    image_data.width = 16;
    image_data.height = 16;
    image_data.pixel_type = IU.PIXELTYPE_RGB;
    header_type = IU.HEADER_NONE;
  }

  if (special_case_info === undefined && entry.type === WAD.TYPE_MIPTEX) {
    header_type = IU.HEADER_MIPTEX;
  }

  // Some Quake LMPs are raw 16x16 palettized images without a width/height header.
  if (special_case_info === undefined && entry.size == 256 && /\.lmp$/i.test(name)) {
    image_data.width = 16;
    image_data.height = 16;
    header_type = IU.HEADER_NONE;
  }

  var byteofs = entry.offset;

  switch (header_type) {
  case IU.HEADER_MIPTEX:
    // get all parameters
    /*image_data.name = getString(data, byteofs, 16, le);*/ byteofs += 16;
    image_data.width = data.getInt32(byteofs, le);          byteofs += 4;
    image_data.height = data.getInt32(byteofs, le);         byteofs += 4;
    if (header_only) break;
    var ofs1 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
    var ofs2 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
    var ofs3 = entry.offset + data.getInt32(byteofs, le);   byteofs += 4;
    var ofs4 = entry.offset + data.getInt32(byteofs, le);
    // get pixels at various mip levels
    image_data.pixels  = new Uint8Array(arraybuffer.slice(ofs1, ofs1 + image_data.width * image_data.height));
    image_data.pixels2 = new Uint8Array(arraybuffer.slice(ofs2, ofs2 + Math.floor((image_data.width * image_data.height) / 4)));
    image_data.pixels3 = new Uint8Array(arraybuffer.slice(ofs3, ofs3 + Math.floor((image_data.width * image_data.height) / 8)));
    image_data.pixels4 = new Uint8Array(arraybuffer.slice(ofs4, ofs4 + Math.floor((image_data.width * image_data.height) / 16)));
    break;
  case IU.HEADER_SIMPLE:
    image_data.width = data.getInt32(byteofs, le);      byteofs += 4;
    image_data.height = data.getInt32(byteofs, le);     byteofs += 4;
    if (header_only) break;
    image_data.pixels = new Uint8Array(arraybuffer.slice(byteofs, byteofs + entry.size));
    break;
  case IU.HEADER_NONE:
    if (header_only) break;
    // this will be special case and palette only, so width and height are already set
    image_data.pixels = new Uint8Array(arraybuffer.slice(byteofs, byteofs + entry.size));
    break;
  default: // FIXME: can never happen. Delete?
    console.log("Error reading image data: Unrecognised header type, '" + header_type + "'");
    return null;
  }

  return image_data;
}

/**
* Convert an array of image info (BSP, WAD) items and converts them into image
* data by extracting it from a file lump.
* @param {Array} image_infos The array of image info objects.
* @param {ArrayBuffer} arraybuffer The binary lump containing the image data.
* @return {Array} An array of image data objects.
* @static
*/
QuakeWebTools.ImageUtil.getImageDatas = function(image_infos, arraybuffer) {
  var IU = QuakeWebTools.ImageUtil;
  var image_datas = [];

  for (var i = 0; i < image_infos.length; ++i) {
    var image_info = image_infos[i];
  }

  return image_datas;
}

/**
* Converts image data in the form { name, width, height, pixels, pixel_type } to an image
* using a data URL that can be displayed in browsers.
* @param {QuakeImageData} image_data The image data to expand.
* @param {PAL} palette A 256 color palette (not required if image_data.pixel_type is ImageUtil.PIXELTYPE_RGB).
* @param {Number} mip_level A number between 1 and 4 that lets the caller choose which pixel array to use for mip mapped textures.
* @param {Boolean} as_uint8_arr If this is set to a value, the return type will be a Uint8Array instead of an Image.
* @return {Image} Returns an Image object, unless as_uint8_arr is set
* @static
*/
QuakeWebTools.ImageUtil.expandImageData = function(image_data, palette, mip_level, as_uint8_arr) {
      // Add the debugging and validation code here
      console.log("Expanding image data with width:", image_data.width, "and height:", image_data.height);

      if (!image_data.width || !image_data.height || isNaN(image_data.width) || isNaN(image_data.height)) {
          console.error("Invalid dimensions for image data:", image_data.width, image_data.height);
          return null; // or handle this situation appropriately
      }
  var pixels;
  var width = image_data.width;
  var height = image_data.height;
  if (mip_level && mip_level > 1 && mip_level < 5 && image_data["pixels" + mip_level]) {
    pixels = image_data["pixels" + mip_level];
    width >>= mip_level - 1;
    height >>= mip_level - 1;
  } else {
    pixels = image_data.pixels;
  }
  var image_size = width * height;

  if (as_uint8_arr) {
    var data = new Uint8Array(image_size * 4);
  } else {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var imgd = ctx.createImageData(width, height);
    var data = imgd.data;
  }

  // small hack for CONCHARS, which uses the wrong transparency index
  var trans_index = (image_data.name == "CONCHARS") ? 0 : 255;
  // mip textures have no transparency
  trans_index = (image_data.pixels2 !== undefined) ? -1 : trans_index;

  if (image_data.pixel_type == QuakeWebTools.ImageUtil.PIXELTYPE_PALETISED) {
    var colors = palette.colors;
    for (var i = 0; i < image_size; ++i) {
      var p = 4 * i;
      if (pixels[i] == trans_index) {
        data[p + 3] = 0;
      } else {
        var c = 3 * pixels[i];
        data[p    ] = colors[c];
        data[p + 1] = colors[c + 1];
        data[p + 2] = colors[c + 2];
        data[p + 3] = 255;
      }
    }
  } else {
    for (var i = 0; i < image_size; ++i) {
      var c = 3 * i;
      var p = 4 * i;
      data[p    ] = pixels[c];
      data[p + 1] = pixels[c + 1];
      data[p + 2] = pixels[c + 2];
      data[p + 3] = 255;
    }
  }

  if (as_uint8_arr) return data;

  ctx.putImageData(imgd, 0, 0);
  var img = new Image();
  img.src = canvas.toDataURL("image/png");
  img.title = image_data.name;

  return img;
}



/**
* Takes an array of image information, loads the images and attaches them to the
* current page's body element, or a specified element on the page.
* The format of the images parameter is:
*  images = {
*    image_infos: []
*    image_datas: []
*    arraybuffer: ArrayBuffer
*  }
* @param {Array} images An object containing an array of image_infos and an arraybuffer or an array of image_datas
* @param {PAL} palette A palette for converting image data to RGB.
* @param {String} element_id The id of a DOM element in the current document.
* @static
*/
QuakeWebTools.ImageUtil.generateHTMLPreview = function(images, palette, element_id) {
  var IU = QuakeWebTools.ImageUtil;
  var fragment = new DocumentFragment();

  var image_datas = images.image_datas || null;
  var image_infos = images.image_infos || null;
  var arraybuffer = images.arraybuffer || null;
  var limit = (image_datas) ? image_datas.length : image_infos.length;

  for (var i = 0; i < limit; ++i) {
    if (image_datas) {
      var image_data = image_datas[i];
    } else {
      var image_info = image_infos[i];
      var image_data = IU.getImageData(image_info.name, arraybuffer, image_info);
    }
    if (!image_data) {
      continue;
    }
    var img_info = " (" + image_data.width + "x"
                        + image_data.height + ")";
    var img = IU.expandImageData(image_data, palette);
    img.title = image_data.name + img_info;
    //img.download = name + ".png"; // seems to have no effect...

    var div = document.createElement("div");
    div.className = "item-box";
    div.appendChild(img);
    div.innerHTML += "<br><span class='item-name'>[" + i + "] " + image_data.name
                   + "</span><span class='item-info'>" + img_info
                   + "</span>";
    if (i < limit - 1) {
      div.innerHTML += "<hr class='item-divider'>";
    }
    fragment.appendChild(div);
  }

  var element = document.getElementById(element_id);
  if (element) {
    element.appendChild(fragment);
  } else {
    document.body.appendChild(fragment);
  }
}
