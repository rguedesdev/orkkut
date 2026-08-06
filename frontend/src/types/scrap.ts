import type { Media } from "./media";

type ScrapAuthor = {
  id: string;
  name: string;
  username: string;
  profile?: { avatarImage?: Media | null } | null;
};

type Scrap = {
  id: string;
  author: ScrapAuthor;
  recipientUserID: string;
  content?: string | null;
  media: Media[];
  replyToScrapID?: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  viewerCanEdit: boolean;
  viewerCanDelete: boolean;
  viewerCanReply: boolean;
};

type ScrapbookViewerState = {
  canView: boolean;
  canWrite: boolean;
  isOwner: boolean;
  isFriend: boolean;
};

type ScrapConnection = {
  edges: Array<{ node: Scrap; cursor: string }>;
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  totalCount: number;
  viewerState: ScrapbookViewerState;
};

export type { Scrap, ScrapAuthor, ScrapConnection, ScrapbookViewerState };
