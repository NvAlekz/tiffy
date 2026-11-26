import { MAX_IMAGE_DATA_URL_LENGTH, MAX_SOURCE_IMAGE_BYTES } from './constants';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_DIMENSION = 1280;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
    image.src = src;
  });
}

function compressImage(source, sourceWidth, sourceHeight) {
  let scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  let quality = 0.8;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo procesar la imagen.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/webp', quality);
    if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) {
      return { dataUrl, width, height, mime: 'image/webp' };
    }

    if (quality > 0.55) {
      quality = Math.max(0.55, quality - 0.12);
    } else {
      scale *= 0.82;
    }

    if (Math.round(sourceWidth * scale) < 160 && Math.round(sourceHeight * scale) < 160) {
      break;
    }
  }

  throw new Error('La imagen pesa demasiado incluso después de comprimirla. Prueba con otra.');
}

export async function prepareImage(file) {
  if (!(file instanceof File)) {
    throw new Error('No se ha seleccionado ninguna imagen.');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Formato no compatible. Usa JPG, PNG, WebP, GIF o AVIF.');
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('La imagen supera el límite de 25 MB.');
  }

  if (file.type === 'image/gif') {
    const dataUrl = await readAsDataUrl(file);
    if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) {
      const image = await loadImage(dataUrl);
      return {
        dataUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        mime: 'image/gif',
      };
    }
  }

  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = null;
  }

  if (bitmap) {
    try {
      return compressImage(bitmap, bitmap.width, bitmap.height);
    } finally {
      bitmap.close?.();
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return compressImage(image, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
