import { CommunityModel } from "../graphql/modules/community/model.js";
import { MediaModel } from "../graphql/modules/media/model.js";
import { TopicModel } from "../graphql/modules/topic/model.js";
import { OrkkutDB } from "../plugins/mongoose.js";

await OrkkutDB.asPromise();

const [communityAvatars, communityCovers, topics] = await Promise.all([
  CommunityModel.updateMany(
    { avatarImageID: { $exists: false } },
    { $set: { avatarImageID: null } },
  ),
  CommunityModel.updateMany(
    { coverImageID: { $exists: false } },
    { $set: { coverImageID: null } },
  ),
  TopicModel.updateMany(
    { featuredImageID: { $exists: false } },
    { $set: { featuredImageID: null } },
  ),
]);

await Promise.all([
  CommunityModel.createIndexes(),
  TopicModel.createIndexes(),
  MediaModel.createIndexes(),
]);

console.log(
  `Comunidades preparadas: ${communityAvatars.modifiedCount} avatares e ${communityCovers.modifiedCount} capas.`,
);
console.log(`Tópicos preparados: ${topics.modifiedCount}`);
console.log("Índices de mídia criados.");
await OrkkutDB.close();
