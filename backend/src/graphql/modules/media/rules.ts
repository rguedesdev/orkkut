import type { MediaPurpose } from "../../../config/media.js";

type AttachableMedia = {
  ownerID: unknown;
  purpose: MediaPurpose;
  status: string;
  resourceID?: unknown | null;
};

type MediaRuleError = {
  message: string;
  code: "FORBIDDEN" | "BAD_USER_INPUT" | "CONFLICT";
};

const validateMediaAttachment = (
  media: AttachableMedia,
  actorID: string,
  purpose: MediaPurpose,
): MediaRuleError | null => {
  if (String(media.ownerID) !== String(actorID)) {
    return { message: "Esta mídia pertence a outro usuário.", code: "FORBIDDEN" };
  }
  if (media.status !== "READY") {
    return {
      message: "A mídia ainda não está pronta para uso.",
      code: "BAD_USER_INPUT",
    };
  }
  if (media.purpose !== purpose) {
    return {
      message: "A mídia não pode ser usada nesta finalidade.",
      code: "BAD_USER_INPUT",
    };
  }
  if (media.resourceID) {
    return { message: "A mídia já está associada a outro recurso.", code: "CONFLICT" };
  }
  return null;
};

export { validateMediaAttachment };
export type { AttachableMedia, MediaRuleError };
