export default class ToggleSwitch {
  constructor(spec) {
    const toggleSwitch = document.getElementById(spec.id);

    this.checked = false;
    this.disabled = false;
    this.onChange = spec.onChange;
    this.toggleSwitch = toggleSwitch;

    this.onClick = this.onClick.bind(this);

    toggleSwitch.addEventListener("click", this.onClick);
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.range2d.setAttribute("aria-disabled", disabled);
  }

  onClick(event) {
    const toggle = event.currentTarget;
    this.checked = !this.checked;
    toggle.setAttribute("aria-checked", this.checked);
    this.onChange(this.checked);
  }
}