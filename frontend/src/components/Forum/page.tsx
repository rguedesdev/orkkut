"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaRegPenToSquare } from "react-icons/fa6";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

import api from "@/utils/api";
import type { TopicSummary } from "@/types/topic";
import Kon from "../../../public/kon.jpg";
import styles from "./forum.module.css";

type ForumProps = {
  communityID?: string;
  communitySlug?: string;
  canCreateTopic?: boolean;
};

type TopicPage = {
  items: TopicSummary[];
  page: number;
  totalPages: number;
  hasNextPage: boolean;
};

function ForumComponent({
  communityID,
  communitySlug,
  canCreateTopic,
}: ForumProps) {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityID) return;

    const fetchTopics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await api.post(
          "/graphql",
          {
            query: `
              query TopicsByCommunity($communityID: ID!, $page: Int!) {
                topicsByCommunity(
                  communityID: $communityID
                  page: $page
                  limit: 5
                ) {
                  items {
                    id
                    title
                    commentsCount
                    likesCount
                    createdAt
                    author {
                      id
                      name
                      username
                    }
                  }
                  page
                  totalPages
                  hasNextPage
                }
              }
            `,
            variables: { communityID, page },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0].message);
        }

        const result: TopicPage = response.data.data.topicsByCommunity;
        setTopics(result.items);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar tópicos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [communityID, page]);

  return (
    <section>
      <div className={styles.forumContainer}>
        <div className={styles.topForumElements}>
          <h2 className={styles.forumTitle}>Fórum</h2>
          {communitySlug && canCreateTopic && (
            <Link
              className={styles.createTopicBtn}
              href={`/community/${encodeURIComponent(communitySlug)}/create-topic`}
            >
              <FaRegPenToSquare size={20} /> <span>Criar tópico</span>
            </Link>
          )}
        </div>

        {isLoading && <p className={styles.status}>Carregando tópicos...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!isLoading && !error && topics.length === 0 && (
          <p className={styles.status}>Esta comunidade ainda não possui tópicos.</p>
        )}

        {topics.map((topic) => (
          <article key={topic.id} className={styles.topicContainer}>
            <Image
              className={styles.forumPicture}
              src={Kon}
              alt={`Foto de ${topic.author.name}`}
              width={60}
              height={60}
            />
            <div className={styles.topicTexts}>
              <Link
                className={styles.topicTitle}
                href={`/community/${encodeURIComponent(communitySlug ?? "")}/forum/${topic.id}`}
              >
                {topic.title}
              </Link>
              <p className={styles.topicAuthor}>
                por @{topic.author.username}
              </p>
              <div className={styles.topicInfo}>
                <span>
                  <IoChatboxEllipsesOutline size={18} /> {topic.commentsCount}
                </span>
                <span>{topic.likesCount} curtidas</span>
              </div>
            </div>
          </article>
        ))}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export { ForumComponent };
