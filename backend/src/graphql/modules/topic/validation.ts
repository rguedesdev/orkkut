import { z } from "zod";

class TopicValidation {
  static createTopic(data: any) {
    const schema = z.object({
      communityID: z.string(),

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
    });

    return schema.parse(data);
  }
}

export { TopicValidation };
