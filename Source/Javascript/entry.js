"use strict";

import App from "./app";
import Vector3 from "./Vector3";

const canvas = document.getElementById("canvas");
const app = new App(canvas, 256, 256);
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

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left - (rect.width / 2);
  const y = rect.top - (event.clientY - (rect.height / 2));
  app.moveBoy(new Vector3(x, y, 0));
});