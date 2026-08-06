"use client";

// Imports Principais
import { useState, useEffect, useContext } from "react";
import { useRouter, useParams } from "next/navigation";

import api from "@/utils/api";

// Contexts
import { UserContext } from "@/context/UserContext";

// Style Sheet CSS
import styles from "./user.module.css";

// Components
import { Loading } from "@/components/Loading/page";
import { BasicInfoComponent } from "@/components/BasicInfo/page";
import { ProfileDetailsComponent } from "@/components/ProfileDetails/page";
import { TestimonialsComponent } from "@/components/Testimonials/page";
import { FriendsComponent } from "@/components/Friends/page";
import { MyCommunitiesComponent } from "@/components/MyCommunities/page";
import { div } from "framer-motion/client";

function UserPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const params = useParams(); // pega o id da rota /profile/:id

  console.log(user);

  useEffect(() => {
    if (!params?.id) {
      router.push("/"); // redireciona se não tiver id
      return;
    }

    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await api.post(
          "/graphql",
          {
            query: `
              query User($id: ID!) {
                user(id: $id) {
                  name
                  nickname
                  email
                  attributes {
                    fans
                    cool
                    sexy
                    reliable
                  }
                }
              }
            `,
            variables: {
              id: params.id,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // DEBUG REAL
        console.log("GraphQL response:", response.data);

        if (response.data.errors) {
          console.error("GraphQL errors:", response.data.errors);
          router.push("/");
          return;
        }

        setUser(response.data.data.user);
      } catch (error) {
        console.error("Erro ao validar usuário:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  if (isLoading) {
    return <Loading />;
  }

  if (!user) return <p>Usuário não encontrado.</p>;

  return (
    <div className={styles.page}>
      <main className={styles.mainContainer}>
        {user && <BasicInfoComponent user={user} />}
        <div className={styles.centralContainer}>
          {user && <ProfileDetailsComponent user={user} />}
          <TestimonialsComponent />
        </div>
        <div className={styles.rightContainer}>
          <FriendsComponent />
          <MyCommunitiesComponent />
        </div>
      </main>
    </div>
  );
}

export default UserPage;
