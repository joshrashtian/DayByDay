/**
 * Picks a representative colour from an image so UI can tint itself to match
 * album art, cover photos and the like.
 *
 * The image is drawn onto a tiny canvas and its pixels averaged, with washed-out
 * (near-grey) pixels down-weighted so a mostly-white sleeve with a red logo
 * still reads as red rather than beige. Returns an `rgb()` string, or `null`
 * when the image cannot be read — cross-origin images without CORS headers
 * taint the canvas, and that is treated as "no tint" rather than an error.
 */

const SAMPLE_SIZE = 16;

const cache = new Map<string, Promise<string | null>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Required for `getImageData` on a cross-origin image; Spotify's CDN sends
    // the permissive CORS header this needs.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
    image.src = url;
  });
}

function averageColor(data: Uint8ClampedArray): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let weightTotal = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.5) continue;

    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    // Saturation-ish: colourful pixels count more than greys, but greys still
    // count a little so a monochrome cover yields a neutral tint, not nothing.
    const chroma = max === 0 ? 0 : (max - min) / max;
    const weight = 0.15 + chroma;

    r += pr * weight;
    g += pg * weight;
    b += pb * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) return null;
  return `rgb(${Math.round(r / weightTotal)} ${Math.round(g / weightTotal)} ${Math.round(b / weightTotal)})`;
}

export function extractDominantColor(url: string): Promise<string | null> {
  const cached = cache.get(url);
  if (cached) return cached;

  const task = (async () => {
    try {
      const image = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return null;
      context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      return averageColor(
        context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data,
      );
    } catch {
      return null;
    }
  })();

  cache.set(url, task);
  return task;
}
