import { ScrapMediaModel, ScrapModel, ScrapbookSettingsModel } from "../graphql/modules/scrap/model.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { OrkkutDB } from "../plugins/mongoose.js";

await OrkkutDB.asPromise();

const users = await UserModel.find().select("_id").lean();
if (users.length) {
  await ScrapbookSettingsModel.bulkWrite(users.map((user) => ({
    updateOne: {
      filter: { userID: user._id },
      update: {
        $setOnInsert: {
          userID: user._id,
          viewPermission: "AUTHENTICATED",
          writePermission: "FRIENDS",
          allowNotifications: true,
        },
      },
      upsert: true,
    },
  })));
}

await Promise.all([
  ScrapModel.syncIndexes(),
  ScrapMediaModel.syncIndexes(),
  ScrapbookSettingsModel.syncIndexes(),
]);

console.log(`Configurações de scraps verificadas: ${users.length}`);
console.log("Índices de scraps sincronizados.");
await OrkkutDB.close();
