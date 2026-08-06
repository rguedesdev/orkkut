"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BasicInfoComponent } from "@/components/BasicInfo/page";
import { Loading } from "@/components/Loading/page";
import { ScrapsComponent } from "@/components/Scraps/page";
import type { ProfileUser } from "@/types/profile";
import api from "@/utils/api";
import styles from "./scrapbookpage.module.css";

const userSelection = `
  id name username email
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
`;

function ScrapbookPage({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [scrapCount, setScrapCount] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (isOwnProfile && !token) {
        router.replace("/");
        return;
      }
      const response = await api.post("/graphql", {
        query: isOwnProfile
          ? `query ScrapbookOwner { me { ${userSelection} } }`
          : `query ScrapbookUser($username: String!) { user(username: $username) { ${userSelection} } }`,
        variables: isOwnProfile ? undefined : { username },
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      if (response.data.errors?.length) throw new Error(response.data.errors[0].message);
      const loaded = (isOwnProfile ? response.data.data.me : response.data.data.user) as ProfileUser | null;
      if (!loaded) throw new Error("Usuário não encontrado.");
      if (isOwnProfile && loaded.username !== username) {
        router.replace(`/profile/${encodeURIComponent(loaded.username)}/scraps`);
        return;
      }
      if (!isOwnProfile && loaded.relationship.viewerIsProfileOwner) {
        router.replace(`/profile/${encodeURIComponent(loaded.username)}/scraps`);
        return;
      }
      setUser(loaded);
    };

    setLoading(true);
    setError(null);
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o mural.");
    }).finally(() => setLoading(false));
  }, [isOwnProfile, router, username]);

  if (loading) return <Loading />;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return null;

  return (
    <div className={styles.page}>
      <main className={styles.mainContainer}>
        <BasicInfoComponent
          user={user}
          isOwnProfile={isOwnProfile}
          scrapCount={scrapCount}
          onRelationshipChange={(relationship, socialInteractions) =>
            setUser((current) => current ? { ...current, relationship, socialInteractions } : current)
          }
        />
        <div className={styles.scrapsColumn}>
          <ScrapsComponent
            userID={user.id}
            username={user.username}
            name={user.name}
            onCountChange={setScrapCount}
          />
        </div>
      </main>
    </div>
  );
}

export { ScrapbookPage };
