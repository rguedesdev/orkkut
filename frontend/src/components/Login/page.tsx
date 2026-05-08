"use client";

// Imports Principais
import { useContext, useState } from "react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";

// Style Sheet CSS
import styles from "./login.module.css";

// Componentes
import { InputComponent } from "../Input/page";

// Schema Zod para SignIn
const CreateSignInSchema = z.object({
  email: z.email("O email é obrigatório!").trim(),
  password: z
    .string()
    .nonempty("A senha é obrigatória!")
    .min(6, "A senha precisa ter no mínimo 6 digitos!"),
});

type TCreateSignInFormData = z.infer<typeof CreateSignInSchema>;

function LoginComponent() {
  const Context = useContext(UserContext);
  if (!Context) return null;
  const { signIn } = Context;

  const [spinner, setSpinner] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateSignInFormData>({
    resolver: zodResolver(CreateSignInSchema),
  });

  const handleSignIn: SubmitHandler<TCreateSignInFormData> = async (data) => {
    setSpinner(true);

    try {
      if (!signIn) {
        console.log("Contexto de autenticação não disponível!");
        return;
      }

      await signIn(data.email, data.password);
    } catch (err: any) {
      console.error("Erro ao logar:", err);
      toast.error(err.message, {
        icon: <span className="text-red-500 text-2xl mb-1">&#10539;</span>,
        position: "top-center",
      });
    } finally {
      setSpinner(false);
    }
  };

  return (
    <section aria-labelledby={styles.loginTitle}>
      <div className={styles.loginBox}>
        <h1 id="loginTitle" className={styles.loginTitle}>
          Login
        </h1>

        <form onSubmit={handleSubmit(handleSignIn)} autoComplete="off">
          <InputComponent
            inputLabel="Email"
            inputType="email"
            inputID="email"
            inputPlaceholder="Digite seu email"
            register={register("email")}
            error={errors.email?.message}
          />

          <InputComponent
            inputLabel="Senha"
            inputType="password"
            inputID="password"
            inputPlaceholder="Digite sua senha"
            register={register("password")}
            error={errors.password?.message}
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

        <p className={styles.recoverBox}>
          <span>Esqueceu a senha ou email?</span>{" "}
          <Link href="/" className={styles.recover}>
            Clique Aqui!
          </Link>
        </p>
      </div>

      <aside className={styles.notMemberBox}>
        <p className={styles.signupBox}>
          <span className={styles.notYetAMemberTitle}>Ainda não é membro?</span>{" "}
          <Link href="/signup" className={styles.signUp}>
            Junte-se ao Orkkut!
          </Link>
        </p>
      </aside>
    </section>
  );
}

export { LoginComponent };
