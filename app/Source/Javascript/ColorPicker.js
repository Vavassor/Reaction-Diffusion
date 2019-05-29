import Color from "./Color";
import Range2d from "./Range2d";

export default class ColorPicker {
  constructor(spec) {
    let hueSlider;
    let svPicker;

    if (spec.anchor) {
      const colorPicker = document.createElement("div");

      const svPickerSpec = {
        anchor: colorPicker,
        onInputChange: (x, y) => this.onSvChange(x, y),
      };
      svPicker = new Range2d(svPickerSpec);
      svPicker.setBoundsClass("sv-picker-bounds");

      hueSlider = document.createElement("input");
      hueSlider.classList.add("hue-slider", "form-control");
      hueSlider.setAttribute("type", "range");
      hueSlider.setAttribute("value", 0);
      hueSlider.setAttribute("min", 0);
      hueSlider.setAttribute("max", 360);
      hueSlider.setAttribute("step", "any");

      colorPicker.appendChild(hueSlider);

      spec.anchor.appendChild(colorPicker);
    } else {
      const svPickerSpec = {
        id: spec.svPicker.id,
        boundsId: spec.svPicker.boundsId,
        selectorId: spec.svPicker.selectorId,
        onInputChange: (x, y) => this.onSvChange(x, y),
      };
      svPicker = new Range2d(svPickerSpec);

      hueSlider = document.getElementById(spec.hueSliderId);
    }

    this.hue = 0;
    this.hueSlider = hueSlider;
    this.onInputChange = spec.onInputChange,
    this.saturation = 0;
    this.svPicker = svPicker;
    this.value = 0;

    this.hueSlider.addEventListener("input", (event) => {
      this.onHueChange(event.currentTarget.value);
    });
  }
  
  focus() {
    this.svPicker.focus();
  }

  onHueChange(x) {
    const hue = x;
    this.hue = hue;
    const svColor = Color.fromHsv(hue, 1, 1);
    this.svPicker.setBackgroundColor(svColor);
    const color = Color.fromHsv(hue, this.saturation, this.value);
    this.svPicker.setSelectorColor(color);
    this.onInputChange(color);
  }

  onSvChange(x, y) {
    const saturation = x;
    const value = y;
    this.saturation = saturation;
    this.value = value;
    const color = Color.fromHsv(this.hue, saturation, value);
    this.svPicker.setSelectorColor(color);
    this.onInputChange(color);
  }

  setColor(color) {
    const parts = Color.toHsv(color);
    const hue = parts.hue;
    const saturation = parts.saturation;
    const value = parts.value;
    const svColor = Color.fromHsv(hue, 1, 1);

    this.hue = hue;
    this.saturation = saturation;
    this.value = value;
    this.hueSlider.setAttribute("value", hue);
    this.svPicker.setSelectorColor(color);
    this.svPicker.setBackgroundColor(svColor);
    this.svPicker.setSelectorPosition(saturation, value);
  }
}