import Range from "./Range";

function smoothstep(a, b, x) {
  const t = Range.clamp(Range.unlerp(a, b, x), 0.0, 1.0);
  return t * t * (3.0 - (2.0 * t));
}

export default {
  createCircle: function(side) {
    const pixels = new Uint8Array(4 * side * side);
    const radius = side / 2;
  
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        const pixelIndex = 4 * ((side * y) + x);
        const deltaX = (x + 0.5) - radius;
        const deltaY = (y + 0.5) - radius;
        const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        const alpha = smoothstep(radius - 2.0, radius, distance);
        pixels[pixelIndex] = 255;
        pixels[pixelIndex + 1] = 255;
        pixels[pixelIndex + 2] = 255;
        pixels[pixelIndex + 3] = 255 * (1.0 - alpha);
      }
    }
  
    return pixels;
  },

  createCenteredNoiseSquare: function(width, height) {
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
  },
  
  createVectorField: function(width, height) {
    const field = new Uint8Array(3 * width * height); 
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = 3 * ((width * y) + x);
        const frequencyX = 2.0 * (1.0 / width);
        const frequencyY = 2.0 * (1.0 / height);
        const directionX = Math.sin(2.0 * Math.PI * frequencyX * x);
        const directionY = Math.sin(2.0 * Math.PI * frequencyY * y);
        field[pixelIndex] = Math.floor(255 * (0.5 * directionX) + 0.5);
        field[pixelIndex + 1] = Math.floor(255 * (0.5 * directionY) + 0.5);
      }
    }
  
    return field;
  },
  
  createWaves: function(width, height) {
    const pattern = new Uint8Array(3 * width * height);
    const side = 50;
    
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
  },
};