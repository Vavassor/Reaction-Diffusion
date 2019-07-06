import basicVsSource from "../../Shaders/basic-vs.glsl";
import brushCutoutFsSource from "../../Shaders/brush-cutout-fs.glsl";
import brushFsSource from "../../Shaders/brush-fs.glsl";
import canvasTextureFsSource from "../../Shaders/canvas-texture-fs.glsl";
import Color from "../Utility/Color";
import diffuseInkFsSource from "../../Shaders/diffuse-ink-fs.glsl";
import displayFsSource from "../../Shaders/display-fs.glsl";
import displayFieldFsSource from "../../Shaders/display-field-fs.glsl";
import FlowSim from "../FlowSim";
import Glo from "../WebGL/Glo";
import * as ImageDraw from "../Utility/ImageDraw";
import Matrix4 from "../Utility/Matrix4";
import passthroughVsSource from "../../Shaders/passthrough-vs.glsl";
import * as Range from "../Utility/Range";
import simulateFsSource from "../../Shaders/simulate-fs.glsl";
import Vector2 from "../Utility/Vector2";
import Vector3 from "../Utility/Vector3";

export const brushState = {
  UP: 0,
  HOVERING: 1,
  DOWN: 2,
};

export const displayImage = {
  INK: "INK",
  ORIENTATION_MAP: "ORIENTATION_MAP",
  SIMULATION_STATE: "SIMULATION_STATE",
  STYLE_MAP: "STYLE_MAP",
  VELOCITY_FIELD: "VELOCITY_FIELD",
};

export default class SimulationCanvas {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;

