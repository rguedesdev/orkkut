import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";

import { canEditCommunity, canEditTopic } from "../topic/permissions.js";
import { validateMediaAttachment } from "./rules.js";
import {
  persistProcessedImage,
  processImage,
  validateUploadDeclaration,
} from "../../../services/upload.js";

describe("regras de mídia", () => {
  it("autoriza gestão de comunidade por owner, moderador e admin", () => {
    assert.equal(
      canEditCommunity({ actorID: "owner", communityOwnerID: "owner", isModerator: false, isAdmin: false }),
      true,
    );
    assert.equal(
      canEditCommunity({ actorID: "mod", communityOwnerID: "owner", isModerator: true, isAdmin: false }),
      true,
    );
    assert.equal(
      canEditCommunity({ actorID: "admin", communityOwnerID: "owner", isModerator: false, isAdmin: true }),
      true,
    );
    assert.equal(
      canEditCommunity({ actorID: "member", communityOwnerID: "owner", isModerator: false, isAdmin: false }),
      false,
    );
  });

  it("autoriza imagem do tópico para autor, owner da comunidade e admin", () => {
    assert.equal(canEditTopic({ actorID: "author", authorID: "author", communityOwnerID: "owner", isAdmin: false }), true);
    assert.equal(canEditTopic({ actorID: "owner", authorID: "author", communityOwnerID: "owner", isAdmin: false }), true);
    assert.equal(canEditTopic({ actorID: "admin", authorID: "author", communityOwnerID: "owner", isAdmin: true }), true);
    assert.equal(canEditTopic({ actorID: "member", authorID: "author", communityOwnerID: "owner", isAdmin: false }), false);
  });

  it("bloqueia mídia pendente, de outro usuário, finalidade errada e reutilização", () => {
    const base = { ownerID: "u1", purpose: "TOPIC_FEATURED" as const, status: "READY", resourceID: null };
    assert.equal(validateMediaAttachment(base, "u1", "TOPIC_FEATURED"), null);
    assert.equal(validateMediaAttachment(base, "u2", "TOPIC_FEATURED")?.code, "FORBIDDEN");
    assert.equal(validateMediaAttachment({ ...base, status: "PENDING" }, "u1", "TOPIC_FEATURED")?.code, "BAD_USER_INPUT");
    assert.equal(validateMediaAttachment(base, "u1", "COMMUNITY_COVER")?.code, "BAD_USER_INPUT");
    assert.equal(validateMediaAttachment({ ...base, resourceID: "topic" }, "u1", "TOPIC_FEATURED")?.code, "CONFLICT");
  });

  it("rejeita extensão, MIME e tamanho inválidos", () => {
    assert.throws(() => validateUploadDeclaration("payload.svg", "image/svg+xml", 10, "COMMUNITY_AVATAR"));
    assert.throws(() => validateUploadDeclaration("photo.jpg", "application/octet-stream", 10, "COMMUNITY_AVATAR"));
    assert.throws(() => validateUploadDeclaration("photo.jpg", "image/jpeg", 6 * 1024 * 1024, "COMMUNITY_AVATAR"));
  });

  it("valida o conteúdo real e produz WebP sem metadados", async () => {
    const png = await sharp({ create: { width: 20, height: 10, channels: 4, background: "red" } }).png().toBuffer();
    const output = await processImage(png, "image/png", "TOPIC_FEATURED");
    assert.equal(output.mimeType, "image/webp");
    assert.equal(output.width, 20);
    assert.equal(output.height, 10);
    await assert.rejects(() => processImage(png, "image/jpeg", "TOPIC_FEATURED"));
  });

  it("propaga falha do serviço de armazenamento sem confirmar upload", async () => {
    const storage = { uploadFile: async () => { throw new Error("storage offline"); } };
    await assert.rejects(
      () => persistProcessedImage(storage, "safe/key.webp", {
        body: Buffer.from("image"), mimeType: "image/webp", size: 5, width: 1, height: 1,
      }),
      /storage offline/,
    );
  });
});
