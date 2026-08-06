import assert from "node:assert/strict";
import test from "node:test";

import { canDeleteComment, canDeleteTopic } from "./permissions.js";

const base = {
  actorID: "actor",
  authorID: "author",
  communityOwnerID: "owner",
  isAdmin: false,
};

test("autor pode excluir o próprio tópico", () => {
  assert.equal(canDeleteTopic({ ...base, actorID: "author" }), true);
});

test("dono da comunidade e admin podem excluir qualquer tópico", () => {
  assert.equal(canDeleteTopic({ ...base, actorID: "owner" }), true);
  assert.equal(canDeleteTopic({ ...base, isAdmin: true }), true);
});

test("membro comum não pode excluir tópico de outra pessoa", () => {
  assert.equal(canDeleteTopic(base), false);
});

test("autor do tópico não ganha permissão sobre comentários alheios", () => {
  assert.equal(
    canDeleteComment({
      actorID: "topic-author",
      authorID: "comment-author",
      communityOwnerID: "owner",
      isAdmin: false,
    }),
    false,
  );
});

test("autor do comentário, dono da comunidade e admin podem excluí-lo", () => {
  assert.equal(canDeleteComment({ ...base, actorID: "author" }), true);
  assert.equal(canDeleteComment({ ...base, actorID: "owner" }), true);
  assert.equal(canDeleteComment({ ...base, isAdmin: true }), true);
});
