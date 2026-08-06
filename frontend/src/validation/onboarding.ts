import * as z from "zod";

import type { Media } from "@/types/media";

const accountSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Use pelo menos 3 caracteres.")
      .max(30, "Use no máximo 30 caracteres.")
      .regex(
        /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/,
        "Use letras minúsculas, números, ponto ou sublinhado.",
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail válido.")
      .max(254, "Use no máximo 254 caracteres."),
    password: z.string().min(8, "Use pelo menos 8 caracteres.").max(120),
    confirmPassword: z.string().min(1, "Confirme a senha."),
    invitation: z.string().trim().min(1, "Informe o convite.").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

const optionalValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("")]).optional();

const profileSchema = z
  .object({
    avatarImage: z.custom<Media>().nullable(),
    profilePhrase: z.string().trim().max(280, "Use no máximo 280 caracteres."),
    about: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
    birthDate: z.string(),
    countryCode: z.string().length(2).or(z.literal("")),
    region: z.string().trim().max(100),
    city: z.string().trim().max(100),
    gender: optionalValue(z.enum(["MAN", "WOMAN", "NON_BINARY", "OTHER", "UNDISCLOSED"])),
    customGender: z.string().trim().max(80),
    relationshipStatus: optionalValue(
      z.enum([
        "SINGLE", "DATING", "ENGAGED", "MARRIED", "CIVIL_UNION",
        "OPEN_RELATIONSHIP", "SEPARATED", "DIVORCED", "WIDOWED",
        "COMPLICATED", "UNDISCLOSED",
      ]),
    ),
    childrenStatus: optionalValue(z.enum(["NONE", "HAVE", "WANT", "DO_NOT_WANT", "UNDISCLOSED"])),
    sexualOrientation: optionalValue(
      z.enum(["HETEROSEXUAL", "HOMOSEXUAL", "BISEXUAL", "PANSEXUAL", "ASEXUAL", "OTHER", "UNDISCLOSED"]),
    ),
    customSexualOrientation: z.string().trim().max(80),
    smokingStatus: optionalValue(z.enum(["NO", "OCCASIONALLY", "YES", "QUITTING", "UNDISCLOSED"])),
    drinkingStatus: optionalValue(z.enum(["NO", "SOCIALLY", "OCCASIONALLY", "FREQUENTLY", "UNDISCLOSED"])),
    interests: z.array(z.string().trim().min(1).max(40)).max(20),
    activities: z.array(z.string().trim().min(1).max(40)).max(20),
    passionIDs: z.array(z.string()).max(30),
    sportIDs: z.array(z.string()).max(30),
    visibility: z.object({
      avatar: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      profilePhrase: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      about: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      age: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      birthDate: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      gender: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      country: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      sexualOrientation: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      relationshipStatus: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      childrenStatus: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      city: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      smokingStatus: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      drinkingStatus: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      interests: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      passions: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      sports: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      activities: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      socialFans: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      socialCool: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      socialSexy: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
      socialTrustworthy: z.enum(["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"]),
    }),
  })
  .superRefine((data, context) => {
    if (data.gender === "OTHER" && !data.customGender) {
      context.addIssue({ code: "custom", path: ["customGender"], message: "Descreva seu gênero." });
    }
    if (data.sexualOrientation === "OTHER" && !data.customSexualOrientation) {
      context.addIssue({
        code: "custom",
        path: ["customSexualOrientation"],
        message: "Descreva sua orientação sexual.",
      });
    }
    if (data.birthDate) {
      const birth = new Date(`${data.birthDate}T00:00:00.000Z`);
      const now = new Date();
      let age = now.getUTCFullYear() - birth.getUTCFullYear();
      if (
        now.getUTCMonth() < birth.getUTCMonth() ||
        (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
      ) age -= 1;
      if (Number.isNaN(birth.getTime()) || age < 13 || age > 120) {
        context.addIssue({ code: "custom", path: ["birthDate"], message: "A idade deve estar entre 13 e 120 anos." });
      }
    }
  });

const onboardingSchema = accountSchema.and(profileSchema);

type OnboardingFormData = z.infer<typeof onboardingSchema>;
type RegistrationAccountData = z.infer<typeof accountSchema>;
type RegistrationProfileData = z.infer<typeof profileSchema>;

export { accountSchema, onboardingSchema, profileSchema };
export type { OnboardingFormData, RegistrationAccountData, RegistrationProfileData };
