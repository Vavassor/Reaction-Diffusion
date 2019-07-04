/**
 * @module ImageLoader
 * @desc Image loading utilities.
 */

function createImageBitmapReplacement(data) {
  return new Promise((resolve, reject) => {
    let dataUrl;
    if (data instanceof Blob) {
      dataUrl = URL.createObjectURL(data);
    } else {
      throw new Error("The image source type is not supported.");
    }
    const img = document.createElement("img");
    img.addEventListener("load", (event) => {
      resolve(this);
    });
    img.src = dataUrl;
  });
}

/**
 * Loads an image from a file.
 * 
 * @param {File} file - the image file
 * @return {Promise<ImageBitmap|HTMLImageElement>} - an image
 */
export function loadFromFile(file) {
  if ("createImageBitmap" in window) {
    return window.createImageBitmap(file);
  } else {
    return createImageBitmapReplacement(file);
  }
}