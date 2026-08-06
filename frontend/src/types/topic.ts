type TopicAuthor = {
  id: string;
  name: string;
  username: string;
};

type TopicSummary = {
  id: string;
  title: string;
  content: string;
  commentsCount: number;
  likesCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  canEdit: boolean;
  featuredImageID?: string | null;
  featuredImage?: Media | null;
  createdAt: string;
  updatedAt: string;
  author: TopicAuthor;
};

type TopicComment = {
  id: string;
  topicID: string;
  content: string;
  parentCommentID?: string | null;
  replyToCommentID?: string | null;
  replyToUserID?: string | null;
  replyToUser?: TopicAuthor | null;
  likesCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  author: TopicAuthor;
  replies: TopicComment[];
};

export type { TopicAuthor, TopicComment, TopicSummary };
import type { Media } from "./media";
