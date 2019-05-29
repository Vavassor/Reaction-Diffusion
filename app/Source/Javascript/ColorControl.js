import ColorPicker from "./ColorPicker";

export default class ColorControl {
  constructor(spec) {
    this.onColorChange = spec.onColorChange;
    this.color = spec.initialColor;
    this.onClick = this.onClick.bind(this);

    document
      .getElementById(spec.buttonId)
      .addEventListener("click", this.onClick);
  }

  onClick(event) {
    const button = event.currentTarget;
    this.openPopover(button);
  }

  openPopover(button) {
    const popover = document.createElement("div");
    popover.classList.add("popover");
  
    popover.addEventListener("focusout", (event) => {
      if (!popover.contains(event.relatedTarget)) {
        button.parentElement.removeChild(popover);
      }
    });
  
    const spec = {
      anchor: popover,
      onInputChange: (color) => {
        this.color = color;
        this.onColorChange(color);
        button.style.backgroundColor = `#${color.toHex()}`;
      },
    };
    const picker = new ColorPicker(spec);
  
    button.insertAdjacentElement("afterend", popover);
  
    picker.setColor(this.color);
    picker.focus();
  }
}