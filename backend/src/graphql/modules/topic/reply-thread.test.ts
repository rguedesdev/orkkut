import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveReplyMetadata,
  shouldDeleteConversation,
} from "./reply-thread.js";

test("resposta ao comentário principal usa o principal como agrupador e alvo", () => {
  assert.deepEqual(
    resolveReplyMetadata("topic-1", {
      _id: "main",
      topicID: "topic-1",
      authorID: "ana",
      parentCommentID: null,
    }),
    {
      parentCommentID: "main",
      replyToCommentID: "main",
      replyToUserID: "ana",
    },
  );
});

test("resposta a uma resposta permanece agrupada no comentário principal", () => {
  assert.deepEqual(
    resolveReplyMetadata("topic-1", {
      _id: "reply-1",
      topicID: "topic-1",
      authorID: "bruno",
      parentCommentID: "main",
    }),
    {
      parentCommentID: "main",
      replyToCommentID: "reply-1",
      replyToUserID: "bruno",
    },
  );
});

test("resposta a uma sub-resposta continua no segundo nível visual", () => {
  const result = resolveReplyMetadata("topic-1", {
    _id: "reply-2",
    topicID: "topic-1",
    authorID: "carla",
    parentCommentID: "main",
  });

  assert.equal(result.parentCommentID, "main");
  assert.equal(result.replyToCommentID, "reply-2");
  assert.equal(result.replyToUserID, "carla");
});

test("impede resposta a comentário de outro tópico e referência circular", () => {
  assert.throws(() =>
    resolveReplyMetadata("topic-1", {
      _id: "other",
      topicID: "topic-2",
      authorID: "user",
    }),
  );
  assert.throws(() =>
    resolveReplyMetadata("topic-1", {
      _id: "circular",
      topicID: "topic-1",
      authorID: "user",
      parentCommentID: "circular",
    }),
  );
});

test("excluir resposta não exclui a conversa; excluir raiz exclui o grupo", () => {
  assert.equal(shouldDeleteConversation({ parentCommentID: null }), true);
  assert.equal(shouldDeleteConversation({ parentCommentID: "main" }), false);
});
