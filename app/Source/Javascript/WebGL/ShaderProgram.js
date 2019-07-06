/** @module ShaderProgram */

/** A program in WebGL. */
export default class ShaderProgram {
  constructor(glo, spec) {
    const gl = glo.gl;
    const fragmentShader = spec.shaders.fragment;
    const vertexShader = spec.shaders.vertex;
    
    const handle = glo.createAndLinkProgram(vertexShader, fragmentShader);
    
    let uniformLocations = {};
    for (const uniformName of spec.uniforms) {
      uniformLocations[uniformName] = gl.getUniformLocation(handle, uniformName);
    }

    this.gl = gl;
    this.handle = handle;
    this.uniformLocations = uniformLocations;
  }

  assertUniformExists(name) {
    const uniformLocations = this.uniformLocations;
    if (!uniformLocations.hasOwnProperty(name)) {
      throw new Error(`The uniform ${name} does not exist.`);
    }
  }

  setUniform1f(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    this.assertUniformExists(name);
    gl.uniform1f(uniformLocations[name], value);
  }

  setUniform1i(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    this.assertUniformExists(name);
    gl.uniform1i(uniformLocations[name], value);
  }

  setUniform2fv(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    this.assertUniformExists(name);
    gl.uniform2fv(uniformLocations[name], value);
  }

  setUniform4fv(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    this.assertUniformExists(name);
    gl.uniform4fv(uniformLocations[name], value);
  }

  setUniformMatrix4fv(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    this.assertUniformExists(name);
    gl.uniformMatrix4fv(uniformLocations[name], false, value);
  }

  use() {
    const gl = this.gl;
    const handle = this.handle;
    gl.useProgram(handle);
  }
}