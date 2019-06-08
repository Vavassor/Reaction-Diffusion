export default class Color {
  /**
   * @param {number} r - the red component in <0, 1>
   * @param {number} g - the green component in <0, 1>
   * @param {number} b - the blue component in <0, 1>
   */
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toArray() {
    return [this.r, this.g, this.b];
  }

  toHex() {
    const r = Math.floor(255 * this.r);
    const g = Math.floor(255 * this.g);
    const b = Math.floor(255 * this.b);
    return r.toString(16).padStart(2, "0")
        + g.toString(16).padStart(2, "0")
        + b.toString(16).padStart(2, "0");
  }

  static black() {
    return new Color(0, 0, 0);
  }
  
  /**
   * Converts a color from HSV to RGB color space.
   * 
   * @param {number} hue - the hue in degrees in <0, 360>
   * @param {number} saturation - the saturation in <0, 1>
   * @param {number} value - the value in <0, 1>
   * @return {Color} a color
   */
  static fromHsv(hue, saturation, value) {
    const h = hue / 60;
    const s = saturation;
    const v = value;
    const integer = Math.floor(h);
    const fraction = h - integer;
    const p = v * (1 - s);
    const q = v * (1 - fraction * s);
    const t = v * (1 - (1 - fraction) * s);
    const sector = integer % 6;
    const r = [v, q, p, p, t, v][sector];
    const g = [t, v, v, q, p, p][sector];
    const b = [p, p, t, v, v, q][sector];
    return new Color(r, g, b);
  }

  static toHsv(color) {
    const r = color.r;
    const g = color.g;
    const b = color.b;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const value = max;

    const d = max - min;
    const saturation = (max === 0) ? 0 : d / max;

    let hue = max;
    if (max === min) {
      hue = 0;
    } else {
      switch (max) {
        case r:
          hue = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / d + 2;
          break;
        case b:
          hue = (r - g) / d + 4;
          break;
      }
      hue *= 60;
    }

    return {
      hue,
      saturation,
      value,
    };
  }

  static white() {
    return new Color(1, 1, 1);
  }
}