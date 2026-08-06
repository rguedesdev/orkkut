import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";

import {
  MAX_UPLOAD_BYTES,
  MEDIA_PURPOSES,
  type MediaPurpose,
} from "../config/media.js";
import { MediaModel } from "../graphql/modules/media/model.js";
import MediaService, { serializeMedia, verifyScrapMediaAccess } from "../graphql/modules/media/service.js";
import { authenticateRequest } from "../services/auth/authenticate.js";
import { StorageService } from "../services/storage.js";
import {
  processImage,
  persistProcessedImage,
  sanitizeOriginalName,
  validateUploadDeclaration,
} from "../services/upload.js";

const registerUploadRoutes = async (app: FastifyInstance) => {
  await app.register(multipart, {
    limits: { files: 1, fields: 0, fileSize: MAX_UPLOAD_BYTES },
  });

  app.post("/uploads/images", async (request, reply) => {
    const user = authenticateRequest(request);
    if (!user) return reply.status(401).send({ error: "Usuário não autenticado." });

    const purpose = (request.query as { purpose?: string }).purpose as MediaPurpose;
    if (!MEDIA_PURPOSES.includes(purpose)) {
      return reply.status(400).send({ error: "Finalidade de upload inválida." });
    }
    if (user.kind === "onboarding" && purpose !== "USER_AVATAR") {
      return reply.status(403).send({ error: "O cadastro permite apenas foto de perfil." });
    }

    let part;
    try {
      part = await request.file();
    } catch (error) {
      request.log.warn({ error, userID: user.id }, "Upload rejeitado pelo parser");
      return reply.status(413).send({ error: "Arquivo ausente ou maior que 10 MB." });
    }
    if (!part) return reply.status(400).send({ error: "Envie uma imagem no campo file." });

    let source: Buffer;
    try {
      source = await part.toBuffer();
      validateUploadDeclaration(part.filename, part.mimetype, source.length, purpose);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arquivo inválido.";
      return reply.status(400).send({ error: message });
    }

    const storageKey = `users/${user.id}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.webp`;
    const media = await MediaModel.create({
      ownerID: user.id,
      storageKey,
      originalName: sanitizeOriginalName(part.filename),
      mimeType: part.mimetype,
      size: source.length,
      width: null,
      height: null,
      purpose,
      status: "PENDING",
      resourceType: null,
      resourceID: null,
      orphanedAt: null,
    });

    try {
      const processed = await processImage(source, part.mimetype, purpose);
      await persistProcessedImage(StorageService, storageKey, processed);
      media.set({
        mimeType: processed.mimeType,
        size: processed.size,
        width: processed.width,
        height: processed.height,
        status: "READY",
        failureReason: null,
        orphanedAt: new Date(),
      });
      await media.save();
      if (request.raw.aborted) {
        await MediaService.deleteUnattached(media.id, user.id);
        request.log.info({ mediaID: media.id, userID: user.id }, "Upload cancelado e removido");
        return reply.status(499).send({ error: "Upload cancelado." });
      }
      request.log.info({ mediaID: media.id, userID: user.id, purpose }, "Upload concluído");
      return reply.status(201).send({ media: serializeMedia(media.toObject()) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao processar imagem.";
      media.set({ status: "FAILED", failureReason: message });
      await media.save();
      request.log.error({ error, mediaID: media.id, userID: user.id }, "Falha no upload");
      return reply.status(400).send({ error: message });
    }
  });

  app.get("/uploads/images/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send();
    const media = await MediaModel.findOne({ _id: id, status: "READY" }).lean();
    if (!media) return reply.status(404).send();
    if (media.purpose === "SCRAP_IMAGE") {
      const { access } = request.query as { access?: string };
      if (!verifyScrapMediaAccess(access, id)) return reply.status(403).send();
    }

    try {
      const file = await StorageService.getFile(media.storageKey);
      return reply
        .header("Content-Type", file.contentType)
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .send(file.body);
    } catch (error) {
      request.log.error({ error, mediaID: id }, "Falha ao ler mídia");
      return reply.status(404).send();
    }
  });

  app.delete("/uploads/images/:id", async (request, reply) => {
    const user = authenticateRequest(request);
    if (!user) return reply.status(401).send({ error: "Usuário não autenticado." });

    const { id } = request.params as { id: string };
    try {
      const deleted = await MediaService.deleteUnattached(id, user.id);
      return reply.status(deleted ? 204 : 404).send();
    } catch (error: any) {
      const code = error?.extensions?.code;
      const status =
        code === "FORBIDDEN"
          ? 403
          : code === "CONFLICT"
            ? 409
            : code === "BAD_USER_INPUT"
              ? 400
              : 503;
      request.log.warn({ error, mediaID: id, userID: user.id }, "Exclusão de mídia rejeitada");
      return reply.status(status).send({ error: error?.message ?? "Falha ao excluir mídia." });
    }
  });
};

export { registerUploadRoutes };
