"use client";

// Imports Principais
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";

// Axios
import api from "@/utils/api";

// Style Sheet CSS
import styles from "./signup.module.css";

// Components
import { WelcomeComponent } from "@/components/Welcome/page";
import { SignUpComponent } from "@/components/SignUpComponent/page";

function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const checkUser = async () => {
      try {
        const response = await api.post("/graphql", {
          query: `
            query {
              me {
                id
              }
            }
          `,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userId = response.data.data.me?.id;
        if (userId) {
          router.push(`/profile/${userId}`);
        }
      } catch (err) {
        console.error("Erro ao validar usuário:", err);
        localStorage.removeItem("token"); // limpa token inválido
      }
    };

    checkUser();
  }, [router]);

  return (
    <main className={styles.container}>
      <ToastContainer
        position="top-center"
        style={{ marginTop: "80px" }}
        icon={<span className="text-red-500 text-2xl mb-1">&#10539;</span>}
      />
      <SignUpComponent />
    </main>
  );
}

export default SignUpPage;
