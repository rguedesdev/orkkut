import slugify from "slugify";

import {
  PassionModel,
  ProfilePassionModel,
  ProfileSportModel,
  SportModel,
} from "../graphql/modules/catalog/model.js";
import { ProfileModel } from "../graphql/modules/profile/model.js";
import { UserModel } from "../graphql/modules/user/model.js";
import { DEFAULT_PROFILE_VISIBILITY } from "../graphql/modules/user/validation.js";
import { OrkkutDB } from "../plugins/mongoose.js";

const PASSIONS = [
  "Anime",
  "Mangá",
  "Filmes",
  "Séries",
  "Música",
  "Livros",
  "Viagens",
  "Tecnologia",
  "Games",
  "Animais",
  "Arte",
  "Fotografia",
  "Moda",
  "Culinária",
  "Natureza",
];

const SPORTS = [
  "Futebol",
  "Futsal",
  "Basquete",
  "Vôlei",
  "Handebol",
  "Tênis",
  "Tênis de Mesa",
  "Natação",
  "Corrida",
  "Caminhada",
  "Musculação",
  "Ciclismo",
  "Artes Marciais",
  "Surf",
  "Skate",
  "Escalada",
];

const normalizeSlug = (value: string) =>
  slugify(value, { lower: true, strict: true, trim: true });

await OrkkutDB.asPromise();

await Promise.all([
  ...PASSIONS.map((name, order) =>
    PassionModel.updateOne(
      { slug: normalizeSlug(name) },
      { $setOnInsert: { name, slug: normalizeSlug(name), icon: null, active: true, order } },
      { upsert: true },
    ),
  ),
  ...SPORTS.map((name, order) =>
    SportModel.updateOne(
      { slug: normalizeSlug(name) },
      { $setOnInsert: { name, slug: normalizeSlug(name), icon: null, active: true, order } },
      { upsert: true },
    ),
  ),
]);

const [passions, sports] = await Promise.all([
  PassionModel.find().lean(),
  SportModel.find().lean(),
]);
const passionBySlug = new Map(passions.map((item) => [item.slug, item]));
const sportBySlug = new Map(sports.map((item) => [item.slug, item]));

const users = await UserModel.collection.find({}).toArray();
let profilesCreated = 0;
let passwordsMigrated = 0;
let visibilityFieldsMigrated = 0;

for (const user of users) {
  let profile = await ProfileModel.findOne({ userID: user._id });
  if (!profile) {
    const rawBirthDate = user.dateBirth ? new Date(user.dateBirth) : null;
    const birthDate = rawBirthDate && !Number.isNaN(rawBirthDate.getTime()) ? rawBirthDate : null;
    const countryCode =
      String(user.country ?? "").toLowerCase() === "brazil" ||
      String(user.country ?? "").toLowerCase() === "brasil"
        ? "BR"
        : String(user.country ?? "").toLowerCase() === "usa"
          ? "US"
          : null;
    profile = await ProfileModel.create({
      userID: user._id,
      avatarImageID: null,
      about: user.whoAmI ?? null,
      birthDate,
      countryCode,
      region: null,
      city: user.city ?? null,
      gender: null,
      customGender: user.gender ?? null,
      relationshipStatus: null,
      childrenStatus: null,
      sexualOrientation: null,
      smokingStatus: null,
      drinkingStatus: null,
      interests: Array.isArray(user.interests) ? user.interests : [],
      activities: user.atividades ? [String(user.atividades).trim()] : [],
      visibility: {},
    });
    profilesCreated += 1;

    const passionIDs = (Array.isArray(user.passions) ? user.passions : [])
      .map((name: string) => passionBySlug.get(normalizeSlug(name))?._id)
      .filter(Boolean);
    const sportIDs = (Array.isArray(user.sports) ? user.sports : [])
      .map((name: string) => sportBySlug.get(normalizeSlug(name))?._id)
      .filter(Boolean);
    if (passionIDs.length) {
      await ProfilePassionModel.insertMany(
        passionIDs.map((catalogID) => ({ profileID: profile!._id, catalogID })),
        { ordered: false },
      ).catch(() => undefined);
    }
    if (sportIDs.length) {
      await ProfileSportModel.insertMany(
        sportIDs.map((catalogID) => ({ profileID: profile!._id, catalogID })),
        { ordered: false },
      ).catch(() => undefined);
    }
  }

  if (!user.passwordHash && user.password) {
    await UserModel.collection.updateOne(
      { _id: user._id },
      { $set: { passwordHash: user.password }, $unset: { password: "" } },
    );
    passwordsMigrated += 1;
  }
}

for (const [field, defaultValue] of Object.entries(DEFAULT_PROFILE_VISIBILITY)) {
  const result = await ProfileModel.updateMany(
    { [`visibility.${field}`]: { $exists: false } },
    { $set: { [`visibility.${field}`]: defaultValue } },
  );
  visibilityFieldsMigrated += result.modifiedCount;
}

const indexes = await UserModel.collection.indexes();
const emailIndex = indexes.find((index) => index.name === "email_1");
if (emailIndex && !emailIndex.sparse && !emailIndex.partialFilterExpression) {
  await UserModel.collection.dropIndex("email_1");
}

await Promise.all([
  UserModel.createIndexes(),
  ProfileModel.createIndexes(),
  PassionModel.createIndexes(),
  SportModel.createIndexes(),
  ProfilePassionModel.createIndexes(),
  ProfileSportModel.createIndexes(),
]);

console.log(`Catálogo: ${PASSIONS.length} paixões e ${SPORTS.length} esportes.`);
console.log(`Perfis criados para contas antigas: ${profilesCreated}`);
console.log(`Senhas migradas para passwordHash: ${passwordsMigrated}`);
console.log(`Campos de privacidade preenchidos: ${visibilityFieldsMigrated}`);
await OrkkutDB.close();
