// Shared types + constants for /ngedumel.
// Keep this file free of 'use server' so it can be imported by client components.

export const DUMEL_PAGE_SIZE = 20;

export type DumelResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type DumelImageInput = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

export type DumelFileInput = {
  url: string;
  publicId: string;
  name: string;
  size: number;
  mime: string;
};

export type UploadDumelImageResult =
  | { ok: true; url: string; publicId: string }
  | { ok: false; error: string };

export type UploadDumelFileResult =
  | { ok: true; url: string; publicId: string; name: string; size: number; mime: string }
  | { ok: false; error: string };

export type DumelFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

export type DumelWithImages = {
  id: number;
  content: string;
  created_at: string;
  images: Array<{
    id: number;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }>;
  file: DumelFile | null;
};

export type LoadMoreResult =
  | { ok: true; dumels: DumelWithImages[]; hasMore: boolean }
  | { ok: false; error: string };
