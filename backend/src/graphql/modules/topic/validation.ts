import { Types } from "mongoose";
import { z } from "zod";

const objectID = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "ID inválido");

class TopicValidation {
  static createTopic(data: any) {
    const schema = z.object({
      communityID: objectID,

      title: z
        .string()
        .trim()
        .min(3, "Título muito curto")
        .max(120, "Título muito longo"),

      content: z
        .string()
        .trim()
        .min(1, "Conteúdo obrigatório")
        .max(5000, "Conteúdo muito longo"),
      featuredImageID: objectID.nullish(),
    });

    return schema.parse(data);
  }

  static updateTopic(data: any) {
    return z
      .object({
        title: z.string().trim().min(3).max(120).optional(),
        content: z.string().trim().min(1).max(5000).optional(),
        featuredImageID: objectID.nullish(),
      })
      .refine((value) => Object.keys(value).length > 0, "Nenhuma alteração informada.")
      .parse(data);
  }

  static createComment(data: any) {
    return z
      .object({
        topicID: objectID,
        parentCommentID: objectID.nullish(),
        replyToCommentID: objectID.nullish(),
        content: z
          .string()
          .trim()
          .min(1, "Comentário obrigatório")
          .max(2000, "Comentário muito longo"),
      })
      .refine(
        (value) =>
          !value.parentCommentID ||
          !value.replyToCommentID ||
          value.parentCommentID === value.replyToCommentID,
        "Informe apenas o comentário que está sendo respondido.",
      )
      .parse(data);
  }

  static pagination(page: number, limit: number) {
    return z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse({ page, limit });
  }
}

export { TopicValidation };
