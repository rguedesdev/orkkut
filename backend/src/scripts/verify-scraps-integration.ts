import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

import { MediaModel } from "../graphql/modules/media/model.js";
import { FriendshipModel, UserBlockModel } from "../graphql/modules/relationship/model.js";
import { ScrapMediaModel, ScrapModel, ScrapbookSettingsModel } from "../graphql/modules/scrap/model.js";
import ScrapService from "../graphql/modules/scrap/service.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { OrkkutDB } from "../plugins/mongoose.js";

await OrkkutDB.asPromise();
const marker = randomUUID().replaceAll("-", "").slice(0, 12);
const passwordHash = await bcrypt.hash("scrap-test-only", 4);
const users = await UserModel.insertMany(["a", "b", "c", "d"].map((suffix) => ({
  name: `Scrap ${suffix.toUpperCase()}`,
  username: `scrap.${marker}.${suffix}`,
  email: `scrap.${marker}.${suffix}@example.test`,
  passwordHash,
  attributes: {},
})));
const a = users[0]!._id.toString();
const b = users[1]!._id.toString();
const c = users[2]!._id.toString();
const d = users[3]!._id.toString();
const pairKey = [a, b].sort().join(":");
const mediaIDs: string[] = [];

const createMedia = async (ownerID: string, status: "READY" | "PENDING" = "READY") => {
  const media = await MediaModel.create({
    ownerID,
    storageKey: `integration/scraps/${randomUUID()}.webp`,
    originalName: "scrap.webp",
    mimeType: "image/webp",
    size: 100,
    width: 10,
    height: 10,
    purpose: "SCRAP_IMAGE",
    status,
    resourceType: null,
    resourceID: null,
    orphanedAt: new Date(),
  });
  mediaIDs.push(media._id.toString());
  return media._id.toString();
};

try {
  await FriendshipModel.create({ pairKey, requesterUserID: a, addresseeUserID: b, status: "ACCEPTED", acceptedAt: new Date() });
  await ScrapbookSettingsModel.insertMany([
    { userID: a, viewPermission: "AUTHENTICATED", writePermission: "FRIENDS" },
    { userID: b, viewPermission: "AUTHENTICATED", writePermission: "FRIENDS" },
    { userID: c, viewPermission: "AUTHENTICATED", writePermission: "AUTHENTICATED" },
    { userID: d, viewPermission: "EVERYONE", writePermission: "AUTHENTICATED" },
  ]);

  const text = await ScrapService.createScrap({ recipientUserID: b, content: "Olá!", clientMutationID: randomUUID() }, a);
  assert.equal(text.content, "Olá!");
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: a, content: "eu" }, a));
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: b, content: "não amigo" }, c));

  const ownMedia = await createMedia(a);
  const image = await ScrapService.createScrap({ recipientUserID: b, mediaIDs: [ownMedia], clientMutationID: randomUUID() }, a);
  assert.equal(image.media.length, 1);
  const both = await ScrapService.createScrap({ recipientUserID: b, content: "texto e imagem", mediaIDs: [await createMedia(a)], clientMutationID: randomUUID() }, a);
  assert.equal(both.media.length, 1);
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: b }, a));
  const otherUsersMedia = await createMedia(c);
  const pendingMedia = await createMedia(a, "PENDING");
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: b, mediaIDs: [otherUsersMedia] }, a));
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: b, mediaIDs: [pendingMedia] }, a));

  const firstPage = await ScrapService.listScraps({ userID: b, first: 1 }, a);
  assert.equal(firstPage.edges.length, 1);
  assert.equal(firstPage.pageInfo.hasNextPage, true);
  const secondPage = await ScrapService.listScraps({ userID: b, first: 1, after: firstPage.pageInfo.endCursor }, a);
  assert.equal(secondPage.edges.length, 1);

  const edited = await ScrapService.updateScrap({ scrapID: text.id, content: "Corrigido" }, a);
  assert.equal(edited.content, "Corrigido");
  assert.ok(edited.editedAt);
  await assert.rejects(() => ScrapService.updateScrap({ scrapID: text.id, content: "indevido" }, b));

  const reply = await ScrapService.createScrap({ recipientUserID: a, content: "Resposta", replyToScrapID: text.id }, b);
  assert.equal(reply.replyToScrapID, text.id);
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: a, content: "terceiro", replyToScrapID: text.id }, c));

  await ScrapService.updateSettings(b, { viewPermission: "ONLY_ME", writePermission: "FRIENDS", allowNotifications: true });
  const privateList = await ScrapService.listScraps({ userID: b, first: 10 }, c);
  assert.equal(privateList.viewerState.canView, false);
  assert.equal(privateList.edges.length, 0);

  await UserBlockModel.create({ blockerUserID: c, blockedUserID: d });
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: d, content: "bloqueado" }, c));
  await UserBlockModel.deleteOne({ blockerUserID: c, blockedUserID: d });

  for (let index = 0; index < 3; index += 1) {
    await ScrapService.createScrap({ recipientUserID: d, content: `rate ${index}`, clientMutationID: randomUUID() }, c);
  }
  await assert.rejects(() => ScrapService.createScrap({ recipientUserID: d, content: "rate excedido" }, c));

  const idempotencyID = randomUUID();
  const once = await ScrapService.createScrap({ recipientUserID: b, content: "uma vez", clientMutationID: idempotencyID }, a);
  const twice = await ScrapService.createScrap({ recipientUserID: b, content: "uma vez", clientMutationID: idempotencyID }, a);
  assert.equal(once.id, twice.id);

  const deletion = await ScrapService.deleteScrap(image.id, b);
  assert.equal(deletion.deletedScrapID, image.id);
  assert.ok((await ScrapModel.findById(image.id).lean())?.deletedAt);
  assert.equal(await ScrapMediaModel.countDocuments({ scrapID: image.id }), 0);
  await assert.rejects(() => ScrapService.deleteScrap(text.id, c));

  console.log("Integração de scraps validada com sucesso.");
} finally {
  await ScrapMediaModel.deleteMany({ scrapID: { $in: await ScrapModel.find({ $or: [{ authorUserID: { $in: [a, b, c, d] } }, { recipientUserID: { $in: [a, b, c, d] } }] }).distinct("_id") } });
  await ScrapModel.deleteMany({ $or: [{ authorUserID: { $in: [a, b, c, d] } }, { recipientUserID: { $in: [a, b, c, d] } }] });
  await MediaModel.deleteMany({ _id: { $in: mediaIDs } });
  await ScrapbookSettingsModel.deleteMany({ userID: { $in: [a, b, c, d] } });
  await FriendshipModel.deleteMany({ pairKey });
  await UserBlockModel.deleteMany({ $or: [{ blockerUserID: { $in: [a, b, c, d] } }, { blockedUserID: { $in: [a, b, c, d] } }] });
  await UserModel.deleteMany({ _id: { $in: users.map((user) => user._id) } });
  await OrkkutDB.close();
}
