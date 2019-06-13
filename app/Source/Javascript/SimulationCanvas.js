import advectFsSource from "../Shaders/advect-fs.glsl";
import basicVsSource from "../Shaders/basic-vs.glsl";
import brushFsSource from "../Shaders/brush-fs.glsl";
import canvasTextureFsSource from "../Shaders/canvas-texture-fs.glsl";
import Color from "./Color";
import displayFsSource from "../Shaders/display-fs.glsl";
import displayFieldFsSource from "../Shaders/display-field-fs.glsl";
import divergenceFsSource from "../Shaders/divergence-fs.glsl";
import Glo from "./Glo";
import * as ImageDraw from "./ImageDraw";
import Matrix4 from "./Matrix4";
import passthroughVsSource from "../Shaders/passthrough-vs.glsl";
import pressureFsSource from "../Shaders/pressure-fs.glsl";
import * as Range from "./Range";
import simulateFsSource from "../Shaders/simulate-fs.glsl";
import subtractPressureGradientFsSource from "../Shaders/subtract-pressure-gradient-fs.glsl";
import Vector3 from "./Vector3";

export const brushState = {
  UP: 0,
  HOVERING: 1,
  DOWN: 2,
};

export const displayImage = {
  DIVERGENCE_FIELD: "DIVERGENCE_FIELD",
  ORIENTATION_MAP: "ORIENTATION_MAP",
  PRESSURE_FIELD: "PRESSURE_FIELD",
  SIMULATION_STATE: "SIMULATION_STATE",
  STYLE_MAP: "STYLE_MAP",
  VELOCITY_FIELD: "VELOCITY_FIELD",
};

export default class SimulationCanvas {
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

