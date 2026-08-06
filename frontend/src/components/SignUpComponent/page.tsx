"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";

// Style Sheet CSS
import styles from "./signupcomponent.module.css";

// Componentes
import { InputComponent } from "../Input/page";

// Schema Zod para SignUp
const CreateSignUpSchema = z
  .object({
    name: z.string().trim().nonempty("O nome é obrigatório!"),
    username: z.string().trim().nonempty("O username é obrigatório!"),
    email: z.email("O email é obrigatório!").trim(),
    password: z
      .string()
      .trim()
      .nonempty("A senha é obrigatória!")
      .min(6, "A senha precisa ter pelo menos 6 caracteres!")
      .max(120),
    confirmPassword: z
      .string()
      .nonempty("A confirmação da Senha é obrigatória!")
      .trim()
      .min(6, "A senha precisa ter pelo menos 6 caracteres!")
      .max(120),
    invitation: z
      .string()
      .trim()
      .nonempty("O código do convite é obrigatório!"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem!",
    path: ["confirmPassword"], // Indica que o erro aparecerá no campo de confirmar
  });

type TCreateSignUpFormData = z.infer<typeof CreateSignUpSchema>;

function SignUpComponent() {
  const Context = useContext(UserContext);
  if (!Context) return null;

  const { signUp } = Context;

  const [spinner, setSpinner] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateSignUpFormData>({
    resolver: zodResolver(CreateSignUpSchema),
  });

  const handleSignUp: SubmitHandler<TCreateSignUpFormData> = async (data) => {
    setSpinner(true);

    try {
      if (!signUp) {
        console.log("Contexto de autenticação não disponível!");
        return;
      }

      await signUp(
        data.name,
        data.username,
        data.email,
        data.password,
        data.confirmPassword,
        data.invitation,
      );
    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);
      toast.error(err.message);
    } finally {
      setSpinner(false);
    }
  };

  return (
    <section aria-labelledby={styles.loginTitle}>
      <div className={styles.signUpBox}>
        <h1 id="loginTitle" className={styles.signUpTitle}>
          Cadastre-se
        </h1>

        <form onSubmit={handleSubmit(handleSignUp)} autoComplete="off">
          <InputComponent
            inputLabel="Name"
            inputType="text"
            inputID="name"
            inputPlaceholder="Digite o seu nome completo"
            register={register("name")}
            error={errors.name?.message}
          />

          <InputComponent
            inputLabel="Username"
            inputType="text"
            inputID="username"
            inputPlaceholder="Digite o seu nome username"
            register={register("username")}
            error={errors.username?.message}
          />

          <InputComponent
            inputLabel="Email"
            inputType="email"
            inputID="email"
            inputPlaceholder="Digite o seu email"
            register={register("email")}
            error={errors.email?.message}
          />

          <InputComponent
            inputLabel="Senha"
            inputType="password"
            inputID="password"
            inputPlaceholder="Digite a sua Senha"
            register={register("password")}
            error={errors.password?.message}
          />

          <InputComponent
            inputLabel="Confirme a Senha"
            inputType="password"
            inputID="confirmPassword"
            inputPlaceholder="Confirme a Senha"
            register={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <InputComponent
            inputLabel="Convite"
            inputType="text"
            inputID="invitation"
            inputPlaceholder="Digite o código do Convite"
            register={register("invitation")}
            error={errors.invitation?.message}
          />

          {spinner ? (
            <button className={styles.btnEnter}>
              <span className={styles.spinner}></span>
            </button>
          ) : (
            <button className={styles.btnEnter} type="submit">
              Entrar
            </button>
          )}
        </form>

        {/* <p className={styles.recoverBox}>
          <span>Esqueceu a senha ou email?</span>{" "}
          <Link href="/" className={styles.recover}>
            Clique Aqui!
          </Link>
        </p> */}
      </div>

      <aside className={styles.memberBox}>
        <p className={styles.signupBox}>
          <span className={styles.memberTitle}>Já é membro?</span>
          <Link href="/" className={styles.signUp}>
            Faça login!
          </Link>
        </p>
      </aside>
    </section>
  );
}

export { SignUpComponent };
