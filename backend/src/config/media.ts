export const MEDIA_PURPOSES = [
  "COMMUNITY_AVATAR",
  "COMMUNITY_COVER",
  "TOPIC_FEATURED",
  "USER_AVATAR",
  "SCRAP_IMAGE",
] as const;

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

type ImageLimit = {
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
};

export const IMAGE_LIMITS: Record<MediaPurpose, ImageLimit> = {
  COMMUNITY_AVATAR: {
    maxBytes: 5 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
  },
  COMMUNITY_COVER: {
    maxBytes: 10 * 1024 * 1024,
    maxWidth: 8000,
    maxHeight: 8000,
  },
  TOPIC_FEATURED: {
    maxBytes: 10 * 1024 * 1024,
    maxWidth: 8000,
    maxHeight: 8000,
  },
  USER_AVATAR: {
    maxBytes: 5 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
  },
  SCRAP_IMAGE: {
    maxBytes: 10 * 1024 * 1024,
    maxWidth: 8000,
    maxHeight: 8000,
  },
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const MAX_UPLOAD_BYTES = Math.max(
  ...Object.values(IMAGE_LIMITS).map((limit) => limit.maxBytes),
);

export const pendingMediaMaxAgeMs = () =>
  Number(process.env.MEDIA_PENDING_MAX_AGE_HOURS ?? 24) * 60 * 60 * 1000;

export const orphanMediaMaxAgeMs = () =>
  Number(process.env.MEDIA_ORPHAN_MAX_AGE_HOURS ?? 168) * 60 * 60 * 1000;
