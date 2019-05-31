import Range from "./range";

export default class Range2d {
  constructor(spec) {
    let bounds;
    let range2d;
    let selector;

    if (spec.anchor) {
      range2d = document.createElement("div");
      range2d.classList.add("range-2d");
      range2d.setAttribute("tabindex", "0");

      const box = document.createElement("div");
      box.classList.add("range-2d-box");
      range2d.appendChild(box);

      bounds = document.createElement("div");
      bounds.classList.add("range-2d-bounds");
      box.appendChild(bounds);

      selector = document.createElement("div");
      selector.classList.add("range-2d-selector");
      bounds.appendChild(selector);

      spec.anchor.appendChild(range2d);
    } else {
      bounds = document.getElementById(spec.boundsId);
      range2d = document.getElementById(spec.id);
      selector = document.getElementById(spec.selectorId);
    }

    if (spec.label) {
      range2d.setAttribute("aria-label", spec.label);
    }

    this.bounds = bounds;
    this.disabled = false;
    this.onInputChange = spec.onInputChange;
    this.range2d = range2d;
    this.selector = selector;

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

    range2d.addEventListener("keydown", (event) => {
      if (!this.disabled) {
        let translationX = 0;
        let translationY = 0;
        switch (event.key) {
          case "ArrowDown":
            translationY++;
            break;
          case "ArrowLeft":
            translationX--;
            break;
          case "ArrowRight":
            translationX++;
            break;
          case "ArrowUp":
            translationY--;
            break;
        }
        if (translationX || translationY) {
          event.preventDefault();
          const stepAmount = 0.05;
          translationX *= stepAmount;
          translationY *= stepAmount;
          this.translateSelector(translationX, translationY);
        }
      }
    });
  }

  focus() {
    this.range2d.focus();
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

    this.onInputChange(x / boundsRect.width, 1 - y / boundsRect.height);
  }

  setBackgroundColor(color) {
    this.bounds.style.backgroundColor = `#${color.toHex()}`;
  }

  setBoundsClass(className) {
    this.bounds.classList.add(className);
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.range2d.setAttribute("aria-disabled", disabled);
  }

  setSelectorColor(color) {
    this.selector.style.backgroundColor = `#${color.toHex()}`;
  }

  setSelectorPosition(positionX, positionY) {
    const bounds = this.bounds;
    const knob = this.selector;

    const boundsRect = bounds.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    let x = boundsRect.width * positionX;
    let y = boundsRect.height * (1 - positionY);
    knob.style.left = (x - (knobRect.width / 2)) + "px";
    knob.style.top = (y - (knobRect.height / 2)) + "px";
  }

  translateSelector(translationX, translationY) {
    const bounds = this.bounds;
    const knob = this.selector;
    const range2d = this.range2d;

    const rect = range2d.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    const paddingLeft = boundsRect.left - rect.left;
    const paddingTop = boundsRect.top - rect.top;
    const offsetX = translationX * boundsRect.width;
    const offsetY = translationY * boundsRect.height;
    let x = knobRect.left + (knobRect.width / 2) - rect.left - paddingLeft + offsetX;
    let y = knobRect.top + (knobRect.height / 2) - rect.top - paddingTop + offsetY;
    x = Range.clamp(x, 0, boundsRect.width);
    y = Range.clamp(y, 0, boundsRect.height);
    
    knob.style.left = (x - (knobRect.width / 2)) + "px";
    knob.style.top = (y - (knobRect.height / 2)) + "px";

    this.onInputChange(x / boundsRect.width, 1 - y / boundsRect.height);
  }
}