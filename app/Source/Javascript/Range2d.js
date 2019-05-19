import Range from "./range";

export default class Range2d {
  constructor(id, boundsId, selectorId, onInputChange) {
    const range2d = document.getElementById(id);

    this.bounds = document.getElementById(boundsId);
    this.disabled = false;
    this.onInputChange = onInputChange;
    this.range2d = range2d;
    this.selector = document.getElementById(selectorId);

    range2d.addEventListener("pointerdown", (event) => {
      if (!this.disabled) {
        this.onPointerMove(event);
        range2d.setPointerCapture(event.pointerId);
      }
    });

    range2d.addEventListener("pointerup", (event) => {
      if (!this.disabled) {
        range2d.releasePointerCapture(event.pointerId);
      }
    });

    range2d.addEventListener("pointermove", (event) => {
      if (!this.disabled) {
        this.onPointerMove(event);
      }
    });
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.range2d.setAttribute("aria-disabled", disable);
  }

  onPointerMove(event) {
    if (!event.pressure) {
      return;
    }

    const bounds = this.bounds;
    const knob = this.selector;
    const range2d = this.range2d;
  
    const rect = range2d.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    const paddingLeft = boundsRect.left - rect.left;
    const paddingTop = boundsRect.top - rect.top;
    let x = event.clientX - rect.left - paddingLeft;
    let y = event.clientY - rect.top - paddingTop;
    x = Range.clamp(x, 0, boundsRect.width);
    y = Range.clamp(y, 0, boundsRect.height);
    knob.style.left = (x - (knobRect.width / 2)) + "px";
    knob.style.top = (y - (knobRect.height / 2)) + "px";

    this.onInputChange(x / boundsRect.width, 1 - y / boundsRect.height)
  }
}