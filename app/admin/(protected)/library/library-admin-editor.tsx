'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import type {
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
  LibraryPhoto,
} from '@/lib/library';
import {
  BOOK_STATUS_LABELS,
  DRINK_CATEGORY_LABELS,
  CAR_STATUS_LABELS,
  MOTO_STATUS_LABELS,
} from '@/lib/library';
import {
  uploadLibraryImage,
  addLibraryPhoto,
  deleteLibraryPhoto,
  type ItemType,
  upsertBook,
  deleteBook,
  upsertDrink,
  deleteDrink,
  upsertCar,
  deleteCar,
  upsertMotorcycle,
  deleteMotorcycle,
} from './actions';

type Tab = 'books' | 'drinks' | 'cars' | 'motorcycles';
type AnyItem =
  | LibraryBook
  | LibraryDrink
  | LibraryCar
  | LibraryMotorcycle;

// =============================================================================
// Shell
// =============================================================================

export function LibraryAdminEditor({
  books,
  drinks,
  cars,
  motorcycles,
}: {
  books: LibraryBook[];
  drinks: LibraryDrink[];
  cars: LibraryCar[];
  motorcycles: LibraryMotorcycle[];
}) {
  const [tab, setTab] = useState<Tab>('books');
  const [editing, setEditing] = useState<{
    item: AnyItem | null;
    kind: Tab;
  } | null>(null);
  const router = useRouter();
  const toast = useToast();

  const TAB_CONFIG: { id: Tab; label: string; emoji: string; count: number }[] = [
    { id: 'books', label: 'Buku', emoji: '📚', count: books.length },
    { id: 'drinks', label: 'Minuman', emoji: '☕', count: drinks.length },
    { id: 'cars', label: 'Mobil', emoji: '🚗', count: cars.length },
    { id: 'motorcycles', label: 'Motor', emoji: '🏍️', count: motorcycles.length },
  ];

  const handleDelete = async (kind: Tab, id: number) => {
    if (!confirm('Hapus item ini?')) return;
    let result;
    if (kind === 'books') result = await deleteBook(id);
    else if (kind === 'drinks') result = await deleteDrink(id);
    else if (kind === 'cars') result = await deleteCar(id);
    else result = await deleteMotorcycle(id);
    if (result.ok) {
      toast.success('Item dihapus');
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const items = tab === 'books' ? books
    : tab === 'drinks' ? drinks
    : tab === 'cars' ? cars
    : motorcycles;

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[var(--color-line)]">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
              tab === t.id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t.emoji} {t.label}
            <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Add button */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing({ item: null, kind: tab })}
          className="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
        >
          + Tambah {TAB_CONFIG.find((t) => t.id === tab)?.label}
        </button>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-ink-3)]">
          Belum ada item. Klik tombol di atas untuk menambahkan.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const title = 'title' in item ? item.title : item.name;
            const photoUrl = 'cover_url' in item ? item.cover_url : item.photo_url;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
              >
                {/* Thumbnail */}
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-[var(--color-paper-2)]">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      {tab === 'books' ? '📚' : tab === 'drinks' ? '☕' : tab === 'cars' ? '🚗' : '🏍️'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">
                    {title}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--color-ink-4)]">
                    order: {item.display_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ item, kind: tab })}
                    className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tab, item.id)}
                    className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-red-600"
                  >
                    hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <ItemFormModal
          kind={editing.kind}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// =============================================================================
// Item form modal
// =============================================================================

