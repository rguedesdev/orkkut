import type { Media } from "./media";

type CommunityUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
};

type CommunityMember = {
  role: string;
  user: CommunityUser;
};

type Community = {
  id: string;
  ownerID: string;
  name: string;
  slug: string;
  description: string;
  members: number;
  createdAt: string;
  category: string;
  privacy: string;
  country: string;
  language: string;
  membersList: CommunityMember[];
  canEdit: boolean;
  avatarImageID?: string | null;
  coverImageID?: string | null;
  avatarImage?: Media | null;
  coverImage?: Media | null;
};

type CommunityUpdate =
  | Community
  | ((previous: Community) => Community);

export type { Community, CommunityMember, CommunityUpdate, CommunityUser };
