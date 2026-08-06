"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Kon from "../../../../../../public/kon.jpg";
import { ImageUploadField } from "@/components/ImageUploadField/page";
import { SearchableMultiSelect, type SearchableOption } from "@/components/SearchableMultiSelect/page";
import { TagsInput } from "@/components/TagsInput/page";
import { ScrapbookPrivacyForm } from "@/components/ScrapbookPrivacyForm/page";
import type { Profile } from "@/types/profile";
import api from "@/utils/api";
import {
  defaultProfileVisibility,
  profileSelectOptions,
  visibilityFieldLabels,
  visibilityOptions,
} from "@/utils/profile-labels";
import { profileSchema, type RegistrationProfileData } from "@/validation/onboarding";
import styles from "./editprofile.module.css";

type Country = { code: string; name: string };
type VisibilityField = keyof typeof defaultProfileVisibility;

const enumFieldLabels = {
  gender: "Gênero",
  relationshipStatus: "Relacionamento",
  childrenStatus: "Filhos",
  sexualOrientation: "Orientação sexual",
  smokingStatus: "Fumo",
  drinkingStatus: "Bebo",
} as const;

const scalarFields = [
  "profilePhrase",
  "about",
  "birthDate",
  "countryCode",
  "region",
  "city",
  "gender",
  "customGender",
  "relationshipStatus",
  "childrenStatus",
  "sexualOrientation",
  "customSexualOrientation",
  "smokingStatus",
  "drinkingStatus",
] as const;

const listFields = ["interests", "activities", "passionIDs", "sportIDs"] as const;

const defaults: RegistrationProfileData = {
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
  visibility: { ...defaultProfileVisibility },
};

const profileSelection = `
  id avatarImageID profilePhrase about birthDate countryCode region city gender customGender
  relationshipStatus childrenStatus sexualOrientation customSexualOrientation smokingStatus
  drinkingStatus interests activities updatedAt
  visibility {
    avatar profilePhrase about age birthDate gender country city relationshipStatus
    childrenStatus sexualOrientation smokingStatus drinkingStatus interests passions sports activities
    socialFans socialCool socialSexy socialTrustworthy
  }
  avatarImage { id url originalName mimeType size width height purpose status }
  passions { id name icon }
  sports { id name icon }
`;

const normalizeProfileVersion = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const valuesFromProfile = (profile: Profile): RegistrationProfileData => ({
  ...defaults,
  avatarImage: profile.avatarImage ?? null,
  profilePhrase: profile.profilePhrase ?? "",
  about: profile.about ?? "",
  birthDate: profile.birthDate ?? "",
  countryCode: profile.countryCode ?? "",
  region: profile.region ?? "",
  city: profile.city ?? "",
  gender: (profile.gender as RegistrationProfileData["gender"]) ?? "",
  customGender: profile.gender === "OTHER" ? profile.customGender ?? "" : "",
  relationshipStatus: (profile.relationshipStatus as RegistrationProfileData["relationshipStatus"]) ?? "",
  childrenStatus: (profile.childrenStatus as RegistrationProfileData["childrenStatus"]) ?? "",
  sexualOrientation: (profile.sexualOrientation as RegistrationProfileData["sexualOrientation"]) ?? "",
  customSexualOrientation: profile.sexualOrientation === "OTHER"
    ? profile.customSexualOrientation ?? ""
    : "",
  smokingStatus: (profile.smokingStatus as RegistrationProfileData["smokingStatus"]) ?? "",
  drinkingStatus: (profile.drinkingStatus as RegistrationProfileData["drinkingStatus"]) ?? "",
  interests: profile.interests ?? [],
  activities: profile.activities ?? [],
  passionIDs: profile.passions?.map((item) => item.id) ?? [],
  sportIDs: profile.sports?.map((item) => item.id) ?? [],
  visibility: {
    ...defaultProfileVisibility,
    ...(profile.visibility as RegistrationProfileData["visibility"] | undefined),
  },
});

