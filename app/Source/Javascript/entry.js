"use strict";

import App from "./app";
import Range from "./range";
import Vector3 from "./Vector3";

import "../Stylesheets/main.css";

let app;
let canvas;
let ongoingTouches = [];
let patternPicker;


function copyTouch(touch) {
  return {
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
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

function onMouseDown(event) {
  if (event.button === 0) {
    app.setBrushDown(true);
  }
}

function onMouseLeave(event) {
  app.setBrushDown(false);
}

function onMouseMove(event) {
  app.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
}

function onMouseUp(event) {
  if (event.button === 0) {
    app.setBrushDown(false);
  }
}

function onPointerMove(event) {
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

function onTouchCancel(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      ongoingTouches.splice(index, 1);
      if (!ongoingTouches.length) {
        app.setBrushDown(false);
      }
    }
  }
}

function onTouchEnd(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      ongoingTouches.splice(index, 1);
      if (!ongoingTouches.length) {
        app.setBrushDown(false);
      }
    }
  }
}

function onTouchMove(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      app.setBrushPosition(getPositionInCanvas(touch.pageX, touch.pageY));
      app.setBrushDown(true);
      ongoingTouches.splice(index, 1, copyTouch(touch));
    }
  }
}

function onTouchStart(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    ongoingTouches.push(copyTouch(touch));
  }
}

function ongoingTouchIndexById(id) {
  return ongoingTouches.findIndex(touch => touch.identifier === id);
}


canvas = document.getElementById("canvas");
app = new App(canvas, 256, 256);
app.start();

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseleave", onMouseLeave);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("touchcancel", onTouchCancel);
canvas.addEventListener("touchend", onTouchEnd);
canvas.addEventListener("touchmove", onTouchMove);
canvas.addEventListener("touchstart", onTouchStart);

patternPicker = document.getElementById("pattern-picker");

patternPicker.addEventListener("pointerdown", (event) => {
  onPointerMove(event);
  patternPicker.setPointerCapture(event.pointerId);
});

patternPicker.addEventListener("pointerup", (event) => {
  patternPicker.releasePointerCapture(event.pointerId);
});

patternPicker.addEventListener("pointermove", onPointerMove);

document
  .getElementById("clear")
  .addEventListener("click", (event) => {
    app.clear();
  });