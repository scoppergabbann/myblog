'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import type { LibraryCategory, LibraryItem, LibraryPhoto } from '@/lib/library';
import {
  uploadLibraryImage,
  upsertCategory,
  deleteCategory,
  upsertItem,
  deleteItem,
  addItemPhoto,
  deleteItemPhoto,
  reorderItemPhotos,
} from './actions';

// =============================================================================
// Shell
// =============================================================================

export function LibraryAdminEditor({
  categories,
  items,
}: {
  categories: LibraryCategory[];
  items: LibraryItem[];
}) {
  const [activeCatId, setActiveCatId] = useState<number | null>(categories[0]?.id ?? null);
  const [editingCategory, setEditingCategory] = useState<LibraryCategory | null | 'new'>(null);
  const [editingItem, setEditingItem] = useState<{ item: LibraryItem | null; categoryId: number } | null>(null);
  const router = useRouter();
  const toast = useToast();

  const activeItems = items.filter((i) => i.category_id === activeCatId);

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Hapus kategori ini dan semua item di dalamnya?')) return;
    const res = await deleteCategory(id);
    if (res.ok) {
      toast.success('Kategori dihapus');
      router.refresh();
      if (activeCatId === id) setActiveCatId(categories.find((c) => c.id !== id)?.id ?? null);
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Hapus item ini?')) return;
    const res = await deleteItem(id);
    if (res.ok) { toast.success('Item dihapus'); router.refresh(); }
    else toast.error(res.error);
  };

  return (
    <div>
      {/* Category tabs + manage */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-4">
        {categories.map((cat) => (
          <div key={cat.id} className="group relative flex items-center">
            <button
              type="button"
              onClick={() => setActiveCatId(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                activeCatId === cat.id
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {cat.emoji} {cat.name}
              {cat.is_hidden && (
                <span className="ml-1.5 rounded-full border border-amber-500/30 px-1.5 py-[1px] font-mono text-[9px] uppercase text-amber-600 dark:text-amber-400">
                  hidden
                </span>
              )}
              <span className="ml-1.5 font-mono text-[10.5px] text-[var(--color-ink-4)]">
                {items.filter((i) => i.category_id === cat.id).length}
              </span>
            </button>
            <div className="ml-0.5 hidden gap-0.5 group-hover:flex">
              <button
                type="button"
                onClick={() => setEditingCategory(cat)}
                className="rounded px-1 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] hover:text-[var(--color-accent)]"
              >
                edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="rounded px-1 py-0.5 font-mono text-[10.5px] text-[var(--color-ink-3)] hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEditingCategory('new')}
          className="rounded-lg border border-dashed border-[var(--color-line)] px-3 py-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          + Kategori baru
        </button>
      </div>

      {/* Items for active category */}
      {activeCatId && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setEditingItem({ item: null, categoryId: activeCatId })}
              className="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-[13px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              + Tambah Item
            </button>
          </div>

          {activeItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-ink-3)]">
              Belum ada item. Klik "+ Tambah Item" untuk mulai.
            </p>
          ) : (
            <div className="space-y-2">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-[var(--color-paper-2)]">
                    {item.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photos[0].url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg opacity-30">📷</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">{item.name}</p>
                    <p className="font-mono text-[11px] text-[var(--color-ink-4)]">
                      {item.subtitle && `${item.subtitle} · `}
                      {item.photos.length} foto · order: {item.display_order}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem({ item, categoryId: activeCatId })}
                      className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-red-600"
                    >
                      hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Category modal */}
      {editingCategory !== null && (
        <CategoryModal
          category={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); router.refresh(); }}
        />
      )}

      {/* Item modal */}
      {editingItem !== null && (
        <ItemModal
          item={editingItem.item}
          categoryId={editingItem.categoryId}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Category modal
// =============================================================================

function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: LibraryCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(category?.name ?? '');
  const [emoji, setEmoji] = useState(category?.emoji ?? '📦');
  const [description, setDescription] = useState(category?.description ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(category?.display_order ?? 0));
  const [isHidden, setIsHidden] = useState(Boolean(category?.is_hidden));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await upsertCategory(category?.id ?? null, {
      name: name.trim(),
      emoji: emoji.trim() || '📦',
      description: description.trim() || null,
      display_order: parseInt(displayOrder) || 0,
      is_hidden: isHidden,
    });
    setSaving(false);
    if (res.ok) { toast.success('Tersimpan'); onSaved(); }
    else toast.error(res.error);
  };

  return (
    <Modal title={category ? 'Edit Kategori' : 'Tambah Kategori'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Field label="Emoji">
            <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="input-base text-center text-xl" />
          </Field>
          <Field label="Nama kategori">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-base" placeholder="Vinyl Record" />
          </Field>
        </div>
        <Field label="Deskripsi (opsional)">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" placeholder="Koleksi piringan hitam favorit" />
        </Field>
        <Field label="Urutan tampil">
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} min={0} className="input-base w-24" />
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-2">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-line)]"
          />
          <span>
            <span className="block text-[13px] font-medium text-[var(--color-ink)]">
              Hidden dari public /library
            </span>
            <span className="mt-0.5 block text-[12px] leading-[1.5] text-[var(--color-ink-3)]">
              Kategori dan item di dalamnya tetap muncul di admin, tapi tidak tampil untuk pengunjung.
            </span>
          </span>
        </label>
      </div>
      <ModalActions onClose={onClose} onSave={handleSave} saving={saving} disabled={!name.trim()} />
    </Modal>
  );
}

// =============================================================================
// Item modal
// =============================================================================

function ItemModal({
  item,
  categoryId,
  onClose,
  onSaved,
}: {
  item: LibraryItem | null;
  categoryId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(item?.name ?? '');
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [badge, setBadge] = useState(item?.badge ?? '');
  const [reelsUrl, setReelsUrl] = useState(item?.reels_url ?? '');
  const [linkUrl, setLinkUrl] = useState(item?.link_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(item?.display_order ?? 0));

  // Pending photos (not yet in DB — saved on submit)
  const [pendingPhotoUrls, setPendingPhotoUrls] = useState<string[]>([]);
  // Pending reorders for existing photos (id → new position)
  const [pendingReorders, setPendingReorders] = useState<{ id: number; position: number }[]>([]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const res = await upsertItem(item?.id ?? null, {
      category_id: categoryId,
      name: name.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      badge: badge.trim() || null,
      reels_url: reelsUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      display_order: parseInt(displayOrder) || 0,
    });

    if (res.ok) {
      const savedId = res.id ?? item?.id;
      if (savedId) {
        // Flush reorders for existing photos
        if (pendingReorders.length > 0) {
          const reorderRes = await reorderItemPhotos(pendingReorders);
          if (!reorderRes.ok) {
            toast.error(reorderRes.error);
            setSaving(false);
            return;
          }
        }

        // Insert pending new photos.
        // Posisi dimulai setelah jumlah foto existing agar cover lama tidak ketimpa secara acak.
        if (pendingPhotoUrls.length > 0) {
          const existingCount = item?.photos?.length ?? 0;
          const photoResults = await Promise.all(
            pendingPhotoUrls.map((url, i) => addItemPhoto(savedId, url, existingCount + i))
          );

          const failedPhoto = photoResults.find((r) => !r.ok);
          if (failedPhoto && !failedPhoto.ok) {
            toast.error(failedPhoto.error);
            setSaving(false);
            return;
          }
        }
      }
      toast.success('Tersimpan');
      onSaved();
    } else {
      toast.error(res.error);
    }

    setSaving(false);
  };

  return (
    <Modal title={item ? 'Edit Item' : 'Tambah Item'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nama">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-base" placeholder="BMW E30, Norwegian Wood, Kopi Tubruk..." />
        </Field>
        <Field label="Subtitle (opsional)">
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input-base" placeholder="Haruki Murakami · 1987, E30 · 1987, Kapal Api..." />
        </Field>
        <Field label="Deskripsi / Kesan">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-base resize-y" placeholder="Ceritakan kenapa kamu suka ini..." />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Badge (opsional)">
            <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} className="input-base" placeholder="Selesai, Wishlist, Impian, Kopi..." />
          </Field>
          <Field label="Urutan tampil">
            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} min={0} className="input-base" />
          </Field>
        </div>
        <Field label="Link Reels IG (opsional)">
          <input type="url" value={reelsUrl} onChange={(e) => setReelsUrl(e.target.value)} className="input-base" placeholder="https://www.instagram.com/reel/..." />
        </Field>
        <Field label="Link eksternal (opsional)">
          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input-base" placeholder="https://..." />
        </Field>

        {/* Gallery photos */}
        {item ? (
          <GallerySection
            itemId={item.id}
            existingPhotos={item.photos}
            pendingUrls={pendingPhotoUrls}
            onPendingChange={setPendingPhotoUrls}
            onReorderChange={setPendingReorders}
            onDeleted={onSaved}
          />
        ) : (
          <GallerySection
            itemId={null}
            existingPhotos={[]}
            pendingUrls={pendingPhotoUrls}
            onPendingChange={setPendingPhotoUrls}
            onReorderChange={setPendingReorders}
            onDeleted={() => {}}
          />
        )}
      </div>
      <ModalActions onClose={onClose} onSave={handleSave} saving={saving} disabled={!name.trim()} />
    </Modal>
  );
}

// =============================================================================
// =============================================================================
// Gallery section — unified drag-to-reorder, pending until submit
// =============================================================================

type GalleryEntry =
  | { kind: 'existing'; photo: LibraryPhoto }
  | { kind: 'pending'; url: string; tempId: string };

function GallerySection({
  itemId,
  existingPhotos,
  pendingUrls,
  onPendingChange,
  onReorderChange,
  onDeleted,
}: {
  itemId: number | null;
  existingPhotos: LibraryPhoto[];
  pendingUrls: string[];
  onPendingChange: (urls: string[]) => void;
  onReorderChange: (reorders: { id: number; position: number }[]) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const [entries, setEntries] = useState<GalleryEntry[]>(() => [
    ...existingPhotos.map((p) => ({ kind: 'existing' as const, photo: p })),
    ...pendingUrls.map((url, i) => ({ kind: 'pending' as const, url, tempId: `init-${i}` })),
  ]);

  // Penting: ketika router.refresh() selesai, props item.photos berubah.
  // Tanpa sync ini, modal/list bisa tetap menampilkan state lama.
  useEffect(() => {
    setEntries([
      ...existingPhotos.map((p) => ({ kind: 'existing' as const, photo: p })),
      ...pendingUrls.map((url, i) => ({ kind: 'pending' as const, url, tempId: `pending-${i}-${url}` })),
    ]);
  }, [itemId, existingPhotos, pendingUrls]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);
  const MAX = 6;
  const total = entries.length;
  const remaining = MAX - total;

  const syncParent = (next: GalleryEntry[]) => {
    onPendingChange(
      next.filter((e): e is Extract<GalleryEntry, { kind: 'pending' }> => e.kind === 'pending').map((e) => e.url)
    );
    onReorderChange(
      next.filter((e): e is Extract<GalleryEntry, { kind: 'existing' }> => e.kind === 'existing')
        .map((e, idx) => ({ id: e.photo.id, position: idx }))
    );
  };

  const updateEntries = (next: GalleryEntry[]) => { setEntries(next); syncParent(next); };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) toast.error(`Hanya ${remaining} slot tersisa`);
    setUploadingCount(toUpload.length);
    const newEntries: GalleryEntry[] = [];
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadLibraryImage(fd);
      if (res.ok) newEntries.push({ kind: 'pending', url: res.url, tempId: `${Date.now()}-${Math.random()}` });
      else toast.error(`${file.name}: ${res.error}`);
      setUploadingCount((c) => Math.max(0, c - 1));
    }
    if (newEntries.length > 0) {
      const next = [...entries, ...newEntries];
      updateEntries(next);
      toast.success(`${newEntries.length} foto siap — klik Simpan`);
    }
  };

  const addFromUrl = () => {
    const url = urlInput.trim();
    if (!url || total >= MAX) return;
    updateEntries([...entries, { kind: 'pending', url, tempId: `url-${Date.now()}` }]);
    setUrlInput('');
    toast.success('URL ditambahkan — klik Simpan');
  };

  const setCover = (idx: number) => {
    if (idx === 0) return;
    const next = [...entries];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    updateEntries(next);
    toast.success('Cover diubah — klik Simpan untuk menyimpan');
  };

  const removeEntry = async (idx: number) => {
    const entry = entries[idx];
    if (entry.kind === 'existing') {
      const res = await deleteItemPhoto(entry.photo.id);
      if (!res.ok) { toast.error(res.error); return; }
      onDeleted();
    }
    updateEntries(entries.filter((_, i) => i !== idx));
  };

  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...entries];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    dragIdx.current = idx;
    updateEntries(next);
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const isUploading = uploadingCount > 0;
  const pendingCount = entries.filter((e) => e.kind === 'pending').length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">
          Galeri foto ({total}/{MAX})
          {pendingCount > 0 && (
            <span className="ml-2 text-[var(--color-accent)]">· {pendingCount} belum disimpan</span>
          )}
        </label>
        {remaining > 0 && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploading}
              className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11.5px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] disabled:opacity-50">
              {isUploading ? `Upload... (${uploadingCount})` : '+ Upload'}
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <p className="mb-2 font-mono text-[10.5px] text-[var(--color-ink-4)]">
          Drag untuk ubah urutan · hover foto → klik <strong>Set Cover</strong> · foto pertama = cover card
        </p>
      )}

      {(total > 0 || isUploading) && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {entries.map((entry, idx) => {
            const url = entry.kind === 'existing' ? entry.photo.url : entry.url;
            const isPending = entry.kind === 'pending';
            const isCover = idx === 0;
            return (
              <div
                key={entry.kind === 'existing' ? entry.photo.id : entry.tempId}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={`group relative aspect-square cursor-grab overflow-hidden rounded-[8px] active:cursor-grabbing ${isPending ? 'border-2 border-dashed border-[var(--color-accent)]' : 'border border-[var(--color-line)]'} bg-[var(--color-paper-2)]`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                {isCover && (
                  <div className="absolute left-1 top-1 rounded bg-[var(--color-accent)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">cover</div>
                )}
                {isPending && !isCover && (
                  <div className="absolute left-1 top-1 rounded bg-black/60 px-1 font-mono text-[9px] text-white">pending</div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isCover && (
                    <button type="button" onClick={() => setCover(idx)}
                      className="rounded-full bg-white/90 px-2 py-0.5 font-mono text-[9px] font-semibold text-black hover:bg-white">
                      Set Cover
                    </button>
                  )}
                  <button type="button" onClick={() => removeEntry(idx)} aria-label="Hapus foto"
                    className="rounded-full bg-red-600/90 px-2 py-0.5 font-mono text-[9px] text-white hover:bg-red-600">
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
          {isUploading && Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={`u-${i}`} className="flex aspect-square items-center justify-center rounded-[8px] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-2)]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-[var(--color-accent)]" />
            </div>
          ))}
        </div>
      )}

      {total === 0 && !isUploading && (
        <p className="mb-2 text-[12px] text-[var(--color-ink-4)]">Belum ada foto. Foto pertama = cover card.</p>
      )}

      {remaining > 0 && (
        <div className="flex gap-2">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder="atau paste URL foto" className="input-base flex-1 text-[12px]"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFromUrl(); } }} />
          <button type="button" onClick={addFromUrl} disabled={!urlInput.trim()}
            className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] disabled:opacity-40">
            Tambah
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Shared UI primitives
// =============================================================================

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[16px] bg-[var(--color-paper)] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-medium text-[var(--color-ink)]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-3)]">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onClose, onSave, saving, disabled }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean }) {
  return (
    <div className="mt-5 flex justify-end gap-3 border-t border-[var(--color-line)] pt-4">
      <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">Batal</button>
      <button type="button" onClick={onSave} disabled={saving || disabled}
        className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  );
}
