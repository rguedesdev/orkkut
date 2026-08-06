import { z } from "zod";

import { PROFILE_RATING_CATEGORIES } from "./model.js";

const profileRatingInputSchema = z.object({
  targetUserID: z.string().min(1),
  category: z.enum(PROFILE_RATING_CATEGORIES),
  value: z.number().int().min(1).max(3),
}).strict();

const removeProfileRatingInputSchema = profileRatingInputSchema.omit({ value: true });

export { profileRatingInputSchema, removeProfileRatingInputSchema };
