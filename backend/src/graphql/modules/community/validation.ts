import { Types } from "mongoose";
import { z } from "zod";

const imageID = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "ID de mídia inválido")
  .nullish();

const communityFields = {
  name: z.string().trim().min(5).max(120),
  description: z.string().trim().min(1).max(5000),
  category: z.string().trim().min(1).max(80),
  privacy: z.string().trim().min(1).max(30),
  country: z.string().trim().min(1).max(80),
  language: z.string().trim().min(1).max(30),
};

class CommunityValidation {
  static createCommunity(data: any) {
    return z
      .object({
        ...communityFields,
        avatarImageID: imageID,
        coverImageID: imageID,
      })
      .parse(data);
  }

  static updateCommunity(data: any) {
    return z
      .object({
        name: communityFields.name.optional(),
        description: communityFields.description.optional(),
        category: communityFields.category.optional(),
        privacy: communityFields.privacy.optional(),
        country: communityFields.country.optional(),
        language: communityFields.language.optional(),
        avatarImageID: imageID,
        coverImageID: imageID,
      })
      .refine((value) => Object.keys(value).length > 0, "Nenhuma alteração informada.")
      .parse(data);
  }
}

export { CommunityValidation };
