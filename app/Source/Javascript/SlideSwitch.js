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
    const slideSwitch = this.slideSwitch;
    if (disabled) {
      slideSwitch.setAttribute("disabled", "disabled");
      slideSwitch.removeEventListener("click");
    } else {
      slideSwitch.removeAttribute("disabled");
      slideSwitch.addEventListener("click", this.onClick);
    }
  }

  onClick(event) {
    const slide = event.currentTarget;
    this.checked = !this.checked;
    slide.setAttribute("aria-checked", this.checked);
    this.onChange(this.checked);
  }
}