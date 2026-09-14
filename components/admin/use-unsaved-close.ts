'use client';

import { useEffect, useRef } from 'react';

export function useUnsavedClose(values: readonly unknown[], pending: boolean, busy: boolean, onClose: () => void) {
  const snapshot = JSON.stringify(values);
  const initial = useRef(snapshot);
  const dirty = snapshot !== initial.current || pending;

  useEffect(() => {
    if (!dirty && !busy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, busy]);

  return () => {
    if (busy) return;
    if (dirty && !window.confirm('Perubahan belum disimpan. Tutup dan buang perubahan? Pilih Batal untuk melanjutkan menulis.')) return;
    onClose();
  };
}
