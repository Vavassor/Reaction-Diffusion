export default class Texture {
  constructor(gl, spec) {
    spec.filter = spec.filter || {};

    const contents = spec.contents || null;
    const format = spec.format || gl.RGBA;
    const height = spec.height;
    const internalFormat = spec.internalFormat || gl.RGBA;
    const minifyFilter = spec.filter.minify || gl.NEAREST;
    const magnifyFilter = spec.filter.magnify || gl.NEAREST;
    const type = spec.type || gl.FLOAT;
    const width = spec.width;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minifyFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magnifyFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, contents);

    if (spec.generate_mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    this.format = format;
    this.gl = gl;
    this.handle = texture;
    this.internalFormat = internalFormat;
    this.type = type;
  }
  
  bind(activeTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + activeTexture);
    gl.bindTexture(gl.TEXTURE_2D, this.handle);
  }

  update(width, height, contents) {
    const format = this.format;
    const gl = this.gl;
    const internalFormat = this.internalFormat;
    const type = this.type;

    this.width = width;
    this.height = height;
    
    this.bind(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, contents);
  }
}