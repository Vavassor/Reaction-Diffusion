"use strict";

/**
 * Constrains a value to an interval.
 * 
 * @param {number} x - the value to constrain
 * @param {number} min - the lower end of the range
 * @param {number} max - the upper end of the range
 * @return {number}
 */
function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

/**
 * Linearly interpolates between two numbers.
 * 
 * @param {number} a - the first number
 * @param {number} b - the second number
 * @param {number} t - the fraction to interpolate between the numbers
 * @return {number} a number between the other two
 */
function lerp(a, b, t) {
  return ((1 - t) * a) + (t * b);
}

/**
 * Remaps a value in one interval to a value another inverval.
 * 
 * @param {number} a0 - the lower end of the ending interval
 * @param {number} b0 - the upper end of the ending interval
 * @param {number} a1 - the lower end of the starting interval
 * @param {number} b1 - the upper end of the starting interval
 * @param {number} t - the value in the starting interval
 */
function remap(a0, b0, a1, b1, t) {
  return lerp(a0, b0, unlerp(a1, b1, t));
}

/**
 * Computes the fraction between two numbers of a value between them.
 * 
 * @param {number} a - the lower end of the interval
 * @param {number} b - the upper end of the interval
 * @param {number} t - the value within the interval
 * @return {number} a fraction between the two numbers
 */
function unlerp(a, b, t) {
  return (t - a) / (b - a);
}

/** Utilities for numeric ranges. */
export default {
  clamp: clamp,
  lerp: lerp,
  remap: remap,
  unlerp: unlerp,
};