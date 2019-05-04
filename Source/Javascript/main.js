"use strict";

import App from "./app";

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