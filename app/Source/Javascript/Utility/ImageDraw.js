/**
 * @module ImageDraw
 * @desc Image drawing utilities.
 */

import * as Range from "./Range";

/** Computes a hermite interpolation between two values. */
function smoothstep(a, b, x) {
  const t = Range.clamp(Range.unlerp(a, b, x), 0.0, 1.0);
  return t * t * (3.0 - (2.0 * t));
}

/**
 * Draws a red rectangle with a square of red-green noise in the middle.
 * @param {number} width - the width of the rectangle
 * @param {number} height - the height of the rectangle
 * @return {Float32Array} - an interleaved array of RGBA pixels
 */
export function createCenteredNoiseSquare(width, height) {
  const pattern = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pattern[(width * y) + x] = Math.random() < 0.3;
    }
  }

  const state = new Float32Array(4 * width * height);
  const squareSide = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = 4 * ((width * y) + x);
      
      if (pattern[Math.floor(y / squareSide) * width + Math.floor(x / squareSide)]) {
        state[i] = 0.5 + Math.random() * 0.02 - 0.01;
        state[i + 1] = 0.25 + Math.random() * 0.02 - 0.01;
      } else {
        state[i] = 1.0;
        state[i + 1] = 0;
      }
    }
  }

  return state;
}

/**
 * Draws a white circle on a black square.
 * @param {number} side - the side length of the square
 * @return {Uint8Array} - an interleaved array of RGBA pixels
 */
export function createCircle(side) {
  const pixels = new Uint8Array(4 * side * side);
  const radius = side / 2;

  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const pixelIndex = 4 * ((side * y) + x);
      const deltaX = (x + 0.5) - radius;
      const deltaY = (y + 0.5) - radius;
      const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
      const alpha = smoothstep(radius - 2.0, radius, distance);
      const value = 255 * (1.0 - alpha);
      pixels[pixelIndex] = value;
      pixels[pixelIndex + 1] = value;
      pixels[pixelIndex + 2] = value;
      pixels[pixelIndex + 3] = value;
    }
  }

  return pixels;
}

/**
 * Draws a checker pattern.
 * @param {number} width - the width of the rectangle
 * @param {number} height - the height of the rectangle
 * @param {number} squareWidth - the width of a square
 * @return {Float32Array} - an interleaved array of RGB pixels
 */
export function createChecker(width, height, squareWidth) {
  const pixels = new Float32Array(4 * width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = 4 * ((width * y) + x);
      const value = ((x / squareWidth) % 2) ^ ((y / squareWidth) % 2);
      pixels[pixelIndex] = value;
      pixels[pixelIndex + 1] = value;
      pixels[pixelIndex + 2] = value;
      pixels[pixelIndex + 3] = 1.0;
    }
  }

  return pixels;
}

export function createColorChecker(width, height) {
  const pixels = new Uint8Array(3 * width * height);
  const squareWidth = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = 3 * ((width * y) + x);
      const squareX = Math.floor(x / squareWidth);
      const squareY = Math.floor(y / squareWidth);
      const redCheck = ((squareX % 3) ^ (squareY % 3)) & 1;
      const greenCheck = ((squareX % 3) ^ ((squareY + 1) % 3)) & 1;
      const blueCheck = (((squareX + 1) % 3) ^ (squareY % 3)) & 1;
      pixels[pixelIndex] = 255 * redCheck;
      pixels[pixelIndex + 1] = 255 * greenCheck;
      pixels[pixelIndex + 2] = 255 * blueCheck;
    }
  }

  return pixels;
}

/**
 * Draws a 2D vector field stored in the red and green channels.
 * @param {number} width - the width of the rectangle
 * @param {number} height - the height of the rectangle
 * @return {Uint8Array} - an interleaved array of RGB pixels
 */
export function createVectorField(width, height) {
  const field = new Uint8Array(3 * width * height); 
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = 3 * ((width * y) + x);
      const frequencyX = 2.0 * (1.0 / width);
      const frequencyY = 2.0 * (1.0 / height);
      const directionX = Math.sin(2.0 * Math.PI * frequencyY * y);
      const directionY = Math.sin(2.0 * Math.PI * frequencyX * x);
      field[pixelIndex] = Math.floor(255 * ((0.5 * directionX) + 0.5));
      field[pixelIndex + 1] = Math.floor(255 * ((0.5 * directionY) + 0.5));
    }
  }

  return field;
}

/**
 * Draws a 2D vector field stored in the red and green channels.
 * @param {number} width - the width of the rectangle
 * @param {number} height - the height of the rectangle
 * @return {Float32Array} - an interleaved array of RGBA pixels
 */
export function createVectorFieldFloat32(width, height) {
  const field = new Float32Array(4 * width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = 4 * ((width * y) + x);
      const frequencyX = 2.0 * (1.0 / width);
      const frequencyY = 2.0 * (1.0 / height);
      const directionX = Math.sin(2.0 * Math.PI * frequencyY * y);
      const directionY = Math.sin(2.0 * Math.PI * frequencyX * x);
      field[pixelIndex] = directionX;
      field[pixelIndex + 1] = directionY;
    }
  }

  return field;
}

/**
 * Draws a rectangle of red and green waves.
 * @param {number} width - the width of the rectangle
 * @param {number} height - the height of the rectangle
 * @return {Uint8Array} - an interleaved array of RGB pixels
 */
export function createWaves(width, height) {
  const pattern = new Uint8Array(3 * width * height);
  const side = width / 5;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = 3 * ((width * y) + x);
      const patternX = x / side;
      const patternY = y / side;
      const waveA = 0.25 * (Math.sin(Math.PI * patternX) + Math.sin(Math.PI * patternY)) + 0.5;
      const waveB = 0.25 * (Math.sin(Math.PI * 6.7 * patternX) + Math.sin(Math.PI * 6.7 * patternY)) + 0.5;
      pattern[pixelIndex] = Math.floor(Range.remap(120, 160, 0, 1, waveA));
      pattern[pixelIndex + 1] = Math.floor(255 * waveB);
    }
  }

  return pattern;
}