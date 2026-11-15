'use server';
import { auth, isAdmin } from '@/auth';
import { uploadImage, type UploadResult } from '@/lib/storage';
import { streamPhotoMatchesType, validateStreamPhotoFile } from '@/lib/stream-photos';

export async function uploadStreamPhoto(formData: FormData): Promise<UploadResult> {
  if (!isAdmin(await auth())) return { ok: false, error: 'Masuk sebagai admin untuk mengunggah foto.' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Pilih file foto terlebih dahulu.' };
  const error = validateStreamPhotoFile(file);
  if (error) return { ok: false, error };
  if (!streamPhotoMatchesType(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type)) {
    return { ok: false, error: 'Isi file tidak sesuai format foto. Pilih foto JPG, PNG, atau WebP yang valid.' };
  }
  // Match the stored extension to the verified type, not the supplied filename.
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const upload = new FormData();
  upload.set('file', file, `photo.${extension}`);
  return uploadImage(upload);
}
