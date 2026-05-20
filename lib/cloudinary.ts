import 'server-only';

/**
 * Cloudinary server-side upload + delete via REST API.
 * No SDK dependency — plain fetch to keep bundle lean.
 *
 * Env vars required:
 *   CLOUDINARY_CLOUD_NAME    e.g. "dxyz123abc"
 *   CLOUDINARY_API_KEY       e.g. "123456789012345"
 *   CLOUDINARY_API_SECRET    (keep server-only, never expose to client)
 *   CLOUDINARY_UPLOAD_PRESET e.g. "bbs-ngedumel"
 */

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }

  return { cloudName, apiKey, apiSecret, uploadPreset };
}

// =============================================================================
// Types
// =============================================================================

export type CloudinaryUploadResult =
  | {
      ok: true;
      publicId: string;
      url: string;        // https://res.cloudinary.com/...
      width: number | null;
      height: number | null;
    }
  | { ok: false; error: string };

export type CloudinaryDeleteResult =
  | { ok: true }
  | { ok: false; error: string };

// =============================================================================
// Upload
// =============================================================================

/**
 * Upload a file buffer to Cloudinary via signed upload.
 *
 * @param buffer    Raw file bytes
 * @param mimeType  MIME type of the file (e.g. "image/jpeg", "application/pdf")
 * @param folder    Cloudinary folder path (e.g. "ngedumel/images")
 * @param resourceType  'image' for photos, 'raw' for documents
 */
export async function cloudinaryUpload(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  resourceType: 'image' | 'raw' = 'image',
  originalFilename?: string  // preserve extension for raw files
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getConfig();

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // For raw files (documents), build a public_id that preserves the extension.
  // This is critical: Cloudinary serves the file with the correct Content-Type
  // based on the extension in public_id.
  // e.g. public_id "ngedumel/files/abc123.pdf" → Content-Type: application/pdf
  let publicIdOverride: string | undefined;
  if (resourceType === 'raw' && originalFilename) {
    const ext = originalFilename.includes('.')
      ? originalFilename.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
      : '';
    // Random 12-char hex prefix to avoid collisions
    const { randomBytes } = await import('crypto');
    const rand = randomBytes(6).toString('hex');
    publicIdOverride = ext
      ? `${folder}/${rand}.${ext}`
      : `${folder}/${rand}`;
  }

  // Build params to sign (alphabetical order, no api_key / file / resource_type)
  const paramsToSign: Record<string, string> = {
    folder,
    timestamp,
  };
  if (publicIdOverride) {
    paramsToSign.public_id = publicIdOverride;
    // When public_id is set, folder is implicit — remove to avoid conflict
    delete paramsToSign.folder;
  }
  if (uploadPreset) {
    paramsToSign.upload_preset = uploadPreset;
  }

  // Signature: SHA-1 of "key1=val1&key2=val2...SECRET"
  const signaturePayload =
    Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&') + apiSecret;

  const { createHash } = await import('crypto');
  const sig = createHash('sha1').update(signaturePayload).digest('hex');

  // Build multipart form
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }));
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', sig);
  if (publicIdOverride) {
    form.append('public_id', publicIdOverride);
  } else {
    form.append('folder', folder);
  }
  if (uploadPreset) form.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: form,
    });

    const json = await res.json();

    if (!res.ok) {
      console.error('[cloudinary.upload] error response', json);
      return {
        ok: false,
        error: json?.error?.message || `HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      publicId: json.public_id as string,
      url: json.secure_url as string,
      width: (json.width as number) || null,
      height: (json.height as number) || null,
    };
  } catch (err) {
    console.error('[cloudinary.upload] exception', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

// =============================================================================
// Delete
// =============================================================================

/**
 * Delete a file from Cloudinary by public_id.
 * resource_type must match what was used during upload.
 */
export async function cloudinaryDelete(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<CloudinaryDeleteResult> {
  const { cloudName, apiKey, apiSecret } = getConfig();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const { createHash } = await import('crypto');
  const sig = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', sig);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;

  try {
    const res = await fetch(endpoint, { method: 'POST', body: form });
    const json = await res.json();

    if (!res.ok || json.result === 'not found') {
      // "not found" is non-fatal — file already gone
      if (json.result === 'not found') return { ok: true };
      return {
        ok: false,
        error: json?.error?.message || `HTTP ${res.status}`,
      };
    }

    return { ok: true };
  } catch (err) {
    console.error('[cloudinary.delete] exception', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

// =============================================================================
// URL helpers
// =============================================================================

/**
 * Build a Cloudinary delivery URL with optional transformations.
 * Useful for generating thumbnails or optimized variants.
 *
 * Example:
 *   cloudinaryUrl('ngedumel/images/abc123', { width: 800, quality: 'auto', format: 'auto' })
 *   → "https://res.cloudinary.com/cloud/image/upload/w_800,q_auto,f_auto/ngedumel/images/abc123"
 */
export function cloudinaryUrl(
  publicId: string,
  opts: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    resourceType?: 'image' | 'raw';
  } = {}
): string {
  const { cloudName } = getConfig();
  const { resourceType = 'image', width, height, quality, format } = opts;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);

  const txStr = transforms.length ? transforms.join(',') + '/' : '';

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${txStr}${publicId}`;
}
