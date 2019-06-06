export default class FixedHistory {
  constructor(cap) {
    this.cap = cap;
    this.count = 0;
    this.elements = [];
    this.index = 0;
  }

  add(element) {
    if (!element) {
      throw Error("element nonexistant");
    }
    const nextIndex = (this.index + 1) % this.cap;
    this.elements[nextIndex] = element;
    this.index = nextIndex;
    this.count = Math.min(this.count + 1, this.cap);
  }

  getCurrent() {
    return this.elements[this.index];
  }

  getOffset(offset) {
    const mod = (x, n) => (x % n + n) % n;
    const index = mod(this.index - offset, this.cap);
    return this.elements[index];
  }
}