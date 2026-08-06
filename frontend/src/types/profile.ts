import type { Media } from "./media";

type CatalogItem = { id: string; name: string; slug: string; icon?: string | null };
type UserRelationshipStatus =
  | "SELF"
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIENDS"
  | "BLOCKED_BY_VIEWER"
  | "BLOCKED_BY_USER";
type UserRelationship = {
  status: UserRelationshipStatus;
  targetUserID: string;
  requestID?: string | null;
  canSendRequest: boolean;
  canAcceptRequest: boolean;
  canDeclineRequest: boolean;
  canCancelRequest: boolean;
  canRemoveFriend: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  viewerIsFriend: boolean;
  viewerIsProfileOwner: boolean;
};
type ProfileRatingSummary = {
  visible: boolean;
  count?: number | null;
  average?: number | null;
  percentage?: number | null;
  level1Count?: number | null;
  level2Count?: number | null;
  level3Count?: number | null;
  viewerValue?: number | null;
};
type ProfileSocialInteractions = {
  fansVisible: boolean;
  fanCount?: number | null;
  viewerIsFan: boolean;
  viewerCanInteract: boolean;
  viewerIsProfileOwner: boolean;
  viewerIsFriend: boolean;
  legal: ProfileRatingSummary;
  sexy: ProfileRatingSummary;
  trustworthy: ProfileRatingSummary;
};
type Profile = {
  id: string;
  avatarImageID?: string | null;
  avatarImage?: Media | null;
  profilePhrase?: string | null;
  about?: string | null;
  birthDate?: string | null;
  age?: number | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  gender?: string | null;
  customGender?: string | null;
  relationshipStatus?: string | null;
  childrenStatus?: string | null;
  sexualOrientation?: string | null;
  customSexualOrientation?: string | null;
  smokingStatus?: string | null;
  drinkingStatus?: string | null;
  interests: string[];
  activities: string[];
  passions: CatalogItem[];
  sports: CatalogItem[];
  visibility?: Record<string, "PUBLIC" | "AUTHENTICATED" | "FRIENDS" | "PRIVATE">;
  updatedAt?: string;
};

type ProfileUser = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  profile?: Profile | null;
  attributes?: { fans: number; cool: number; sexy: number; reliable: number };
  relationship: UserRelationship;
  socialInteractions: ProfileSocialInteractions;
};

export type {
  CatalogItem,
  Profile,
  ProfileRatingSummary,
  ProfileSocialInteractions,
  ProfileUser,
  UserRelationship,
  UserRelationshipStatus,
};
