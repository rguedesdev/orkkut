"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { CommunityBasicInfoComponent } from "@/components/CommunityBasicInfo/page";
import { Loading } from "@/components/Loading/page";
import { Topic } from "@/components/Topic/page";
import type { TopicSummary } from "@/types/topic";
import type { Community, CommunityUpdate } from "@/types/community";
import api from "@/utils/api";
import styles from "./topic.module.css";

type TopicDetails = TopicSummary & {
  authorID: string;
  community: Community;
};

function TopicPage() {
  const { slug, topicID } = useParams<{ slug: string; topicID: string }>();
  const [topic, setTopic] = useState<TopicDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/graphql",
          {
            query: `
              query Topic($id: ID!) {
                topic(id: $id) {
                  id
                  authorID
                  title
                  content
                  commentsCount
                  likesCount
                  likedByMe
                  canDelete
                  canEdit
                  featuredImageID
                  featuredImage { id url originalName mimeType size width height purpose status }
                  createdAt
                  updatedAt
                  author { id name username }
                  community {
                    id
                    name
                    slug
                    description
                    category
                    privacy
                    country
                    language
                    members
                    ownerID
                    canEdit
                    avatarImageID
                    coverImageID
                    avatarImage { id url originalName mimeType size width height purpose status }
                    coverImage { id url originalName mimeType size width height purpose status }
                    createdAt
                    membersList {
                      role
                      user { id name username }
                    }
                  }
                }
              }
            `,
            variables: { id: topicID },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0].message);
        }
        if (!response.data.data.topic) {
          throw new Error("Tópico não encontrado.");
        }
        setTopic(response.data.data.topic);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar tópico.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [topicID]);

  if (isLoading) return <Loading />;
  if (error || !topic) return <p className={styles.error}>{error}</p>;

  const loggedUserID = localStorage.getItem("userID");
  const isOwner = String(loggedUserID) === String(topic.community.ownerID);
  const canInteract = topic.community.membersList.some(
    (member) => String(member.user.id) === String(loggedUserID),
  );

  return (
    <div className={styles.page}>
      <main className={styles.topicContainer}>
        <CommunityBasicInfoComponent
          community={topic.community}
          owner={isOwner}
          setCommunity={(update: CommunityUpdate) =>
            setTopic((current) => {
              if (!current) return current;
              const community =
                typeof update === "function"
                  ? update(current.community)
                  : update;
              return { ...current, community };
            })
          }
        />
        <Topic
          topic={topic}
          communitySlug={slug}
          canInteract={canInteract}
          setTopic={(updated) =>
            setTopic((current) =>
              current ? { ...current, ...updated } : current,
            )
          }
        />
      </main>
    </div>
  );
}

export default TopicPage;
