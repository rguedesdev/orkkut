import { Types, type ClientSession } from "mongoose";
import jwt from "jsonwebtoken";

import type { MediaPurpose } from "../../../config/media.js";
import { orphanMediaMaxAgeMs, pendingMediaMaxAgeMs } from "../../../config/media.js";
import { StorageService } from "../../../services/storage.js";
import { graphQLError } from "../../errors.js";
import { MediaModel, type MediaResourceType } from "./model.js";
import { validateMediaAttachment } from "./rules.js";

const mediaUrl = (media: any) => {
  const base = (
    process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 5000}`
  ).replace(/\/$/, "");
  const id = media._id?.toString() ?? media.id;
  const url = `${base}/uploads/images/${id}`;
  if (media.purpose !== "SCRAP_IMAGE") return url;
  const access = jwt.sign(
    { kind: "scrap-media", mediaID: id },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" },
  );
  return `${url}?access=${encodeURIComponent(access)}`;
};

const verifyScrapMediaAccess = (token: unknown, mediaID: string) => {
  if (typeof token !== "string" || !token) return false;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    return typeof payload === "object" && payload.kind === "scrap-media" && payload.mediaID === mediaID;
  } catch {
    return false;
  }
};

const serializeMedia = (media: any) => ({
  ...media,
  id: media._id?.toString() ?? media.id,
  url: mediaUrl(media),
});

class MediaService {
  static async getReadyMedia(id: unknown) {
    if (!Types.ObjectId.isValid(String(id))) return null;
    const media = await MediaModel.findOne({ _id: id, status: "READY" }).lean();
    return media ? serializeMedia(media) : null;
  }

  static async requireAttachable(
    mediaID: unknown,
    ownerID: string,
    purpose: MediaPurpose,
    session?: ClientSession,
  ) {
    if (!Types.ObjectId.isValid(String(mediaID))) {
      throw graphQLError("Mídia inválida.", "BAD_USER_INPUT");
    }
    const query = MediaModel.findById(mediaID);
    if (session) query.session(session);
    const media = await query.lean();
    if (!media) throw graphQLError("Mídia não encontrada.", "NOT_FOUND");
    const violation = validateMediaAttachment(media, ownerID, purpose);
    if (violation) throw graphQLError(violation.message, violation.code);
    return media;
  }

  static async attach(
    mediaID: unknown,
    ownerID: string,
    purpose: MediaPurpose,
    resourceType: MediaResourceType,
    resourceID: unknown,
    session?: ClientSession,
  ) {
    await this.requireAttachable(mediaID, ownerID, purpose, session);
    const media = await MediaModel.findOneAndUpdate(
      {
        _id: mediaID,
        ownerID,
        purpose,
        status: "READY",
        resourceID: null,
      },
      {
        $set: { resourceType, resourceID, orphanedAt: null },
      },
      { new: true, ...(session ? { session } : {}) },
    );
    if (!media) {
      throw graphQLError("A mídia foi associada por outra operação.", "CONFLICT");
    }
    return media;
  }

  static async orphan(
    mediaID: unknown,
    resourceType?: MediaResourceType,
    resourceID?: unknown,
    session?: ClientSession,
  ) {
    if (!mediaID) return;
    const filter: Record<string, unknown> = { _id: mediaID, status: "READY" };
    if (resourceType) filter.resourceType = resourceType;
    if (resourceID) filter.resourceID = resourceID;
    const query = MediaModel.updateOne(filter, {
      $set: {
        resourceType: null,
        resourceID: null,
        orphanedAt: new Date(),
      },
    });
    if (session) query.session(session);
    await query;
  }

  static async deleteUnattached(mediaID: unknown, ownerID: string) {
    if (!Types.ObjectId.isValid(String(mediaID))) {
      throw graphQLError("Mídia inválida.", "BAD_USER_INPUT");
    }

    const media = await MediaModel.findOneAndUpdate(
      {
        _id: mediaID,
        ownerID,
        resourceID: null,
        status: { $in: ["READY", "FAILED"] },
      },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
          resourceType: null,
          resourceID: null,
        },
      },
      { new: true },
    );

    if (!media) {
      const existing = await MediaModel.findById(mediaID)
        .select("ownerID resourceID status")
        .lean();
      if (!existing || existing.status === "DELETED") return false;
      if (String(existing.ownerID) !== String(ownerID)) {
        throw graphQLError("Esta mídia pertence a outro usuário.", "FORBIDDEN");
      }
      if (existing.resourceID) {
        throw graphQLError("Uma mídia associada não pode ser excluída diretamente.", "CONFLICT");
      }
      throw graphQLError("A mídia ainda está sendo processada.", "CONFLICT");
    }

    try {
      await StorageService.deleteFile(media.storageKey);
    } catch (error) {
      await MediaModel.updateOne(
        { _id: media._id, status: "DELETED" },
        {
          $set: {
            status: "FAILED",
            deletedAt: null,
            orphanedAt: new Date(0),
            failureReason:
              error instanceof Error ? error.message : "Falha ao excluir arquivo.",
          },
        },
      );
      throw error;
    }

    return true;
  }

  static async cleanup(now = new Date()) {
    const stalePending = new Date(now.getTime() - pendingMediaMaxAgeMs());
    const staleOrphan = new Date(now.getTime() - orphanMediaMaxAgeMs());
    const candidates = await MediaModel.find({
      $or: [
        { status: { $in: ["PENDING", "FAILED"] }, createdAt: { $lte: stalePending } },
        {
          status: "READY",
          resourceID: null,
          orphanedAt: { $ne: null, $lte: staleOrphan },
        },
      ],
    }).lean();

    let deleted = 0;
    let failed = 0;
    for (const media of candidates) {
      try {
        await StorageService.deleteFile(media.storageKey);
        await MediaModel.updateOne(
          { _id: media._id, status: { $ne: "DELETED" } },
          { $set: { status: "DELETED", deletedAt: now } },
        );
        deleted += 1;
      } catch (error) {
        failed += 1;
        console.error("Falha ao limpar mídia", media._id.toString(), error);
      }
    }
    return { scanned: candidates.length, deleted, failed };
  }
}

export { mediaUrl, serializeMedia, verifyScrapMediaAccess };
export default MediaService;
