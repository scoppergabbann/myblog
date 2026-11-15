'use client';

import { createContext, startTransition, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { saveStreamEntry, deleteStreamEntry } from '@/app/admin/(protected)/now/stream-actions';
import { streamCategories, type StreamCategory, type StreamEntry, type StreamInput } from '@/lib/now-stream';
import { StreamPhotoPicker } from '@/components/stream-photo-picker';
import { activityPresets, applyActivityPreset, newStreamActivity } from '@/lib/stream-activity';

type Editor = { kind: 'edit'; entry: StreamEntry | null } | { kind: 'delete'; entry: StreamEntry };
const AdminContext = createContext<((editor: Editor) => void) | null>(null);
const button = 'rounded-full border border-[var(--color-line-2)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-paper-2)] disabled:cursor-wait disabled:opacity-50';

export function StreamEntryActions({ entry }: { entry: StreamEntry }) {
  const open = useContext(AdminContext);
  if (!open || entry.id <= 0) return null;
  return <div className="mt-5 flex gap-2" aria-label={`Kelola ${entry.title}`}>
    <button type="button" className={button} onClick={() => open({ kind: 'edit', entry })} aria-label={`Edit ${entry.title}`}>Edit</button>
    <button type="button" className={`${button} text-[var(--color-ink-3)]`} onClick={() => open({ kind: 'delete', entry })} aria-label={`Hapus ${entry.title}`}>Hapus</button>
  </div>;
}

export function StreamAdmin({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setMounted(true); }, []);

  function open(next: Editor) { setNotice(''); setEditor(next); }

  return <AdminContext.Provider value={open}>
    {children}
    {mounted && createPortal(<>
      <button type="button" onClick={() => open({ kind: 'edit', entry: null })}
        aria-label="Tambah aktivitas" title="Tambah aktivitas" aria-haspopup="dialog"
        className="stream-compose-button fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
        <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      {notice && <div role="status" className="fixed bottom-24 right-6 z-[60] max-w-[calc(100vw-3rem)] rounded-2xl border border-[var(--color-line-2)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)] shadow-lg">
        {notice}<button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice('')} className="ml-4 px-2 py-1">×</button>
      </div>}
      {editor && <ActivityDialog editor={editor} close={() => setEditor(null)} done={message => { setEditor(null); setNotice(message); }} />}
    </>, document.body)}
  </AdminContext.Provider>;
}

