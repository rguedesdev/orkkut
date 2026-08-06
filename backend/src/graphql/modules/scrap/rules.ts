import type { ScrapViewPermission, ScrapWritePermission } from "./model.js";

type ViewerRuleContext = {
  viewerID: string | null;
  ownerID: string;
  isFriend: boolean;
  blocked: boolean;
};

const canViewScrapbook = (permission: ScrapViewPermission, context: ViewerRuleContext) => {
  if (context.viewerID === context.ownerID) return true;
  if (permission === "EVERYONE") return true;
  if (permission === "AUTHENTICATED") return Boolean(context.viewerID);
  if (permission === "FRIENDS") return Boolean(context.viewerID && context.isFriend);
  return false;
};

const canWriteScrapbook = (permission: ScrapWritePermission, context: ViewerRuleContext) => {
  if (!context.viewerID || context.viewerID === context.ownerID || context.blocked) return false;
  if (permission === "AUTHENTICATED") return true;
  if (permission === "FRIENDS") return context.isFriend;
  return false;
};

const canEditScrap = (viewerID: string | null, authorID: unknown) =>
  Boolean(viewerID && viewerID === String(authorID));

const canDeleteScrap = (
  viewerID: string | null,
  authorID: unknown,
  recipientID: unknown,
  isAdmin = false,
) => Boolean(viewerID && (isAdmin || viewerID === String(authorID) || viewerID === String(recipientID)));

export { canDeleteScrap, canEditScrap, canViewScrapbook, canWriteScrapbook };
