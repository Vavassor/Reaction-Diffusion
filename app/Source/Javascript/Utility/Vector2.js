export default class Vector2 {
  constructor(x, y) {
    this.elements = [x, y];
  }

  get length() {
    return Math.sqrt(this.squaredLength);
  }

  get squaredLength() {
    const [x, y] = this.elements;
    return (x * x) + (y * y);
  }

  get x() {
    return this.elements[0];
  }

  get y() {
    return this.elements[1];
  }

  static multiply(s, v) {
    return new Vector2(s * v.x, s * v.y);
  }

  static normalize(v) {
    const s = v.length;
    return new Vector2(v.x / s, v.y / s);
  }

  static zero() {
    return new Vector2(0, 0);
  }
}