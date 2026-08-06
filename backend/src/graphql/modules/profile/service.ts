import countries from "i18n-iso-countries";
import { Types, type ClientSession } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";
import { graphQLError } from "../../errors.js";
import { PassionModel, ProfilePassionModel, ProfileSportModel, SportModel } from "../catalog/model.js";
import MediaService from "../media/service.js";
import RelationshipService from "../relationship/service.js";
import {
  DEFAULT_PROFILE_VISIBILITY,
  normalizeProfileUpdateInput,
} from "../user/validation.js";
import { ProfileModel, type VisibilityLevel } from "./model.js";
import { calculateAge, canSee } from "./rules.js";

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

const ensureEditableCatalogIDs = async (
  profileID: Types.ObjectId,
  passionIDs: string[] | undefined,
  sportIDs: string[] | undefined,
  session: ClientSession,
) => {
  const validate = async (
    ids: string[] | undefined,
    catalogModel: typeof PassionModel,
    linkModel: typeof ProfilePassionModel,
    label: string,
  ) => {
    if (ids === undefined || ids.length === 0) return;
    const [active, existingLinks] = await Promise.all([
      catalogModel.find({ _id: { $in: ids }, active: true }).select("_id").session(session).lean(),
      linkModel.find({ profileID, catalogID: { $in: ids } }).select("catalogID").session(session).lean(),
    ]);
    const allowed = new Set([
      ...active.map((item) => item._id.toString()),
      ...existingLinks.map((item) => item.catalogID.toString()),
    ]);
    if (ids.some((id) => !allowed.has(id))) {
      throw graphQLError(`Um ou mais ${label} não existem ou estão inativos.`, "BAD_USER_INPUT");
    }
  };

  await Promise.all([
    validate(passionIDs, PassionModel, ProfilePassionModel, "itens de paixão"),
    validate(sportIDs, SportModel, ProfileSportModel, "esportes"),
  ]);
};

const updateCatalogLinks = async (
  profileID: Types.ObjectId,
  nextIDs: string[] | undefined,
  linkModel: typeof ProfilePassionModel,
  session: ClientSession,
) => {
  if (nextIDs === undefined) return;
  const existing = await linkModel.find({ profileID }).select("catalogID").session(session).lean();
  const currentIDs = new Set(existing.map((item) => item.catalogID.toString()));
  const desiredIDs = new Set(nextIDs);
  const removed = [...currentIDs].filter((id) => !desiredIDs.has(id));
  const added = nextIDs.filter((id) => !currentIDs.has(id));

  if (removed.length) {
    await linkModel.deleteMany({ profileID, catalogID: { $in: removed } }).session(session);
  }
  if (added.length) {
    await linkModel.insertMany(
      added.map((catalogID) => ({ profileID, catalogID })),
      { session },
    );
  }
};

class ProfileService {
  static async ensureForUser(userID: string) {
    await ProfileModel.updateOne(
      { userID },
      { $setOnInsert: { userID } },
      { upsert: true },
    );
    return this.getByUserID(userID, userID);
  }

  static async getByUserID(userID: unknown, viewerID: string | null) {
    const profile = await ProfileModel.findOne({ userID }).lean();
    if (!profile) return null;
    const viewerIsFriend = viewerID && String(viewerID) !== String(profile.userID)
      ? await RelationshipService.areFriends(viewerID, profile.userID)
      : false;
    const visibility = { ...DEFAULT_PROFILE_VISIBILITY, ...profile.visibility };
    const visible = (field: keyof typeof visibility) =>
      canSee(visibility[field] as VisibilityLevel, viewerID, profile.userID, viewerIsFriend);

    const [passionLinks, sportLinks] = await Promise.all([
      visible("passions") ? ProfilePassionModel.find({ profileID: profile._id }).lean() : [],
      visible("sports") ? ProfileSportModel.find({ profileID: profile._id }).lean() : [],
    ]);
    const [passions, sports, avatarImage] = await Promise.all([
      PassionModel.find({ _id: { $in: passionLinks.map((link) => link.catalogID) } })
        .sort({ order: 1, name: 1 })
        .lean(),
      SportModel.find({ _id: { $in: sportLinks.map((link) => link.catalogID) } })
        .sort({ order: 1, name: 1 })
        .lean(),
      visible("avatar") && profile.avatarImageID
        ? MediaService.getReadyMedia(profile.avatarImageID)
        : null,
    ]);

    return {
      ...profile,
      id: profile._id.toString(),
      visibility,
      avatarImageID: visible("avatar") ? profile.avatarImageID : null,
      avatarImage,
      profilePhrase: visible("profilePhrase") ? profile.profilePhrase : null,
      about: visible("about") ? profile.about : null,
      age: visible("age") ? calculateAge(profile.birthDate) : null,
      birthDate: visible("birthDate") ? profile.birthDate?.toISOString().slice(0, 10) : null,
      countryCode: visible("country") ? profile.countryCode : null,
      region: visible("country") ? profile.region : null,
      city: visible("city") ? profile.city : null,
      gender: visible("gender") ? profile.gender : null,
      customGender: visible("gender") ? profile.customGender : null,
      sexualOrientation: visible("sexualOrientation") ? profile.sexualOrientation : null,
      customSexualOrientation: visible("sexualOrientation")
        ? profile.customSexualOrientation
        : null,
      relationshipStatus: visible("relationshipStatus") ? profile.relationshipStatus : null,
      childrenStatus: visible("childrenStatus") ? profile.childrenStatus : null,
      smokingStatus: visible("smokingStatus") ? profile.smokingStatus : null,
      drinkingStatus: visible("drinkingStatus") ? profile.drinkingStatus : null,
      interests: visible("interests") ? profile.interests : [],
      activities: visible("activities") ? profile.activities : [],
      passions,
      sports,
    };
  }