function EditProfilePage() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const [passions, setPassions] = useState<SearchableOption[]>([]);
  const [sports, setSports] = useState<SearchableOption[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState("");
  const initialValuesRef = useRef<RegistrationProfileData>(defaults);

  const {
    register,
    control,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<RegistrationProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/");
        return;
      }
      const response = await api.post(
        "/graphql",
        {
          query: `query EditProfileData {
            me { username }
            myProfile { ${profileSelection} }
            passions { id name icon }
            sports { id name icon }
            countries { code name }
          }`,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const authenticatedUsername = response.data.data.me.username as string;
      if (authenticatedUsername !== username) {
        router.replace(`/profile/${encodeURIComponent(authenticatedUsername)}/edit`);
        return;
      }
      const profile = response.data.data.myProfile as Profile;
      const initialValues = valuesFromProfile(profile);
      initialValuesRef.current = initialValues;
      setProfileVersion(normalizeProfileVersion(profile.updatedAt));
      reset(initialValues);
      setPassions(response.data.data.passions);
      setSports(response.data.data.sports);
      setCountries(response.data.data.countries);
    };

    setLoading(true);
    void load()
      .catch((error) => {
        setServerError(error instanceof Error ? error.message : "Erro ao carregar perfil.");
      })
      .finally(() => setLoading(false));
  }, [reset, router, username]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  const save = async (values: RegistrationProfileData) => {
    if (saving || uploading || !isDirty) return;
    setSaving(true);
    setServerError(null);
    try {
      const input: Record<string, unknown> = {};
      if (profileVersion) input.expectedUpdatedAt = profileVersion;
      const dirty = dirtyFields as Record<string, unknown>;
      if (dirty.avatarImage) input.avatarImageID = values.avatarImage?.id ?? null;
      for (const field of scalarFields) {
        if (dirty[field]) input[field] = values[field] === "" ? null : values[field];
      }
      for (const field of listFields) {
        if (dirty[field]) input[field] = values[field];
      }
      if (dirty.visibility) {
        const changedVisibility = dirty.visibility as Record<string, unknown>;
        input.visibility = Object.fromEntries(
          (Object.keys(changedVisibility) as VisibilityField[])
            .filter((field) => changedVisibility[field])
            .map((field) => [field, values.visibility[field]]),
        );
      }

      const response = await api.post(
        "/graphql",
        {
          query: `mutation UpdateMyProfile($data: ProfileInput!) {
            updateMyProfile(data: $data) { ${profileSelection} }
          }`,
          variables: { data: input },
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const updatedProfile = response.data.data.updateMyProfile as Profile;
      const updatedValues = valuesFromProfile(updatedProfile);
      initialValuesRef.current = updatedValues;
      setProfileVersion(normalizeProfileVersion(updatedProfile.updatedAt));
      reset(updatedValues);
      toast.success("Perfil atualizado com sucesso.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const leave = () => {
    if (isDirty && !window.confirm("Descartar as alterações não salvas?")) return;
    router.push(`/profile/${encodeURIComponent(username)}`);
  };

  const discard = () => {
    if (!isDirty || window.confirm("Descartar todas as alterações feitas nesta página?")) {
      reset(initialValuesRef.current);
      setServerError(null);
    }
  };

  const genderField = register("gender");
  const orientationField = register("sexualOrientation");
  const countryField = register("countryCode");
  const profilePhrase = watch("profilePhrase");
  const about = watch("about");

  if (loading) return <p role="status">Carregando perfil…</p>;

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit(save)} className={styles.form} noValidate>
        <h1>Editar perfil</h1>

        <h2>Perfil</h2>
        <Controller
          name="avatarImage"
          control={control}
          render={({ field }) => (
            <ImageUploadField
              key={profileVersion}
              label="Foto de perfil"
              purpose="USER_AVATAR"
              value={field.value}
              onChange={field.onChange}
              onUploadingChange={setUploading}
              disabled={saving}
              fallbackUrl={Kon.src}
              hint="JPG, PNG ou WebP, até 5 MB."
            />
          )}
        />
        <label>
          Frase do perfil
          <textarea {...register("profilePhrase")} rows={2} maxLength={280} />
          <span>{profilePhrase.length}/280 caracteres</span>
          {errors.profilePhrase && <small>{errors.profilePhrase.message}</small>}
        </label>
        <label>
          Quem sou eu
          <textarea {...register("about")} rows={5} maxLength={1000} />
          <span>{about.length}/1000 caracteres</span>
          {errors.about && <small>{errors.about.message}</small>}
        </label>

        <h2>Informações básicas</h2>
        <div className={styles.grid}>
          <label>Data de nascimento<input type="date" {...register("birthDate")} />{errors.birthDate && <small>{errors.birthDate.message}</small>}</label>
          <label>
            País
            <select
              {...countryField}
              onChange={(event) => {
                void countryField.onChange(event);
                setValue("region", "", { shouldDirty: true });
                setValue("city", "", { shouldDirty: true });
              }}
            >
              <option value="">Não informar</option>
              {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
          <label>Estado/Província<input {...register("region")} />{errors.region && <small>{errors.region.message}</small>}</label>
          <label>Cidade<input {...register("city")} />{errors.city && <small>{errors.city.message}</small>}</label>
          <label>
            Gênero
            <select
              {...genderField}
              onChange={(event) => {
                void genderField.onChange(event);
                if (event.target.value !== "OTHER") {
                  setValue("customGender", "", { shouldDirty: true, shouldValidate: true });
                }
              }}
            >
              <option value="">Não informar</option>
              {profileSelectOptions.gender.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {watch("gender") === "OTHER" && <label>Descrição do gênero<input {...register("customGender")} />{errors.customGender && <small>{errors.customGender.message}</small>}</label>}
        </div>

        <h2>Vida pessoal</h2>
        <div className={styles.grid}>
          {(["relationshipStatus", "childrenStatus", "smokingStatus", "drinkingStatus"] as const).map((name) => (
            <label key={name}>
              {enumFieldLabels[name]}
              <select {...register(name)}>
                <option value="">Não informar</option>
                {profileSelectOptions[name].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ))}
          <label>
            Orientação sexual
            <select
              {...orientationField}
              onChange={(event) => {
                void orientationField.onChange(event);
                if (event.target.value !== "OTHER") {
                  setValue("customSexualOrientation", "", { shouldDirty: true, shouldValidate: true });
                }
              }}
            >
              <option value="">Não informar</option>
              {profileSelectOptions.sexualOrientation.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {watch("sexualOrientation") === "OTHER" && <label>Descrição da orientação sexual<input {...register("customSexualOrientation")} />{errors.customSexualOrientation && <small>{errors.customSexualOrientation.message}</small>}</label>}
        </div>

        <h2>Gostos e atividades</h2>
        <Controller name="interests" control={control} render={({ field }) => <TagsInput label="Interesses" value={field.value} onChange={field.onChange} error={errors.interests?.message} disabled={saving} />} />
        <Controller name="passionIDs" control={control} render={({ field }) => <SearchableMultiSelect label="Paixões" options={passions} value={field.value} onChange={field.onChange} error={errors.passionIDs?.message} disabled={saving} />} />
        <Controller name="sportIDs" control={control} render={({ field }) => <SearchableMultiSelect label="Esportes" options={sports} value={field.value} onChange={field.onChange} error={errors.sportIDs?.message} disabled={saving} />} />
        <Controller name="activities" control={control} render={({ field }) => <TagsInput label="Atividades" value={field.value} onChange={field.onChange} error={errors.activities?.message} disabled={saving} />} />

        <fieldset className={styles.privacy}>
          <legend>Privacidade</legend>
          {(Object.keys(defaultProfileVisibility) as VisibilityField[]).map((field) => (
            <label key={field}>
              {visibilityFieldLabels[field]}
              <select {...register(`visibility.${field}`)}>
                {visibilityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ))}
        </fieldset>

        {serverError && <p className={styles.error} role="alert">{serverError}</p>}
        <div className={styles.actions}>
          <button type="button" onClick={leave}>Voltar ao perfil</button>
          <button type="button" onClick={discard} disabled={!isDirty || saving}>Descartar alterações</button>
          <button type="submit" disabled={!isDirty || saving || uploading}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
      <ScrapbookPrivacyForm />
    </main>
  );
}

export default EditProfilePage;
