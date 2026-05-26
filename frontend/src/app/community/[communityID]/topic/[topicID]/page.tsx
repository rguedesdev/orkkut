"use client";

import { useEffect, useState } from "react";

import styles from "./topic.module.css";

import api from "@/utils/api";

function TopicPage() {
  const [topic, setTopic] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchTopic = async () => {
      try {
        const response = await api.post(
          "graphql",
          {
            query: `
            query Topic($id: ID!) {
              topic(id: $id) {
                title
                content
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
        <h1>{topic.title}</h1>
      </main>
    </div>
  );
}

export default TopicPage;