  static countryOptions(locale = "pt-BR") {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return Object.keys(countries.getAlpha2Codes())
      .map((code) => ({ code, name: displayNames.of(code) ?? code }))
      .sort((left, right) => left.name.localeCompare(right.name, locale));
  }

  static async updateMyProfile(userID: string, data: unknown) {
    const parsed = normalizeProfileUpdateInput(data);
    if (parsed.avatarImageID) {
      await MediaService.requireAttachable(parsed.avatarImageID, userID, "USER_AVATAR");
    }

    const session = await OrkkutDB.startSession();
    try {
      await session.withTransaction(async () => {
        let current = await ProfileModel.findOne({ userID }).session(session).lean();
        if (!current) {
          const [created] = await ProfileModel.create([{ userID }], { session });
          if (!created) throw new Error("Falha ao criar perfil.");
          current = created.toObject();
        }

        if (
          parsed.expectedUpdatedAt &&
          new Date(parsed.expectedUpdatedAt).getTime() !== new Date(current.updatedAt).getTime()
        ) {
          throw graphQLError(
            "Este perfil foi alterado em outra sessão. Recarregue a página antes de salvar.",
            "CONFLICT",
          );
        }

        await ensureEditableCatalogIDs(
          current._id,
          parsed.passionIDs,
          parsed.sportIDs,
          session,
        );

        const effectiveGender = parsed.gender !== undefined ? parsed.gender : current.gender;
        let effectiveCustomGender = parsed.customGender !== undefined
          ? parsed.customGender
          : current.customGender;
        if (effectiveGender !== "OTHER") effectiveCustomGender = null;
        if (effectiveGender === "OTHER" && !effectiveCustomGender) {
          throw graphQLError("Descreva seu gênero.", "BAD_USER_INPUT");
        }

        const effectiveOrientation = parsed.sexualOrientation !== undefined
          ? parsed.sexualOrientation
          : current.sexualOrientation;
        let effectiveCustomOrientation = parsed.customSexualOrientation !== undefined
          ? parsed.customSexualOrientation
          : current.customSexualOrientation;
        if (effectiveOrientation !== "OTHER") effectiveCustomOrientation = null;
        if (effectiveOrientation === "OTHER" && !effectiveCustomOrientation) {
          throw graphQLError(
            "Descreva sua orientação sexual.",
            "BAD_USER_INPUT",
          );
        }

        const imageChanged = hasOwn(parsed, "avatarImageID") &&
          String(parsed.avatarImageID ?? "") !== String(current.avatarImageID ?? "");
        if (imageChanged && parsed.avatarImageID) {
          await MediaService.attach(
            parsed.avatarImageID,
            userID,
            "USER_AVATAR",
            "PROFILE",
            current._id,
            session,
          );
        }

        const {
          passionIDs,
          sportIDs,
          visibility,
          expectedUpdatedAt: _expectedUpdatedAt,
          ...fields
        } = parsed;
        void _expectedUpdatedAt;
        const setFields: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) setFields[key] = value;
        }
        if (parsed.gender !== undefined || parsed.customGender !== undefined) {
          setFields.customGender = effectiveCustomGender;
        }
        if (
          parsed.sexualOrientation !== undefined ||
          parsed.customSexualOrientation !== undefined
        ) {
          setFields.customSexualOrientation = effectiveCustomOrientation;
        }
        for (const [key, value] of Object.entries(visibility ?? {})) {
          if (value !== undefined) setFields[`visibility.${key}`] = value;
        }
        setFields.updatedAt = new Date();

        const filter: Record<string, unknown> = { _id: current._id };
        if (parsed.expectedUpdatedAt) filter.updatedAt = new Date(parsed.expectedUpdatedAt);
        const updateResult = await ProfileModel.updateOne(
          filter,
          { $set: setFields },
          { session, timestamps: false },
        );
        if (updateResult.matchedCount !== 1) {
          throw graphQLError(
            "Este perfil foi alterado em outra sessão. Recarregue a página antes de salvar.",
            "CONFLICT",
          );
        }

        await Promise.all([
          updateCatalogLinks(current._id, passionIDs, ProfilePassionModel, session),
          updateCatalogLinks(current._id, sportIDs, ProfileSportModel, session),
        ]);

        if (imageChanged && current.avatarImageID) {
          await MediaService.orphan(current.avatarImageID, "PROFILE", current._id, session);
        }
      });
    } finally {
      await session.endSession();
    }
    return this.getByUserID(userID, userID);
  }
}

export default ProfileService;
