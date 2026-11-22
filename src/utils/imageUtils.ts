const MAX_ANALYSIS_BYTES = 2.8 * 1024 * 1024;

async function resizeDataUrl(
  dataUrl: string,
  maxDimension: number,
  quality: number
): Promise<{ imageBase64: string; mimeType: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Unable to load image for resizing.'));
    element.src = dataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize canvas context for image resizing.');
  }

  ctx.drawImage(img, 0, 0, width, height);
  const resized = canvas.toDataURL('image/jpeg', quality);
  return {
    mimeType: 'image/jpeg',
    imageBase64: resized.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ''),
  };
}

/**
 * Converts an image URL or data URI into a base64 payload suitable for Vercel Serverless
 * Function limits (<= 4.5 MB) while preserving text legibility for Gemini extraction.
 */
export async function imageSrcToPayload(
  imageUrl: string,
  fallbackMimeType = 'image/jpeg'
): Promise<{ imageBase64: string; mimeType: string }> {
  let dataUrl = imageUrl;

  if (!dataUrl.startsWith('data:')) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Could not load the selected announcement image.');
    }
    const blob = await response.blob();
    const detectedType = blob.type || fallbackMimeType;

    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to encode image for analysis.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image bytes.'));
      reader.readAsDataURL(blob);
    });

    if (!dataUrl.startsWith('data:image/')) {
      const base64Only = dataUrl.split(',')[1] || '';
      dataUrl = `data:${detectedType};base64,${base64Only}`;
    }
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Unsupported image data URL format.');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const estimatedBytes = Math.floor((base64.length * 3) / 4);

  if (estimatedBytes > MAX_ANALYSIS_BYTES) {
    return resizeDataUrl(dataUrl, 1600, 0.85);
  }

  return { imageBase64: base64, mimeType };
}

/**
 * Compresses custom uploaded data URLs into compact thumbnails when needed.
 */
export async function compressImageForFirestore(imageUrl: string | null): Promise<string> {
  if (!imageUrl) return '';
  if (!imageUrl.startsWith('data:')) {
    return imageUrl.slice(0, 250000);
  }
  if (imageUrl.length <= 120000) {
    return imageUrl;
  }

  try {
    const { imageBase64 } = await resizeDataUrl(imageUrl, 560, 0.65);
    const compressed = `data:image/jpeg;base64,${imageBase64}`;
    return compressed.length <= 240000 ? compressed : '';
  } catch {
    return '';
  }
}
