type DeletePolicyInput = {
  actorID: string;
  authorID: string;
  communityOwnerID: string;
  isAdmin: boolean;
};

const sameID = (left: unknown, right: unknown) => String(left) === String(right);

const canDeleteTopic = (input: DeletePolicyInput) =>
  input.isAdmin ||
  sameID(input.actorID, input.authorID) ||
  sameID(input.actorID, input.communityOwnerID);

const canDeleteComment = (input: DeletePolicyInput) =>
  input.isAdmin ||
  sameID(input.actorID, input.authorID) ||
  sameID(input.actorID, input.communityOwnerID);

const canEditTopic = canDeleteTopic;

type CommunityPolicyInput = {
  actorID: string;
  communityOwnerID: string;
  isModerator: boolean;
  isAdmin: boolean;
};

const canEditCommunity = (input: CommunityPolicyInput) =>
  input.isAdmin ||
  input.isModerator ||
  sameID(input.actorID, input.communityOwnerID);

export { canDeleteComment, canDeleteTopic, canEditCommunity, canEditTopic };
