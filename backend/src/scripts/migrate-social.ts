import { ProfileFanModel, ProfileRatingModel } from "../graphql/modules/profile-interaction/model.js";
import { ProfileModel } from "../graphql/modules/profile/model.js";
import { FriendshipModel, UserBlockModel } from "../graphql/modules/relationship/model.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { DEFAULT_PROFILE_VISIBILITY } from "../graphql/modules/user/validation.js";
import { OrkkutDB } from "../plugins/mongoose.js";

await OrkkutDB.asPromise();

let visibilityFieldsMigrated = 0;
for (const field of ["socialFans", "socialCool", "socialSexy", "socialTrustworthy"] as const) {
  const result = await ProfileModel.updateMany(
    { [`visibility.${field}`]: { $exists: false } },
    { $set: { [`visibility.${field}`]: DEFAULT_PROFILE_VISIBILITY[field] } },
  );
  visibilityFieldsMigrated += result.modifiedCount;
}

await Promise.all([
  FriendshipModel.createIndexes(),
  UserBlockModel.createIndexes(),
  ProfileFanModel.createIndexes(),
  ProfileRatingModel.createIndexes(),
]);

const legacyAttributeUsers = await UserModel.countDocuments({
  $or: [
    { "attributes.fans": { $gt: 0 } },
    { "attributes.cool": { $gt: 0 } },
    { "attributes.sexy": { $gt: 0 } },
    { "attributes.trustworthy": { $gt: 0 } },
  ],
});

console.log(`Campos sociais de privacidade preenchidos: ${visibilityFieldsMigrated}`);
console.log(`Usuários com agregados legados preservados e ignorados: ${legacyAttributeUsers}`);
console.log("Índices de amizade, bloqueio, fãs e avaliações criados.");

await OrkkutDB.close();
