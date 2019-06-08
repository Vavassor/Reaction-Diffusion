"use strict";

import basicVsSource from "../Shaders/basic-vs.glsl";
import brushFsSource from "../Shaders/brush-fs.glsl";
import brushVsSource from "../Shaders/brush-vs.glsl";
import Color from "./Color";
import defaultVsSource from "../Shaders/default-vs.glsl";
import flatColourFsSource from "../Shaders/flat-colour-fs.glsl";
import Glo from "./Glo";
import ImageDraw from "./ImageDraw";
import Matrix4 from "./Matrix4";
import Range from "./Range";
import renderFsSource from "../Shaders/render-fs.glsl";
import timestepFsSource from "../Shaders/timestep-fs.glsl";
import Vector3 from "./Vector3";

const brushState = {
  UP: 0,
  HOVERING: 1,
  DOWN: 2,
};

class SimulationCanvas {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;

    const attributes = {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    };
    const gl = canvas.getContext("webgl", attributes)
        || canvas.getContext("experimental-webgl", attributes);
    this.gl = gl;

    const glo = new Glo(gl);
    this.glo = glo;

    glo.checkCompatibility();

    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const brushVertexShader = glo.createShader(gl.VERTEX_SHADER, brushVsSource);
    const vertexShader = glo.createShader(gl.VERTEX_SHADER, defaultVsSource);
    const brushFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, brushFsSource);
    const flatColourShader = glo.createShader(gl.FRAGMENT_SHADER, flatColourFsSource);
    const timestepShader = glo.createShader(gl.FRAGMENT_SHADER, timestepFsSource);
    const renderShader = glo.createShader(gl.FRAGMENT_SHADER, renderFsSource);

    const brushProgram = glo.createAndLinkProgram(brushVertexShader, brushFragmentShader);
    const flatColourProgram = glo.createAndLinkProgram(basicVertexShader, flatColourShader);
    const timestepProgram = glo.createAndLinkProgram(vertexShader, timestepShader);
    const renderProgram = glo.createAndLinkProgram(vertexShader, renderShader);

    gl.useProgram(brushProgram);
    glo.loadVertexData(brushProgram);
    gl.uniform1i(gl.getUniformLocation(brushProgram, "brush_shape"), 0);

    gl.useProgram(renderProgram);
    glo.loadVertexData(renderProgram);
    gl.uniform2f(gl.getUniformLocation(renderProgram, "state_size"), width, height);

    gl.useProgram(timestepProgram);
    glo.loadVertexData(timestepProgram);
    gl.uniform2f(gl.getUniformLocation(timestepProgram, "state_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(timestepProgram, "state"), 0);
    gl.uniform1i(gl.getUniformLocation(timestepProgram, "style_map"), 1);
    gl.uniform1i(gl.getUniformLocation(timestepProgram, "orientation_map"), 2);

    const styleMapSpec = {
      format: gl.RGB,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
    };
    const orientationMapSpec = {
      format: gl.RGB,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
    };
    const brushShapeSpec = {
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR_MIPMAP_LINEAR,
      },
      format: gl.RGBA,
      generate_mipmaps: true,
      internalFormat: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };
    const textures = [
      glo.createTexture(width, height, ImageDraw.createCenteredNoiseSquare(width, height)),
      glo.createTexture(width, height, null),
      glo.createTexture(width, height, ImageDraw.createWaves(width, height), styleMapSpec),
      glo.createTexture(width, height, ImageDraw.createVectorField(width, height), orientationMapSpec),
      glo.createTexture(64, 64, ImageDraw.createCircle(64), brushShapeSpec),
    ];
    const framebuffers = [
      glo.createFramebuffer(textures[0]),
      glo.createFramebuffer(textures[1]),
    ];

    gl.useProgram(timestepProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Cannot render to framebuffer: " + status);
    }
    
    this.brush = {
      endStrokeNextFrame: false,
      position: new Vector3(-16, 32, 0),
      positions: [],
      radius: 16,
      state: brushState.UP,
      strokeStepStart: 0.0,
    };
    this.camera = {
      height: height,
      projection: Matrix4.orthographicProjection(width, height, -1, 1),
      width: width,
    };
    this.flatColourProgram = flatColourProgram;
    this.framebuffers = framebuffers;
    this.iterationsPerFrame = 16;
    this.paused = false;
    this.programs = {
      brush: brushProgram,
    };
    this.renderProgram = renderProgram;
    this.textures = textures;
    this.timestepProgram = timestepProgram;
    this.update = {
      applyOrientationMap: false,
      applyStyleMap: false,
      colorA: Color.black(),
      colorB: Color.white(),
      feedRate: 0.0545,
      flowRate: 1,
      killRate: 0.062,
    };
  }

  clear() {
    this.clearNextStep = true;
  }

  getColorA() {
    return this.update.colorA;
  }

  getColorB() {
    return this.update.colorB;
  }

  setApplyOrientationMap(apply) {
    this.update.applyOrientationMap = apply;
  }

  setApplyStyleMap(applyStyleMap) {
    this.update.applyStyleMap = applyStyleMap;
  }

  setBrushPosition(position) {
    this.brush.position = position;

    if (this.brush.state === brushState.DOWN) {
      this.brush.positions.push(position);
    }
  }

  setBrushRadius(radius) {
    this.brush.radius = radius;
  }

  setBrushState(state) {
    const priorState = this.brush.state;

    this.brush.state = state;

    if ((state === brushState.HOVERING || state === brushState.UP)
        && priorState === brushState.DOWN) {
      this.brush.endStrokeNextFrame = true;
    }
  }

  setColorA(color) {
    this.update.colorA = color;
  }

  setColorB(color) {
    this.update.colorB = color;
  }

  setFlowRate(flowRate) {
    this.update.flowRate = flowRate;
  }

  setIterationsPerFrame(iterationsPerFrame) {
    this.iterationsPerFrame = iterationsPerFrame;
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

  start() {
    const frame = () => {
      this.step();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  step() {
    const brushProgram = this.programs.brush;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const renderProgram = this.renderProgram;
    const textures = this.textures;
    const timestepProgram = this.timestepProgram;

    // Edit Phase
    const translation = Matrix4.translate(this.brush.position);
    const radius = this.brush.radius;
    const dilation = Matrix4.dilate(new Vector3(radius, radius, 1));
    const model = Matrix4.multiply(translation, dilation);
    const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);

    if (this.clearNextStep) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.clearNextStep = false;
    }

    if (this.brush.state === brushState.DOWN && this.brush.positions.length > 1) {
      gl.useProgram(brushProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[4]);
      gl.uniform4fv(gl.getUniformLocation(brushProgram, "brush_color"), [0.0, 1.0, 0.0, 1.0]);

      let stepStart = this.brush.strokeStepStart;

      for (let i = 0; i < this.brush.positions.length - 1; i++) {
        const a = this.brush.positions[i];
        const b = this.brush.positions[i + 1];
        const distance = Vector3.distance(a, b);

        const spacing = 0.5 * this.brush.radius;
        if (stepStart < distance) {
          let step = stepStart;
          for (; step <= distance; step += spacing) {
            const translation = Matrix4.translate(Vector3.lerp(a, b, step / distance));
            const model = Matrix4.multiply(translation, dilation);
            const modelViewProjection = Matrix4.multiply(this.camera.projection, model);
  
            gl.uniformMatrix4fv(gl.getUniformLocation(brushProgram, "model_view_projection"), false, modelViewProjection.transpose.float32Array);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
          stepStart = step - distance;
        } else {
          stepStart -= distance;
        }
      }

      this.brush.positions.splice(0, Math.max(this.brush.positions.length - 1, 0));
      this.brush.strokeStepStart = stepStart;
    }

    if (this.brush.endStrokeNextFrame && this.brush.positions.length > 0) {
      gl.useProgram(brushProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[4]);
      gl.uniform4fv(gl.getUniformLocation(brushProgram, "brush_color"), [0.0, 1.0, 0.0, 1.0]);

      const translation = Matrix4.translate(this.brush.positions[0]);
      const model = Matrix4.multiply(translation, dilation);
      const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

      gl.uniformMatrix4fv(gl.getUniformLocation(brushProgram, "model_view_projection"), false, modelViewProjection.transpose.float32Array);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (this.brush.endStrokeNextFrame) {
      this.brush.endStrokeNextFrame = false;
      this.brush.positions = [];
      this.brush.strokeStepStart = 0.0;
    }

    // Timestep Phase
    if (!this.paused) {
      gl.useProgram(timestepProgram);

      gl.uniform1f(gl.getUniformLocation(timestepProgram, "canvas_feed_rate"), this.update.feedRate);
      gl.uniform1f(gl.getUniformLocation(timestepProgram, "flow_rate"), this.update.flowRate);
      gl.uniform1f(gl.getUniformLocation(timestepProgram, "canvas_kill_rate"), this.update.killRate);
      gl.uniform1i(gl.getUniformLocation(timestepProgram, "apply_orientation_map"), this.update.applyOrientationMap);
      gl.uniform1i(gl.getUniformLocation(timestepProgram, "apply_style_map"), this.update.applyStyleMap);
    
      for (let i = 0; i <= this.iterationsPerFrame; i++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[i % 2]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[2]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[3]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(i % 2) ^ 1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    // Render Phase
    gl.useProgram(renderProgram);
    gl.uniform3fv(gl.getUniformLocation(renderProgram, "color_a"), this.update.colorA.toArray());
    gl.uniform3fv(gl.getUniformLocation(renderProgram, "color_b"), this.update.colorB.toArray());
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // UI Phase
    if (this.brush.state === brushState.DOWN
        || this.brush.state === brushState.HOVERING) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(brushProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[4]);
      gl.uniformMatrix4fv(gl.getUniformLocation(brushProgram, "model_view_projection"), false, modelViewProjection.transpose.float32Array);
      gl.uniform4fv(gl.getUniformLocation(brushProgram, "brush_color"), [0.0, 1.0, 0.0, 0.5]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.BLEND);
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }
}

export {brushState};
export default SimulationCanvas;