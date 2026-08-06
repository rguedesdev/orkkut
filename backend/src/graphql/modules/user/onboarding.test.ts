import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createOnboardingToken, verifyOnboardingToken } from "../../../services/auth/onboarding-token.js";
import { calculateAge, canSee } from "../profile/rules.js";
import {
  DEFAULT_PROFILE_VISIBILITY,
  normalizeProfileInput,
  normalizeProfileUpdateInput,
  registrationAccountSchema,
  emailSchema,
  usernameSchema,
} from "./validation.js";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "onboarding-test-secret";

describe("onboarding", () => {
  it("valida username e confirmação da senha", () => {
    assert.equal(usernameSchema.parse("  usuario.teste "), "usuario.teste");
    assert.equal(usernameSchema.safeParse("_invalido").success, false);
    assert.equal(
      registrationAccountSchema.safeParse({
        name: "Pessoa Teste",
        username: "pessoa.teste",
        email: "pessoa@example.com",
        password: "senha-segura",
        confirmPassword: "outra-senha",
        invitation: "convite",
      }).success,
      false,
    );
  });

  it("exige e normaliza o e-mail", () => {
    assert.equal(emailSchema.parse("  Pessoa@Example.COM "), "pessoa@example.com");
    assert.equal(emailSchema.safeParse("").success, false);
    assert.equal(emailSchema.safeParse("email-invalido").success, false);

    const validAccount = {
      name: "Pessoa Teste",
      username: "pessoa.teste",
      email: "pessoa@example.com",
      password: "senha-segura",
      confirmPassword: "senha-segura",
      invitation: "convite",
    };
    const { email: _email, ...withoutEmail } = validAccount;
    const { username: _username, ...withoutUsername } = validAccount;
    assert.equal(registrationAccountSchema.safeParse(withoutEmail).success, false);
    assert.equal(registrationAccountSchema.safeParse(withoutUsername).success, false);
  });

  it("não coloca senha no token temporário", () => {
    const token = createOnboardingToken({ id: "507f1f77bcf86cd799439011", username: "pessoa", email: "pessoa@example.com", invitation: "abc" });
    assert.equal(token.includes("senha-segura"), false);
    const payload = verifyOnboardingToken(token);
    assert.equal(payload.kind, "onboarding");
    assert.equal(payload.id, "507f1f77bcf86cd799439011");
    assert.equal(payload.username, "pessoa");
    assert.equal(payload.email, "pessoa@example.com");
    assert.equal(payload.invitation, "abc");
  });

  it("calcula idade considerando o aniversário", () => {
    assert.equal(calculateAge("2000-08-05", new Date("2026-08-06T12:00:00Z")), 26);
    assert.equal(calculateAge("2000-08-07", new Date("2026-08-06T12:00:00Z")), 25);
  });

  it("normaliza tags duplicadas e rejeita datas fora do limite", () => {
    const profile = normalizeProfileInput({ interests: ["Anime", " anime ", "Mangá"] });
    assert.deepEqual(profile.interests, ["anime", "Mangá"]);
    assert.throws(() => normalizeProfileInput({ birthDate: "2999-01-01" }));
  });

  it("mantém campos omitidos na atualização parcial e aceita remoções explícitas", () => {
    const update = normalizeProfileUpdateInput({
      profilePhrase: "  Minha frase  ",
      about: null,
      interests: [],
      visibility: { profilePhrase: "PRIVATE" },
    });
    assert.equal(update.profilePhrase, "Minha frase");
    assert.equal(update.about, null);
    assert.deepEqual(update.interests, []);
    assert.equal(update.birthDate, undefined);
    assert.deepEqual(update.visibility, { profilePhrase: "PRIVATE" });
  });

  it("valida frase, campos personalizados e privacidade completa", () => {
    assert.equal(normalizeProfileInput({}).visibility.avatar, DEFAULT_PROFILE_VISIBILITY.avatar);
    assert.equal(
      normalizeProfileInput({ profilePhrase: "Frase do perfil" }).profilePhrase,
      "Frase do perfil",
    );
    assert.throws(() => normalizeProfileInput({ profilePhrase: "x".repeat(281) }));
    assert.throws(() => normalizeProfileInput({ sexualOrientation: "OTHER" }));
    assert.equal(
      normalizeProfileInput({
        sexualOrientation: "OTHER",
        customSexualOrientation: "Minha descrição",
      }).customSexualOrientation,
      "Minha descrição",
    );
  });

  it("aplica visibilidade no backend", () => {
    assert.equal(canSee("PUBLIC", null, "owner"), true);
    assert.equal(canSee("AUTHENTICATED", "viewer", "owner"), true);
    assert.equal(canSee("FRIENDS", "viewer", "owner"), false);
    assert.equal(canSee("FRIENDS", "viewer", "owner", true), true);
    assert.equal(canSee("PRIVATE", "owner", "owner"), true);
  });
});
