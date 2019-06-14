import basicVsSource from "../../Shaders/basic-vs.glsl";
import brushFsSource from "../../Shaders/brush-fs.glsl";
import canvasTextureFsSource from "../../Shaders/canvas-texture-fs.glsl";
import Color from "../Utility/Color";
import displayFsSource from "../../Shaders/display-fs.glsl";
import displayFieldFsSource from "../../Shaders/display-field-fs.glsl";
import FlowSim from "../FlowSim";
import Glo from "../Utility/Glo";
import * as ImageDraw from "../Utility/ImageDraw";
import Matrix4 from "../Utility/Matrix4";
import passthroughVsSource from "../../Shaders/passthrough-vs.glsl";
import * as Range from "../Utility/Range";
import simulateFsSource from "../../Shaders/simulate-fs.glsl";
import Vector3 from "../Utility/Vector3";

export const brushState = {
  UP: 0,
  HOVERING: 1,
  DOWN: 2,
};

export const displayImage = {
  ORIENTATION_MAP: "ORIENTATION_MAP",
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

    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const passthroughVertexShader = glo.createShader(gl.VERTEX_SHADER, passthroughVsSource);
    const brushFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, brushFsSource);
    const canvasTextureShader = glo.createShader(gl.FRAGMENT_SHADER, canvasTextureFsSource);
    const displayShader = glo.createShader(gl.FRAGMENT_SHADER, displayFsSource);
    const displayFieldShader = glo.createShader(gl.FRAGMENT_SHADER, displayFieldFsSource);
    const simulateShader = glo.createShader(gl.FRAGMENT_SHADER, simulateFsSource);

    const brushProgram = glo.createAndLinkProgram(basicVertexShader, brushFragmentShader);
    const canvasTextureProgram = glo.createAndLinkProgram(passthroughVertexShader, canvasTextureShader);
    const displayProgram = glo.createAndLinkProgram(passthroughVertexShader, displayShader);
    const displayFieldProgram = glo.createAndLinkProgram(basicVertexShader, displayFieldShader);
    const simulateProgram = glo.createAndLinkProgram(passthroughVertexShader, simulateShader);

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

    gl.useProgram(simulateProgram);
    glo.loadVertexData(simulateProgram);
    gl.uniform2f(gl.getUniformLocation(simulateProgram, "state_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "state"), 0);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "style_map"), 1);
    gl.uniform1i(gl.getUniformLocation(simulateProgram, "orientation_map"), 2);

    const brushShapeSpec = {
      contents: ImageDraw.createCircle(64),
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR_MIPMAP_LINEAR,
      },
      format: gl.RGBA,
      generate_mipmaps: true,
      height: 64,
      internalFormat: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      width: 64,
    };

    const orientationMapSpec = {
      contents: ImageDraw.createVectorField(width, height),
      format: gl.RGB,
      height: height,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
      width: width,
    };

    const stateSpec = {
      contents: ImageDraw.createCenteredNoiseSquare(width, height),
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR,
      },
      height: height,
      width: width,
    };

    const styleMapSpec = {
      contents: ImageDraw.createWaves(width, height),
      format: gl.RGB,
      internalFormat: gl.RGB,
      height: height,
      type: gl.UNSIGNED_BYTE,
      width: width,
    };

    const textures = {
      brushShape: glo.createTexture(brushShapeSpec),
      orientationMap: glo.createTexture(orientationMapSpec),
      state: [
        glo.createTexture(stateSpec),
        glo.createTexture(stateSpec),
      ],
      styleMap: glo.createTexture(styleMapSpec),
    };
    
    const framebuffers = {
      state: [
        glo.createFramebuffer(textures.state[0]),
        glo.createFramebuffer(textures.state[1]),
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
    this.canvas = canvas;
    this.displayImage = displayImage.SIMULATION_STATE;
    this.flowSim = new FlowSim({
      canvasSize: {
        height: height,
        width: width,
      },
      gl: gl,
      glo: glo,
    });
    this.framebuffers = framebuffers;
    this.iterationsPerFrame = 16;
    this.nextFrameChange = {
      clear: false,
      resize: false,
    };
    this.pageIndex = 0;
    this.paused = false;
    this.programs = {
      brush: brushProgram,
      canvasTexture: canvasTextureProgram,
      display: displayProgram,
      displayField: displayFieldProgram,
      simulate: simulateProgram,
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
    this.nextFrameChange.clear = true;
  }

  getColorA() {
    return this.update.colorA;
  }

  getColorB() {
    return this.update.colorB;
  }

  resize(width, height) {
    const camera = this.camera;
    const canvas = this.canvas;
    const displayProgram = this.programs.display;
    const gl = this.gl;
    const simulateProgram = this.programs.simulate;
    const textures = this.textures;

    canvas.width = width;
    canvas.height = height;
    
    camera.width = width;
    camera.height = height;
    camera.projection = Matrix4.orthographicProjectionRh(width, height, -1, 1);

    const stateContents = ImageDraw.createCenteredNoiseSquare(width, height);
    textures.state[0].update(width, height, stateContents);
    textures.state[1].update(width, height, null);

    gl.useProgram(displayProgram);
    gl.uniform2f(gl.getUniformLocation(displayProgram, "state_size"), width, height);
    
    gl.useProgram(simulateProgram);
    gl.uniform2f(gl.getUniformLocation(simulateProgram, "state_size"), width, height);
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
    const brushProgram = this.programs.brush;
    const canvasTextureProgram = this.programs.canvasTexture;
    const displayProgram = this.programs.display;
    const displayFieldProgram = this.programs.displayField;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;
    const simulateProgram = this.programs.simulate;

    // Edit Phase
    const translation = Matrix4.translate(this.brush.position);
    const radius = this.brush.radius;
    const dilation = Matrix4.dilate(new Vector3(radius, radius, 1));
    const model = Matrix4.multiply(translation, dilation);
    const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[0]);
    gl.viewport(0, 0, this.camera.width, this.camera.height);

    if (this.nextFrameChange.clear) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.nextFrameChange.clear = false;
    }

    if (this.brush.state === brushState.DOWN && this.brush.positions.length > 1) {
      gl.useProgram(brushProgram);
      textures.brushShape.bind(0);
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
      textures.brushShape.bind(0);
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
        textures.state[i % 2].bind(0);
        textures.styleMap.bind(1);
        textures.orientationMap.bind(2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.state[(i % 2) ^ 1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    // Flow Phase
    if (!this.paused && this.update.applyFlowMap) {
      this.flowSim.drawFlow(textures.state[0], framebuffers.state[1]);

      let temp = framebuffers.state[1];
      framebuffers.state[1] = framebuffers.state[0];
      framebuffers.state[0] = temp;
      temp = textures.state[1];
      textures.state[1] = textures.state[0];
      textures.state[0] = temp;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.camera.width, this.camera.height);

    // Display Phase
    switch (this.displayImage) {
      case displayImage.ORIENTATION_MAP:
        gl.useProgram(canvasTextureProgram);
        textures.orientationMap.bind(0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.STYLE_MAP:
        gl.useProgram(canvasTextureProgram);
        textures.styleMap.bind(0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

      case displayImage.SIMULATION_STATE: {
        gl.useProgram(displayProgram);
        gl.uniform3fv(gl.getUniformLocation(displayProgram, "color_a"), this.update.colorA.toArray());
        gl.uniform3fv(gl.getUniformLocation(displayProgram, "color_b"), this.update.colorB.toArray());
        textures.state[0].bind(0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;
      }

      case displayImage.VELOCITY_FIELD:
        this.flowSim.drawVelocityField(displayFieldProgram);
        break;
    }
    
    // UI Phase
    if (this.brush.state === brushState.DOWN
        || this.brush.state === brushState.HOVERING) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(brushProgram);
      textures.brushShape.bind(0);
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