"use client";

// Imports Principais
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ToastContainer, toast } from "react-toastify";

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

function CommunityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const { slug } = useParams();

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
                  description
                  members
                  createdAt
                  category
                  privacy
                  country
                  language

                  membersList {
                    role
                    user {
                      id
                      name
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

  return (
    <div className={styles.page}>
      <ToastContainer position="top-center" style={{ marginTop: "80px" }} />
      <main className={styles.communityContainer}>
        <CommunityBasicInfoComponent
          community={community}
          owner={isOwner}
          setCommunity={setCommunity}
        />
        <div className={styles.communityCentralContainer}>
          <CommunityDetailsComponent community={community} />
          <ForumComponent />
        </div>
        <div className={styles.communityRightContainer}>
          <CommunityMembersComponent
            communityMembers={community?.membersList}
          />
          <RelatedCommunitiesComponent />
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;
