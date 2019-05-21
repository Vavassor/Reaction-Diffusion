export default class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
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
}