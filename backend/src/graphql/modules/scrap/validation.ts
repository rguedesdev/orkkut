import { Types } from "mongoose";
import { z } from "zod";

import { SCRAP_VIEW_PERMISSIONS, SCRAP_WRITE_PERMISSIONS } from "./model.js";

const objectID = z.string().refine((value) => Types.ObjectId.isValid(value), "ID inválido.");
const contentSchema = z
  .string()
  .trim()
  .max(2000, "O scrap deve ter no máximo 2000 caracteres.")
  .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""))
  .nullable()
  .optional();
const mediaIDsSchema = z.array(objectID).max(4, "Use no máximo 4 imagens.").default([])
  .transform((ids) => [...new Set(ids)]);

const assertSafeContent = (content: string | null | undefined, context: z.RefinementCtx) => {
  if (!content) return;
  if (/<\/?[a-z][^>]*>/i.test(content)) {
    context.addIssue({ code: "custom", path: ["content"], message: "HTML não é permitido em scraps." });
  }
  const links = content.match(/https?:\/\/[^\s]+/gi) ?? [];
  if (links.length > 3) {
    context.addIssue({ code: "custom", path: ["content"], message: "Use no máximo 3 links." });
  }
  for (const link of links) {
    try {
      const url = new URL(link);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      context.addIssue({ code: "custom", path: ["content"], message: "O scrap contém um link inválido." });
      break;
    }
  }
};

const createScrapSchema = z.object({
  recipientUserID: objectID,
  content: contentSchema,
  mediaIDs: mediaIDsSchema,
  replyToScrapID: objectID.nullable().optional(),
  clientMutationID: z.string().trim().min(8).max(100).nullable().optional(),
}).superRefine((data, context) => {
  assertSafeContent(data.content, context);
  if (!data.content && data.mediaIDs.length === 0) {
    context.addIssue({ code: "custom", path: ["content"], message: "Escreva um recado ou adicione uma imagem." });
  }
});

const updateScrapSchema = z.object({
  scrapID: objectID,
  content: contentSchema,
  mediaIDs: z.array(objectID).max(4, "Use no máximo 4 imagens.").transform((ids) => [...new Set(ids)]).optional(),
}).superRefine((data, context) => {
  assertSafeContent(data.content, context);
  if (data.content === null && data.mediaIDs?.length === 0) {
    context.addIssue({ code: "custom", path: ["content"], message: "Escreva um recado ou adicione uma imagem." });
  }
});

const settingsSchema = z.object({
  viewPermission: z.enum(SCRAP_VIEW_PERMISSIONS),
  writePermission: z.enum(SCRAP_WRITE_PERMISSIONS),
  allowNotifications: z.boolean().optional(),
});

const pageSchema = z.object({
  userID: objectID,
  first: z.number().int().min(1).max(30).default(10),
  after: z.string().max(500).nullable().optional(),
});

export { createScrapSchema, pageSchema, settingsSchema, updateScrapSchema };
