"use client";

// Imports Principais
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import { ToastContainer } from "react-toastify";

import api from "@/utils/api";

// Style Sheet CSS
import styles from "./communityId.module.css";

// Components
import { Loading } from "@/components/Loading/page";
import { CommunityBasicInfoComponent } from "@/components/CommunityBasicInfo/page";
import { CommunityDetailsComponent } from "@/components/CommunityDetails/page";
import { ForumComponent } from "@/components/Forum/page";
import { CommunityMembersComponent } from "@/components/CommunityMembers/page";
import { RelatedCommunitiesComponent } from "@/components/RelatedCommunities/page";
import type { Community, CommunityUpdate } from "@/types/community";

function CommunityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (!slug) return;

    const fetchCommunity = async () => {
      try {
        const token = localStorage.getItem("token");
        const loggedUserId = localStorage.getItem("userID");

        // Se não tem token, nem tenta a requisição
        if (!token) {
          console.error("Token não encontrado");
          return;
        }

        const response = await api.post(
          "/graphql",
          {
            query: `
              query Community($slug: String!) {
                community(slug: $slug) {
                  ownerID
                  id
                  name
                  slug
                  description
                  members
                  createdAt
                  category
                  privacy
                  country
                  language
                  canEdit
                  avatarImageID
                  coverImageID
                  avatarImage { id url originalName mimeType size width height purpose status }
                  coverImage { id url originalName mimeType size width height purpose status }

                  membersList {
                    role
                    user {
                      id
                      name
                      username
                    }
                  }
                }
              }
            `,
            variables: { slug },
          },
          {
            // O TOKEN PRECISA ESTAR AQUI!
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.errors) {
          console.error("GraphQL errors:", response.data.errors);
          return;
        }

        const communityData = response.data.data.community;
        setCommunity(communityData);

        // Agora a comparação vai funcionar porque os dados de fato chegaram
        if (loggedUserId && communityData?.ownerID) {
          const s1 = String(loggedUserId).trim().replace(/[\\"]/g, "");
          const s2 = String(communityData.ownerID).trim().replace(/[\\"]/g, "");

          const matches = s1 === s2;

          setIsOwner(matches);
        }
      } catch (error) {
        console.error("Erro ao buscar comunidade:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunity();
  }, [slug]);

  if (isLoading) {
    return <Loading />;
  }

  if (!community) {
    return <p>Comunidade não encontrada.</p>;
  }

  const loggedUserID = localStorage.getItem("userID");
  const canCreateTopic = community.membersList.some(
    (member) => String(member.user.id) === String(loggedUserID),
  );

  return (
    <div className={styles.page}>
      <ToastContainer position="top-center" style={{ marginTop: "80px" }} />
      <main className={styles.communityContainer}>
        {community.coverImage && (
          <div className={styles.communityCover}>
            <Image
              src={community.coverImage.url}
              alt={`Capa da comunidade ${community.name}`}
              fill
              unoptimized
              priority
            />
          </div>
        )}
        <div className={styles.communityColumns}>
        <CommunityBasicInfoComponent
          community={community}
          owner={isOwner}
          setCommunity={(update: CommunityUpdate) =>
            setCommunity((current) => {
              if (!current) return current;
              return typeof update === "function" ? update(current) : update;
            })
          }
        />
        <div className={styles.communityCentralContainer}>
          <CommunityDetailsComponent community={community} />
          <ForumComponent
            communityID={community?.id}
            communitySlug={community?.slug}
            canCreateTopic={canCreateTopic}
          />
        </div>
        <div className={styles.communityRightContainer}>
          <CommunityMembersComponent
            communityMembers={community?.membersList}
          />
          <RelatedCommunitiesComponent />
        </div>
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;
