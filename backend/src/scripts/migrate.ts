import { OrkkutDB } from "../plugins/mongoose.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { Types } from "mongoose";

type LegacyUser = {
  _id: Types.ObjectId;
  username?: string;
  nickname?: string;
};

async function migrateUsernames() {
  await OrkkutDB.asPromise();

  const indexes = await UserModel.collection.indexes();
  const legacyIndexes = indexes.filter((index) =>
    Object.prototype.hasOwnProperty.call(index.key, "nickname"),
  );

  for (const index of legacyIndexes) {
    if (index.name) {
      await UserModel.collection.dropIndex(index.name);
    }
  }

  const legacyUsers = (await UserModel.collection
    .find({ nickname: { $exists: true } })
    .toArray()) as LegacyUser[];

  let migrated = 0;
  let conflicts = 0;

  for (const user of legacyUsers) {
    const username = user.username?.trim() || user.nickname?.trim();

    if (!username) {
      conflicts += 1;
      continue;
    }

    const usernameOwner = await UserModel.collection.findOne({
      _id: { $ne: user._id },
      username,
    });

    if (usernameOwner) {
      conflicts += 1;
      continue;
    }

    await UserModel.collection.updateOne(
      { _id: user._id },
      {
        $set: { username },
        $unset: { nickname: "" },
      },
    );

    migrated += 1;
  }

  console.log(`Índices antigos removidos: ${legacyIndexes.length}`);
  console.log(`Usuários migrados: ${migrated}`);
  console.log(`Conflitos não migrados: ${conflicts}`);

  await OrkkutDB.close();

  if (conflicts > 0) {
    process.exitCode = 1;
  }
}

migrateUsernames().catch(async (error) => {
  console.error("Falha ao migrar usernames:", error);
  await OrkkutDB.close();
  process.exitCode = 1;
});
