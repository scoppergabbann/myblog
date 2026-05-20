'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import type {
  LibraryBook,
  LibraryDrink,
  LibraryCar,
  LibraryMotorcycle,
} from '@/lib/library';
import {
  BOOK_STATUS_LABELS,
  DRINK_CATEGORY_LABELS,
  CAR_STATUS_LABELS,
  MOTO_STATUS_LABELS,
} from '@/lib/library';
import {
  uploadLibraryImage,
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

  // Photo upload
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
