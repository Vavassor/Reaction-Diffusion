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
    const simSize = spec.canvasSize;

    const advectFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, advectFsSource);
    const basicVertexShader = glo.createShader(gl.VERTEX_SHADER, basicVsSource);
    const bfeccFragmentShader = glo.createShader(gl.FRAGMENT_SHADER, bfeccFsSource);
    const divergenceShader = glo.createShader(gl.FRAGMENT_SHADER, divergenceFsSource);
    const pressureShader = glo.createShader(gl.FRAGMENT_SHADER, pressureFsSource);
    const subtractPressureGradientShader = glo.createShader(gl.FRAGMENT_SHADER, subtractPressureGradientFsSource);

    const advectProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: advectFragmentShader,
      },
      uniforms: [
        "delta_time",
        "texture_size",
        "input_texture",
        "velocity_field",
        "model_view_projection",
      ],
    });

    const bfeccProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: bfeccFragmentShader,
      },
      uniforms: [
        "velocity_field",
        "compensation_field",
        "model_view_projection",
      ],
    });

    const divergenceProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: divergenceShader,
      },
      uniforms: [
        "delta_time",
        "density",
        "velocity_field",
        "velocity_field_size",
        "model_view_projection",
      ],
    });

    const pressureProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: pressureShader,
      },
      uniforms: [
        "field_size",
        "divergence_field",
        "pressure_field",
        "model_view_projection",
      ],
    });

    const subtractPressureGradientProgram = glo.createShaderProgram({
      shaders: {
        vertex: basicVertexShader,
        fragment: subtractPressureGradientShader,
      },
      uniforms: [
        "delta_time",
        "density",
        "field_size",
        "velocity_field",
        "pressure_field",
        "model_view_projection",
      ],
    });

    advectProgram.use();
    advectProgram.setUniform1f("delta_time", deltaTime);
    advectProgram.setUniform2fv("texture_size", simSize.elements);
    advectProgram.setUniform1i("input_texture", 0);
    advectProgram.setUniform1i("velocity_field", 1);
    advectProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    bfeccProgram.use();
    bfeccProgram.setUniform1i("velocity_field", 0);
    bfeccProgram.setUniform1i("compensation_field", 1);
    bfeccProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    divergenceProgram.use();
    divergenceProgram.setUniform1f("delta_time", deltaTime);
    divergenceProgram.setUniform1f("density", density);
    divergenceProgram.setUniform1i("velocity_field", 0);
    divergenceProgram.setUniform2fv("velocity_field_size", simSize.elements);
    divergenceProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    pressureProgram.use();
    pressureProgram.setUniform2fv("field_size", simSize.elements);
    pressureProgram.setUniform1i("divergence_field", 0);
    pressureProgram.setUniform1i("pressure_field", 1);
    pressureProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    subtractPressureGradientProgram.use();
    subtractPressureGradientProgram.setUniform1f("delta_time", deltaTime);
    subtractPressureGradientProgram.setUniform1f("density", density);
    subtractPressureGradientProgram.setUniform2fv("field_size", simSize.elements);
    subtractPressureGradientProgram.setUniform1i("velocity_field", 0);
    subtractPressureGradientProgram.setUniform1i("pressure_field", 1);
    subtractPressureGradientProgram.setUniformMatrix4fv("model_view_projection", Matrix4.identity().transpose.float32Array);

    const programs = {
      advect: advectProgram,
      bfecc: bfeccProgram,
      divergence: divergenceProgram,
      pressure: pressureProgram,
      subtractPressureGradient: subtractPressureGradientProgram,
    };

    const divergenceFieldSpec = {
      size: simSize,
    };

    const pressureFieldSpec = {
      size: simSize,
    };

    const velocityFieldSpec = {
      contents: ImageDraw.createVectorFieldFloat32(simSize),
      size: simSize,
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

  resize(size) {
    const advectProgram = this.programs.advect;
    const divergenceProgram = this.programs.divergence;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const subtractPressureGradientProgram = this.programs.subtractPressureGradient;
    const textures = this.textures;

    const divergenceContent = ImageDraw.createBlackness(size);
    textures.divergence.update(size, divergenceContent);

    const pressureContent = divergenceContent;
    textures.pressure[0].update(size, pressureContent);
    textures.pressure[1].update(size, pressureContent);

    const velocityContent = ImageDraw.createVectorFieldFloat32(size);
    textures.velocityField[0].update(size, velocityContent);
    textures.velocityField[1].update(size, velocityContent);
    textures.velocityField[2].update(size, velocityContent);

    advectProgram.use();
    advectProgram.setUniform2fv("texture_size", size.elements);
    
    divergenceProgram.use();
    divergenceProgram.setUniform2fv("velocity_field_size", size.elements);

    pressureProgram.use();
    pressureProgram.setUniform2fv("field_size", size.elements);

    subtractPressureGradientProgram.use();
    subtractPressureGradientProgram.setUniform2fv("field_size", size.elements);
  }

  advectVelocity() {
    const advectProgram = this.programs.advect;
    const bfeccProgram = this.programs.bfecc;
    const deltaTime = this.deltaTime;
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const textures = this.textures;

    advectProgram.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
    textures.velocityField[0].bind(0);
    textures.velocityField[0].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[2]);
    advectProgram.setUniform1f("delta_time", -deltaTime);
    textures.velocityField[1].bind(0);
    textures.velocityField[1].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    bfeccProgram.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[1]);
    textures.velocityField[0].bind(0);
    textures.velocityField[2].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    advectProgram.use();
    advectProgram.setUniform1f("delta_time", deltaTime);
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

    divergenceProgram.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.divergence);
    textures.velocityField[2].bind(0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  computePressure() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    const pressureProgram = this.programs.pressure;
    const textures = this.textures;

    pressureProgram.use();

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

    subtractPressureGradientProgram.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
    textures.velocityField[2].bind(0);
    textures.pressure[0].bind(1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  advectInput(inputTexture, outputFramebuffer) {
    const advectProgram = this.programs.advect;
    const gl = this.gl;
    const textures = this.textures;

    advectProgram.use();
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

    displayFieldProgram.use();
    textures.velocityField[0].bind(0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  bindVelocityFramebuffer() {
    const framebuffers = this.framebuffers;
    const gl = this.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.velocityField[0]);
  }
}