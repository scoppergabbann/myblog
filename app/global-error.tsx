'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#fbfaf7',
          color: '#14130f',
          margin: 0,
          padding: '6rem 1.5rem',
          maxWidth: 680,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <p style={{ fontSize: 13, color: '#595650', marginBottom: 16 }}>
          ~/critical-error
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 500, marginBottom: 16, letterSpacing: '-0.035em' }}>
          Sesuatu yang serius terjadi
        </h1>
        <p style={{ fontSize: 15.5, color: '#2a2823', lineHeight: 1.7, marginBottom: 24 }}>
          Aplikasi gagal dimuat sepenuhnya. Coba muat ulang halaman.
        </p>
        {error.digest && (
          <p style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#8a8780', marginBottom: 24 }}>
            error id: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#14130f',
            color: '#fbfaf7',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
