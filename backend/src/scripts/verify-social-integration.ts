import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import buildApp from "../app.js";
import { ProfileFanModel, ProfileRatingModel } from "../graphql/modules/profile-interaction/model.js";
import ProfileInteractionService from "../graphql/modules/profile-interaction/service.js";
import { ProfileModel } from "../graphql/modules/profile/model.js";
import { FriendshipModel, UserBlockModel } from "../graphql/modules/relationship/model.js";
import RelationshipService from "../graphql/modules/relationship/service.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { OrkkutDB } from "../plugins/mongoose.js";
import { createUserToken } from "../services/auth/create-user-token.js";

await OrkkutDB.asPromise();
const marker = randomUUID().replaceAll("-", "").slice(0, 10);
const app = await buildApp();
await app.ready();

const users = await UserModel.create([
  { name: "Social A", username: `social.${marker}.a`, passwordHash: "unused", attributes: {} },
  { name: "Social B", username: `social.${marker}.b`, passwordHash: "unused", attributes: {} },
  { name: "Social C", username: `social.${marker}.c`, passwordHash: "unused", attributes: {} },
]);
const userA = users[0]!;
const userB = users[1]!;
const userC = users[2]!;
await ProfileModel.create(users.map((user) => ({ userID: user._id, visibility: {} })));
const a = userA._id.toString();
const b = userB._id.toString();
const c = userC._id.toString();

