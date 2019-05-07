"use strict";

import basicVsSource from "../Shaders/basic-vs.glsl";
import defaultVsSource from "../Shaders/default-vs.glsl";
import flatColourFsSource from "../Shaders/flat-colour-fs.glsl";
import Matrix4 from "./Matrix4";
import Range from "./range";
import renderFsSource from "../Shaders/render-fs.glsl";
import timestepFsSource from "../Shaders/timestep-fs.glsl";
import Vector3 from "./Vector3";

class App {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext("webgl")
        || canvas.getContext("experimental-webgl");
    this.gl = gl;

    this.checkCompatibility();

    const basicVertexShader = this.createShader(gl.VERTEX_SHADER, basicVsSource);
    const vertexShader = this.createShader(gl.VERTEX_SHADER, defaultVsSource);
    const flatColourShader = this.createShader(gl.FRAGMENT_SHADER, flatColourFsSource);
    const timestepShader = this.createShader(gl.FRAGMENT_SHADER, timestepFsSource);
    const renderShader = this.createShader(gl.FRAGMENT_SHADER, renderFsSource);

    const flatColourProgram = this.createAndLinkProgram(basicVertexShader, flatColourShader);
    const timestepProgram = this.createAndLinkProgram(vertexShader, timestepShader);
    const renderProgram = this.createAndLinkProgram(vertexShader, renderShader);

    gl.useProgram(renderProgram);
    this.loadVertexData(renderProgram);
    gl.uniform2f(gl.getUniformLocation(renderProgram, "state_size"), width, height);

    gl.useProgram(timestepProgram);
    this.loadVertexData(timestepProgram);
    gl.uniform2f(gl.getUniformLocation(timestepProgram, "state_size"), width, height);

    const initialState = this.getInitialState(width, height);
    const textures = [
      this.createTexture(width, height, initialState),
      this.createTexture(width, height, null),
    ];
    const framebuffers = [
      this.createFramebuffer(textures[0]),
      this.createFramebuffer(textures[1]),
    ];

    gl.useProgram(timestepProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Cannot render to framebuffer: " + status);
    }
    
    this.brush = {
      down: false,
      position: new Vector3(-16, 32, 0),
    };
    this.camera = {
      projection: Matrix4.orthographicProjection(width, height, -1, 1),
    };
    this.flatColourProgram = flatColourProgram;
    this.framebuffers = framebuffers;
    this.iterationCount = 4;
    this.renderProgram = renderProgram;
    this.textures = textures;
    this.timestepProgram = timestepProgram;
    this.update = {
      feedRate: 0.0545,
      flowRate: 1,
      killRate: 0.062,
    };
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
  
    const requiredTextureSize = 512;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize < requiredTextureSize) {
      throw new Error(`WebGL texture sizes of at least ${requiredTextureSize}x${requiredTextureSize} are required, but only ${maxTextureSize}x${maxTextureSize} are supported.`);
    }
  }

  clear() {
    this.clearNextStep = true;
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

  createTexture(width, height, contents) {
    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, contents);
  
    return texture;
  }

  getInitialState(width, height) {
    const state = new Float32Array(4 * width * height);
    const squareSide = 10;
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = 4 * ((width * y) + x);
        
        const withinSquare = x > (height / 2) - squareSide
            && x < (width / 2) + squareSide
            && y > (height / 2) - squareSide
            && y < (height / 2) + squareSide;
  
        if (withinSquare) {
          state[i] = 0.5 + Math.random() * 0.02 - 0.01;
          state[i + 1] = 0.25 + Math.random() * 0.02 - 0.01;
        } else {
          state[i] = 1.0;
          state[i + 1] = 0;
        }
      }
    }
  
    return state;
  }

  loadVertexData(program) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  setBrushPosition(position) {
    this.brush.position = position;
  }

  start() {
    const frame = () => {
      this.step();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  step() {
    const flatColourProgram = this.flatColourProgram;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const renderProgram = this.renderProgram;
    const textures = this.textures;
    const timestepProgram = this.timestepProgram;

    // Edit Phase
    const translation = Matrix4.translate(this.brush.position);
    const dilation = Matrix4.dilate(new Vector3(16, 16, 1));
    const model = Matrix4.multiply(translation, dilation);
    const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);

    if (this.clearNextStep) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.clearNextStep = false;
    }

    if (this.brush.down) {
      gl.useProgram(flatColourProgram);
      gl.uniformMatrix4fv(gl.getUniformLocation(flatColourProgram, "model_view_projection"), false, modelViewProjection.transpose.float32Array);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Timestep Phase
    gl.useProgram(timestepProgram);

    gl.uniform1f(gl.getUniformLocation(timestepProgram, "feed_rate"), this.update.feedRate);
    gl.uniform1f(gl.getUniformLocation(timestepProgram, "flow_rate"), this.update.flowRate);
    gl.uniform1f(gl.getUniformLocation(timestepProgram, "kill_rate"), this.update.killRate);

    for (let i = 0; i <= this.iterationCount; i++) {
      gl.bindTexture(gl.TEXTURE_2D, textures[i % 2]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(i % 2) ^ 1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Render Phase
    gl.useProgram(renderProgram);
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // UI Phase
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(flatColourProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(flatColourProgram, "model_view_projection"), false, modelViewProjection.transpose.float32Array);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
  }

  setBrushDown(down) {
    this.brush.down = down;
  }

  setFlowRate(flowRate) {
    this.update.flowRate = flowRate;
  }

  setIterationCount(iterationCount) {
    this.iterationCount = iterationCount;
  }

  setRates(killRate, feedRate) {
    const x = feedRate;
    const y = killRate;

    // Many combinations of feed and kill rates result in a uniform, blank
    // solution. To avoid this, remap the parameters into the "interesting"
    // region. This is defined here by two arbitrary polynomials, which
    // serve as the region's upper and lower bounds.
    const x2 = x * x;
    const x3 = x2 * x;
    const t = [
      (51.6043 * x3) - (15.1554 * x2) + (1.2813 * x) + 0.02777,
      (63.7108 * x3) - (17.505 * x2) + (1.3261 * x) + 0.03793,
    ];
    this.update.killRate = Range.remap(t[0], t[1], 0.01, 0.1, y);
    this.update.feedRate = x;
  }
}

export default App;