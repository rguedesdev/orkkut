"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import api from "@/utils/api";
import styles from "./scrapbookprivacy.module.css";

const settingsSchema = z.object({
  viewPermission: z.enum(["EVERYONE", "AUTHENTICATED", "FRIENDS", "ONLY_ME"]),
  writePermission: z.enum(["AUTHENTICATED", "FRIENDS", "NOBODY"]),
  allowNotifications: z.boolean(),
});
type SettingsData = z.infer<typeof settingsSchema>;

function ScrapbookPrivacyForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, reset, handleSubmit, formState: { isDirty } } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { viewPermission: "AUTHENTICATED", writePermission: "FRIENDS", allowNotifications: true },
  });

  useEffect(() => {
    void api.post("/graphql", { query: `query { myScrapbookSettings { viewPermission writePermission allowNotifications } }` }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((response) => {
        if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
        reset(response.data.data.myScrapbookSettings);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a privacidade dos scraps."))
      .finally(() => setLoading(false));
  }, [reset]);

  const save = handleSubmit(async (input) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await api.post("/graphql", {
        query: `mutation($input: UpdateScrapbookSettingsInput!) {
          updateMyScrapbookSettings(input: $input) { viewPermission writePermission allowNotifications }
        }`,
        variables: { input },
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      reset(response.data.data.updateMyScrapbookSettings);
      toast.success("Privacidade dos scraps atualizada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a privacidade dos scraps.");
    } finally {
      setSaving(false);
    }
  });

  if (loading) return <section className={styles.form}><p role="status">Carregando privacidade dos scraps…</p></section>;

  return (
    <form className={styles.form} onSubmit={save}>
      <fieldset>
        <legend>Privacidade dos scraps</legend>
        <p>Scraps são recados exibidos no seu perfil. Não compartilhe informações privadas no mural.</p>
        <label>Quem pode ver meus scraps?
          <select {...register("viewPermission")}>
            <option value="EVERYONE">Todos</option>
            <option value="AUTHENTICATED">Usuários cadastrados</option>
            <option value="FRIENDS">Amigos</option>
            <option value="ONLY_ME">Somente eu</option>
          </select>
        </label>
        <label>Quem pode me enviar scraps?
          <select {...register("writePermission")}>
            <option value="AUTHENTICATED">Usuários cadastrados</option>
            <option value="FRIENDS">Amigos</option>
            <option value="NOBODY">Ninguém</option>
          </select>
        </label>
        <label className={styles.checkbox}><input type="checkbox" {...register("allowNotifications")} /> Permitir notificações de novos scraps</label>
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" disabled={!isDirty || saving}>{saving ? "Salvando…" : "Salvar privacidade dos scraps"}</button>
    </form>
  );
}

export { ScrapbookPrivacyForm };
