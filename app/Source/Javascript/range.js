"use strict";

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function lerp(a, b, t) {
  return ((1 - t) * a) + (t * b);
}

function remap(a0, b0, a1, b1, t) {
  return lerp(a0, b0, unlerp(a1, b1, t));
}

function unlerp(a, b, t) {
  return (t - a) / (b - a);
}


export default {
  clamp: clamp,
  lerp: lerp,
  remap: remap,
  unlerp: unlerp,
};