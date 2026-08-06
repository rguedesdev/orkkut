"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { ImageUploadField } from "@/components/ImageUploadField/page";
import {
  SearchableMultiSelect,
  type SearchableOption,
} from "@/components/SearchableMultiSelect/page";
import { TagsInput } from "@/components/TagsInput/page";
import { UserContext } from "@/context/UserContext";
import api from "@/utils/api";
import { profileSelectOptions as selectOptions } from "@/utils/profile-labels";
import {
  onboardingSchema,
  type OnboardingFormData,
  type RegistrationAccountData,
  type RegistrationProfileData,
} from "@/validation/onboarding";
import styles from "./signupcomponent.module.css";

type Country = { code: string; name: string };

function SignUpComponent() {
  const context = useContext(UserContext);
  const [step, setStep] = useState<1 | 2>(1);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [passions, setPassions] = useState<SearchableOption[]>([]);
  const [sports, setSports] = useState<SearchableOption[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    control,
    getValues,
    trigger,
    setError,
    clearErrors,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      invitation: "",
      avatarImage: null,
      profilePhrase: "",
      about: "",
      birthDate: "",
      countryCode: "",
      region: "",
      city: "",
      gender: "",
      customGender: "",
      relationshipStatus: "",
      childrenStatus: "",
      sexualOrientation: "",
      customSexualOrientation: "",
      smokingStatus: "",
      drinkingStatus: "",
      interests: [],
      activities: [],
      passionIDs: [],
      sportIDs: [],
      visibility: {
        avatar: "PUBLIC",
        profilePhrase: "PUBLIC",
        about: "PUBLIC",
        age: "PUBLIC",
        birthDate: "PRIVATE",
        gender: "PUBLIC",
        country: "PUBLIC",
        sexualOrientation: "PRIVATE",
        relationshipStatus: "AUTHENTICATED",
        childrenStatus: "AUTHENTICATED",
        city: "AUTHENTICATED",
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
      },
    },
  });

  useEffect(() => {
    const loadOptions = async () => {
      const response = await api.post("/graphql", {
        query: `query OnboardingOptions {
          passions { id name icon }
          sports { id name icon }
          countries { code name }
        }`,
      });
      if (!response.data.errors?.length) {
        setPassions(response.data.data.passions);
        setSports(response.data.data.sports);
        setCountries(response.data.data.countries);
      }
    };
    void loadOptions();
  }, []);

  if (!context) return null;

  const accountData = (): RegistrationAccountData => {
    const values = getValues();
    return {
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      invitation: values.invitation,
    };
  };

  const checkUsername = async (username: string) => {
    if (!username || errors.username) return;
    const response = await api.post("/graphql", {
      query: `query($username: String!) { usernameAvailable(username: $username) }`,
      variables: { username },
    });
    if (response.data.data?.usernameAvailable) clearErrors("username");
    else setError("username", { message: "Este username já está em uso ou é inválido." });
  };

  const checkEmail = async (email: string) => {
    if (!email || errors.email) return;
    const response = await api.post("/graphql", {
      query: `query($email: String!) { emailAvailable(email: $email) }`,
      variables: { email },
    });
    if (response.data.data?.emailAvailable) clearErrors("email");
    else setError("email", { message: "Este e-mail já está em uso ou é inválido." });
  };

  const checkInvitation = async (code: string) => {
    if (!code) return;
    const response = await api.post("/graphql", {
      query: `query($code: String!) { invitationStatus(code: $code) { valid message } }`,
      variables: { code },
    });
    const status = response.data.data?.invitationStatus;
    if (status?.valid) clearErrors("invitation");
    else setError("invitation", { message: status?.message ?? "Convite inválido." });
  };

  const proceed = async () => {
    const valid = await trigger(["name", "username", "email", "password", "confirmPassword", "invitation"]);
    if (!valid || loading) return;
    setLoading(true);
    try {
      const response = await api.post("/graphql", {
        query: `mutation($data: RegistrationAccountInput!) {
          validateRegistrationStep(data: $data) { onboardingToken expiresInSeconds }
        }`,
        variables: { data: accountData() },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      setOnboardingToken(response.data.data.validateRegistrationStep.onboardingToken);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível validar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const profileData = (values: OnboardingFormData): RegistrationProfileData => ({
    avatarImage: values.avatarImage,
    profilePhrase: values.profilePhrase,
    about: values.about,
    birthDate: values.birthDate,
    countryCode: values.countryCode,
    region: values.region,
    city: values.city,
    gender: values.gender,
    customGender: values.customGender,
    relationshipStatus: values.relationshipStatus,
    childrenStatus: values.childrenStatus,
    sexualOrientation: values.sexualOrientation,
    customSexualOrientation: values.customSexualOrientation,
    smokingStatus: values.smokingStatus,
    drinkingStatus: values.drinkingStatus,
    interests: values.interests,
    activities: values.activities,
    passionIDs: values.passionIDs,
    sportIDs: values.sportIDs,
    visibility: values.visibility,
  });

  const finish = async (values: OnboardingFormData, skip = false) => {
    if (!onboardingToken || loading || avatarUploading) return;
    setLoading(true);
    try {
      await context.completeRegistration(
        accountData(),
        skip ? {} : profileData(values),
        onboardingToken,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const usernameField = register("username");
  const emailField = register("email");
  const invitationField = register("invitation");

  return (
    <section className={styles.onboarding} aria-labelledby="signup-title">
      <div className={styles.progress} aria-label={`Etapa ${step} de 2`}>
        <span className={styles.active}>1. Conta</span>
        <div><i style={{ width: step === 1 ? "50%" : "100%" }} /></div>
        <span className={step === 2 ? styles.active : ""}>2. Perfil</span>
      </div>

      <form onSubmit={handleSubmit((values) => finish(values))} autoComplete="off">
        {step === 1 ? (
          <div className={styles.card}>
            <h1 id="signup-title">Crie sua conta</h1>
            <p>Comece com o essencial. Seu perfil vem na próxima etapa.</p>
            <label>Nome<input {...register("name")} autoComplete="name" />{errors.name && <small>{errors.name.message}</small>}</label>
            <label>Username
              <input
                {...usernameField}
                autoCapitalize="none"
                autoComplete="username"
                onBlur={async (event) => {
                  await usernameField.onBlur(event);
                  await checkUsername(event.target.value);
                }}
              />
              {errors.username && <small>{errors.username.message}</small>}
            </label>
            <label>E-mail
              <input
                {...emailField}
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={async (event) => {
                  await emailField.onBlur(event);
                  await checkEmail(event.target.value);
                }}
              />
              {errors.email && <small>{errors.email.message}</small>}
            </label>
            <div className={styles.twoColumns}>
              <label>Senha<input type="password" {...register("password")} autoComplete="new-password" />{errors.password && <small>{errors.password.message}</small>}</label>
              <label>Confirmar senha<input type="password" {...register("confirmPassword")} autoComplete="new-password" />{errors.confirmPassword && <small>{errors.confirmPassword.message}</small>}</label>
            </div>
            <label>Código de convite
              <input
                {...invitationField}
                onBlur={async (event) => {
                  await invitationField.onBlur(event);
                  await checkInvitation(event.target.value);
                }}
              />
              {errors.invitation && <small>{errors.invitation.message}</small>}
            </label>
            <button type="button" className={styles.primary} onClick={proceed} disabled={loading}>
              {loading ? "Validando…" : "Prosseguir"}
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <h1>Deixe o Orkkut com a sua cara</h1>
            <p>Todos os campos abaixo são opcionais.</p>

            <fieldset className={styles.section}>
              <legend>Sobre você</legend>
              <Controller
                name="avatarImage"
                control={control}
                render={({ field }) => (
                  <ImageUploadField
                    label="Foto de perfil"
                    purpose="USER_AVATAR"
                    value={field.value}
                    onChange={field.onChange}
                    onUploadingChange={setAvatarUploading}
                    authToken={onboardingToken ?? undefined}
                    hint="JPG, PNG ou WebP, até 5 MB."
                    disabled={loading}
                  />
                )}
              />
              <label>Frase do perfil<textarea {...register("profilePhrase")} rows={2} maxLength={280} />{errors.profilePhrase && <small>{errors.profilePhrase.message}</small>}</label>
              <label>Quem sou eu<textarea {...register("about")} rows={5} maxLength={1000} />{errors.about && <small>{errors.about.message}</small>}</label>
              <div className={styles.twoColumns}>
                <label>Data de nascimento<input type="date" {...register("birthDate")} />{errors.birthDate && <small>{errors.birthDate.message}</small>}</label>
                <label>País<select {...register("countryCode")}><option value="">Não informar</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
                <label>Estado/Província<input {...register("region")} /></label>
                <label>Cidade<input {...register("city")} /></label>
                <label>Gênero<select {...register("gender")}><option value="">Não informar</option>{selectOptions.gender.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                {watch("gender") === "OTHER" && <label>Como você se identifica?<input {...register("customGender")} />{errors.customGender && <small>{errors.customGender.message}</small>}</label>}
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Vida pessoal</legend>
              <div className={styles.twoColumns}>
                {(["relationshipStatus", "childrenStatus", "sexualOrientation", "smokingStatus", "drinkingStatus"] as const).map((name) => (
                  <label key={name}>{
                    name === "relationshipStatus" ? "Relacionamento" : name === "childrenStatus" ? "Filhos" : name === "sexualOrientation" ? "Orientação sexual" : name === "smokingStatus" ? "Fumo" : "Bebo"
                  }<select {...register(name)}><option value="">Não informar</option>{selectOptions[name].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                ))}
                {watch("sexualOrientation") === "OTHER" && <label>Como você descreve sua orientação?<input {...register("customSexualOrientation")} />{errors.customSexualOrientation && <small>{errors.customSexualOrientation.message}</small>}</label>}
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Gostos</legend>
              <Controller name="interests" control={control} render={({ field }) => <TagsInput label="Interesses" value={field.value} onChange={field.onChange} error={errors.interests?.message} disabled={loading} />} />
              <Controller name="passionIDs" control={control} render={({ field }) => <SearchableMultiSelect label="Paixões" options={passions} value={field.value} onChange={field.onChange} error={errors.passionIDs?.message} disabled={loading} />} />
              <Controller name="sportIDs" control={control} render={({ field }) => <SearchableMultiSelect label="Esportes" options={sports} value={field.value} onChange={field.onChange} error={errors.sportIDs?.message} disabled={loading} />} />
              <Controller name="activities" control={control} render={({ field }) => <TagsInput label="Atividades" value={field.value} onChange={field.onChange} error={errors.activities?.message} disabled={loading} />} />
            </fieldset>

            <div className={styles.actions}>
              <button type="button" onClick={() => setStep(1)} disabled={loading}>Voltar</button>
              <button type="button" onClick={() => finish(getValues(), true)} disabled={loading || avatarUploading}>Pular por enquanto</button>
              <button className={styles.primary} type="submit" disabled={loading || avatarUploading}>{loading ? "Criando…" : "Criar conta"}</button>
            </div>
          </div>
        )}
      </form>

      <p className={styles.loginLink}>Já é membro? <Link href="/">Faça login</Link></p>
    </section>
  );
}

export { SignUpComponent };
