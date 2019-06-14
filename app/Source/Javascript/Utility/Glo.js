/** @module Glo */

/** A WebGL utility class to separate out some of the boilerplate. */
export default class Glo {
  constructor(gl) {
    this.gl = gl;
  }

  checkCompatibility() {
    const gl = this.gl;

    if (!gl) {
      throw new Error("WebGL is not supported.");
    }
  
    const floatTextureExtension = gl.getExtension("OES_texture_float");
    if (!floatTextureExtension) {
      throw new Error("The WebGL extension OES_texture_float is not supported.");
    }

    const floatLinearFilteringExtension = gl.getExtension("OES_texture_float_linear");
    if (!floatLinearFilteringExtension) {
      throw new Error("The WebGL extension OES_texture_float_linear is not supported.");
    }
  
    const requiredTextureSize = 512;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize < requiredTextureSize) {
      throw new Error(`WebGL texture sizes of at least ${requiredTextureSize}x${requiredTextureSize} are required, but only ${maxTextureSize}x${maxTextureSize} are supported.`);
    }
  }

  createAndLinkProgram(vertexShader, fragmentShader) {
    const gl = this.gl;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program);
      throw new Error("Failed to link program: " + infoLog);
    }
    
    return program;
  }

  createFramebuffer(texture) {
    const gl = this.gl;

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return framebuffer;
  }

  createShader(shaderType, source) {
    const gl = this.gl;

    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader);
      throw new Error("Failed to compile shader: " + infoLog);
    }
    
    return shader;
  }

  createTexture(width, height, contents, spec) {
    const gl = this.gl;

    spec = spec || {};
    spec.filter = spec.filter || {};

    const format = spec.format || gl.RGBA;
    const internalFormat = spec.internalFormat || gl.RGBA;
    const type = spec.type || gl.FLOAT;
    const minifyFilter = spec.filter.minify || gl.NEAREST;
    const magnifyFilter = spec.filter.magnify || gl.NEAREST;

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
  
    return texture;
  }

  loadVertexData(program) {
    const gl = this.gl;

    const data = new Float32Array(
      [
        -1, -1, 0, 0,
        1, -1, 1, 0,
        -1, 1, 0, 1,
        1, 1, 1, 1,
      ]
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
    const position = gl.getAttribLocation(program, "position");
    const texcoord = gl.getAttribLocation(program, "texcoord");
    
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);

    if (texcoord !== -1) {
      gl.enableVertexAttribArray(texcoord);
      gl.vertexAttribPointer(texcoord, 2, gl.FLOAT, false, 16, 8);
    }
  }
}