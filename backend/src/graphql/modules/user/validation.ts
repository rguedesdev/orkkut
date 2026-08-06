import { Types } from "mongoose";
import { z } from "zod";
import countries from "i18n-iso-countries";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O username precisa ter pelo menos 3 caracteres.")
  .max(30, "O username deve ter no máximo 30 caracteres.")
  .regex(
    /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/,
    "Use apenas letras minúsculas, números, ponto ou sublinhado, sem pontuação nas extremidades.",
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .email("Informe um e-mail válido.")
  .max(254, "O e-mail deve ter no máximo 254 caracteres.");

const registrationAccountSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    username: usernameSchema,
    email: emailSchema,
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(120),
    confirmPassword: z.string().min(1, "Confirme a senha."),
    invitation: z.string().trim().min(1, "Informe o código de convite.").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);
const optionalText = (max: number) =>
  z
    .preprocess(emptyToNull, z.string().trim().max(max).nullable())
    .optional()
    .transform((value) =>
      typeof value === "string"
        ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        : value,
    );
const optionalUpdateText = (max: number) =>
  z
    .preprocess(
      (value) => (value === "" ? null : value),
      z.string().trim().max(max).nullable().optional(),
    )
    .transform((value) =>
      typeof value === "string"
        ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        : value,
    );
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToNull, z.enum(values).nullable()).optional();
const objectID = z.string().refine((value) => Types.ObjectId.isValid(value), "ID inválido.");

const GENDERS = ["MAN", "WOMAN", "NON_BINARY", "OTHER", "UNDISCLOSED"] as const;
const RELATIONSHIPS = [
  "SINGLE",
  "DATING",
  "ENGAGED",
  "MARRIED",
  "CIVIL_UNION",
  "OPEN_RELATIONSHIP",
  "SEPARATED",
  "DIVORCED",
  "WIDOWED",
  "COMPLICATED",
  "UNDISCLOSED",
] as const;
const CHILDREN = ["NONE", "HAVE", "WANT", "DO_NOT_WANT", "UNDISCLOSED"] as const;
const ORIENTATIONS = [
  "HETEROSEXUAL",
  "HOMOSEXUAL",
  "BISEXUAL",
  "PANSEXUAL",
  "ASEXUAL",
  "OTHER",
  "UNDISCLOSED",
] as const;
const SMOKING = ["NO", "OCCASIONALLY", "YES", "QUITTING", "UNDISCLOSED"] as const;
const DRINKING = ["NO", "SOCIALLY", "OCCASIONALLY", "FREQUENTLY", "UNDISCLOSED"] as const;
const VISIBILITY = ["PUBLIC", "AUTHENTICATED", "FRIENDS", "PRIVATE"] as const;

const DEFAULT_PROFILE_VISIBILITY = {
  avatar: "PUBLIC",
  profilePhrase: "PUBLIC",
  about: "PUBLIC",
  age: "PUBLIC",
  birthDate: "PRIVATE",
  gender: "PUBLIC",
  country: "PUBLIC",
  city: "AUTHENTICATED",
  relationshipStatus: "AUTHENTICATED",
  childrenStatus: "AUTHENTICATED",
  sexualOrientation: "PRIVATE",
  smokingStatus: "AUTHENTICATED",
  drinkingStatus: "AUTHENTICATED",
  interests: "PUBLIC",
  passions: "PUBLIC",
  sports: "PUBLIC",
  activities: "PUBLIC",
  socialFans: "PUBLIC",
  socialCool: "PUBLIC",
  socialSexy: "PUBLIC",
  socialTrustworthy: "PUBLIC",
} as const;

const visibilityShape = {
  avatar: z.enum(VISIBILITY),
  profilePhrase: z.enum(VISIBILITY),
  about: z.enum(VISIBILITY),
  age: z.enum(VISIBILITY),
  birthDate: z.enum(VISIBILITY),
  gender: z.enum(VISIBILITY),
  country: z.enum(VISIBILITY),
  city: z.enum(VISIBILITY),
  relationshipStatus: z.enum(VISIBILITY),
  childrenStatus: z.enum(VISIBILITY),
  sexualOrientation: z.enum(VISIBILITY),
  smokingStatus: z.enum(VISIBILITY),
  drinkingStatus: z.enum(VISIBILITY),
  interests: z.enum(VISIBILITY),
  passions: z.enum(VISIBILITY),
  sports: z.enum(VISIBILITY),
  activities: z.enum(VISIBILITY),
  socialFans: z.enum(VISIBILITY),
  socialCool: z.enum(VISIBILITY),
  socialSexy: z.enum(VISIBILITY),
  socialTrustworthy: z.enum(VISIBILITY),
};

const tagList = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .transform((items) => [...new Map(items.map((item) => [item.toLocaleLowerCase(), item])).values()]);

