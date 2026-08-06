import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mediaUrl, verifyScrapMediaAccess } from "../media/service.js";
import { canDeleteScrap, canEditScrap, canViewScrapbook, canWriteScrapbook } from "./rules.js";
import { decodeCursor, encodeCursor } from "./service.js";
import { createScrapSchema, updateScrapSchema } from "./validation.js";

const ownerID = "507f1f77bcf86cd799439011";
const viewerID = "507f1f77bcf86cd799439012";
const mediaID = "507f1f77bcf86cd799439013";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "scrap-test-secret";

describe("scraps", () => {
  it("aplica privacidade de visualização", () => {
    assert.equal(canViewScrapbook("EVERYONE", { viewerID: null, ownerID, isFriend: false, blocked: false }), true);
    assert.equal(canViewScrapbook("AUTHENTICATED", { viewerID: null, ownerID, isFriend: false, blocked: false }), false);
    assert.equal(canViewScrapbook("FRIENDS", { viewerID, ownerID, isFriend: false, blocked: false }), false);
    assert.equal(canViewScrapbook("FRIENDS", { viewerID, ownerID, isFriend: true, blocked: false }), true);
    assert.equal(canViewScrapbook("ONLY_ME", { viewerID: ownerID, ownerID, isFriend: false, blocked: false }), true);
  });

  it("aplica escrita, amizade, autoenvio e bloqueio", () => {
    assert.equal(canWriteScrapbook("AUTHENTICATED", { viewerID, ownerID, isFriend: false, blocked: false }), true);
    assert.equal(canWriteScrapbook("FRIENDS", { viewerID, ownerID, isFriend: true, blocked: false }), true);
    assert.equal(canWriteScrapbook("FRIENDS", { viewerID, ownerID, isFriend: false, blocked: false }), false);
    assert.equal(canWriteScrapbook("AUTHENTICATED", { viewerID, ownerID, isFriend: true, blocked: true }), false);
    assert.equal(canWriteScrapbook("AUTHENTICATED", { viewerID: ownerID, ownerID, isFriend: false, blocked: false }), false);
    assert.equal(canWriteScrapbook("NOBODY", { viewerID, ownerID, isFriend: true, blocked: false }), false);
  });

  it("restringe edição e exclusão às partes permitidas", () => {
    assert.equal(canEditScrap(viewerID, viewerID), true);
    assert.equal(canEditScrap(ownerID, viewerID), false);
    assert.equal(canDeleteScrap(viewerID, viewerID, ownerID), true);
    assert.equal(canDeleteScrap(ownerID, viewerID, ownerID), true);
    assert.equal(canDeleteScrap("507f1f77bcf86cd799439014", viewerID, ownerID), false);
    assert.equal(canDeleteScrap("507f1f77bcf86cd799439014", viewerID, ownerID, true), true);
  });

  it("aceita texto, imagem ou ambos e rejeita conteúdo vazio", () => {
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID, content: "Olá" }).success, true);
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID, mediaIDs: [mediaID] }).success, true);
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID, content: "Olá", mediaIDs: [mediaID] }).success, true);
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID }).success, false);
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID, content: "<script>alert(1)</script>" }).success, false);
    assert.equal(createScrapSchema.safeParse({ recipientUserID: ownerID, content: "x", mediaIDs: Array(5).fill(mediaID) }).success, false);
    assert.equal(updateScrapSchema.safeParse({ scrapID: ownerID, content: null, mediaIDs: [] }).success, false);
  });

  it("gera cursor opaco com data e id", () => {
    const cursor = encodeCursor({ _id: ownerID, createdAt: new Date("2026-08-06T12:00:00.000Z") });
    const decoded = decodeCursor(cursor);
    assert.equal(decoded.id.toString(), ownerID);
    assert.equal(decoded.createdAt.toISOString(), "2026-08-06T12:00:00.000Z");
    assert.throws(() => decodeCursor("cursor-invalido"));
  });

  it("protege imagens de scraps com acesso temporário assinado", () => {
    const url = new URL(mediaUrl({ _id: mediaID, purpose: "SCRAP_IMAGE" }));
    const access = url.searchParams.get("access");
    assert.equal(verifyScrapMediaAccess(access, mediaID), true);
    assert.equal(verifyScrapMediaAccess(access, ownerID), false);
    assert.equal(verifyScrapMediaAccess(null, mediaID), false);
  });
});
