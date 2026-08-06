"use client";

// Imports Principais
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/utils/api";

// Style Sheet CSS
import styles from "./profile.module.css";

// Components
import { Loading } from "@/components/Loading/page";
import { BasicInfoComponent } from "@/components/BasicInfo/page";
import { ProfileDetailsComponent } from "@/components/ProfileDetails/page";
import { TestimonialsComponent } from "@/components/Testimonials/page";
import { FriendsComponent } from "@/components/Friends/page";
import { FriendRequestsComponent } from "@/components/FriendRequests/page";
import { MyCommunitiesComponent } from "@/components/MyCommunities/page";
import type { ProfileUser } from "@/types/profile";

function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [friendsVersion, setFriendsVersion] = useState(0);

  console.log(user);

  // const Context = useContext(UserContext);
  // if (!Context) return null;

  // const { userAuthenticated } = Context;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/");
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
          const message = response.data.errors[0]?.message ?? "Erro ao carregar perfil.";

          if (
            message.includes("Acesso negado") ||
            message.includes("Usuário não encontrado")
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("userID");
            delete api.defaults.headers.Authorization;
            router.replace("/");
            return;
          }

          setError(message);
          return;
        }

        const authenticatedUser = response.data.data.me;
        setUser(authenticatedUser);

        if (params.username !== authenticatedUser.username) {
          router.replace(
            `/profile/${encodeURIComponent(authenticatedUser.username)}`,
          );
        }
      } catch (error) {
        console.error("Erro ao validar usuário:", error);
        setError("Não foi possível carregar o perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [params.username, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className={styles.page}>
      <main className={styles.mainContainer}>
        {user && <BasicInfoComponent
          user={user}
          isOwnProfile
          onRelationshipChange={(relationship, socialInteractions) =>
            setUser((current) => current ? { ...current, relationship, socialInteractions } : current)
          }
        />}
        <div className={styles.centralContainer}>
          {user && <ProfileDetailsComponent user={user} />}
          <FriendRequestsComponent onRelationshipChanged={() => setFriendsVersion((version) => version + 1)} />
          <TestimonialsComponent />
        </div>
        <div className={styles.rightContainer}>
          {user && <FriendsComponent key={`${user.id}:${friendsVersion}`} userID={user.id} isOwnProfile />}
          <MyCommunitiesComponent />
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
