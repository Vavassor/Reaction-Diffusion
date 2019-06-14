/** @module FlowSim */

import advectFsSource from "../Shaders/advect-fs.glsl";
import basicVsSource from "../Shaders/basic-vs.glsl";
import divergenceFsSource from "../Shaders/divergence-fs.glsl";
import * as ImageDraw from "./ImageDraw";
import Matrix4 from "./Matrix4";
import pressureFsSource from "../Shaders/pressure-fs.glsl";
import subtractPressureGradientFsSource from "../Shaders/subtract-pressure-gradient-fs.glsl";

/** A simulation of flow in incompressible, homogenous fluid. */
export default class FlowSim {
  constructor(spec) {
    const gl = spec.gl;
    const glo = spec.glo;
    const width = spec.canvasSize.width;
    const height = spec.canvasSize.height;

    const advectFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, advectFsSource);
    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const divergenceShader = glo.createShader(gl.FRAGMENT_SHADER, divergenceFsSource);
    const pressureShader = glo.createShader(gl.FRAGMENT_SHADER, pressureFsSource);
    const subtractPressureGradientShader = glo.createShader(gl.FRAGMENT_SHADER, subtractPressureGradientFsSource);

    const advectProgram = glo.createAndLinkProgram(basicVertexShader, advectFragmentShader);
    const divergenceProgram = glo.createAndLinkProgram(basicVertexShader, divergenceShader);
    const pressureProgram = glo.createAndLinkProgram(basicVertexShader, pressureShader);
    const subtractPressureGradientProgram = glo.createAndLinkProgram(basicVertexShader, subtractPressureGradientShader);

    gl.useProgram(advectProgram);
    glo.loadVertexData(advectProgram);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "input_texture"), 0);
    gl.uniform1i(gl.getUniformLocation(advectProgram, "velocity_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(advectProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

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

    gl.useProgram(subtractPressureGradientProgram);
    glo.loadVertexData(subtractPressureGradientProgram);
    gl.uniform2f(gl.getUniformLocation(subtractPressureGradientProgram, "field_size"), width, height);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "velocity_field"), 0);
    gl.uniform1i(gl.getUniformLocation(subtractPressureGradientProgram, "pressure_field"), 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(subtractPressureGradientProgram, "model_view_projection"), false, Matrix4.identity().transpose.float32Array);

    const programs = {
      advect: advectProgram,
      divergence: divergenceProgram,
      pressure: pressureProgram,
      subtractPressureGradient: subtractPressureGradientProgram,
    };

    const velocityFieldSpec = {
      filter: {
        magnify: gl.LINEAR,
        minify: gl.LINEAR,
      },
    };

    const textures = {
      divergence: glo.createTexture(width, height, null),
      pressure: [
        glo.createTexture(width, height, null),
        glo.createTexture(width, height, null),
      ],
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
      velocityField: [
        glo.createFramebuffer(textures.velocityField[0]),
        glo.createFramebuffer(textures.velocityField[1]),
      ],
    };

    this.framebuffers = framebuffers;
    this.gl = spec.gl;
    this.programs = programs;
    this.textures = textures;
  }

  advectVelocity() {
    const advectProgram = this.programs.advect;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(advectProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  computeDivergence() {
    const divergenceProgram = this.programs.divergence;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(divergenceProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.divergence);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  computePressure() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const textures = this.textures;

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

  subtractPressureGradient() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const subtractPressureGradientProgram = this.programs.subtractPressureGradient;
    const textures = this.textures;

    gl.useProgram(subtractPressureGradientProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[1]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.pressure[0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  advectInput(inputTexture, outputFramebuffer) {
    const advectProgram = this.programs.advect;
    const gl = this.gl;
    const textures = this.textures;

    gl.useProgram(advectProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.velocityField[0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}