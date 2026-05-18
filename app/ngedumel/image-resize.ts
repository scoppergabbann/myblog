/**
 * Resize an image File to fit within maxDimension (width or height),
 * preserving aspect ratio. Returns a new File (JPEG, quality 0.85).
 *
 * Skips processing for GIF (preserve animation) and SVG (vector, no resize).
 * Skips if image is already smaller than maxDimension.
 *
 * Also returns intrinsic dimensions of the original for DB storage.
 */
export async function resizeImage(
  file: File,
  maxDimension = 2000
): Promise<{ file: File; width: number; height: number }> {
  // Don't process types that shouldn't be resized
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    const dims = await getImageDimensions(file);
    return { file, width: dims.width, height: dims.height };
  }

  const dims = await getImageDimensions(file);
  const { width: origW, height: origH } = dims;

  // Already small enough? Return original
  if (origW <= maxDimension && origH <= maxDimension) {
    return { file, width: origW, height: origH };
  }

  // Calculate target dimensions
  const ratio = origW / origH;
  let targetW: number;
  let targetH: number;
  if (origW > origH) {
    targetW = maxDimension;
    targetH = Math.round(maxDimension / ratio);
  } else {
    targetH = maxDimension;
    targetW = Math.round(maxDimension * ratio);
  }

  // Draw on canvas
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Export as JPEG (best compression for photos). If original was PNG with
  // transparency, this loses transparency — but for ngedumel photos that's fine.
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.85
    );
  });

  const resized = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '.jpg'),
    { type: 'image/jpeg', lastModified: Date.now() }
  );

  return { file: resized, width: targetW, height: targetH };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
}
