'use client';

import { Children, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/toast';
import { useUnsavedClose } from '@/components/admin/use-unsaved-close';
import type { LibraryCategory, LibraryItem, LibraryPhoto } from '@/lib/library';
import { libraryKinds, libraryForms, resolveLibraryKind, cleanLibraryDetails, getLibraryItemSubtitle, type LibraryKind, type LibraryDetails } from '@/lib/library-fields';
import { LibraryDetailFields } from './library-detail-fields';
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
  const activeKind = resolveLibraryKind(null, categories.find(category => category.id === activeCatId));

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
              + Tambah {libraryKinds[activeKind]}
            </button>
          </div>

          {activeItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-ink-3)]">
              Belum ada koleksi. Tambahkan {libraryKinds[activeKind].toLowerCase()} pertama kamu.
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
                      {getLibraryItemSubtitle(item) && `${getLibraryItemSubtitle(item)} · `}
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
          category={categories.find(c => c.id === editingItem.categoryId)}
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
  const [itemType, setItemType] = useState<LibraryKind>(resolveLibraryKind(null, category));
  const [isHidden, setIsHidden] = useState(Boolean(category?.is_hidden));
  const requestClose = useUnsavedClose([name, emoji, description, displayOrder, isHidden, itemType], false, saving, onClose);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await upsertCategory(category?.id ?? null, {
      name: name.trim(),
      emoji: emoji.trim() || '📦',
      description: description.trim() || null,
      display_order: parseInt(displayOrder) || 0,
      is_hidden: isHidden,
      item_type: itemType,
    });
    setSaving(false);
    if (res.ok) { toast.success('Tersimpan'); onSaved(); }
    else toast.error(res.error);
  };

  return (
    <Modal title={category ? 'Edit Kategori' : 'Tambah Kategori'} onClose={requestClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Field label="Emoji">
            <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="input-base text-center text-xl" />
          </Field>
          <Field label="Nama kategori">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-base" placeholder="Vinyl Record" />
          </Field>
        </div>
        <Field label="Jenis form untuk kategori ini">
          <select value={itemType} onChange={e => setItemType(e.target.value as LibraryKind)} className="input-base">
            {Object.entries(libraryKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Field>
        <p className="text-xs text-[var(--color-ink-3)]">Menentukan isian awal item baru. Jenis item yang sudah tersimpan tetap dipertahankan.</p>
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
      <ModalActions onClose={requestClose} onSave={handleSave} saving={saving} disabled={!name.trim()} />
    </Modal>
  );
}

// =============================================================================
// Item modal
// =============================================================================

function ItemModal({
  item,
  categoryId,
  category,
  onClose,
  onSaved,
}: {
  item: LibraryItem | null;
  categoryId: number;
  category?: LibraryCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [itemType, setItemType] = useState<LibraryKind>(resolveLibraryKind(item, category));
  const [details, setDetails] = useState<LibraryDetails>(item?.details ?? {});
  const [savedItemId, setSavedItemId] = useState<number | null>(item?.id ?? null);
  const form = libraryForms[itemType];
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
  const [photos, setPhotos] = useState(item?.photos ?? []);
  const [galleryDirty, setGalleryDirty] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const router = useRouter();
  const requestClose = useUnsavedClose(
    [name, subtitle, description, badge, reelsUrl, linkUrl, displayOrder, itemType, details],
    galleryDirty || pendingPhotoUrls.length > 0 || pendingReorders.some((entry) =>
      photos.find((photo) => photo.id === entry.id)?.position !== entry.position),
    saving || galleryBusy,
    onClose,
  );

  const handleSave = async () => {
    if (saving || galleryBusy) return;
    if (!name.trim()) { toast.error(form.name + ' wajib diisi.'); return; }
    const checked = cleanLibraryDetails(itemType, details);
    if (checked.error) { toast.error(checked.error); return; }
    setSaving(true);

    try {
      const res = await upsertItem(savedItemId, {
        category_id: categoryId,
        item_type: itemType,
        details: checked.details,
        name: name.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        badge: badge.trim() || null,
        reels_url: reelsUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        display_order: displayOrder.trim() ? Number(displayOrder) : 0,
      });

      if (res.ok) {
        const savedId = res.id ?? savedItemId;
        if (savedId) setSavedItemId(savedId);
        if (savedId) {
          // Flush reorders for existing photos
          if (pendingReorders.length > 0) {
            const reorderRes = await reorderItemPhotos(pendingReorders);
            if (!reorderRes.ok) {
              toast.error(reorderRes.error);
              setSaving(false);
              return;
            }
            setPendingReorders([]);
          }

          // Insert pending new photos.
          // Posisi dimulai setelah jumlah foto existing agar cover lama tidak ketimpa secara acak.
          if (pendingPhotoUrls.length > 0) {
            const existingCount = Math.max(-1, ...photos.map(photo => photo.position), ...pendingReorders.map(photo => photo.position)) + 1;
            const photoResults = await Promise.all(
              pendingPhotoUrls.map((url, i) => addItemPhoto(savedId, url, existingCount + i))
            );

            const successful = photoResults.flatMap((result, index) => result.ok && result.id ? [{ id: result.id, url: pendingPhotoUrls[index], position: existingCount + index }] : []);
            setPhotos(current => [...current, ...successful]);
            setPendingPhotoUrls(current => current.filter((_, index) => !photoResults[index]?.ok));
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

    } catch { toast.error('Gagal menyimpan. Isian tetap tersedia; coba lagi.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`${item ? 'Edit' : 'Tambah'} ${libraryKinds[itemType]}`} onClose={requestClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--color-paper-2)] px-3 py-2.5">
          <p className="text-xs text-[var(--color-ink-3)]">Kategori: <span className="font-medium text-[var(--color-ink)]">{category?.name ?? 'Library'}</span></p>
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-3)]">Jenis item
            <select disabled={saving || galleryBusy} value={itemType} onChange={e => {
              const next = e.target.value as LibraryKind;
              if (Object.values(details).some(Boolean) && !confirm('Ganti jenis item? Detail khusus jenis sebelumnya akan dikosongkan.')) return;
              setItemType(next); setDetails({}); setBadge('');
            }} className="input-base w-auto">
              {Object.entries(libraryKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
        {!savedItemId && <p className="text-xs leading-relaxed text-[var(--color-ink-3)]">{category?.is_hidden
          ? 'Kategori ini tersembunyi. Catatan penambahan akan disimpan sebagai draft di Stream.'
          : 'Item baru otomatis muncul sebagai pembaruan di Stream (/now), lengkap dengan tautan ke detailnya.'}</p>}
        <fieldset disabled={saving || galleryBusy} className="space-y-5">
          <Field label={form.name + ' *'}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={200} className="input-base" placeholder={form.placeholder} />
          </Field>
          <LibraryDetailFields kind={itemType} details={details} onChange={setDetails} />
          {form.statuses.length > 0 && <Field label={itemType === 'book' ? 'Status membaca' : 'Status koleksi'}>
            <select value={badge} onChange={e => setBadge(e.target.value)} className="input-base">
              <option value="">Belum dipilih</option>
              {badge && !form.statuses.includes(badge) && <option value={badge}>{badge} (status lama)</option>}
              {form.statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>}
          <section className="space-y-4 border-t border-[var(--color-line)] pt-5">
            <h3 className="text-sm font-medium">{itemType === 'book' ? 'Pengalaman membaca' : itemType === 'note' ? 'Catatanmu' : 'Cerita pribadi'}</h3>
            <Field label={form.description}>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={20000} className="input-base resize-y" placeholder={form.descriptionPlaceholder} />
            </Field>
            {form.notes && <Field label={form.notes}>
              <textarea value={details.notes ?? ''} onChange={e => setDetails(current => ({ ...current, notes: e.target.value }))} rows={4} maxLength={12000} className="input-base resize-y" placeholder={itemType === 'book' ? 'Ide yang ingin diingat, kutipan, atau catatan per bab…' : 'Catatan tambahan yang ingin kamu simpan…'} />
            </Field>}
            <p className="text-xs leading-relaxed text-[var(--color-ink-3)]">Kesan dan catatan ini akan tampil di detail library publik.</p>
          </section>
          <Field label={itemType === 'book' ? 'Tautan buku / referensi (opsional)' : 'Tautan referensi (opsional)'}>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="input-base" placeholder="https://..." />
          </Field>
          <details className="rounded-lg border border-[var(--color-line)] p-3">
            <summary className="cursor-pointer text-sm text-[var(--color-ink-3)]">Pengaturan tambahan</summary>
            <div className="mt-4 space-y-4">
              <Field label="Subtitle tambahan (opsional)"><input value={subtitle} maxLength={600} onChange={e => setSubtitle(e.target.value)} className="input-base" placeholder="Otomatis dari identitas jika dikosongkan" /></Field>
              {(form.reels || reelsUrl) && <Field label="Link Reels IG (opsional)"><input type="url" value={reelsUrl} onChange={e => setReelsUrl(e.target.value)} className="input-base" placeholder="https://www.instagram.com/reel/..." /></Field>}
              {form.statuses.length === 0 && <Field label="Label (opsional)"><input value={badge} maxLength={100} onChange={e => setBadge(e.target.value)} className="input-base" /></Field>}
              <Field label="Urutan tampil"><input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} min={0} step={1} className="input-base" /></Field>
            </div>
          </details>
        </fieldset>

        {/* Gallery photos */}
          <fieldset disabled={saving}><GallerySection
            itemId={savedItemId}
            existingPhotos={photos}
            pendingUrls={pendingPhotoUrls}
            onPendingChange={setPendingPhotoUrls}
            onReorderChange={setPendingReorders}
            onDirtyChange={setGalleryDirty}
            onBusyChange={setGalleryBusy}
            onDeleted={(id) => {
              setPhotos((current) => current.filter((photo) => photo.id !== id));
              router.refresh();
            }}
          /></fieldset>
      </div>
      <ModalActions onClose={requestClose} onSave={handleSave} saving={saving} disabled={!name.trim() || galleryBusy} />
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
  onDirtyChange,
  onBusyChange,
}: {
  itemId: number | null;
  existingPhotos: LibraryPhoto[];
  pendingUrls: string[];
  onPendingChange: (urls: string[]) => void;
  onReorderChange: (reorders: { id: number; position: number }[]) => void;
  onDeleted: (id: number) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
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
  useEffect(() => { onDirtyChange(urlInput.length > 0); }, [urlInput, onDirtyChange]);
  useEffect(() => { onBusyChange(uploadingCount > 0); }, [uploadingCount, onBusyChange]);
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
      onDeleted(entry.photo.id);
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
  const content = Children.toArray(children);
  const footer = content.pop();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[90dvh] w-full max-w-[700px] flex-col overflow-hidden rounded-[20px] bg-[var(--color-paper)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-6 py-5">
          <h2 className="text-[17px] font-medium text-[var(--color-ink)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal" className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">✕</button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{content}</div>
        {footer}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[var(--color-ink-3)]">{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ onClose, onSave, saving, disabled }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean }) {
  return (
    <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-4">
      <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">Batal</button>
      <button type="button" onClick={onSave} disabled={saving || disabled}
        className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  );
}
