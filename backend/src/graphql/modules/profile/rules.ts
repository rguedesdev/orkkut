import type { VisibilityLevel } from "./model.js";

const calculateAge = (birthDate: Date | string | null | undefined, now = new Date()) => {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const canSee = (
  level: VisibilityLevel,
  viewerID: string | null,
  ownerID: unknown,
  viewerIsFriend = false,
) => {
  if (viewerID && String(viewerID) === String(ownerID)) return true;
  if (level === "PUBLIC") return true;
  if (level === "AUTHENTICATED") return Boolean(viewerID);
  if (level === "FRIENDS") return viewerIsFriend;
  return false;
};

export { calculateAge, canSee };
