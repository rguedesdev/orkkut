"use client";

// Imports Principais
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Axios
import api from "@/utils/api";

// Style Sheet CSS
import styles from "./createcommunity.module.css";

// Componentes
import { InputComponent } from "@/components/Input/page";
import { SelectComponent } from "@/components/Select/page";

// Schema de validação usando Zod
const CreateCommunitySchema = z.object({
  name: z
    .string()
    .min(5, "Insira pelo menos 5 caracteres!")
    .max(120, "Insira no máximo 120 caracteres!"),
  description: z.string().nonempty("A descrição é obrigatória!"),
  category: z.string().nonempty("Selecione a categoria!"),
  privacy: z.string().nonempty("Selecione o tipo de privacidade!"),
  country: z.string().nonempty("Selecione o país!"),
  language: z.string().nonempty("Selecione o idioma!"),
});

// Tipo para os dados do formulário, inferido a partir do schema
type TCreateCommunityFormData = z.infer<typeof CreateCommunitySchema>;

function CreateCommunity() {
  const [name, setName] = useState("");

  const router = useRouter();

  const categorias = [
    { value: "anime", label: "Anime" },
    { value: "manga", label: "Mangá" },
    { value: "games", label: "Jogos" },
    { value: "retro", label: "Retro Gaming" },
  ];

  const privacy = [
    { value: "public", label: "Público" },
    { value: "private", label: "Privado" },
    { value: "secret", label: "Secreto" },
  ];

  const countries = [
    { value: "brazil", label: "Brasil" },
    { value: "usa", label: "Estados Unidos" },
  ];

  const languages = [
    { value: "pt-BR", label: "Português" },
    { value: "en", label: "Inglês" },
  ];

  // Configuração do React Hook Form com validação Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateCommunityFormData>({
    resolver: zodResolver(CreateCommunitySchema),
  });

  const handleCreateCommunity = async (data: TCreateCommunityFormData) => {
    const mutation = `
      mutation CreateCommunity($input: CreateCommunityInput!) {
        createCommunity(input: $input) {
          id
          name
        }
      }
    `;

    try {
      // Usando a sua instância do Axios (api)
      const response = await api.post("/graphql", {
        query: mutation,
        variables: {
          input: data, // O Zod já validou e deixou os campos idênticos ao Input do GraphQL
        },
      });

      const { data: gqlData, errors } = response.data;

      if (errors?.length) {
        throw new Error(errors[0].message);
      }

      console.log("Comunidade criada com sucesso!", gqlData.createCommunity);

      // Redireciona para a página da comunidade recém-criada
      router.push(`/community/${gqlData.createCommunity.id}`);
    } catch (err: any) {
      console.error("Erro ao criar comunidade:", err);
      alert(err.message || "Erro ao conectar com o servidor");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <h1 className={styles.communityTitle}>Criar Comunidade</h1>
        <form onSubmit={handleSubmit(handleCreateCommunity)} autoComplete="off">
          <InputComponent
            inputLabel="Nome da Comunidade"
            inputType="text"
            inputID="name"
            inputPlaceholder="Digite o nome da Comunidade"
            register={register("name")}
            error={errors.name?.message}
          />

          <div>
            <fieldset
              className={`${errors.description ? `${styles.fieldsetError}` : `${styles.fieldset}`}`}
            >
              <legend className={styles.legend}>Descrição</legend>
              <textarea
                className={styles.textarea}
                placeholder="Descrição da Comunidade"
                {...register("description")}
              />
            </fieldset>
            {errors.description && (
              <span
                className={styles.errorTextarea}
              >{`※ ${errors.description.message}`}</span>
            )}
          </div>

          <div className={styles.selectsContainer}>
            <SelectComponent
              selectLabel="Categoria"
              register={register("category")}
              options={categorias}
              error={errors.category?.message}
            />

            <SelectComponent
              selectLabel="Privacidade"
              register={register("privacy")}
              options={privacy}
              error={errors.privacy?.message}
            />

            <SelectComponent
              selectLabel="País"
              register={register("country")}
              options={countries}
              error={errors.country?.message}
            />

            <SelectComponent
              selectLabel="Idioma"
              register={register("language")}
              options={languages}
              error={errors.language?.message}
            />
          </div>

          <button className={styles.btnCreate} type="submit">
            Criar Comunidade
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateCommunity;
