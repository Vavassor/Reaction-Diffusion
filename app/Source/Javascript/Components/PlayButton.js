export default class PlayButton {
  constructor(spec) {
    let paused = spec.paused;
    if (paused === undefined) {
      paused = false;
    }

    this.onClick = this.onClick.bind(this);

    document
      .getElementById(spec.id)
      .addEventListener("click", this.onClick);

    this.onChange = spec.onChange;
    this.paused = paused;
  }

  onClick(event) {
    const button = event.currentTarget;

    this.paused = !this.paused;

    if (this.paused) {
      button.setAttribute("aria-label", "play");
      button.textContent = "▶";
    } else {
      button.setAttribute("aria-label", "pause");
      button.textContent = "❙❙";
    }

    this.onChange(this.paused);
  }
}