    const advectFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, advectFsSource);
    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const passthroughVertexShader = glo.createShader(gl.VERTEX_SHADER, passthroughVsSource);
    const brushFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, brushFsSource);
    const canvasTextureShader = glo.createShader(gl.FRAGMENT_SHADER, canvasTextureFsSource);
    const displayShader = glo.createShader(gl.FRAGMENT_SHADER, displayFsSource);
    const displayFieldShader = glo.createShader(gl.FRAGMENT_SHADER, displayFieldFsSource);
    const divergenceShader = glo.createShader(gl.FRAGMENT_SHADER, divergenceFsSource);
    const pressureShader = glo.createShader(gl.FRAGMENT_SHADER, pressureFsSource);
    const simulateShader = glo.createShader(gl.FRAGMENT_SHADER, simulateFsSource);
    const subtractPressureGradientShader = glo.createShader(gl.FRAGMENT_SHADER, subtractPressureGradientFsSource);

    const advectProgram = glo.createAndLinkProgram(basicVertexShader, advectFragmentShader);
    const brushProgram = glo.createAndLinkProgram(basicVertexShader, brushFragmentShader);
    const canvasTextureProgram = glo.createAndLinkProgram(passthroughVertexShader, canvasTextureShader);
    const displayProgram = glo.createAndLinkProgram(passthroughVertexShader, displayShader);
    const displayFieldProgram = glo.createAndLinkProgram(basicVertexShader, displayFieldShader);
    const divergenceProgram = glo.createAndLinkProgram(basicVertexShader, divergenceShader);
    const pressureProgram = glo.createAndLinkProgram(basicVertexShader, pressureShader);
    const simulateProgram = glo.createAndLinkProgram(passthroughVertexShader, simulateShader);
    const subtractPressureGradientProgram = glo.createAndLinkProgram(basicVertexShader, subtractPressureGradientShader);

    gl.useProgram(advectProgram);
    glo.loadVertexData(advectProgram);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "input_texture"), 0);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "velocity_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(advectProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(brushProgram);
    glo.loadVertexData(brushProgram);
    gl.uniform1i(gl.getUniformLocation(brushProgram, "brush_shape"), 0);

    gl.useProgram(canvasTextureProgram);
    glo.loadVertexData(canvasTextureProgram);
    gl.uniform2f(gl.getUniformLocation(canvasTextureProgram, "image_dimensions"), width, height);
    gl.uniform1i(gl.getUniformLocation(canvasTextureProgram, "image"), 0);

    gl.useProgram(displayProgram);
    glo.loadVertexData(displayProgram);
    gl.uniform2f(gl.getUniformLocation(displayProgram, "state_size"), width, height);

    gl.useProgram(displayFieldProgram);
    glo.loadVertexData(displayFieldProgram);
    gl.uniform1i(gl.getUniformLocation(displayFieldProgram, "field"), 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(displayFieldProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(divergenceProgram);
    glo.loadVertexData(divergenceProgram);
    gl.uniform1i(gl.getUniformLocation(divergenceProgram, "velocity_field"), 0);
    gl.uniform2f(gl.getUniformLocation(divergenceProgram, "velocity_field_size"), width, height);
    gl.uniformMatrix4fv(gl.getUniformLocation(divergenceProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(pressureProgram);
    glo.loadVertexData(pressureProgram);
    gl.uniform2f(gl.getUniformLocation(pressureProgram, "field_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, "divergence_field"), 0);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, "pressure_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(pressureProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(simulateProgram);
    glo.loadVertexData(simulateProgram);
    gl.uniform2f(gl.getUniformLocation(simulateProgram, "state_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "state"), 0);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "style_map"), 1);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "orientation_map"), 2);

    gl.useProgram(subtractPressureGradientProgram);
    glo.loadVertexData(subtractPressureGradientProgram);
    gl.uniform2f(gl.getUniformLocation(subtractPressureGradientProgram, "field_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "velocity_field"), 0);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "pressure_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(subtractPressureGradientProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

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

    const orientationMapSpec = {
      format: gl.RGB,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
    };

    const stateSpec = {
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR,
      },
    };

    const styleMapSpec = {
      format: gl.RGB,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
    };
    
    const velocityFieldSpec = {
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR,
      },
    };

    const textures = {
      brushShape: glo.createTexture(64, 64, ImageDraw.createCircle(64), brushShapeSpec),
      divergence: glo.createTexture(width, height, null),
      orientationMap: glo.createTexture(width, height, ImageDraw.createVectorField(width, height), orientationMapSpec),
      pressure: [
        glo.createTexture(width, height, null),
        glo.createTexture(width, height, null),
      ],
      state: [
        glo.createTexture(width, height, ImageDraw.createCenteredNoiseSquare(width, height), stateSpec),
        glo.createTexture(width, height, null, stateSpec),
      ],
      styleMap: glo.createTexture(width, height, ImageDraw.createWaves(width, height), styleMapSpec),
      velocityField: [
        glo.createTexture(width, height, ImageDraw.createVectorFieldFloat32(width, height), velocityFieldSpec),
        glo.createTexture(width, height, null, velocityFieldSpec),
      ],
    };
    
    const framebuffers = {
      divergence: glo.createFramebuffer(textures.divergence),
      pressure: [
        glo.createFramebuffer(textures.pressure[0]),
        glo.createFramebuffer(textures.pressure[1]),
      ],
      state: [
        glo.createFramebuffer(textures.state[0]),
        glo.createFramebuffer(textures.state[1]),
      ],
      velocityField: [
        glo.createFramebuffer(textures.velocityField[0]),
        glo.createFramebuffer(textures.velocityField[1]),
      ],
    };

    gl.useProgram(simulateProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[0]);
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
      projection: Matrix4.orthographicProjectionRh(width, height, -1, 1),
      width: width,
    };
    this.displayImage = displayImage.SIMULATION_STATE;
    this.framebuffers = framebuffers;
    this.iterationsPerFrame = 16;
    this.pageIndex = 0;
    this.paused = false;
    this.programs = {
      advect: advectProgram,
      brush: brushProgram,
      canvasTexture: canvasTextureProgram,
      display: displayProgram,
      displayField: displayFieldProgram,
      divergence: divergenceProgram,
      pressure: pressureProgram,
      simulate: simulateProgram,
      subtractPressureGradient: subtractPressureGradientProgram,
    };
    this.textures = textures;
    this.update = {
      applyFlowMap: false,
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

  setApplyFlowMap(apply) {
    this.update.applyFlowMap = apply;
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

  setDisplayImage(image) {
    this.displayImage = image;
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
    const advectProgram = this.programs.advect;
    const brushProgram = this.programs.brush;
    const canvasTextureProgram = this.programs.canvasTexture;
    const displayProgram = this.programs.display;
    const displayFieldProgram = this.programs.displayField;
    const divergenceProgram = this.programs.divergence;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const textures = this.textures;
    const simulateProgram = this.programs.simulate;
    const subtractPressureGradientProgram = this.programs.subtractPressureGradient;

    // Edit Phase
    const translation = Matrix4.translate(this.brush.position);
    const radius = this.brush.radius;
    const dilation = Matrix4.dilate(new Vector3(radius, radius, 1));
    const model = Matrix4.multiply(translation, dilation);
    const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[0]);

    if (this.clearNextStep) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.clearNextStep = false;
    }

    if (this.brush.state === brushState.DOWN && this.brush.positions.length > 1) {
      gl.useProgram(brushProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.brushShape);
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
      gl.bindTexture(gl.TEXTURE_2D, textures.brushShape);
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

    // Simulation Phase
    if (!this.paused) {
      gl.useProgram(simulateProgram);

      gl.uniform1f(gl.getUniformLocation(simulateProgram, "canvas_feed_rate"), this.update.feedRate);
      gl.uniform1f(gl.getUniformLocation(simulateProgram, "flow_rate"), this.update.flowRate);
      gl.uniform1f(gl.getUniformLocation(simulateProgram, "canvas_kill_rate"), this.update.killRate);
      gl.uniform1i(gl.getUniformLocation(simulateProgram, "apply_orientation_map"), this.update.applyOrientationMap);
      gl.uniform1i(gl.getUniformLocation(simulateProgram, "apply_style_map"), this.update.applyStyleMap);
    
      for (let i = 0; i <= this.iterationsPerFrame; i++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.state[i % 2]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures.styleMap);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures.orientationMap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[(i % 2) ^ 1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    if (!this.paused && this.update.applyFlowMap) {
      // Advection Phase
      {
        gl.useProgram(advectProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // Divergence Phase
      {
        gl.useProgram(divergenceProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.divergence);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // Pressure Iteration Phase
      {
        gl.useProgram(pressureProgram);
        
        for (let i = 0; i < 10; i++) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.pressure[(i % 2) ^ 1]);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, textures.divergence);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, textures.pressure[i % 2]);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // Subtract Pressure Gradient Phase
      {
        gl.useProgram(subtractPressureGradientProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[1]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures.pressure[0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // Color Advection Phase
      {
        gl.useProgram(advectProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[1]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.state[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        let temp = framebuffers.state[1];
        framebuffers.state[1] = framebuffers.state[0];
        framebuffers.state[0] = temp;
        temp = textures.state[1];
        textures.state[1] = textures.state[0];
        textures.state[0] = temp;
      }
    }

    // Display Phase
    switch (this.displayImage) {
      case displayImage.DIVERGENCE_FIELD:
        gl.useProgram(displayFieldProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.divergence);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.ORIENTATION_MAP:
        gl.useProgram(canvasTextureProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.orientationMap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.PRESSURE_FIELD:
        gl.useProgram(displayFieldProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.pressure[0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.STYLE_MAP:
        gl.useProgram(canvasTextureProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.styleMap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.SIMULATION_STATE: {
        gl.useProgram(displayProgram);
        gl.uniform3fv(gl.getUniformLocation(displayProgram, "color_a"), this.update.colorA.toArray());
        gl.uniform3fv(gl.getUniformLocation(displayProgram, "color_b"), this.update.colorB.toArray());
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.state[0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;
      }

      case displayImage.VELOCITY_FIELD:
        gl.useProgram(displayFieldProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;
    }
    
    // UI Phase
    if (this.brush.state === brushState.DOWN
        || this.brush.state === brushState.HOVERING) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(brushProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.brushShape);
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