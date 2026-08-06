type MediaPurpose =
  | "COMMUNITY_AVATAR"
  | "COMMUNITY_COVER"
  | "TOPIC_FEATURED"
  | "USER_AVATAR"
  | "SCRAP_IMAGE";

type Media = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  purpose: MediaPurpose;
  status: "PENDING" | "READY" | "FAILED" | "DELETED";
};

export type { Media, MediaPurpose };
