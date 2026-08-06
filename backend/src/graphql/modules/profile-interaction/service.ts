import type { ClientSession } from "mongoose";

import { OrkkutDB } from "../../../plugins/mongoose.js";
import { ProfileModel } from "../profile/model.js";
import { canSee } from "../profile/rules.js";
import RelationshipService from "../relationship/service.js";
import { FriendshipModel, UserBlockModel } from "../relationship/model.js";
import { relationshipPairKey } from "../relationship/rules.js";
import { UserModel } from "../user/model.js";
import { DEFAULT_PROFILE_VISIBILITY } from "../user/validation.js";
import {
  PROFILE_RATING_CATEGORIES,
  ProfileFanModel,
  ProfileRatingModel,
  type ProfileRatingCategory,
} from "./model.js";
import { profileRatingInputSchema, removeProfileRatingInputSchema } from "./validation.js";

const validActorsForTarget = async (targetUserID: string, actorUserIDs: string[]) => {
  if (!actorUserIDs.length) return new Set<string>();
  const pairKeys = actorUserIDs.map((actor) => relationshipPairKey(actor, targetUserID));
  const [friendships, blocks] = await Promise.all([
    FriendshipModel.find({ pairKey: { $in: pairKeys }, status: "ACCEPTED" }).select("pairKey").lean(),
    UserBlockModel.find({
      $or: [
        { blockerUserID: targetUserID, blockedUserID: { $in: actorUserIDs } },
        { blockedUserID: targetUserID, blockerUserID: { $in: actorUserIDs } },
      ],
    }).select("blockerUserID blockedUserID").lean(),
  ]);
  const acceptedPairs = new Set(friendships.map((item) => item.pairKey));
  const blockedActors = new Set(blocks.map((block) =>
    String(block.blockerUserID) === targetUserID
      ? String(block.blockedUserID)
      : String(block.blockerUserID),
  ));
  return new Set(actorUserIDs.filter((actor) =>
    acceptedPairs.has(relationshipPairKey(actor, targetUserID)) && !blockedActors.has(actor),
  ));
};

const calculateRatingPercentage = (sum: number, count: number) =>
  count > 0 ? (sum / (count * 3)) * 100 : null;

class ProfileInteractionService {
  static async getSummary(targetUserID: unknown, viewerUserID: string | null) {
    const target = String(targetUserID);
    if (!(await UserModel.exists({ _id: target }))) return null;

    const [fans, ratings, profile, relationship] = await Promise.all([
      ProfileFanModel.find({ targetUserID: target }).lean(),
      ProfileRatingModel.find({ targetUserID: target }).lean(),
      ProfileModel.findOne({ userID: target }).select("visibility").lean(),
      RelationshipService.getRelationship(viewerUserID, target),
    ]);
    const actorIDs = [...new Set([
      ...fans.map((fan) => String(fan.actorUserID)),
      ...ratings.map((rating) => String(rating.actorUserID)),
    ])];
    const validActors = await validActorsForTarget(target, actorIDs);
    const validFans = fans.filter((fan) => validActors.has(String(fan.actorUserID)));
    const validRatings = ratings.filter((rating) => validActors.has(String(rating.actorUserID)));
    const visibility = { ...DEFAULT_PROFILE_VISIBILITY, ...profile?.visibility };
    const isFriend = relationship.status === "FRIENDS";
    const visible = (field: "socialFans" | "socialCool" | "socialSexy" | "socialTrustworthy") =>
      canSee(visibility[field], viewerUserID, target, isFriend);

    const ratingSummary = (
      category: ProfileRatingCategory,
      field: "socialCool" | "socialSexy" | "socialTrustworthy",
    ) => {
      const items = validRatings.filter((rating) => rating.category === category);
      const isVisible = visible(field);
      const sum = items.reduce((total, rating) => total + rating.value, 0);
      return {
        visible: isVisible,
        count: isVisible ? items.length : null,
        average: isVisible && items.length ? sum / items.length : null,
        percentage: isVisible ? calculateRatingPercentage(sum, items.length) : null,
        level1Count: isVisible ? items.filter((item) => item.value === 1).length : null,
        level2Count: isVisible ? items.filter((item) => item.value === 2).length : null,
        level3Count: isVisible ? items.filter((item) => item.value === 3).length : null,
        viewerValue: viewerUserID
          ? items.find((item) => String(item.actorUserID) === viewerUserID)?.value ?? null
          : null,
      };
    };

    const fansVisible = visible("socialFans");
    return {
      fanCount: fansVisible ? validFans.length : null,
      fansVisible,
      viewerIsFan: viewerUserID
        ? validFans.some((fan) => String(fan.actorUserID) === viewerUserID)
        : false,
      viewerCanInteract: relationship.status === "FRIENDS",
      viewerIsProfileOwner: relationship.status === "SELF",
      viewerIsFriend: relationship.status === "FRIENDS",
      legal: ratingSummary("COOL", "socialCool"),
      sexy: ratingSummary("SEXY", "socialSexy"),
      trustworthy: ratingSummary("TRUSTWORTHY", "socialTrustworthy"),
    };
  }

  static async withFriendTransaction(
    actorUserID: string,
    targetUserID: unknown,
    operation: (target: string, session: ClientSession) => Promise<void>,
  ) {
    const session = await OrkkutDB.startSession();
    let target = String(targetUserID);
    try {
      await session.withTransaction(async () => {
        target = await RelationshipService.assertCanInteractAsFriend(actorUserID, targetUserID, session);
        await operation(target, session);
      });
    } finally {
      await session.endSession();
    }
    return this.getSummary(target, actorUserID);
  }

  static becomeFan(actorUserID: string, targetUserID: unknown) {
    return this.withFriendTransaction(actorUserID, targetUserID, async (target, session) => {
      await ProfileFanModel.updateOne(
        { actorUserID, targetUserID: target },
        { $setOnInsert: { actorUserID, targetUserID: target } },
        { upsert: true, session },
      );
    });
  }

  static removeFan(actorUserID: string, targetUserID: unknown) {
    return this.withFriendTransaction(actorUserID, targetUserID, async (target, session) => {
      await ProfileFanModel.deleteOne({ actorUserID, targetUserID: target }).session(session);
    });
  }

  static setRating(actorUserID: string, data: unknown) {
    const parsed = profileRatingInputSchema.parse(data);
    return this.withFriendTransaction(actorUserID, parsed.targetUserID, async (target, session) => {
      await ProfileRatingModel.updateOne(
        { actorUserID, targetUserID: target, category: parsed.category },
        { $set: { value: parsed.value }, $setOnInsert: { actorUserID, targetUserID: target, category: parsed.category } },
        { upsert: true, session },
      );
    });
  }

  static removeRating(actorUserID: string, data: unknown) {
    const parsed = removeProfileRatingInputSchema.parse(data);
    return this.withFriendTransaction(actorUserID, parsed.targetUserID, async (target, session) => {
      await ProfileRatingModel.deleteOne({
        actorUserID,
        targetUserID: target,
        category: parsed.category,
      }).session(session);
    });
  }
}

export { calculateRatingPercentage };
export default ProfileInteractionService;
