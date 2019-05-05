"use strict";

import App from "./app";
import Vector3 from "./Vector3";

let app;
let canvas;
let ongoingTouches = [];


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

function onMouseMove(event) {
  app.setBrushPosition(getPositionInCanvas(event.clientX, event.clientY));
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

document
  .getElementById("feed-rate")
  .addEventListener("input", (event) => {
    app.setFeedRate(event.currentTarget.value);
  });

document
  .getElementById("kill-rate")
  .addEventListener("input", (event) => {
    app.setKillRate(event.currentTarget.value);
  });

canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("touchcancel", onTouchCancel);
canvas.addEventListener("touchend", onTouchEnd);
canvas.addEventListener("touchmove", onTouchMove);
canvas.addEventListener("touchstart", onTouchStart);