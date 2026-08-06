"use client";

// Imports Principais
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";

// Axios
import api from "@/utils/api";

// Style Sheet CSS
import styles from "./home.module.css";

// Components
import { WelcomeComponent } from "@/components/Welcome/page";
import { LoginComponent } from "@/components/Login/page";

function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const checkUser = async () => {
      try {
        const response = await api.post(
          "/graphql",
          {
            query: `
              query {
                me {
                  id
                  username
                }
              }
            `,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0].message);
        }

        const user = response.data.data.me;
        if (user?.username) {
          router.replace(`/profile/${encodeURIComponent(user.username)}`);
        }
      } catch (err) {
        console.error("Erro ao validar usuário:", err);
        localStorage.removeItem("token"); // limpa token inválido
        localStorage.removeItem("userID");
        delete api.defaults.headers.Authorization;
      }
    };

    checkUser();
  }, [router]);

  return (
    <>
      <ToastContainer
        position="top-center"
        style={{ marginTop: "80px" }}
        icon={<span className="text-red-500 text-2xl mb-1">&#10539;</span>}
      />
      <aside className={styles.infoBanner}>
        <p className={styles.boujeeText}>
          Não temos nenhum vínculo com a Alphabet/Google nem com o Orkut
          Buyukkokten. Somos apenas um site feito por fãs, para fãs.
        </p>
      </aside>
      <main className={styles.container}>
        <WelcomeComponent />
        <LoginComponent />
      </main>
    </>
  );
}

export default HomePage;
