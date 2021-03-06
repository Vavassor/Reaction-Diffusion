/** @module Matrix4 */

import Vector3 from "./Vector3";

/** A 4x4 square matrix. */
export default class Matrix4 {
  /**
   * @param {number[]} elements - the elements of the matrix in row-major order
   */
  constructor(elements) {
    this.e = elements;
  }

  get float32Array() {
    return new Float32Array(this.e);
  }

  get transpose() {
    const {e} = this;
    return new Matrix4([
      e[0], e[4], e[8], e[12],
      e[1], e[5], e[9], e[13],
      e[2], e[6], e[10], e[14],
      e[3], e[7], e[11], e[15],
    ]);
  }

  static dilate(dilation) {
    return new Matrix4([
      dilation.x, 0, 0, 0,
      0, dilation.y, 0, 0,
      0, 0, dilation.z, 0,
      0, 0, 0, 1,
    ]);
  }

  static identity() {
    return new Matrix4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  /**
   * Computes a view matrix assuming a right-handed coordinate system.
   * 
   * @param {Vector3} position - the camera position
   * @param {Vector3} target - the position where the camera is looking towards
   * @param {Vector3} worldUp - the world-space up axis
   */
  static lookAtRh(position, target, worldUp) {
    const forward = Vector3.normalize(Vector3.subtract(position, target));
    const right = Vector3.normalize(Vector3.cross(worldUp, forward));
    const up = Vector3.normalize(Vector3.cross(forward, right));
    return Matrix4.view(right, up, forward, position);
  }

  static multiply(a, b) {
    const elements = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let m = 0.0;
        for (let w = 0; w < 4; w++) {
          m += a.e[4 * i + w] * b.e[4 * w + j];
        }
        elements[4 * i + j] = m;
      }
    }

    return new Matrix4(elements);
  }

  /**
   * Computes an orthographic projection assuming a right-handed coordinate system.
   * 
   * @param {number} width - the width of the image plane
   * @param {number} height - the height of the image plane
   * @param {number} nearPlane - the distance from the camera position to the near plane
   * @param {number} farPlane - the distance from the camera position to the far plane
   */
  static orthographicProjectionRh(width, height, nearPlane, farPlane) {
    const negativeDepth = nearPlane - farPlane;

    const elements = [];

    elements[0] = 2 / width;
    elements[1] = 0;
    elements[2] = 0;
    elements[3] = 0;

    elements[4] = 0;
    elements[5] = 2 / height;
    elements[6] = 0;
    elements[7] = 0;

    elements[8] = 0;
    elements[9] = 0;
    elements[10] = 2 / negativeDepth;
    elements[11] = (farPlane + nearPlane) / negativeDepth;

    elements[12] = 0;
    elements[13] = 0;
    elements[14] = 0;
    elements[15] = 1;

    return new Matrix4(elements);
  }

  /**
   * Computes a perspective projection matrix assuming a right-handed coordinate system.
   * 
   * @param {number} fovy - the vertical field of view of the camera
   * @param {number} width - the width of the image plane
   * @param {number} height - the height of the image plane
   * @param {number} nearPlane - the distance from the camera position to the near plane
   * @param {number} farPlane - the distance from the camera position to the far plane
   */
  static perspectiveProjectionRh(fovy, width, height, nearPlane, farPlane) {
    const coty = 1 / Math.tan(fovy / 2);
    const aspectRatio = width / height;
    const negativeDepth = nearPlane - farPlane;

    const elements = [];

    elements[0] = coty / aspectRatio;
    elements[1] = 0;
    elements[2] = 0;
    elements[3] = 0;

    elements[4] = 0;
    elements[5] = coty;
    elements[6] = 0;
    elements[7] = 0;

    elements[8] = 0;
    elements[9] = 0;
    elements[10] = (nearPlane + farPlane) / negativeDepth;
    elements[11] = 2 * nearPlane * farPlane / negativeDepth;

    elements[12] = 0;
    elements[13] = 0;
    elements[14] = -1;
    elements[15] = 0;

    return new Matrix4(elements);
  }

  static translate(translation) {
    return new Matrix4([
      1, 0, 0, translation.x,
      0, 1, 0, translation.y,
      0, 0, 1, translation.z,
      0, 0, 0, 1,
    ]);
  }

  /**
   * Computes a view matrix.
   * 
   * @param {Vector3} xAxis - the X axis basis vector
   * @param {Vector3} yAxis - the Y axis basis vector
   * @param {Vector3} zAxis - the Z axis basis vector
   * @param {Vector3} position - the position of the viewer
   */
  static view(xAxis, yAxis, zAxis, position) {
    const elements = [];

    elements[0] = xAxis.x;
    elements[1] = xAxis.y;
    elements[2] = xAxis.z;
    elements[3] = -Vector3.dot(xAxis, position);

    elements[4] = yAxis.x;
    elements[5] = yAxis.y;
    elements[6] = yAxis.z;
    elements[7] = -Vector3.dot(yAxis, position);

    elements[8] = zAxis.x;
    elements[9] = zAxis.y;
    elements[10] = zAxis.z;
    elements[11] = -Vector3.dot(zAxis, position);

    elements[12] = 0;
    elements[13] = 0;
    elements[14] = 0;
    elements[15] = 1;

    return new Matrix4(elements);
  }
}