function ItemFormModal({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: Tab;
  item: AnyItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>(
    item ? (('cover_url' in item ? item.cover_url : item.photo_url) ?? '') : ''
  );
  const [urlInput, setUrlInput] = useState(photoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generic fields
  const [name, setName] = useState(
    item ? ('title' in item ? item.title : item.name) : ''
  );
  const [author, setAuthor] = useState(
    item && 'author' in item ? item.author : ''
  );
  const [brand, setBrand] = useState(
    item && 'brand' in item ? (item.brand ?? '') : ''
  );
  const [model, setModel] = useState(
    item && 'model' in item ? (item.model ?? '') : ''
  );
  const [year, setYear] = useState(
    item && 'year' in item ? String(item.year ?? '') :
    item && 'year_read' in item ? String((item as LibraryBook).year_read ?? '') : ''
  );
  const [description, setDescription] = useState(
    item?.description ?? ''
  );
  const [status, setStatus] = useState<string>(
    item && 'status' in item ? item.status : 'finished'
  );
  const [category, setCategory] = useState<string>(
    item && 'category' in item ? item.category : 'kopi'
  );
  const [reelsUrl, setReelsUrl] = useState(
    item && 'reels_url' in item ? (item.reels_url ?? '') : ''
  );
  const [linkUrl, setLinkUrl] = useState(
    item && 'link_url' in item ? (item.link_url ?? '') : ''
  );
  const [displayOrder, setDisplayOrder] = useState(
    item ? String(item.display_order) : '0'
  );

  // Gallery pending photos (urls collected, not saved to DB yet)
  const [pendingPhotoUrls, setPendingPhotoUrls] = useState<string[]>([]);
  const itemType = kind === 'books' ? 'book' : kind === 'drinks' ? 'drink' : kind === 'cars' ? 'car' : 'motorcycle';

  // Photo upload (for legacy single cover_url field)
  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadLibraryImage(fd);
    if (result.ok) {
      setPhotoUrl(result.url);
      setUrlInput(result.url);
      toast.success('Foto ter-upload');
    } else {
      toast.error(result.error);
    }
    setUploading(false);
  };

  const applyUrlInput = () => {
    setPhotoUrl(urlInput);
  };

  const handleSave = async () => {
    setSaving(true);
    const id = item?.id ?? null;
    const finalPhoto = photoUrl || null;
    let result;

    if (kind === 'books') {
      result = await upsertBook(id, {
        title: name,
        author,
        cover_url: finalPhoto,
        year_read: year ? parseInt(year) : null,
        description: description || null,
        status,
        link_url: linkUrl || null,
        display_order: parseInt(displayOrder) || 0,
      });
    } else if (kind === 'drinks') {
      result = await upsertDrink(id, {
        name,
        brand: brand || null,
        photo_url: finalPhoto,
        description: description || null,
        category,
        reels_url: reelsUrl || null,
        display_order: parseInt(displayOrder) || 0,
      });
    } else if (kind === 'cars') {
      result = await upsertCar(id, {
        name,
        model: model || null,
        year: year ? parseInt(year) : null,
        photo_url: finalPhoto,
        description: description || null,
        status,
        reels_url: reelsUrl || null,
        display_order: parseInt(displayOrder) || 0,
      });
    } else {
      result = await upsertMotorcycle(id, {
        name,
        model: model || null,
        year: year ? parseInt(year) : null,
        photo_url: finalPhoto,
        description: description || null,
        status,
        reels_url: reelsUrl || null,
        display_order: parseInt(displayOrder) || 0,
      });
    }

    setSaving(false);
    if (result.ok) {
      // Flush pending gallery photos to DB
      if (pendingPhotoUrls.length > 0) {
        const savedId = result.id ?? item?.id;
        if (savedId) {
          const existingCount = item?.photos?.length ?? 0;
          await Promise.all(
            pendingPhotoUrls.map((url, i) =>
              addLibraryPhoto(itemType, savedId, url, existingCount + i)
            )
          );
        }
      }
      toast.success('Tersimpan');
      onSaved();
    } else {
      toast.error(result.error);
    }
  };

  const kindLabel = kind === 'books' ? 'Buku' : kind === 'drinks' ? 'Minuman' : kind === 'cars' ? 'Mobil' : 'Motor';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[16px] bg-[var(--color-paper)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-medium text-[var(--color-ink)]">
            {item ? 'Edit' : 'Tambah'} {kindLabel}
          </h2>
          <button type="button" onClick={onClose} className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">✕</button>
        </div>

        <div className="space-y-4">
          {/* Photo */}
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
              Foto
            </label>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="mb-2 h-24 w-24 rounded-lg object-cover border border-[var(--color-line)]" />
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12.5px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-accent)] disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload foto'}
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="atau paste URL foto"
                className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-[13px] text-[var(--color-ink)] focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={applyUrlInput}
                className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12.5px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)]"
              >
                Pakai
              </button>
            </div>
          </div>

          {/* Title / Name */}
          <Field label={kind === 'books' ? 'Judul' : 'Nama'}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-base" />
          </Field>

          {/* Kind-specific fields */}
          {kind === 'books' && (
            <>
              <Field label="Penulis">
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-base" />
              </Field>
              <Field label="Tahun baca">
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1900} max={2099} className="input-base" />
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base">
                  {Object.entries(BOOK_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Link (Goodreads, dll — opsional)">
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input-base" placeholder="https://" />
              </Field>
            </>
          )}

          {kind === 'drinks' && (
            <>
              <Field label="Brand / Asal (opsional)">
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="input-base" />
              </Field>
              <Field label="Kategori">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
                  {Object.entries(DRINK_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Link Reels IG (opsional)">
                <input type="url" value={reelsUrl} onChange={(e) => setReelsUrl(e.target.value)} className="input-base" placeholder="https://www.instagram.com/reel/..." />
              </Field>
            </>
          )}

          {(kind === 'cars' || kind === 'motorcycles') && (
            <>
              <Field label="Model (opsional)">
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="input-base" placeholder={kind === 'cars' ? 'E30 318i' : 'CB100'} />
              </Field>
              <Field label="Tahun">
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1900} max={2099} className="input-base" />
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base">
                  {Object.entries(kind === 'cars' ? CAR_STATUS_LABELS : MOTO_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Link Reels IG (opsional)">
                <input type="url" value={reelsUrl} onChange={(e) => setReelsUrl(e.target.value)} className="input-base" placeholder="https://www.instagram.com/reel/..." />
              </Field>
            </>
          )}

          {/* Description (all) */}
          <Field label="Deskripsi / Kesan">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-base resize-y"
              placeholder="Ceritakan sedikit tentang ini..."
            />
          </Field>

          {/* Gallery photos */}
          {item && (
            <GalleryPhotoSection
              itemType={itemType}
              itemId={item.id}
              existingPhotos={item.photos ?? []}
              pendingUrls={pendingPhotoUrls}
              onPendingChange={setPendingPhotoUrls}
              onDeleted={onSaved}
            />
          )}
          {!item && (
            <div className="rounded-[8px] border border-dashed border-[var(--color-line)] p-3 text-center">
              <p className="text-[12px] text-[var(--color-ink-3)]">
                💡 Galeri foto bisa ditambahkan setelah item disimpan pertama kali.
              </p>
            </div>
          )}

          {/* Display order */}
          <Field label="Urutan tampil (angka kecil = lebih atas)">
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              min={0}
              className="input-base w-24"
            />
          </Field>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-[var(--color-line)] pt-4">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Gallery photo section
// - existingPhotos: already in DB — delete is immediate (deliberate action)
// - pendingUrls: collected locally, saved to DB only when parent calls handleSave
// =============================================================================

function GalleryPhotoSection({
  itemType,
  itemId,
  existingPhotos,
  pendingUrls,
  onPendingChange,
  onDeleted,
}: {
  itemType: ItemType;
  itemId: number;
  existingPhotos: LibraryPhoto[];
  pendingUrls: string[];
  onPendingChange: (urls: string[]) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const [existing, setExisting] = useState<LibraryPhoto[]>(existingPhotos);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 6;

  const totalCount = existing.length + pendingUrls.length;
  const remaining = MAX_PHOTOS - totalCount;
  const isUploading = uploadingCount > 0;

  // Upload file to Cloudinary → add URL to pending (not DB yet)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Hanya ${remaining} slot tersisa (max ${MAX_PHOTOS})`);
    }
    setUploadingCount(toUpload.length);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadLibraryImage(fd);
      if (res.ok) {
        newUrls.push(res.url);
      } else {
        toast.error(`${file.name}: ${res.error}`);
      }
      setUploadingCount((c) => Math.max(0, c - 1));
    }
    if (newUrls.length > 0) {
      onPendingChange([...pendingUrls, ...newUrls]);
      toast.success(
        newUrls.length === 1
          ? 'Foto siap — klik Simpan untuk menyimpan'
          : `${newUrls.length} foto siap — klik Simpan untuk menyimpan`
      );
    }
  };

  // Add URL from input → pending (not DB yet)
  const addFromUrl = () => {
    const url = urlInput.trim();
    if (!url || totalCount >= MAX_PHOTOS) return;
    onPendingChange([...pendingUrls, url]);
    setUrlInput('');
    toast.success('URL ditambahkan — klik Simpan untuk menyimpan');
  };

  // Remove pending (just update local array, nothing to undo from DB)
  const removePending = (idx: number) => {
    onPendingChange(pendingUrls.filter((_, i) => i !== idx));
  };

  // Delete existing from DB immediately (deliberate X button action)
  const removeExisting = async (photoId: number) => {
    const res = await deleteLibraryPhoto(photoId);
    if (res.ok) {
      setExisting((prev) => prev.filter((p) => p.id !== photoId));
      onDeleted();
      toast.success('Foto dihapus');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
          Galeri foto ({totalCount}/{MAX_PHOTOS})
          {pendingUrls.length > 0 && (
            <span className="ml-2 text-[var(--color-accent)]">
              · {pendingUrls.length} belum disimpan
            </span>
          )}
        </label>
        {remaining > 0 && (
          <div className="flex items-center gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11.5px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] disabled:opacity-50"
            >
              {isUploading
                ? `Upload... (${uploadingCount})`
                : `+ Upload${remaining > 1 ? ` (max ${remaining})` : ''}`}
            </button>
          </div>
        )}
      </div>

      {/* Grid: existing (saved) + pending (unsaved) + uploading placeholders */}
      {(totalCount > 0 || isUploading) && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {/* Saved photos */}
          {existing.map((photo, idx) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-[8px] border border-[var(--color-line)] bg-[var(--color-paper-2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {idx === 0 && pendingUrls.length === 0 && (
                <div className="absolute left-1 top-1 rounded bg-black/60 px-1 font-mono text-[9px] text-white">cover</div>
              )}
              <button
                type="button"
                onClick={() => removeExisting(photo.id)}
                aria-label="Hapus foto"
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* Pending photos (unsaved) */}
          {pendingUrls.map((url, idx) => (
            <div
              key={`pending-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-[8px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
              <div className="absolute left-1 top-1 rounded bg-[var(--color-accent)]/80 px-1 font-mono text-[9px] text-white">
                belum disimpan
              </div>
              <button
                type="button"
                onClick={() => removePending(idx)}
                aria-label="Batalkan foto ini"
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploadingCount > 0 &&
            Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`uploading-${i}`}
                className="flex aspect-square items-center justify-center rounded-[8px] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-2)]"
              >
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-[var(--color-accent)]" />
              </div>
            ))}
        </div>
      )}

      {totalCount === 0 && !isUploading && (
        <p className="mb-2 text-[12px] text-[var(--color-ink-4)]">
          Belum ada foto. Foto pertama = cover card di halaman library.
        </p>
      )}

      {/* URL input */}
      {remaining > 0 && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="atau paste URL foto (imgur, google photos, dll)"
            className="input-base flex-1 text-[12px]"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFromUrl(); } }}
          />
          <button
            type="button"
            onClick={addFromUrl}
            disabled={!urlInput.trim()}
            className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] disabled:opacity-40"
          >
            Tambah
          </button>
        </div>
      )}

      <p className="mt-1.5 font-mono text-[10.5px] text-[var(--color-ink-4)]">
        Foto dengan border oranye belum tersimpan — klik <strong>Simpan</strong> untuk menyimpan ke database.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
        {label}
      </label>
      {children}
    </div>
  );
}
