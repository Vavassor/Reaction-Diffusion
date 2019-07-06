/** @module ShaderProgram */

/** A program in WebGL. */
export default class ShaderProgram {
  constructor(gl, spec) {
    const handle = spec.handle;
    
    let uniformLocations = {};
    for (const uniformName of spec.uniforms) {
      uniformLocations[uniformName] = gl.getUniformLocation(handle, uniformName);
    }

    this.gl = gl;
    this.handle = handle;
    this.uniformLocations = uniformLocations;
  }

  setUniform1f(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    gl.uniform1f(uniformLocations[name], value);
  }

  setUniform1i(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    gl.uniform1i(uniformLocations[name], value);
  }

  setUniform2fv(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    gl.uniform2fv(uniformLocations[name], value);
  }

  setUniformMatrix4fv(name, value) {
    const gl = this.gl;
    const uniformLocations = this.uniformLocations;
    gl.uniformMatrix4fv(uniformLocations[name], false, value);
  }

  use() {
    const gl = this.gl;
    const handle = this.handle;
    gl.useProgram(handle);
  }
}