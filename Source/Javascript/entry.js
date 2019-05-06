"use strict";

import App from "./app";
import Vector3 from "./Vector3";

import "../Stylesheets/main.css";

let app;
let canvas;
let ongoingTouches = [];
let patternPicker;


function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

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
  return new Vector3(x, y, 0);
}

function lerp(a, b, t) {
  return ((1 - t) * a) + (t * b);
}

function onMouseMove(event) {
  app.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
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
  x = clamp(x, 0, boundsRect.width);
  y = clamp(y, 0, boundsRect.height);
  knob.style.left = (x - (knobRect.width / 2)) + "px";
  knob.style.top = (y - (knobRect.height / 2)) + "px";
  const killRate = lerp(0.045, 0.07, x / boundsRect.width);
  const feedRate = lerp(0.01, 0.1, 1 - y / boundsRect.height);
  app.setFeedRate(feedRate);
  app.setKillRate(killRate);
}

function onTouchCancel(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      ongoingTouches.splice(index, 1);
    }
  }
}

function onTouchEnd(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      ongoingTouches.splice(index, 1);
    }
  }
}

function onTouchMove(event) {
  event.preventDefault();

  for (const touch of event.changedTouches) {
    const index = ongoingTouchIndexById(touch.identifier);
    if (index >= 0) {
      app.setBrushPosition(getPositionInCanvas(touch.pageX, touch.pageY));
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

canvas.addEventListener("mousemove", onMouseMove);
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