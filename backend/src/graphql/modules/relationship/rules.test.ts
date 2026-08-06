import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { profileRatingInputSchema } from "../profile-interaction/validation.js";
import { calculateRatingPercentage } from "../profile-interaction/service.js";
import { relationshipPairKey } from "./rules.js";

const first = "507f1f77bcf86cd799439011";
const second = "507f191e810c19729de860ea";

describe("regras de relacionamento social", () => {
  it("gera a mesma chave para as duas direções", () => {
    assert.equal(relationshipPairKey(first, second), relationshipPairKey(second, first));
  });

  it("impede relação consigo mesmo e IDs inválidos", () => {
    assert.throws(() => relationshipPairKey(first, first), /próprio perfil/);
    assert.throws(() => relationshipPairKey(first, "inválido"), /Usuário inválido/);
  });

  it("aceita apenas categorias válidas e níveis inteiros entre 1 e 3", () => {
    assert.equal(profileRatingInputSchema.parse({ targetUserID: second, category: "COOL", value: 3 }).value, 3);
    assert.throws(() => profileRatingInputSchema.parse({ targetUserID: second, category: "COOL", value: 0 }));
    assert.throws(() => profileRatingInputSchema.parse({ targetUserID: second, category: "SEXY", value: 2.5 }));
    assert.throws(() => profileRatingInputSchema.parse({ targetUserID: second, category: "INVALID", value: 2 }));
  });

  it("calcula a porcentagem pela soma sobre o máximo possível", () => {
    assert.equal(calculateRatingPercentage(3, 1), 100);
    assert.equal(calculateRatingPercentage(4, 2), 66.66666666666666);
    assert.equal(calculateRatingPercentage(5, 2), 83.33333333333334);
    assert.equal(calculateRatingPercentage(0, 0), null);
  });
});
