import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import sharp from "sharp";

import buildApp from "../app.js";
import { CommunityModel } from "../graphql/modules/community/model.js";
import { CommunityMemberModel } from "../graphql/modules/community_members/model.js";
import { MediaModel } from "../graphql/modules/media/model.js";
import MediaService from "../graphql/modules/media/service.js";
import { TopicModel } from "../graphql/modules/topic/model.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { OrkkutDB } from "../plugins/mongoose.js";
import { StorageService } from "../services/storage.js";

await OrkkutDB.asPromise();
const user = await UserModel.findOne().lean();
if (!user) throw new Error("Crie ao menos um usuário antes do teste integrado.");

const app = await buildApp();
await app.ready();
const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET as string);
const authorization = { authorization: `Bearer ${token}` };
const marker = `codex-media-${randomUUID()}`;
const mediaIDs: string[] = [];
let communityID: string | null = null;
let topicID: string | null = null;

const gql = async (query: string, variables: object) => {
  const response = await app.inject({
    method: "POST",
    url: "/graphql",
    headers: authorization,
    payload: { query, variables },
  });
  const body = response.json();
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data;
};

const upload = async (purpose: string) => {
  const boundary = `----orkkut-${randomUUID()}`;
  const image = await sharp({
    create: { width: 64, height: 64, channels: 4, background: "#4f46e5" },
  })
    .png()
    .toBuffer();
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`,
    ),
    image,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await app.inject({
    method: "POST",
    url: `/uploads/images?purpose=${purpose}`,
    headers: {
      ...authorization,
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload,
  });
  assert.equal(response.statusCode, 201, response.body);
  const media = response.json().media;
  mediaIDs.push(media.id);
  return media;
};

try {
  const unauthorized = await app.inject({ method: "POST", url: "/uploads/images?purpose=COMMUNITY_AVATAR" });
  assert.equal(unauthorized.statusCode, 401);

  const discarded = await upload("COMMUNITY_COVER");
  const discardedResponse = await app.inject({
    method: "DELETE",
    url: `/uploads/images/${discarded.id}`,
    headers: authorization,
  });
  assert.equal(discardedResponse.statusCode, 204, discardedResponse.body);
  assert.equal((await MediaModel.findById(discarded.id).lean())?.status, "DELETED");
  assert.equal(
    (await app.inject({ method: "GET", url: `/uploads/images/${discarded.id}` })).statusCode,
    404,
  );

  const firstAvatar = await upload("COMMUNITY_AVATAR");
  const imageResponse = await app.inject({ method: "GET", url: `/uploads/images/${firstAvatar.id}` });
  assert.equal(imageResponse.statusCode, 200);
  assert.equal(imageResponse.headers["content-type"], "image/webp");

  const createdCommunity = await gql(
    `mutation($data: CreateCommunityInput!) {
      createCommunity(data: $data) { id slug avatarImageID avatarImage { id status } }
    }`,
    {
      data: {
        name: marker,
        description: "Verificação integrada de mídia",
        category: "test",
        privacy: "private",
        country: "brazil",
        language: "pt-BR",
        avatarImageID: firstAvatar.id,
      },
    },
  );
  communityID = createdCommunity.createCommunity.id;
  assert.equal(createdCommunity.createCommunity.avatarImage.id, firstAvatar.id);
  const protectedMedia = await app.inject({
    method: "DELETE",
    url: `/uploads/images/${firstAvatar.id}`,
    headers: authorization,
  });
  assert.equal(protectedMedia.statusCode, 409);

  await assert.rejects(
    () => MediaService.requireAttachable(firstAvatar.id, new Types.ObjectId().toString(), "COMMUNITY_AVATAR"),
    /outro usuário/,
  );

  const secondAvatar = await upload("COMMUNITY_AVATAR");
  const replaced = await gql(
    `mutation($id: ID!, $data: UpdateCommunityInput!) {
      updateCommunity(id: $id, data: $data) { id avatarImageID avatarImage { id } }
    }`,
    { id: communityID, data: { avatarImageID: secondAvatar.id } },
  );
  assert.equal(replaced.updateCommunity.avatarImage.id, secondAvatar.id);
  assert.equal((await MediaModel.findById(firstAvatar.id).lean())?.resourceID, null);

  const removed = await gql(
    `mutation($id: ID!, $data: UpdateCommunityInput!) {
      updateCommunity(id: $id, data: $data) { id avatarImageID avatarImage { id } }
    }`,
    { id: communityID, data: { avatarImageID: null } },
  );
  assert.equal(removed.updateCommunity.avatarImage, null);

  const featured = await upload("TOPIC_FEATURED");
  const createdTopic = await gql(
    `mutation($data: CreateTopicInput!) {
      createTopic(data: $data) { id featuredImageID featuredImage { id status } }
    }`,
    {
      data: {
        communityID,
        title: "Tópico de verificação",
        content: "Conteúdo temporário",
        featuredImageID: featured.id,
      },
    },
  );
  topicID = createdTopic.createTopic.id;
  assert.equal(createdTopic.createTopic.featuredImage.id, featured.id);

  const topicWithoutImage = await gql(
    `mutation($id: ID!, $data: UpdateTopicInput!) {
      updateTopic(id: $id, data: $data) { id featuredImageID featuredImage { id } }
    }`,
    { id: topicID, data: { featuredImageID: null } },
  );
  assert.equal(topicWithoutImage.updateTopic.featuredImage, null);

  console.log(
    "Upload, descarte imediato, proteção de vínculo, associação, substituição e remoção validados.",
  );
} finally {
  if (topicID) await TopicModel.deleteOne({ _id: topicID });
  if (communityID) {
    await CommunityMemberModel.deleteMany({ communityID });
    await CommunityModel.deleteOne({ _id: communityID });
  }
  const medias = await MediaModel.find({ _id: { $in: mediaIDs } }).lean();
  for (const media of medias) await StorageService.deleteFile(media.storageKey);
  await MediaModel.deleteMany({ _id: { $in: mediaIDs } });
  await app.close();
  await OrkkutDB.close();
}
