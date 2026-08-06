type ReplyTarget = {
  _id: unknown;
  topicID: unknown;
  authorID: unknown;
  parentCommentID?: unknown | null;
};

const resolveReplyMetadata = (topicID: unknown, target: ReplyTarget) => {
  if (String(target.topicID) !== String(topicID)) {
    throw new Error("O comentário respondido pertence a outro tópico.");
  }

  if (
    target.parentCommentID &&
    String(target.parentCommentID) === String(target._id)
  ) {
    throw new Error("Referência circular de comentário.");
  }

  return {
    parentCommentID: target.parentCommentID ?? target._id,
    replyToCommentID: target._id,
    replyToUserID: target.authorID,
  };
};

const shouldDeleteConversation = (comment: {
  parentCommentID?: unknown | null;
}) => !comment.parentCommentID;

export { resolveReplyMetadata, shouldDeleteConversation };
