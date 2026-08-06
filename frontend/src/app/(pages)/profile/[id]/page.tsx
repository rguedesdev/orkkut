"use client";

// Imports Principais
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

import api from "@/utils/api";

// Contexts
import { UserContext } from "@/context/UserContext";

// Style Sheet CSS
import styles from "./profile.module.css";

// Components
import { Loading } from "@/components/Loading/page";
import { BasicInfoComponent } from "@/components/BasicInfo/page";
import { ProfileDetailsComponent } from "@/components/ProfileDetails/page";
import { TestimonialsComponent } from "@/components/Testimonials/page";
import { FriendsComponent } from "@/components/Friends/page";
import { MyCommunitiesComponent } from "@/components/MyCommunities/page";

function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);

  console.log(user);

  // const Context = useContext(UserContext);
  // if (!Context) return null;

  // const { userAuthenticated } = Context;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }

    const checkUser = async () => {
      try {
        const response = await api.post(
          "/graphql",
          {
            query: `
            query Me {
              me {
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

        setUser(response.data.data.me);
      } catch (error) {
        console.error("Erro ao validar usuário:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

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

export default ProfilePage;
