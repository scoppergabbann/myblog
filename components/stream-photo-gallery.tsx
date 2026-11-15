import { MAX_STREAM_PHOTOS, safeStreamPhotoUrl, type StreamPhoto } from '@/lib/stream-photos';

export function StreamPhotoGallery({ photos = [], title }: { photos?: StreamPhoto[]; title: string }) {
  const visible = photos.filter(photo => safeStreamPhotoUrl(photo.url)).slice(0, MAX_STREAM_PHOTOS);
  if (!visible.length) return null;
  return <div aria-label={`Dokumentasi ${title}`} className={`mt-5 grid gap-3 ${visible.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
    {visible.map((photo, index) => <figure key={photo.url} className={`min-w-0 ${visible.length === 3 && index === 0 ? 'col-span-2' : ''}`}>
      <a href={photo.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka foto ${index + 1}: ${photo.alt || title} (tab baru)`}
        className="block overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
        <img src={photo.url} alt={photo.alt || `Dokumentasi ${title}, foto ${index + 1}`} loading="lazy" decoding="async"
          className={`w-full object-cover transition-transform hover:scale-[1.02] ${visible.length === 1 || (visible.length === 3 && index === 0) ? 'aspect-[16/10] max-h-[480px]' : 'aspect-[4/3]'}`} />
      </a>
      {photo.alt && <figcaption className="mt-2 break-words text-xs leading-relaxed text-[var(--color-ink-3)]">{photo.alt}</figcaption>}
    </figure>)}
  </div>;
}