try {
  await assert.rejects(() => RelationshipService.sendFriendRequest(a, a), /próprio perfil/);
  const requestAB = await RelationshipService.sendFriendRequest(a, b);
  assert.ok(requestAB);
  await assert.rejects(() => RelationshipService.sendFriendRequest(a, b), /já foi enviada/);
  await assert.rejects(() => RelationshipService.sendFriendRequest(b, a), /já recebeu/);
  assert.equal((await RelationshipService.sentRequests(a)).length, 1);
  assert.equal((await RelationshipService.receivedRequests(b)).length, 1);
  await assert.rejects(
    () => RelationshipService.acceptFriendRequest(c, requestAB!._id),
    /não encontrada/,
  );
  await RelationshipService.acceptFriendRequest(b, requestAB!._id);
  assert.equal(await RelationshipService.areFriends(a, b), true);
  assert.equal((await RelationshipService.getRelationship(a, b)).status, "FRIENDS");

  await Promise.all([
    ProfileInteractionService.becomeFan(a, b),
    ProfileInteractionService.becomeFan(a, b),
  ]);
  await ProfileInteractionService.becomeFan(b, a);
  assert.equal(await ProfileFanModel.countDocuments({ actorUserID: a, targetUserID: b }), 1);
  assert.equal(await ProfileFanModel.countDocuments({ actorUserID: b, targetUserID: a }), 1);
  await assert.rejects(() => ProfileInteractionService.becomeFan(a, a), /próprio perfil/);
  await assert.rejects(
    () => ProfileInteractionService.becomeFan(c, b),
    /Somente amigos/,
  );

  await ProfileInteractionService.setRating(a, { targetUserID: b, category: "COOL", value: 1 });
  await ProfileInteractionService.setRating(a, { targetUserID: b, category: "COOL", value: 3 });
  await ProfileInteractionService.setRating(a, { targetUserID: b, category: "SEXY", value: 2 });
  await ProfileInteractionService.setRating(a, { targetUserID: b, category: "TRUSTWORTHY", value: 2 });
  assert.equal(await ProfileRatingModel.countDocuments({ actorUserID: a, targetUserID: b, category: "COOL" }), 1);
  const summary = await ProfileInteractionService.getSummary(b, a);
  assert.equal(summary?.fanCount, 1);
  assert.equal(summary?.viewerIsFan, true);
  assert.equal(summary?.legal.count, 1);
  assert.equal(summary?.legal.average, 3);
  assert.equal(summary?.legal.percentage, 100);
  assert.equal(summary?.legal.level3Count, 1);
  assert.equal(summary?.legal.viewerValue, 3);
  await ProfileModel.updateOne({ userID: b }, { $set: { "visibility.socialCool": "PRIVATE" } });
  const privateSummary = await ProfileInteractionService.getSummary(b, a);
  const ownerSummary = await ProfileInteractionService.getSummary(b, b);
  assert.equal(privateSummary?.legal.visible, false);
  assert.equal(privateSummary?.legal.count, null);
  assert.equal(privateSummary?.legal.percentage, null);
  assert.equal(privateSummary?.legal.viewerValue, 3);
  assert.equal(ownerSummary?.legal.visible, true);
  assert.equal(ownerSummary?.legal.count, 1);
  await ProfileModel.updateOne({ userID: b }, { $set: { "visibility.socialCool": "PUBLIC" } });
  await assert.rejects(
    () => ProfileInteractionService.setRating(c, { targetUserID: b, category: "COOL", value: 2 }),
    /Somente amigos/,
  );
  assert.throws(
    () => ProfileInteractionService.setRating(a, { targetUserID: b, category: "COOL", value: 4 }),
  );

  await RelationshipService.removeFriend(b, a);
  assert.equal(await RelationshipService.areFriends(a, b), false);
  assert.equal(await ProfileFanModel.countDocuments({ $or: [{ actorUserID: a, targetUserID: b }, { actorUserID: b, targetUserID: a }] }), 0);
  assert.equal(await ProfileRatingModel.countDocuments({ $or: [{ actorUserID: a, targetUserID: b }, { actorUserID: b, targetUserID: a }] }), 0);

  const canceled = await RelationshipService.sendFriendRequest(a, c);
  await RelationshipService.cancelFriendRequest(a, canceled!._id);
  assert.equal((await RelationshipService.getRelationship(a, c)).status, "NONE");
  const declined = await RelationshipService.sendFriendRequest(c, a);
  await RelationshipService.declineFriendRequest(a, declined!._id);
  assert.equal((await RelationshipService.getRelationship(c, a)).status, "NONE");

  const secondAB = await RelationshipService.sendFriendRequest(a, b);
  await RelationshipService.acceptFriendRequest(b, secondAB!._id);
  await ProfileInteractionService.becomeFan(a, b);
  await ProfileInteractionService.setRating(a, { targetUserID: b, category: "COOL", value: 2 });
  await RelationshipService.blockUser(b, a);
  assert.equal(await RelationshipService.areFriends(a, b), false);
  assert.equal((await RelationshipService.getRelationship(b, a)).status, "BLOCKED_BY_VIEWER");
  assert.equal(await ProfileFanModel.countDocuments({ targetUserID: b }), 0);
  assert.equal(await ProfileRatingModel.countDocuments({ targetUserID: b }), 0);
  await assert.rejects(() => RelationshipService.sendFriendRequest(a, b), /bloqueio/);
  await RelationshipService.unblockUser(b, a);
  assert.equal((await RelationshipService.getRelationship(b, a)).status, "NONE");
  assert.equal(await RelationshipService.areFriends(a, b), false);

  const pendingAC = await RelationshipService.sendFriendRequest(a, c);
  await RelationshipService.blockUser(c, a);
  assert.equal((await FriendshipModel.findById(pendingAC!._id).lean())?.status, "CANCELED");
  await RelationshipService.unblockUser(c, a);

  const crossedRace = await Promise.allSettled([
    RelationshipService.sendFriendRequest(a, c),
    RelationshipService.sendFriendRequest(c, a),
  ]);
  assert.equal(crossedRace.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(crossedRace.filter((result) => result.status === "rejected").length, 1);
  assert.equal(await FriendshipModel.countDocuments({
    pairKey: [a, c].sort().join(":"),
    status: "PENDING",
  }), 1);

  const token = createUserToken(userA);
  const graphql = await app.inject({
    method: "POST",
    url: "/graphql",
    headers: { authorization: `Bearer ${token}` },
    payload: { query: `query($userID: ID!) { relationshipWith(userID: $userID) { status canSendRequest } myFriends { id } myBlockedUsers { id } }`, variables: { userID: b } },
  });
  assert.equal(graphql.statusCode, 200, graphql.body);
  assert.equal(graphql.json().errors, undefined, graphql.body);

  console.log("Amizades, solicitações, bloqueios, fãs, avaliações, agregados e limpezas validados.");
} finally {
  const ids = users.map((user) => user._id);
  await Promise.all([
    ProfileFanModel.deleteMany({ $or: [{ actorUserID: { $in: ids } }, { targetUserID: { $in: ids } }] }),
    ProfileRatingModel.deleteMany({ $or: [{ actorUserID: { $in: ids } }, { targetUserID: { $in: ids } }] }),
    FriendshipModel.deleteMany({ $or: [{ requesterUserID: { $in: ids } }, { addresseeUserID: { $in: ids } }] }),
    UserBlockModel.deleteMany({ $or: [{ blockerUserID: { $in: ids } }, { blockedUserID: { $in: ids } }] }),
    ProfileModel.deleteMany({ userID: { $in: ids } }),
    UserModel.deleteMany({ _id: { $in: ids } }),
  ]);
  await app.close();
  await OrkkutDB.close();
}
