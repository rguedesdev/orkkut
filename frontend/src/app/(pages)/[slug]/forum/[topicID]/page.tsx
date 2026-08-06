"use client";

// Imports Principais
import { useEffect, useState } from "react";

// Style Sheet CSS
import styles from "./topic.module.css";

// Axios
import api from "@/utils/api";

// Componentes
import { CommunityBasicInfoComponent } from "@/components/CommunityBasicInfo/page";
import { Topic } from "@/components/Topic/page";

function TopicPage() {
  const [topic, setTopic] = useState({});
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);

  useEffect(() => {
    setLoggedUserId(localStorage.getItem("userID"));
  }, []);

  const cleanLoggedUserId = loggedUserId
    ? String(loggedUserId).trim().replace(/[\\"]/g, "")
    : "";

  const cleanOwnerId = topic?.community?.ownerID
    ? String(topic.community.ownerID).trim().replace(/[\\"]/g, "")
    : "";

  const isOwner = cleanOwnerId === cleanLoggedUserId;

  console.log("Dados do tópico", topic);

  console.log("LOGGED USER ID:", cleanLoggedUserId);
  console.log("OWNER ID:", cleanOwnerId);
  console.log("IS OWNER?", isOwner);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchTopic = async () => {
      try {
        const response = await api.post(
          "/graphql",
          {
            query: `
              query Topic($id: ID!) {
                topic(id: $id) {
                  title
                  content
                   community {
                    id
                    name
                    slug
                    members
                    ownerID

                    membersList {
                      role

                      user {
                        id
                        name
                      }
                    }
                  }
                }
              }
            `,
            variables: {
              id: "6a155b3b172f6ab8f08a9d79",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setTopic(response.data.data.topic);
      } catch (error) {
        console.log(error);
      }
    };

    fetchTopic();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.topicContainer}>
        <CommunityBasicInfoComponent
          community={topic.community}
          owner={isOwner}
          setCommunity={(updatedCommunity) => {
            setTopic((prev) => ({
              ...prev,
              community:
                typeof updatedCommunity === "function"
                  ? updatedCommunity(prev.community)
                  : updatedCommunity,
            }));
          }}
        />
        <Topic topic={topic} />
      </main>
    </div>
  );
}

export default TopicPage;
