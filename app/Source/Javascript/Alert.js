export default class Alert {
  constructor(spec) {
    this.element = document.getElementById(spec.id);
  }

  show(message) {
    this.element.textContent = message;
    this.element.classList.remove("display-none");
  }
}