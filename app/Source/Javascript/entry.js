"use strict";

import App, {brushState} from "./app";
import FileSaver from "file-saver";
import Range from "./range";
import Vector3 from "./Vector3";

import "../Stylesheets/main.css";

let app;
let canvas;
let ongoingTouches = [];
let patternPicker;


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
  app.togglePause();

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

function onPickerPointerMove(event) {
  if (!event.pressure) {
    return;
  }

  const rect = patternPicker.getBoundingClientRect();
  const bounds = document.getElementById("pattern-picker-bounds");
  const boundsRect = bounds.getBoundingClientRect();
  const knob = document.getElementById("pattern-picker-knob");
  const knobRect = knob.getBoundingClientRect();
  const paddingLeft = boundsRect.left - rect.left;
  const paddingTop = boundsRect.top - rect.top;
  let x = event.clientX - rect.left - paddingLeft;
  let y = event.clientY - rect.top - paddingTop;
  x = Range.clamp(x, 0, boundsRect.width);
  y = Range.clamp(y, 0, boundsRect.height);
  knob.style.left = (x - (knobRect.width / 2)) + "px";
  knob.style.top = (y - (knobRect.height / 2)) + "px";
  const killRate = Range.lerp(0.045, 0.07, x / boundsRect.width);
  const feedRate = Range.lerp(0.01, 0.1, 1 - y / boundsRect.height);
  app.setRates(killRate, feedRate);
}

function onPointerCancel(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1);
    if (!ongoingTouches.length) {
      app.setBrushState(brushState.UP);
    }
  }
}

function onPointerDown(event) {
  app.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
  app.setBrushState(brushState.DOWN);
  canvas.setPointerCapture(event.pointerId);
}

function onPointerEnter(event) {
  ongoingTouches.push(copyTouch(event));
  app.setBrushState(brushState.HOVERING);
}

function onPointerMove(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1, copyTouch(event));
  }
  app.setBrushState(event.pressure > 0 ? brushState.DOWN : brushState.HOVERING);
  app.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
}

function onPointerOut(event) {
  const index = ongoingTouchIndexById(event.pointerId);
  if (index >= 0) {
    ongoingTouches.splice(index, 1);
    app.setBrushState(brushState.UP);
  }
}

function onPointerUp(event) {
  app.setBrushState(brushState.HOVERING);
  canvas.releasePointerCapture(event.pointerId);
}

function ongoingTouchIndexById(id) {
  return ongoingTouches.findIndex(touch => touch.identifier === id);
}


canvas = document.getElementById("canvas");
app = new App(canvas, 256, 256);
app.start();

canvas.addEventListener("pointercancel", onPointerCancel);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointerenter", onPointerEnter);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerout", onPointerOut);
canvas.addEventListener("pointerup", onPointerUp);


patternPicker = document.getElementById("pattern-picker");

patternPicker.addEventListener("pointerdown", (event) => {
  if (patternPicker.getAttribute("aria-disabled") != "true") {
    onPickerPointerMove(event);
    patternPicker.setPointerCapture(event.pointerId);
  }
});

patternPicker.addEventListener("pointerup", (event) => {
  if (patternPicker.getAttribute("aria-disabled") != "true") {
    patternPicker.releasePointerCapture(event.pointerId);
  }
});

patternPicker.addEventListener("pointermove", (event) => {
  if (patternPicker.getAttribute("aria-disabled") != "true") {
    onPickerPointerMove(event);
  }
});

document
  .getElementById("flow-rate")
  .addEventListener("input", (event) => {
    app.setFlowRate(event.currentTarget.value);
  });

document
  .getElementById("iterations-per-frame")
  .addEventListener("input", (event) => {
    app.setIterationsPerFrame(event.currentTarget.value);
  });

document
  .getElementById("apply-style-map")
  .addEventListener("click", (event) => {
    const toggle = event.currentTarget;
    const checked = toggle.getAttribute("aria-checked") != "true";
    toggle.setAttribute("aria-checked", checked);
    patternPicker.setAttribute("aria-disabled", checked);
    app.setApplyStyleMap(checked);
  });

document
  .getElementById("clear")
  .addEventListener("click", (event) => {
    app.clear();
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