    const simWidth = width;
    const simHeight = height;
    const simSize = new Vector2(simWidth, simHeight);

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
    glo.loadVertexData();

    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const passthroughVertexShader = glo.createShader(gl.VERTEX_SHADER, passthroughVsSource);
    const brushCutoutShader = glo.createShader(gl.FRAGMENT_SHADER, brushCutoutFsSource);
    const brushFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, brushFsSource);
    const canvasTextureShader = glo.createShader(gl.FRAGMENT_SHADER, canvasTextureFsSource);
    const diffuseInkShader = glo.createShader(gl.FRAGMENT_SHADER, diffuseInkFsSource);
    const displayShader = glo.createShader(gl.FRAGMENT_SHADER, displayFsSource);
    const displayFieldShader = glo.createShader(gl.FRAGMENT_SHADER, displayFieldFsSource);
    const simulateShader = glo.createShader(gl.FRAGMENT_SHADER, simulateFsSource);

    const brushProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: brushFragmentShader,
      },
      uniforms: [
        "brush_shape",
        "brush_color",
        "model_view_projection",
      ],
    });

    const brushCutoutProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: brushCutoutShader,
      },
      uniforms: [
        "brush_shape",
        "brush_color",
        "model_view_projection",
      ],
    });

    const canvasTextureProgram = glo.createAndLinkProgram(passthroughVertexShader, canvasTextureShader);
    const diffuseInkProgram = glo.createAndLinkProgram(basicVertexShader, diffuseInkShader);
    const displayProgram = glo.createAndLinkProgram(passthroughVertexShader, displayShader);
    const displayFieldProgram = glo.createAndLinkProgram(basicVertexShader, displayFieldShader);
    const simulateProgram = glo.createAndLinkProgram(passthroughVertexShader, simulateShader);

    brushProgram.use();
    brushProgram.setUniform1i("brush_shape", 0);
    brushProgram.setUniform4fv("brush_color", Color.black().toRgba());
    brushProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    brushCutoutProgram.use();
    brushCutoutProgram.setUniform1i("brush_shape", 0);
    brushCutoutProgram.setUniform4fv("brush_color", Color.black().toRgba());
    brushCutoutProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    gl.useProgram(canvasTextureProgram);
    glo.setUpVertexLayout(canvasTextureProgram);
    gl.uniform2fv(gl.getUniformLocation(canvasTextureProgram, "image_dimensions"), simSize.elements);
    gl.uniform1i(gl.getUniformLocation(canvasTextureProgram, "image"), 0);

    gl.useProgram(diffuseInkProgram);
    glo.setUpVertexLayout(diffuseInkProgram);
    gl.uniform2fv(gl.getUniformLocation(diffuseInkProgram, "texture_size"), simSize.elements);
    gl.uniform1i(gl.getUniformLocation(diffuseInkProgram, "ink"), 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(diffuseInkProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(displayProgram);
    glo.setUpVertexLayout(displayProgram);
    gl.uniform1i(gl.getUniformLocation(displayProgram, "state"), 0);
    gl.uniform1i(gl.getUniformLocation(displayProgram, "ink"), 1);
    gl.uniform2fv(gl.getUniformLocation(displayProgram, "state_size"), simSize.elements);

    gl.useProgram(displayFieldProgram);
    glo.setUpVertexLayout(displayFieldProgram);
    gl.uniform1i(gl.getUniformLocation(displayFieldProgram, "field"), 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(displayFieldProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(simulateProgram);
    glo.setUpVertexLayout(simulateProgram);
    gl.uniform2fv(gl.getUniformLocation(simulateProgram, "state_size"), simSize.elements);
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
      internalFormat: gl.RGBA,
      size: new Vector2(64, 64),
      type: gl.UNSIGNED_BYTE,
    };

    const inkSpec = {
      contents: ImageDraw.createColorChecker(simSize),
      format: gl.RGB,
      internalFormat: gl.RGB,
      type: gl.UNSIGNED_BYTE,
      size: simSize,
    };

    const orientationMapSpec = {
      contents: ImageDraw.createVectorField(simSize),
      format: gl.RGB,
      internalFormat: gl.RGB,
      size: simSize,
      type: gl.UNSIGNED_BYTE,
    };

    const stateSpec = {
      contents: ImageDraw.createCenteredNoiseSquare(simSize),
      size: simSize,
    };

    const styleMapSpec = {
      contents: ImageDraw.createWaves(simSize),
      format: gl.RGB,
      internalFormat: gl.RGB,
      size: simSize,
      type: gl.UNSIGNED_BYTE,
    };

    const textures = {
      brushShape: glo.createTexture(brushShapeSpec),
      ink: [
        glo.createTexture(inkSpec),
        glo.createTexture(inkSpec),
      ],
      orientationMap: glo.createTexture(orientationMapSpec),
      state: [
        glo.createTexture(stateSpec),
        glo.createTexture(stateSpec),
      ],
      styleMap: glo.createTexture(styleMapSpec),
    };
    
    const framebuffers = {
      ink: [
        glo.createFramebuffer(textures.ink[0]),
        glo.createFramebuffer(textures.ink[1]),
      ],
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
      color: Color.fromHex("00ffcc"),
      endStrokeNextFrame: false,
      position: new Vector3(-16, 32, 0),
      positions: [],
      radius: 16,
      state: brushState.UP,
      strokeStepStart: 0.0,
      velocity: Vector2.zero(),
    };
    this.camera = {
      height: height,
      projection: Matrix4.orthographicProjectionRh(width, height, -1, 1),
      width: width,
    };
    this.canvas = canvas;
    this.displayImage = displayImage.SIMULATION_STATE;
    this.flowSim = new FlowSim({
      canvasSize: simSize,
      gl: gl,
      glo: glo,
    });
    this.framebuffers = framebuffers;
    this.iterationsPerFrame = 16;
    this.nextFrameChange = {
      clear: false,
    };
    this.pageIndex = 0;
    this.paused = false;
    this.programs = {
      brush: brushProgram,
      brushCutout: brushCutoutProgram,
      canvasTexture: canvasTextureProgram,
      diffuseInk: diffuseInkProgram,
      display: displayProgram,
      displayField: displayFieldProgram,
      simulate: simulateProgram,
    };
    this.textures = textures;
    this.update = {
      applyFlowMap: false,
      applyOrientationMap: false,
      applyStyleMap: false,
      backgroundColor: Color.black(),
      feedRate: 0.0545,
      flowRate: 1,
      killRate: 0.062,
    };
  }

  clear() {
    this.nextFrameChange.clear = true;
  }

  drawBrush(brushColor, brushProgram) {
    const brush = this.brush;
    const gl = this.gl;
    const textures = this.textures;

    let stepStart = 0.0;

    if (brush.state === brushState.DOWN && brush.positions.length > 1) {
      brushProgram.use();
      textures.brushShape.bind(0);
      brushProgram.setUniform4fv("brush_color", brushColor.toRgba());
      stepStart = this.drawBrushStroke(brushProgram);
    }

    if (brush.endStrokeNextFrame && brush.positions.length > 0) {
      brushProgram.use();
      textures.brushShape.bind(0);
      brushProgram.setUniform4fv("brush_color", brushColor.toRgba());
      this.drawBrushDot(brush.positions[0], brushProgram);
    }

    return stepStart;
  }

  drawBrushDot(position, brushProgram) {
    const brush = this.brush;
    const gl = this.gl;

    const dilation = Matrix4.dilate(new Vector3(brush.radius, brush.radius, 1));
    const translation = Matrix4.translate(position);
    const model = Matrix4.multiply(translation, dilation);
    const modelViewProjection = Matrix4.multiply(this.camera.projection, model);

    brushProgram.setUniformMatrix4fv("model_view_projection", modelViewProjection.transpose.float32Array);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  drawBrushStroke(brushProgram) {
    const brush = this.brush;

    let stepStart = brush.strokeStepStart;

    for (let i = 0; i < brush.positions.length - 1; i++) {
      const a = brush.positions[i];
      const b = brush.positions[i + 1];
      const distance = Vector3.distance(a, b);

      const spacing = 0.5 * brush.radius;
      if (stepStart < distance) {
        let step = stepStart;
        for (; step <= distance; step += spacing) {
          const position = Vector3.lerp(a, b, step / distance);
          this.drawBrushDot(position, brushProgram);
        }
        stepStart = step - distance;
      } else {
        stepStart -= distance;
      }
    }

    return stepStart;
  }

  resize(size) {
    const camera = this.camera;
    const canvas = this.canvas;
    const canvasTextureProgram = this.programs.canvasTexture;
    const diffuseInkProgram = this.programs.diffuseInk;
    const displayProgram = this.programs.display;
    const gl = this.gl;
    const simulateProgram = this.programs.simulate;
    const textures = this.textures;

    canvas.width = size.x;
    canvas.height = size.y;
    
    camera.width = size.x;
    camera.height = size.y;
    camera.projection = Matrix4.orthographicProjectionRh(size.x, size.y, -1, 1);

    const inkContent = ImageDraw.createColorChecker(size);
    textures.ink[0].update(size, inkContent);
    textures.ink[1].update(size, inkContent);

    const orientationContent = ImageDraw.createVectorField(size);
    textures.orientationMap.update(size, orientationContent);

    const stateContents = ImageDraw.createCenteredNoiseSquare(size);
    textures.state[0].update(size, stateContents);
    textures.state[1].update(size, stateContents);

    const styleContent = ImageDraw.createWaves(size);
    textures.styleMap.update(size, styleContent);

    gl.useProgram(canvasTextureProgram);
    gl.uniform2fv(gl.getUniformLocation(canvasTextureProgram, "image_dimensions"), size.elements);

    gl.useProgram(diffuseInkProgram);
    gl.uniform2fv(gl.getUniformLocation(diffuseInkProgram, "texture_size"), size.elements);

    gl.useProgram(displayProgram);
    gl.uniform2fv(gl.getUniformLocation(displayProgram, "state_size"), size.elements);

    gl.useProgram(simulateProgram);
    gl.uniform2fv(gl.getUniformLocation(simulateProgram, "state_size"), size.elements);

    this.flowSim.resize(size);
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

  setBackgroundColor(color) {
    this.update.backgroundColor = color;
  }

  setBrushColor(color) {
    this.brush.color = color;
  }

  setBrushPosition(position) {
    const brush = this.brush;
    const priorPosition = brush.position;

    brush.position = position;

    const delta = Vector3.subtract(position, priorPosition);
    if (delta.squaredLength > 0.0) {
      brush.velocity = new Vector2(delta.x, delta.y);
    }

    if (brush.state === brushState.DOWN) {
      brush.positions.push(position);
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

  setDisplayImage(image) {
    this.displayImage = image;
  }

  setFlowRate(flowRate) {
    this.update.flowRate = flowRate;
  }

  setIterationsPerFrame(iterationsPerFrame) {
    this.iterationsPerFrame = iterationsPerFrame;
  }

  setPaused(paused) {
    this.paused = paused;
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

  setInkTexture(image) {
    const size = new Vector2(image.width, image.height);
    this.textures.ink[0].update(size, image);
  }

  setOrientationMap(image) {
    const size = new Vector2(image.width, image.height);
    this.textures.orientationMap.update(size, image);
  }

  setStyleMap(image) {
    const size = new Vector2(image.width, image.height);
    this.textures.styleMap.update(size, image);
  }

  start() {
    const frame = () => {
      this.step();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  step() {
    const brushProgram = this.programs.brushCutout;
    const canvasTextureProgram = this.programs.canvasTexture;
    const diffuseInkProgram = this.programs.diffuseInk;
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

    const stepStart = this.drawBrush(new Color(0.0, 1.0, 0.0), this.programs.brushCutout);

    // Ink Phase
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.ink[0]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.drawBrush(this.brush.color, this.programs.brush);
    gl.disable(gl.BLEND);

    if (!this.paused && !this.update.applyFlowMap) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.ink[1]);
      gl.useProgram(diffuseInkProgram);
      textures.ink[0].bind(0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      let temp = textures.ink[1];
      textures.ink[1] = textures.ink[0];
      textures.ink[0] = temp;
      temp = framebuffers.ink[1];
      framebuffers.ink[1] = framebuffers.ink[0];
      framebuffers.ink[0] = temp;
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
      this.flowSim.bindVelocityFramebuffer();
      let brushVelocity = Vector2.multiply(0.05, this.brush.velocity);
      if (brushVelocity.length > 1.0) {
        brushVelocity = Vector2.normalize(brushVelocity);
      }
      this.drawBrush(new Color(brushVelocity.x, brushVelocity.y, 0.0), this.programs.brushCutout);

      this.flowSim.drawFlow(textures.state[0], framebuffers.state[1]);

      let temp = framebuffers.state[1];
      framebuffers.state[1] = framebuffers.state[0];
      framebuffers.state[0] = temp;
      temp = textures.state[1];
      textures.state[1] = textures.state[0];
      textures.state[0] = temp;

      this.flowSim.advectInput(textures.ink[0], framebuffers.ink[1]);
      temp = textures.ink[1];
      textures.ink[1] = textures.ink[0];
      textures.ink[0] = temp;
      temp = framebuffers.ink[1];
      framebuffers.ink[1] = framebuffers.ink[0];
      framebuffers.ink[0] = temp;
    }

    this.updateBrushAfterDrawing(stepStart);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.camera.width, this.camera.height);

    // Display Phase
    switch (this.displayImage) {
      case displayImage.INK:
        gl.useProgram(canvasTextureProgram);
        textures.ink[0].bind(0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        break;

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
        gl.uniform4fv(gl.getUniformLocation(displayProgram, "background_color"), this.update.backgroundColor.toRgba());
        textures.state[0].bind(0);
        textures.ink[0].bind(1);
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
      brushProgram.use();
      textures.brushShape.bind(0);
      brushProgram.setUniformMatrix4fv("model_view_projection", modelViewProjection.transpose.float32Array);
      brushProgram.setUniform4fv("brush_color", [0.0, 1.0, 0.0, 0.5]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.BLEND);
    }
  }

  updateBrushAfterDrawing(stepStart) {
    const brush = this.brush;

    if (brush.state === brushState.DOWN && brush.positions.length > 1) {
      brush.positions.splice(0, Math.max(brush.positions.length - 1, 0));
      brush.strokeStepStart = stepStart;
    }

    if (brush.endStrokeNextFrame) {
      brush.endStrokeNextFrame = false;
      brush.positions = [];
      brush.strokeStepStart = 0.0;
    }
  }
}