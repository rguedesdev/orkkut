"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { TopicComment } from "@/types/topic";
import api from "@/utils/api";
import Kon from "../../../public/kon.jpg";
import styles from "./comments.module.css";

type CommentsProps = {
  topicID: string;
  canInteract: boolean;
};

const formatDate = (value: string) => {
  const timestamp = Number(value);
  const date = Number.isNaN(timestamp) ? new Date(value) : new Date(timestamp);
  return date.toLocaleString("pt-BR");
};

function Comments({ topicID, canInteract }: CommentsProps) {
  const [comments, setComments] = useState<TopicComment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<TopicComment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (query: string, variables: object) => {
    const token = localStorage.getItem("token");
    const response = await api.post(
      "/graphql",
      { query, variables },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  }, []);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request(
        `
          query CommentsByTopic($topicID: ID!, $page: Int!) {
            commentsByTopic(topicID: $topicID, page: $page, limit: 10) {
              items {
                id
                topicID
                content
                parentCommentID
                replyToCommentID
                replyToUserID
                likesCount
                likedByMe
                canDelete
                createdAt
                updatedAt
                author { id name username }
                replyToUser { id name username }
                replies {
                  id
                  topicID
                  content
                  parentCommentID
                  replyToCommentID
                  replyToUserID
                  likesCount
                  likedByMe
                  canDelete
                  createdAt
                  updatedAt
                  author { id name username }
                  replyToUser { id name username }
                }
              }
              page
              totalPages
            }
          }
        `,
        { topicID, page },
      );
      setComments(data.commentsByTopic.items);
      setTotalPages(data.commentsByTopic.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar comentários.");
    } finally {
      setIsLoading(false);
    }
  }, [page, request, topicID]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (
    event: FormEvent,
    replyTarget?: TopicComment,
  ) => {
    event.preventDefault();
    const value = replyTarget ? replyContent : content;
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await request(
        `
          mutation CreateComment($data: CreateCommentInput!) {
            createComment(data: $data) { id }
          }
        `,
        {
          data: {
            topicID,
            content: value.trim(),
            ...(replyTarget ? { replyToCommentID: replyTarget.id } : {}),
          },
        },
      );
      setContent("");
      setReplyContent("");
      setReplyTo(null);
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao comentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setLike = async (comment: TopicComment) => {
    try {
      await request(
        `
          mutation SetCommentLike($commentID: ID!, $liked: Boolean!) {
            setCommentLike(commentID: $commentID, liked: $liked) { id }
          }
        `,
        { commentID: comment.id, liked: !comment.likedByMe },
      );
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao curtir comentário.");
    }
  };

  const deleteComment = async (comment: TopicComment) => {
    const confirmation = comment.parentCommentID
      ? "Excluir esta resposta? As demais mensagens da conversa serão preservadas."
      : "Excluir este comentário e todas as respostas da conversa?";
    if (!window.confirm(confirmation)) return;

    try {
      await request(
        `mutation DeleteComment($id: ID!) { deleteComment(id: $id) }`,
        { id: comment.id },
      );
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir comentário.");
    }
  };

  const renderComment = (comment: TopicComment, isReply = false) => (
    <li
      id={`comment-${comment.id}`}
      key={comment.id}
      className={isReply ? styles.reply : styles.commentItem}
    >
      <article className={styles.comment}>
        <div className={styles.commentAuthor}>
          <Image
            className={styles.authorPicture}
            src={Kon}
            alt={`Foto de ${comment.author.name}`}
            width={42}
            height={42}
          />
          <header>
            <Link href={`/user/${encodeURIComponent(comment.author.username)}`}>
              {comment.author.name} <span>@{comment.author.username}</span>
            </Link>
            <time>{formatDate(comment.createdAt)}</time>
          </header>
        </div>
        {comment.replyToUser && comment.replyToCommentID && (
          <a
            className={styles.replyReference}
            href={`#comment-${comment.replyToCommentID}`}
          >
            Respondendo a @{comment.replyToUser.username}
          </a>
        )}
        <p>{comment.content}</p>
        <div className={styles.commentActions}>
          {canInteract && (
            <button onClick={() => setLike(comment)}>
              {comment.likedByMe ? "Descurtir" : "Curtir"} ({comment.likesCount})
            </button>
          )}
          {canInteract && (
            <button
              onClick={() => {
                setReplyTo(comment);
                setReplyContent("");
              }}
            >
              Responder
            </button>
          )}
          {comment.canDelete && (
            <button onClick={() => deleteComment(comment)}>Excluir</button>
          )}
        </div>
      </article>

      {replyTo?.id === comment.id && (
        <form
          className={styles.replyForm}
          onSubmit={(event) => createComment(event, comment)}
        >
          <p className={styles.replyingTo}>
            Respondendo a @{comment.author.username}
          </p>
          <textarea
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            maxLength={2000}
            required
            placeholder="Escreva uma resposta..."
          />
          <div>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setReplyContent("");
              }}
            >
              Cancelar
            </button>
            <button disabled={isSubmitting} type="submit">
              Responder
            </button>
          </div>
        </form>
      )}

      {!isReply && comment.replies.length > 0 && (
        <ul className={styles.replies}>
          {comment.replies.map((reply) => renderComment(reply, true))}
        </ul>
      )}
    </li>
  );

  return (
    <section className={styles.wrapper}>
      <h2>Comentários</h2>
      {canInteract && (
        <form className={styles.commentForm} onSubmit={createComment}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            required
            placeholder="Escreva um comentário..."
          />
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Enviando..." : "Comentar"}
          </button>
        </form>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {isLoading && <p>Carregando comentários...</p>}
      {!isLoading && comments.length === 0 && (
        <p>Nenhum comentário ainda. Seja o primeiro!</p>
      )}
      <ul className={styles.list}>{comments.map((item) => renderComment(item))}</ul>

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
    </section>
  );
}

export { Comments };
