"use strict";

import Alert from "./Components/Alert";
import Color from "./Utility/Color";
import ColorControl from "./Components/ColorControl";
import FileSaver from "file-saver";
import * as Range from "./Utility/Range";
import SimulationCanvas, {brushState, displayImage} from "./Components/SimulationCanvas";
import Slider2d from "./Components/Slider2d";
import SlideSwitch from "./Components/SlideSwitch";
import Tablist from "./Components/Tablist";
import Vector3 from "./Utility/Vector3";

import "../Stylesheets/main.css";
import Vector2 from "./Utility/Vector2";

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

function onCanvasSizeChange(event) {
  const button = event.currentTarget;
  const checked = button.checked;
  if (checked) {
    const width = parseInt(button.value);
    const height = width;
    const size = new Vector2(width, height);
    simulationCanvas.resize(size);
  }
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

const canvasAlert = new Alert({
  id: "canvas-alert",
});

canvas = document.getElementById("canvas");
try {
  simulationCanvas = new SimulationCanvas(canvas, 256, 256);
} catch (exception) {
  canvasAlert.show(exception);
}

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

const applyFlowMap = new SlideSwitch({
  id: "apply-flow-map",
  onChange: (checked) => {
    simulationCanvas.setApplyFlowMap(checked);
  },
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

const backgroundColor = new ColorControl({
  buttonId: "background-color",
  initialColor: Color.black(),
  onColorChange: (color) => {
    simulationCanvas.setBackgroundColor(color);
  },
});

const brushColor = new ColorControl({
  buttonId: "brush-color",
  initialColor: Color.black(),
  onColorChange: (color) => {
    simulationCanvas.setBrushColor(color);
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
      id: "display-ink",
      displayImage: displayImage.INK,
    },
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

document
  .getElementById("canvas-size-small")
  .addEventListener("change", onCanvasSizeChange);

document
  .getElementById("canvas-size-large")
  .addEventListener("change", onCanvasSizeChange);