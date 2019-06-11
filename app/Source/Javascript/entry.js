"use strict";

import Color from "./Color";
import ColorControl from "./ColorControl";
import FileSaver from "file-saver";
import * as Range from "./Range";
import SimulationCanvas, {brushState, displayImage} from "./SimulationCanvas";
import Slider2d from "./Slider2d";
import SlideSwitch from "./SlideSwitch";
import Tablist from "./Tablist";
import Vector3 from "./Vector3";

import "../Stylesheets/main.css";

let simulationCanvas;
let canvas;
let ongoingTouches = [];


function copyTouch(touch) {
  return {
    identifier: touch.pointerId,
    pageX: touch.clientX,
    pageY: touch.clientY,
  };
}

function getPositionInCanvas(pageX, pageY) {
  const rect = canvas.getBoundingClientRect();
  const x = pageX - rect.left - (rect.width / 2);
  const y = rect.top - (pageY - (rect.height / 2));
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return new Vector3(scaleX * x, scaleY * y, 0);
}

function onPauseClick(event) {
  simulationCanvas.togglePause();

  const button = event.currentTarget;
  const pause = (button.getAttribute("aria-label") === "pause");
  if (pause) {
    button.setAttribute("aria-label", "play");
    button.textContent = "▶";
  } else {
    button.setAttribute("aria-label", "pause");
    button.textContent = "❙❙";
  }
}

function onPointerCancel(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1);
    if (!ongoingTouches.length) {
      simulationCanvas.setBrushState(brushState.UP);
    }
  }
}

function onPointerDown(event) {
  simulationCanvas.setBrushState(brushState.DOWN);
  simulationCanvas.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
  canvas.setPointerCapture(event.pointerId);
}

function onPointerEnter(event) {
  ongoingTouches.push(copyTouch(event));
  simulationCanvas.setBrushState(brushState.HOVERING);
}

function onPointerMove(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1, copyTouch(event));
  }
  simulationCanvas.setBrushState(event.pressure > 0 ? brushState.DOWN : brushState.HOVERING);
  simulationCanvas.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
}

function onPointerOut(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1);
    simulationCanvas.setBrushState(brushState.UP);
  }
}

function onPointerUp(event) {
  simulationCanvas.setBrushState(brushState.HOVERING);
  simulationCanvas.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
  canvas.releasePointerCapture(event.pointerId);
}

function ongoingTouchIndexById(id) {
  return ongoingTouches.findIndex(touch => touch.identifier === id);
}

// Entrypoint..................................................................

canvas = document.getElementById("canvas");
simulationCanvas = new SimulationCanvas(canvas, 256, 256);
simulationCanvas.start();

canvas.addEventListener("pointercancel", onPointerCancel);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointerenter", onPointerEnter);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerout", onPointerOut);
canvas.addEventListener("pointerup", onPointerUp);

const stylePickerSpec = {
  id: "style-picker",
  boundsId: "style-picker-bounds",
  selectorId: "style-picker-selector",
  onInputChange: (x, y) => {
    const killRate = Range.lerp(0.045, 0.07, x);
    const feedRate = Range.lerp(0.01, 0.1, y);
    simulationCanvas.setRates(killRate, feedRate);
  },
};

const stylePicker = new Slider2d(stylePickerSpec);

document
  .getElementById("flow-rate")
  .addEventListener("input", (event) => {
    simulationCanvas.setFlowRate(event.currentTarget.value);
  });

document
  .getElementById("iterations-per-frame")
  .addEventListener("input", (event) => {
    simulationCanvas.setIterationsPerFrame(event.currentTarget.value);
  });

const applyStyleMap = new SlideSwitch({
  id: "apply-style-map",
  onChange: (checked) => {
    stylePicker.setDisabled(checked);
    simulationCanvas.setApplyStyleMap(checked);
  },
});

const applyOrientationMap = new SlideSwitch({
  id: "apply-orientation-map",
  onChange: (checked) => {
    simulationCanvas.setApplyOrientationMap(checked);
  },
});

const colorA = new ColorControl({
  buttonId: "color-a",
  initialColor: Color.black(),
  onColorChange: (color) => {
    simulationCanvas.setColorA(color);
  },
});

const colorB = new ColorControl({
  buttonId: "color-b",
  initialColor: Color.white(),
  onColorChange: (color) => {
    simulationCanvas.setColorB(color);
  },
});

document
  .getElementById("brush-radius")
  .addEventListener("input", (event) => {
    simulationCanvas.setBrushRadius(event.currentTarget.value);
  });

const tablistSpec = {
  onSelect: (displayImage) => simulationCanvas.setDisplayImage(displayImage),
  tabs: [
    {
      id: "display-orientation-map",
      displayImage: displayImage.ORIENTATION_MAP,
    },
    {
      id: "display-simulation",
      displayImage: displayImage.SIMULATION_STATE,
    },
    {
      id: "display-style-map",
      displayImage: displayImage.STYLE_MAP,
    },
    {
      id: "display-velocity-field",
      displayImage: displayImage.VELOCITY_FIELD,
    },
  ],
};
const tablist = new Tablist(tablistSpec);

document
  .getElementById("clear")
  .addEventListener("click", (event) => {
    simulationCanvas.clear();
  });

document
  .getElementById("download")
  .addEventListener("click", (event) => {
    canvas.toBlob((blob) => {
      FileSaver.saveAs(blob, "Untitled.png");
    }, "image/png");
  });

document
  .getElementById("pause")
  .addEventListener("click", onPauseClick);