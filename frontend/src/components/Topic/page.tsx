import { Comments } from "../Comments/page";

import styles from "./topic.module.css";

const fakeComments = [
  {
    id: 1,
    author: "Lucas",
    content: "Comentário principal.",
    replies: [
      {
        id: 2,
        author: "Amanda",
        content: "Resposta do comentário principal.",
        replies: [
          {
            id: 3,
            author: "Pedro",
            content: "Resposta da resposta.",
            replies: [],
          },
        ],
      },

      {
        id: 4,
        author: "João",
        content: "Outra resposta.",
        replies: [],
      },
    ],
  },

  {
    id: 5,
    author: "Carlos",
    content: "Segundo comentário principal.",
    replies: [],
  },
];

function Topic({ topic }) {
  return (
    <div className={styles.topicCard}>
      <div className={styles.topicHeader}>
        <h1>{topic.title}</h1>

        <p>{topic.content}</p>
      </div>

      <div className={styles.commentsSection}>
        <Comments />
      </div>
    </div>
  );
}

export { Topic };
