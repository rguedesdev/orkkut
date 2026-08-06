import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { Types } from "mongoose";

import buildApp from "../app.js";
import { PassionModel, ProfilePassionModel, ProfileSportModel, SportModel } from "../graphql/modules/catalog/model.js";
import { InvitationModel } from "../graphql/modules/invitation/model.js";
import { MediaModel } from "../graphql/modules/media/model.js";
import { ProfileModel } from "../graphql/modules/profile/model.js";
import ProfileService from "../graphql/modules/profile/service.js";
import { UserModel } from "../graphql/modules/user/model.js";
import UserService from "../graphql/modules/user/service.js";
import { OrkkutDB } from "../plugins/mongoose.js";
import { StorageService } from "../services/storage.js";

await OrkkutDB.asPromise();
const marker = randomUUID().replaceAll("-", "").slice(0, 12);
const invitations: string[] = [];
const usernames: string[] = [];
const mediaIDs: string[] = [];
const app = await buildApp();
await app.ready();

const uploadAvatar = async (token: string) => {
  const boundary = `----onboarding-${randomUUID()}`;
  const image = await sharp({ create: { width: 80, height: 80, channels: 4, background: "#ed2590" } }).png().toBuffer();
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n`),
    image,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const denied = await app.inject({
    method: "POST",
    url: "/uploads/images?purpose=COMMUNITY_AVATAR",
    headers: { authorization: `Bearer ${token}`, "content-type": `multipart/form-data; boundary=${boundary}` },
    payload,
  });
  assert.equal(denied.statusCode, 403);
  const response = await app.inject({
    method: "POST",
    url: "/uploads/images?purpose=USER_AVATAR",
    headers: { authorization: `Bearer ${token}`, "content-type": `multipart/form-data; boundary=${boundary}` },
    payload,
  });
  assert.equal(response.statusCode, 201, response.body);
  const media = response.json().media;
  mediaIDs.push(media.id);
  return media;
};

const account = (suffix: string, invitation: string) => ({
  name: `Teste ${suffix}`,
  username: `codex.${marker}.${suffix}`,
  email: `codex.${marker}.${suffix}@example.test`,
  password: "senha-segura-123",
  confirmPassword: "senha-segura-123",
  invitation,
});

const createInvitation = async () => {
  const code = `codex-${randomUUID()}`;
  invitations.push(code);
  await InvitationModel.create({ createdBy: "integration-test", code, used: false });
  return code;
};

try {
  const [passion, sport] = await Promise.all([
    PassionModel.findOne({ active: true }).lean(),
    SportModel.findOne({ active: true }).lean(),
  ]);
  assert.ok(passion && sport, "Execute migrate:onboarding antes do teste.");

  const fullInvite = await createInvitation();
  const fullAccount = account("full", fullInvite);
  usernames.push(fullAccount.username);
  const validation = await UserService.validateRegistrationStep(fullAccount);
  assert.equal(await UserModel.exists({ username: fullAccount.username }), null);
  const avatar = await uploadAvatar(validation.onboardingToken);

  const auth = await UserService.completeRegistration({
    account: fullAccount,
    onboardingToken: validation.onboardingToken,
    profile: {
      about: "Perfil completo",
      avatarImageID: avatar.id,
      birthDate: "2000-08-07",
      countryCode: "BR",
      interests: ["Anime", "anime", "Tecnologia"],
      passionIDs: [passion._id.toString(), passion._id.toString()],
      sportIDs: [sport._id.toString()],
    },
  });
  assert.ok(auth.token);
  const created = await UserModel.findOne({ username: fullAccount.username }).lean();
  assert.ok(created);
  assert.equal(await UserService.usernameAvailable(fullAccount.username), false);
  const profile = await ProfileModel.findOne({ userID: created._id }).lean();
  assert.ok(profile);
  assert.equal(String(profile.avatarImageID), avatar.id);
  assert.equal(String((await MediaModel.findById(avatar.id).lean())?.resourceID), String(profile._id));
  assert.deepEqual(profile.interests, ["anime", "Tecnologia"]);
  assert.equal(await ProfilePassionModel.countDocuments({ profileID: profile._id }), 1);
  assert.equal(await ProfileSportModel.countDocuments({ profileID: profile._id }), 1);
  assert.equal((await InvitationModel.findOne({ code: fullInvite }).lean())?.used, true);
  assert.ok((await UserService.signIn({ login: fullAccount.username, password: fullAccount.password })).token);

  await ProfileService.updateMyProfile(created._id.toString(), {
    profilePhrase: "Minha frase de perfil",
    about: "Perfil atualizado",
    countryCode: "BR",
    passionIDs: [],
    sportIDs: [],
  });
  const partiallyUpdated = await ProfileModel.findById(profile._id).lean();
  assert.equal(partiallyUpdated?.about, "Perfil atualizado");
  assert.equal(partiallyUpdated?.profilePhrase, "Minha frase de perfil");
  assert.equal(partiallyUpdated?.birthDate?.toISOString().slice(0, 10), "2000-08-07");
  assert.deepEqual(partiallyUpdated?.interests, ["anime", "Tecnologia"]);
  assert.equal(await ProfilePassionModel.countDocuments({ profileID: profile._id }), 0);
  assert.equal(await ProfileSportModel.countDocuments({ profileID: profile._id }), 0);

  const version = partiallyUpdated?.updatedAt.toISOString();
  assert.ok(version);
  await ProfileService.updateMyProfile(created._id.toString(), {
    about: null,
    visibility: { profilePhrase: "PRIVATE", about: "PRIVATE" },
    expectedUpdatedAt: version,
  });
  const privateProfile = await ProfileService.getByUserID(created._id, null);
  const ownProfile = await ProfileService.getByUserID(created._id, created._id.toString());
  assert.equal(privateProfile?.profilePhrase, null);
  assert.equal(privateProfile?.about, null);
  assert.equal(ownProfile?.profilePhrase, "Minha frase de perfil");
  assert.equal(ownProfile?.about, null);
  await assert.rejects(
    () => ProfileService.updateMyProfile(created._id.toString(), {
      city: "Atualização concorrente",
      expectedUpdatedAt: version,
    }),
    /alterado em outra sessão/,
  );

  const latestVersion = (await ProfileModel.findById(profile._id).lean())?.updatedAt.toISOString();
  assert.ok(latestVersion);
  await ProfileService.updateMyProfile(created._id.toString(), {
    avatarImageID: null,
    expectedUpdatedAt: latestVersion,
  });
  const profileWithoutAvatar = await ProfileModel.findById(profile._id).lean();
  const orphanedAvatar = await MediaModel.findById(avatar.id).lean();
  assert.equal(profileWithoutAvatar?.avatarImageID, null);
  assert.equal(orphanedAvatar?.resourceID, null);
  assert.ok(orphanedAvatar?.orphanedAt);

  const myProfileResponse = await app.inject({
    method: "POST",
    url: "/graphql",
    headers: { authorization: `Bearer ${auth.token}` },
    payload: {
      query: `query { myProfile { profilePhrase about avatarImageID updatedAt visibility { profilePhrase } } }`,
    },
  });
  assert.equal(myProfileResponse.statusCode, 200, myProfileResponse.body);
  assert.equal(myProfileResponse.json().data.myProfile.profilePhrase, "Minha frase de perfil");
  assert.equal(myProfileResponse.json().data.myProfile.avatarImageID, null);
  assert.match(myProfileResponse.json().data.myProfile.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const unauthorizedUpdate = await app.inject({
    method: "POST",
    url: "/graphql",
    payload: {
      query: `mutation { updateMyProfile(data: { about: "Não autorizado" }) { id } }`,
    },
  });
  assert.equal(unauthorizedUpdate.statusCode, 200);
  assert.equal(unauthorizedUpdate.json().data, null);
  assert.equal(unauthorizedUpdate.json().errors[0].extensions.code, "UNAUTHENTICATED");

  const skipInvite = await createInvitation();
  const skipAccount = account("skip", skipInvite);
  usernames.push(skipAccount.username);
  const skipValidation = await UserService.validateRegistrationStep(skipAccount);
  const skipped = await UserService.completeRegistration({
    account: skipAccount,
    profile: {},
    onboardingToken: skipValidation.onboardingToken,
  });
  const skippedProfile = await ProfileModel.findOne({ userID: skipped.user.id }).lean();
  assert.ok(skippedProfile);
  assert.equal(skippedProfile.avatarImageID, null);

  await assert.rejects(
    () => UserService.validateRegistrationStep(account("badinv", "convite-inexistente")),
    /Convite inválido/,
  );

  const catalogInvite = await createInvitation();
  const catalogAccount = account("badcatalog", catalogInvite);
  usernames.push(catalogAccount.username);
  const catalogValidation = await UserService.validateRegistrationStep(catalogAccount);
  await assert.rejects(
    () =>
      UserService.completeRegistration({
        account: catalogAccount,
        onboardingToken: catalogValidation.onboardingToken,
        profile: { passionIDs: [new Types.ObjectId().toString()] },
      }),
    /paixões não existem/,
  );
  assert.equal(await UserModel.exists({ username: catalogAccount.username }), null);
  assert.equal((await InvitationModel.findOne({ code: catalogInvite }).lean())?.used, false);

  const sharedInvite = await createInvitation();
  const raceA = account("racea", sharedInvite);
  const raceB = account("raceb", sharedInvite);
  usernames.push(raceA.username, raceB.username);
  const [tokenA, tokenB] = await Promise.all([
    UserService.validateRegistrationStep(raceA),
    UserService.validateRegistrationStep(raceB),
  ]);
  const race = await Promise.allSettled([
    UserService.completeRegistration({ account: raceA, profile: {}, onboardingToken: tokenA.onboardingToken }),
    UserService.completeRegistration({ account: raceB, profile: {}, onboardingToken: tokenB.onboardingToken }),
  ]);
  assert.equal(race.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(race.filter((result) => result.status === "rejected").length, 1);
  const raceUsers = await UserModel.find({ username: { $in: [raceA.username, raceB.username] } }).lean();
  assert.equal(raceUsers.length, 1);
  assert.equal(await ProfileModel.countDocuments({ userID: { $in: raceUsers.map((user) => user._id) } }), 1);

  console.log("Cadastro, edição parcial, frase, privacidade, concorrência, avatar, convite e rollback validados.");
} finally {
  const users = await UserModel.find({ username: { $in: usernames } }).lean();
  const profiles = await ProfileModel.find({ userID: { $in: users.map((user) => user._id) } }).lean();
  const profileIDs = profiles.map((profile) => profile._id);
  await Promise.all([
    ProfilePassionModel.deleteMany({ profileID: { $in: profileIDs } }),
    ProfileSportModel.deleteMany({ profileID: { $in: profileIDs } }),
  ]);
  await ProfileModel.deleteMany({ _id: { $in: profileIDs } });
  await UserModel.deleteMany({ _id: { $in: users.map((user) => user._id) } });
  await InvitationModel.deleteMany({ code: { $in: invitations } });
  const medias = await MediaModel.find({ _id: { $in: mediaIDs } }).lean();
  for (const media of medias) await StorageService.deleteFile(media.storageKey);
  await MediaModel.deleteMany({ _id: { $in: mediaIDs } });
  await app.close();
  await OrkkutDB.close();
}