const profileInputSchema = z
  .object({
    avatarImageID: z.preprocess(emptyToNull, objectID.nullable()).optional(),
    profilePhrase: optionalText(280),
    about: optionalText(1000),
    birthDate: z
      .preprocess(emptyToNull, z.iso.date().nullable())
      .optional()
      .transform((value, context) => {
        if (!value) return null;
        const date = new Date(`${value}T00:00:00.000Z`);
        const now = new Date();
        const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));
        const youngest = new Date(Date.UTC(now.getUTCFullYear() - 13, now.getUTCMonth(), now.getUTCDate()));
        if (date < oldest || date > youngest) {
          context.addIssue({ code: "custom", message: "A idade deve estar entre 13 e 120 anos." });
          return z.NEVER;
        }
        return date;
      }),
    countryCode: optionalText(2),
    region: optionalText(100),
    city: optionalText(100),
    gender: optionalEnum(GENDERS),
    customGender: optionalText(80),
    relationshipStatus: optionalEnum(RELATIONSHIPS),
    childrenStatus: optionalEnum(CHILDREN),
    sexualOrientation: optionalEnum(ORIENTATIONS),
    customSexualOrientation: optionalText(80),
    smokingStatus: optionalEnum(SMOKING),
    drinkingStatus: optionalEnum(DRINKING),
    interests: tagList.default([]),
    activities: tagList.default([]),
    passionIDs: z.array(objectID).max(30).default([]).transform((ids) => [...new Set(ids)]),
    sportIDs: z.array(objectID).max(30).default([]).transform((ids) => [...new Set(ids)]),
    visibility: z.object(visibilityShape).default(DEFAULT_PROFILE_VISIBILITY),
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
    if (data.countryCode && !countries.isValid(data.countryCode)) {
      context.addIssue({ code: "custom", path: ["countryCode"], message: "Selecione um país válido." });
    }
  });

const optionalUpdateEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (value === "" ? null : value), z.enum(values).nullable().optional());

const updateTagList = tagList.optional();

const profileUpdateSchema = z
  .object({
    avatarImageID: z.preprocess(
      (value) => (value === "" ? null : value),
      objectID.nullable().optional(),
    ),
    profilePhrase: optionalUpdateText(280),
    about: optionalUpdateText(1000),
    birthDate: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.iso.date().nullable().optional(),
      )
      .transform((value, context) => {
        if (value === undefined || value === null) return value;
        const date = new Date(`${value}T00:00:00.000Z`);
        const now = new Date();
        const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));
        const youngest = new Date(Date.UTC(now.getUTCFullYear() - 13, now.getUTCMonth(), now.getUTCDate()));
        if (date < oldest || date > youngest) {
          context.addIssue({ code: "custom", message: "A idade deve estar entre 13 e 120 anos." });
          return z.NEVER;
        }
        return date;
      }),
    countryCode: optionalUpdateText(2),
    region: optionalUpdateText(100),
    city: optionalUpdateText(100),
    gender: optionalUpdateEnum(GENDERS),
    customGender: optionalUpdateText(80),
    relationshipStatus: optionalUpdateEnum(RELATIONSHIPS),
    childrenStatus: optionalUpdateEnum(CHILDREN),
    sexualOrientation: optionalUpdateEnum(ORIENTATIONS),
    customSexualOrientation: optionalUpdateText(80),
    smokingStatus: optionalUpdateEnum(SMOKING),
    drinkingStatus: optionalUpdateEnum(DRINKING),
    interests: updateTagList,
    activities: updateTagList,
    passionIDs: z.array(objectID).max(30).optional().transform((ids) => ids ? [...new Set(ids)] : ids),
    sportIDs: z.array(objectID).max(30).optional().transform((ids) => ids ? [...new Set(ids)] : ids),
    visibility: z.object(visibilityShape).partial().optional(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.countryCode && !countries.isValid(data.countryCode)) {
      context.addIssue({ code: "custom", path: ["countryCode"], message: "Selecione um país válido." });
    }
  });

const signInSchema = z.object({
  login: z.string().trim().min(1, "Informe username ou e-mail."),
  password: z.string().min(1, "Informe a senha."),
});

const normalizeProfileInput = (data: unknown) => profileInputSchema.parse(data ?? {});
const normalizeProfileUpdateInput = (data: unknown) => profileUpdateSchema.parse(data ?? {});

export {
  DRINKING,
  GENDERS,
  ORIENTATIONS,
  RELATIONSHIPS,
  SMOKING,
  CHILDREN,
  DEFAULT_PROFILE_VISIBILITY,
  VISIBILITY,
  normalizeProfileInput,
  normalizeProfileUpdateInput,
  profileInputSchema,
  profileUpdateSchema,
  registrationAccountSchema,
  emailSchema,
  signInSchema,
  usernameSchema,
};
