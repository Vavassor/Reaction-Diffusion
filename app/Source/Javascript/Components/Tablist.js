export default class Tablist {
  constructor(spec) {
    this.onClick = this.onClick.bind(this);
    this.onSelect = spec.onSelect;
    this.tabs = spec.tabs.map((tabSpec) => {
      const tab = {
        displayImage: tabSpec.displayImage,
        element: document.getElementById(tabSpec.id),
      };
      return tab;
    });

    for (const tab of this.tabs) {
      tab.element.addEventListener("click", this.onClick);
    }
  }

  onClick(event) {
    const clickedTab = event.currentTarget;
    for (const tab of this.tabs) {
      const button = tab.element;
      if (button === clickedTab) {
        button.setAttribute("aria-selected", true);
        button.classList.add("tab-selected");
        this.onSelect(tab.displayImage);
      } else {
        button.setAttribute("aria-selected", false);
        button.classList.remove("tab-selected");
      }
    }
  }
}