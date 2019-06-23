/**
 * @module Range
 * @desc Utilities for numeric ranges.
 */

/**
 * Constrains a value to an interval.
 * 
 * @param {number} x - the value to constrain
 * @param {number} min - the lower end of the range
 * @param {number} max - the upper end of the range
 * @return {number}
 */
export function clamp(x, min, max) {
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
export function lerp(a, b, t) {
  return ((1 - t) * a) + (t * b);
}

/**
 * Rounds an unsigned 32-bit integer up to the nearest power of two.
 * 
 * @param {number} x - an unsigned 32-bit integer
 * @return {number} the smallest power of two larger than the given number
 */
export function nextPowerOfTwoUint32(x) {
  if (x === 0) {
    return 1;
  }
  x--;
  x |= x >> 1;
  x |= x >> 2;
  x |= x >> 4;
  x |= x >> 8;
  x |= x >> 16;
  return x + 1;
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
export function remap(a0, b0, a1, b1, t) {
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
export function unlerp(a, b, t) {
  return (t - a) / (b - a);
}
