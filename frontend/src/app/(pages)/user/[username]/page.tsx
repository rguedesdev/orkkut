"use client";

// Imports Principais
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import api from "@/utils/api";

// Style Sheet CSS
import styles from "./user.module.css";

// Components
import { Loading } from "@/components/Loading/page";
import { BasicInfoComponent } from "@/components/BasicInfo/page";
import { ProfileDetailsComponent } from "@/components/ProfileDetails/page";
import { TestimonialsComponent } from "@/components/Testimonials/page";
import { FriendsComponent } from "@/components/Friends/page";
import { MyCommunitiesComponent } from "@/components/MyCommunities/page";
import type { ProfileUser } from "@/types/profile";

function UserPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const params = useParams<{ username: string }>();

  console.log(user);

  useEffect(() => {
    if (!params?.username) {
      setError("Username não informado.");
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await api.post(
          "/graphql",
          {
            query: `
              query User($username: String!) {
                user(username: $username) {
                name
                id
                username
                  email
                  relationship {
                    status targetUserID requestID canSendRequest canAcceptRequest canDeclineRequest
                    canCancelRequest canRemoveFriend canBlock canUnblock viewerIsFriend viewerIsProfileOwner
                  }
                  socialInteractions {
                    fansVisible fanCount viewerIsFan viewerCanInteract viewerIsProfileOwner viewerIsFriend
                    legal { visible count average percentage level1Count level2Count level3Count viewerValue }
                    sexy { visible count average percentage level1Count level2Count level3Count viewerValue }
                    trustworthy { visible count average percentage level1Count level2Count level3Count viewerValue }
                  }
                  profile {
                  id avatarImageID profilePhrase about birthDate age countryCode region city gender customGender
                  relationshipStatus childrenStatus sexualOrientation customSexualOrientation smokingStatus drinkingStatus
                  interests activities
                  avatarImage { id url originalName mimeType size width height purpose status }
                  passions { id name slug icon }
                  sports { id name slug icon }
                  }
                }
              }
            `,
            variables: {
              username: params.username,
            },
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        );

        // DEBUG REAL
        console.log("GraphQL response:", response.data);

        if (response.data.errors) {
          console.error("GraphQL errors:", response.data.errors);
          setError(response.data.errors[0]?.message ?? "Não foi possível carregar este perfil.");
          return;
        }

        const visitedUser = response.data.data.user as ProfileUser | null;
        if (!visitedUser) {
          setError("Usuário não encontrado.");
          return;
        }
        if (visitedUser.relationship.viewerIsProfileOwner) {
          router.replace(`/profile/${encodeURIComponent(visitedUser.username)}`);
          return;
        }
        setUser(visitedUser);
      } catch (error) {
        console.error("Erro ao validar usuário:", error);
        setError("Não foi possível carregar este perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.username, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) return <p role="alert">{error}</p>;

  if (!user) return <p>Usuário não encontrado.</p>;

  return (
    <div className={styles.page}>
      <main className={styles.mainContainer}>
        {user && <BasicInfoComponent
          user={user}
          onRelationshipChange={(relationship, socialInteractions) =>
            setUser((current) => current ? { ...current, relationship, socialInteractions } : current)
          }
        />}
        <div className={styles.centralContainer}>
          {user && <ProfileDetailsComponent user={user} />}
          <TestimonialsComponent />
        </div>
        <div className={styles.rightContainer}>
          {user && <FriendsComponent key={`${user.id}:${user.relationship.status}`} userID={user.id} />}
          <MyCommunitiesComponent />
        </div>
      </main>
    </div>
  );
}

export default UserPage;
