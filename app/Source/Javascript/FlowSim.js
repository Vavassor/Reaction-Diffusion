/** @module FlowSim */

import advectFsSource from "../Shaders/advect-fs.glsl";
import basicVsSource from "../Shaders/basic-vs.glsl";
import bfeccFsSource from "../Shaders/bfecc-fs.glsl";
import divergenceFsSource from "../Shaders/divergence-fs.glsl";
import * as ImageDraw from "./Utility/ImageDraw";
import Matrix4 from "./Utility/Matrix4";
import pressureFsSource from "../Shaders/pressure-fs.glsl";
import subtractPressureGradientFsSource from "../Shaders/subtract-pressure-gradient-fs.glsl";

/** A simulation of flow in incompressible, homogenous fluid. */
export default class FlowSim {
  constructor(spec) {
    const deltaTime = 1.0 / 120.0;
    const density = 1.0;
    const gl = spec.gl;
    const glo = spec.glo;
    const height = spec.canvasSize.height;
    const width = spec.canvasSize.width;

    const advectFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, advectFsSource);
    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const bfeccFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, bfeccFsSource);
    const divergenceShader = glo.createShader(gl.FRAGMENT_SHADER, divergenceFsSource);
    const pressureShader = glo.createShader(gl.FRAGMENT_SHADER, pressureFsSource);
    const subtractPressureGradientShader = glo.createShader(gl.FRAGMENT_SHADER, subtractPressureGradientFsSource);

    const advectProgram = glo.createAndLinkProgram(basicVertexShader, advectFragmentShader);
    const bfeccProgram = glo.createAndLinkProgram(basicVertexShader, bfeccFragmentShader);
    const divergenceProgram = glo.createAndLinkProgram(basicVertexShader, divergenceShader);
    const pressureProgram = glo.createAndLinkProgram(basicVertexShader, pressureShader);
    const subtractPressureGradientProgram = glo.createAndLinkProgram(basicVertexShader, subtractPressureGradientShader);

    gl.useProgram(advectProgram);
    glo.loadVertexData(advectProgram);
    gl.uniform1f(gl.getUniformLocation(advectProgram, "delta_time"), deltaTime);
    gl.uniform2f(gl.getUniformLocation(advectProgram, "texture_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "input_texture"), 0);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "velocity_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(advectProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(bfeccProgram);
    glo.loadVertexData(bfeccProgram);
    gl.uniform1i(gl.getUniformLocation(bfeccProgram, "velocity_field"), 0);
    gl.uniform1i(gl.getUniformLocation(bfeccProgram, "compensation_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(bfeccProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(divergenceProgram);
    glo.loadVertexData(divergenceProgram);
    gl.uniform1f(gl.getUniformLocation(divergenceProgram, "delta_time"), deltaTime);
    gl.uniform1f(gl.getUniformLocation(divergenceProgram, "density"), density);
    gl.uniform1i(gl.getUniformLocation(divergenceProgram, "velocity_field"), 0);
    gl.uniform2f(gl.getUniformLocation(divergenceProgram, "velocity_field_size"), width, height);
    gl.uniformMatrix4fv(gl.getUniformLocation(divergenceProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(pressureProgram);
    glo.loadVertexData(pressureProgram);
    gl.uniform2f(gl.getUniformLocation(pressureProgram, "field_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, "divergence_field"), 0);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, "pressure_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(pressureProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    gl.useProgram(subtractPressureGradientProgram);
    glo.loadVertexData(subtractPressureGradientProgram);
    gl.uniform1f(gl.getUniformLocation(subtractPressureGradientProgram, "delta_time"), deltaTime);
    gl.uniform1f(gl.getUniformLocation(subtractPressureGradientProgram, "density"), density);
    gl.uniform2f(gl.getUniformLocation(subtractPressureGradientProgram, "field_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "velocity_field"), 0);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "pressure_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(subtractPressureGradientProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    const programs = {
      advect: advectProgram,
      bfecc: bfeccProgram,
      divergence: divergenceProgram,
      pressure: pressureProgram,
      subtractPressureGradient: subtractPressureGradientProgram,
    };

    const divergenceFieldSpec = {
      height: height,
      width: width,
    };

    const pressureFieldSpec = {
      height: height,
      width: width,
    };

    const velocityFieldSpec = {
      contents: ImageDraw.createVectorFieldFloat32(width, height),
      height: height,
      width: width,
    };

    const textures = {
      divergence: glo.createTexture(divergenceFieldSpec),
      pressure: [
        glo.createTexture(pressureFieldSpec),
        glo.createTexture(pressureFieldSpec),
      ],
      velocityField: [
        glo.createTexture(velocityFieldSpec),
        glo.createTexture(velocityFieldSpec),
        glo.createTexture(velocityFieldSpec),
      ],
    };

    const framebuffers = {
      divergence: glo.createFramebuffer(textures.divergence),
      pressure: [
        glo.createFramebuffer(textures.pressure[0]),
        glo.createFramebuffer(textures.pressure[1]),
      ],
      velocityField: [
        glo.createFramebuffer(textures.velocityField[0]),
        glo.createFramebuffer(textures.velocityField[1]),
        glo.createFramebuffer(textures.velocityField[2]),
      ],
    };

    this.deltaTime = deltaTime;
    this.framebuffers = framebuffers;
    this.gl = spec.gl;
    this.programs = programs;
    this.textures = textures;
  }

  resize(width, height) {
    const advectProgram = this.programs.advect;
    const divergenceProgram = this.programs.divergence;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const subtractPressureGradientProgram = this.programs.subtractPressureGradient;
    const textures = this.textures;

    textures.divergence.update(width, height, null);

    textures.pressure[0].update(width, height, null);
    textures.pressure[1].update(width, height, null);

    const velocityContent = ImageDraw.createVectorFieldFloat32(width, height);
    textures.velocityField[0].update(width, height, velocityContent);
    textures.velocityField[1].update(width, height, velocityContent);
    textures.velocityField[2].update(width, height, velocityContent);

    gl.useProgram(advectProgram);
    gl.uniform2f(gl.getUniformLocation(advectProgram, "texture_size"), width, height);
    
    gl.useProgram(divergenceProgram);
    gl.uniform2f(gl.getUniformLocation(divergenceProgram, "velocity_field_size"), width, height);

    gl.useProgram(pressureProgram);
    gl.uniform2f(gl.getUniformLocation(pressureProgram, "field_size"), width, height);

    gl.useProgram(subtractPressureGradientProgram);
    gl.uniform2f(gl.getUniformLocation(subtractPressureGradientProgram, "field_size"), width, height);
  }

  advectVelocity() {
    const advectProgram = this.programs.advect;
    const bfeccProgram = this.programs.bfecc;
    const deltaTime = this.deltaTime;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(advectProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
    textures.velocityField[0].bind(0);
    textures.velocityField[0].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[2]);
    gl.uniform1f(gl.getUniformLocation(advectProgram, "delta_time"), -deltaTime);
    textures.velocityField[1].bind(0);
    textures.velocityField[1].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(bfeccProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
    textures.velocityField[0].bind(0);
    textures.velocityField[2].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(advectProgram);
    gl.uniform1f(gl.getUniformLocation(advectProgram, "delta_time"), deltaTime);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[2]);
    textures.velocityField[1].bind(0);
    textures.velocityField[1].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  computeDivergence() {
    const divergenceProgram = this.programs.divergence;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(divergenceProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.divergence);
    textures.velocityField[2].bind(0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  computePressure() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const textures = this.textures;

    gl.useProgram(pressureProgram);

    const iterationsPerFrame = 10;
      
    for (let i = 0; i < iterationsPerFrame; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.pressure[(i % 2) ^ 1]);
      textures.divergence.bind(0);
      textures.pressure[i % 2].bind(1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  subtractPressureGradient() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const subtractPressureGradientProgram = this.programs.subtractPressureGradient;
    const textures = this.textures;

    gl.useProgram(subtractPressureGradientProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
    textures.velocityField[2].bind(0);
    textures.pressure[0].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  advectInput(inputTexture, outputFramebuffer) {
    const advectProgram = this.programs.advect;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(advectProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    inputTexture.bind(0);
    textures.velocityField[0].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  drawFlow(inputTexture, outputFramebuffer) {
    this.advectVelocity();
    this.computeDivergence();
    this.computePressure();
    this.subtractPressureGradient();
    this.advectInput(inputTexture, outputFramebuffer);
  }

  drawVelocityField(displayFieldProgram) {
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(displayFieldProgram);
    textures.velocityField[0].bind(0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  bindVelocityFramebuffer() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
  }
}