export default class SlideSwitch {
  constructor(spec) {
    const slideSwitch = document.getElementById(spec.id);

    this.checked = false;
    this.disabled = false;
    this.onChange = spec.onChange;
    this.slideSwitch = slideSwitch;

    this.onClick = this.onClick.bind(this);

    slideSwitch.addEventListener("click", this.onClick);
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    if (disabled) {
      this.slideSwitch.setAttribute("disabled", "disabled");
    } else {
      this.slideSwitch.removeAttribute("disabled");
    }
  }

  onClick(event) {
    const slide = event.currentTarget;
    this.checked = !this.checked;
    slide.setAttribute("aria-checked", this.checked);
    this.onChange(this.checked);
  }
}