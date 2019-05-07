"use strict";

class Vector3 {
  constructor(x, y, z) {
    this.elements = [x, y, z];
  }

  get length() {
    return Math.sqrt(this.squaredLength);
  }

  get squaredLength() {
    const [x, y, z] = this.elements;
    return (x * x) + (y * y) + (z * z);
  }

  get x() {
    return this.elements[0];
  }

  get y() {
    return this.elements[1];
  }

  get z() {
    return this.elements[2];
  }

  static add(a, b) {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  static cross(a, b) {
    return new Vector3(
      (a.y * b.z) - (a.z * b.y),
      (a.z * b.x) - (a.x * b.z),
      (a.x * b.y) - (a.y * b.x),
    );
  }

  static dot(a, b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
  }

  static multiply(s, v) {
    return new Vector3(s * v.x, s * v.y, s * v.z);
  }

  static normalize(v) {
    const s = v.length;
    return new Vector3(v.x / s, v.y / s, v.z / s);
  }

  static subtract(a, b) {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}

export default Vector3;