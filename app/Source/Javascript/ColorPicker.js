import Color from "./Color";
import Range2d from "./Range2d";

export default class ColorPicker {
  constructor(spec) {
    this.hue = 0;
    this.hueSlider = document.getElementById(spec.hueSliderId);
    this.onInputChange = spec.onInputChange,
    this.onSvChange = this.onSvChange.bind(this);
    this.saturation = 0;
    this.svPicker = new Range2d(
      spec.svPicker.id,
      spec.svPicker.boundsId,
      spec.svPicker.selectorId,
      this.onSvChange,
    );
    this.value = 0;

    this.hueSlider.addEventListener("input", (event) => {
      this.onHueChange(event.currentTarget.value);
    });
  }

  onHueChange(x) {
    const hue = x;
    this.hue = hue;
    const svColor = Color.fromHsv(hue, 1, 1);
    console.log(hue);
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
}