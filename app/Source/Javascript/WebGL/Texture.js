/** @module Texture */

/** A collection of one or more images of the same format in WebGL. */
export default class Texture {
  constructor(gl, spec) {
    spec.filter = spec.filter || {};

    const contents = spec.contents || null;
    const format = spec.format || gl.RGBA;
    const internalFormat = spec.internalFormat || gl.RGBA;
    const minifyFilter = spec.filter.minify || gl.NEAREST;
    const magnifyFilter = spec.filter.magnify || gl.NEAREST;
    const size = spec.size;
    const type = spec.type || gl.FLOAT;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minifyFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magnifyFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, size.x, size.y, 0, format, type, contents);

    if (spec.generate_mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    this.format = format;
    this.gl = gl;
    this.handle = texture;
    this.size = size;
    this.internalFormat = internalFormat;
    this.type = type;
  }
  
  /**
   * Binds the texture to a particular texture unit.
   * 
   * @param {number} activeTexture - the texture unit number
   */
  bind(activeTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + activeTexture);
    gl.bindTexture(gl.TEXTURE_2D, this.handle);
  }

  /**
   * Recreates the texture with new content.
   * 
   * This implicitly binds the texture as a side-effect.
   * 
   * @param {Vector2} size - the dimensions of the content
   * @param {Float32Array|HTMLImageElement|ImageBitmap|Uint8Array} content - the content
   */
  update(size, content) {    
    const gl = this.gl;

    this.size = size;
    this.bind(0);

    if (content instanceof HTMLImageElement
        || content instanceof ImageBitmap) {
      const internalFormat = gl.RGBA;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
  
      this.format = format;
      this.internalFormat = internalFormat;
      this.type = type;

      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, content);
    } else if (content instanceof Uint8Array
        || content instanceof Float32Array) {
      const format = this.format;
      const internalFormat = this.internalFormat;
      const type = this.type;

      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, size.x, size.y, 0, format, type, content);
    } else if (content) {
      throw new Error("The content type is unsupported.");
    }
  }
}