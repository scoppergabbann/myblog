'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { streamCategories, type StreamEntry, type StreamInput, type StreamCategory } from '@/lib/now-stream';
import { StreamIcon } from '@/components/stream-icon';
import { formatDate } from '@/lib/utils';
import { saveStreamEntry, deleteStreamEntry } from './stream-actions';

function emptyEntry(): StreamInput {
  return { title: '', category: 'life', project: '', project_url: '', content: '', published_on: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), published: false };
}
const button = 'rounded-md border border-[var(--color-line-2)] px-3 py-2 text-xs transition-colors hover:bg-[var(--color-paper-2)] disabled:opacity-40';
export function StreamEditor({ entries }: { entries: StreamEntry[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<StreamInput>(emptyEntry);
  const [baseline, setBaseline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  useEffect(() => {
    if (editing === null || JSON.stringify(form) === baseline) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editing, form, baseline]);
  function change<K extends keyof StreamInput>(key: K, value: StreamInput[K]) { setForm(prev => ({ ...prev, [key]: value })); }
  function canClose() { return editing === null || JSON.stringify(form) === baseline || window.confirm('Buang perubahan yang belum disimpan?'); }
  function open(entry?: StreamEntry) {
    if (!canClose()) return;
    const next = entry ? { title: entry.title, category: entry.category, project: entry.project, project_url: entry.project_url, content: entry.content, published_on: entry.published_on, published: entry.published } : emptyEntry();
    setForm(next); setBaseline(JSON.stringify(next)); setEditing(entry?.id ?? 'new'); setError(''); setNotice('');
  }
  async function save() {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await saveStreamEntry(editing === 'new' ? null : editing, form);
      if (!result.ok) { setError(result.error); return; }
      setEditing(null); setNotice('Catatan berhasil disimpan.'); router.refresh();
    } catch { setError('Gagal menyimpan. Coba lagi; isian kamu tetap tersimpan di form.'); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await deleteStreamEntry(id);
      if (!result.ok) { setError(result.error); return; }
      setDeleting(null); setNotice('Catatan berhasil dihapus.'); router.refresh();
    } catch { setError('Gagal menghapus catatan. Coba lagi.'); }
    finally { setBusy(false); }
  }
  return <section>
    <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-[var(--color-ink-3)]">{entries.length} catatan · {entries.filter(e => e.published).length} dipublikasikan</p><button type="button" className={button} disabled={busy} onClick={() => open()}>+ Tambah catatan</button></div>
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="mb-4 text-sm text-[var(--color-accent)]">{notice}</p>}
    {editing !== null && <form onSubmit={event => { event.preventDefault(); startTransition(() => save()); }} className="mb-8 rounded-xl border border-[var(--color-line-2)] bg-[var(--color-paper)] p-5">
      <h2 className="mb-5 text-lg font-medium">{editing === 'new' ? 'Catatan baru' : 'Edit catatan'}</h2>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm">Judul<input required autoFocus maxLength={160} value={form.title} onChange={e => change('title', e.target.value)} className="input-base mt-1" placeholder="Apa yang baru?" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Kategori<select value={form.category} onChange={e => change('category', e.target.value as StreamCategory)} className="input-base mt-1">{Object.entries(streamCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="block text-sm">Tanggal<input required type="date" value={form.published_on} onChange={e => change('published_on', e.target.value)} className="input-base mt-1" /></label>
          <label className="block text-sm">Proyek / konteks <span className="text-[var(--color-ink-3)]">(opsional)</span><input maxLength={100} value={form.project} onChange={e => change('project', e.target.value)} className="input-base mt-1" placeholder="Personal Website" /></label>
          <label className="block text-sm">URL proyek <span className="text-[var(--color-ink-3)]">(opsional)</span><input type="url" maxLength={1000} value={form.project_url} onChange={e => change('project_url', e.target.value)} className="input-base mt-1" placeholder="https://..." /></label>
        </div>
        <label className="block text-sm">Isi catatan<textarea required rows={10} maxLength={20000} value={form.content} onChange={e => change('content', e.target.value)} className="input-base mt-1 resize-y font-mono" aria-describedby="stream-markdown-help" placeholder="Ceritakan pembaruannya..." /></label>
        <p id="stream-markdown-help" className="text-xs leading-relaxed text-[var(--color-ink-3)]">Mendukung Markdown: **tebal**, *miring*, [tautan](https://...), `kode`, dan daftar dengan tanda -. Pisahkan paragraf dengan baris kosong.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e => change('published', e.target.checked)} />Publikasikan di Stream dan RSS</label>
        <div className="flex gap-2"><button type="submit" className={`${button} bg-[var(--color-ink)] text-[var(--color-paper)] hover:opacity-80`}>{busy ? 'Menyimpan...' : 'Simpan catatan'}</button><button type="button" className={button} onClick={() => { if (canClose()) { setEditing(null); setError(''); } }}>Batal</button></div>
      </fieldset>
    </form>}
    {!entries.length && <p className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-ink-3)]">Belum ada catatan. Mulai dengan pembaruan pertama.</p>}
    <div className="divide-y divide-[var(--color-line)]">
      {entries.map(entry => <article key={entry.id} className="flex items-start gap-3 py-5 max-sm:flex-wrap">
        <span className="mt-1 text-[var(--color-ink-3)]"><StreamIcon category={entry.category} /></span>
        <div className="min-w-0 flex-1"><h3 className="break-words font-medium">{entry.title}</h3><p className="mt-1 text-xs text-[var(--color-ink-3)]">{formatDate(`${entry.published_on}T12:00:00`)} · {streamCategories[entry.category]} · {entry.published ? 'Published' : 'Draft'}</p><p className="mt-2 line-clamp-2 break-words text-sm text-[var(--color-ink-3)]">{entry.content}</p></div>
        <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:pl-8">{deleting === entry.id ? <><span className="self-center text-xs">Hapus catatan ini?</span><button type="button" disabled={busy} className={`${button} text-red-600`} onClick={() => startTransition(() => remove(entry.id))}>Ya, hapus</button><button type="button" disabled={busy} className={button} onClick={() => setDeleting(null)}>Batal</button></> : <><button type="button" disabled={busy} className={button} onClick={() => open(entry)}>Edit</button><button type="button" disabled={busy || editing !== null} className={`${button} text-red-600`} onClick={() => setDeleting(entry.id)}>Hapus</button></>}</div>
      </article>)}
    </div>
  </section>;
}