function ActivityDialog({ editor, close, done }: { editor: Editor; close: () => void; done: (message: string) => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const [form, setForm] = useState<StreamInput>(() => editor.entry ? {
    title: editor.entry.title, category: editor.entry.category, project: editor.entry.project,
    project_url: editor.entry.project_url, content: editor.entry.content,
    published_on: editor.entry.published_on, published: editor.entry.published,
    ...(editor.entry.photos === undefined ? {} : { photos: editor.entry.photos }),
  } : newStreamActivity());
  const [baseline] = useState(() => JSON.stringify(form));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const deleting = editor.kind === 'delete';
  const dirty = !deleting && JSON.stringify(form) !== baseline;

  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (!dirty && !uploading) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, uploading]);

  function requestClose() {
    if (saving.current || uploading) return;
    if (!dirty || window.confirm('Buang perubahan yang belum disimpan?')) close();
  }
  function change<K extends keyof StreamInput>(key: K, value: StreamInput[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
  }
  async function submit() {
    if (saving.current || uploading) return;
    saving.current = true;
    setBusy(true); setError('');
    try {
      const result = deleting
        ? await deleteStreamEntry(editor.entry.id)
        : await saveStreamEntry(editor.entry?.id ?? null, form);
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
      done(deleting ? 'Aktivitas berhasil dihapus.' : editor.entry ? 'Aktivitas berhasil diperbarui.' : 'Aktivitas berhasil diposting ke Stream.');
    } catch {
      setError('Gagal menyimpan perubahan. Pastikan sesi admin masih aktif, lalu coba lagi. Isian tetap ada di form.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <dialog ref={dialog} aria-labelledby="activity-dialog-title" aria-describedby={deleting ? 'activity-delete-description' : undefined}
    onCancel={event => { event.preventDefault(); requestClose(); }}
    className="stream-activity-dialog m-auto w-[calc(100%-2rem)] max-w-[560px] rounded-3xl border border-[var(--color-line-2)] bg-[var(--color-paper)] p-0 text-[var(--color-ink)] shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm">
    <form onSubmit={event => { event.preventDefault(); startTransition(() => { void submit(); }); }} className="p-6 max-sm:p-5" aria-busy={busy}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><p className="mb-1 text-xs font-medium tracking-wide text-[var(--color-accent)]">STREAM · ADMIN</p>
          <h2 id="activity-dialog-title" className="text-xl font-semibold tracking-tight">{deleting ? 'Hapus aktivitas?' : editor.entry ? 'Edit aktivitas' : 'Lagi ngapain?'}</h2>
          {!deleting && <p className="mt-1 text-sm text-[var(--color-ink-3)]">Bagikan cerita kecil dari keseharianmu.</p>}
        </div>
        <button type="button" disabled={busy || uploading} onClick={requestClose} aria-label="Tutup" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl hover:bg-[var(--color-paper-2)] disabled:opacity-50">×</button>
      </div>
      {deleting ? <p id="activity-delete-description" className="mb-6 break-words text-sm leading-relaxed">“{editor.entry.title}” akan dihapus dari Stream dan RSS. Tindakan ini tidak dapat dibatalkan.</p> :
        <fieldset disabled={busy || uploading} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Aktivitas</legend>
            <div className="flex flex-wrap gap-2">
              {[...activityPresets, { label: 'Lainnya', context: '', symbol: '+' }].map(preset => {
                const selected = form.category === 'life' && form.project === preset.context;
                return <button key={preset.label} type="button" aria-pressed={selected} onClick={() => setForm(previous => applyActivityPreset(previous, preset.context))}
                  className={`${button} ${selected ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : ''}`}>
                  <span aria-hidden="true" className="mr-1.5">{preset.symbol}</span>{preset.label}
                </button>;
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-3)]">Jogging dan tenis masuk aktivitas olahraga.</p>
          </fieldset>
          <label className="block text-sm font-medium">Judul<input autoFocus required maxLength={160} value={form.title} onChange={event => change('title', event.target.value)} className="input-base mt-2" placeholder="Misalnya: Jogging pagi di taman" /></label>
          <label className="block text-sm font-medium">Cerita<textarea required rows={5} maxLength={20000} value={form.content} onChange={event => change('content', event.target.value)} className="input-base mt-2 resize-y font-normal" placeholder="Apa yang seru hari ini?" aria-describedby="activity-content-help" /></label>
          <p id="activity-content-help" className="!mt-2 text-xs text-[var(--color-ink-3)]">Bisa pakai Markdown untuk **tebal**, daftar, dan tautan.</p>
          <StreamPhotoPicker photos={form.photos ?? []} onChange={photos => change('photos', photos)} onBusyChange={setUploading} disabled={busy} />
          <details className="rounded-xl border border-[var(--color-line)] p-3">
            <summary className="cursor-pointer text-sm text-[var(--color-ink-3)]">Tanggal & detail tambahan</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">Tanggal<input required type="date" value={form.published_on} onChange={event => change('published_on', event.target.value)} className="input-base mt-1" /></label>
              <label className="block text-sm">Kategori<select value={form.category} onChange={event => change('category', event.target.value as StreamCategory)} className="input-base mt-1">{Object.entries(streamCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block text-sm">Konteks / proyek<input maxLength={100} value={form.project} onChange={event => change('project', event.target.value)} className="input-base mt-1" placeholder="Opsional" /></label>
              <label className="block text-sm">Tautan konteks<input type="url" maxLength={1000} value={form.project_url} onChange={event => change('project_url', event.target.value)} className="input-base mt-1" placeholder="https://..." /></label>
            </div>
          </details>
          <p className="text-xs leading-relaxed text-[var(--color-ink-3)]">Posting langsung tampil publik di Stream dan RSS.</p>
        </fieldset>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-6 flex justify-end gap-2 border-t border-[var(--color-line)] pt-4">
        <button type="button" autoFocus={deleting} disabled={busy || uploading} className={button} onClick={requestClose}>Batal</button>
        <button type="submit" disabled={busy || uploading} className={`${button} border-transparent ${deleting ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:opacity-85 hover:bg-[var(--color-ink)]'}`}>
          {uploading ? 'Mengunggah foto...' : busy ? 'Memproses...' : deleting ? 'Ya, hapus' : editor.entry ? 'Simpan perubahan' : 'Posting aktivitas'}
        </button>
      </div>
    </form>
  </dialog>;
}
