# Amizades, bloqueios, fãs e qualificações

## Fonte de verdade

`Friendship` é a única fonte de autorização para interações entre amigos. Cada par
possui uma `pairKey` formada pelos dois `ObjectId` ordenados e um índice único, o que
impede relações duplicadas em direções opostas. A direção da solicitação permanece
em `requesterUserID` e `addresseeUserID`.

Estados encerrados (`DECLINED`, `CANCELED` e `REMOVED`) são preservados no mesmo
documento para auditoria. Uma nova solicitação reutiliza o registro e limpa os
timestamps do ciclo anterior. Em solicitação cruzada, o segundo usuário deve aceitar
a solicitação que recebeu; não existe aceite automático.

Somente `ACCEPTED`, sem bloqueio em nenhuma direção, é amizade ativa.

## Bloqueios

`UserBlock` é direcional e possui índice único por bloqueador/bloqueado. Qualquer
bloqueio entre duas pessoas impede solicitação, aceite, fã e avaliação. Bloquear:

1. cria o bloqueio de forma idempotente;
2. cancela solicitação pendente ou encerra amizade aceita;
3. exclui fãs e avaliações nos dois sentidos;
4. confirma tudo na mesma transação.

Desbloquear apenas remove o bloqueio e nunca restaura relações anteriores.

## Fãs e avaliações

`ProfileFan` possui índice único por ator/alvo. `ProfileRating` possui índice único
por ator/alvo/categoria. Categorias: `COOL`, `SEXY` e `TRUSTWORTHY`; valores inteiros
de 1 a 3.

Todas as mutations obtêm o ator pelo JWT e chamam
`RelationshipService.assertCanInteractAsFriend`. Operações são idempotentes e usam
transações. Mesmo se existirem registros inconsistentes, os agregados só consideram
atores cuja amizade ainda esteja ativa e sem bloqueio.

Os agregados retornam total de fãs, média, porcentagem, contagem, distribuição 1/2/3
e o valor do visitante. A porcentagem usa `soma / (quantidade × 3) × 100`. A
identidade dos avaliadores não é exposta.

## GraphQL

Queries autenticadas:

- `myFriends`;
- `receivedFriendRequests`;
- `sentFriendRequests`;
- `myBlockedUsers`.

Queries contextuais:

- `friendsOf(userID)`;
- `relationshipWith(userID)`;
- `User.relationship`;
- `User.socialInteractions`.

Mutations:

- `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`;
- `cancelFriendRequest`, `removeFriend`;
- `blockUser`, `unblockUser`;
- `becomeProfileFan`, `removeProfileFan`;
- `setProfileRating`, `removeProfileRating`.

## Privacidade

`socialFans`, `socialCool`, `socialSexy` e `socialTrustworthy` usam os mesmos níveis
do perfil: `PUBLIC`, `AUTHENTICATED`, `FRIENDS` e `PRIVATE`. Métricas bloqueadas são
retornadas como `null`; não são escondidas apenas por CSS. A opção `FRIENDS` agora
consulta a amizade persistida.

## Campos legados

`User.attributes` foi mantido fisicamente para compatibilidade, está marcado como
deprecated no GraphQL e não é fonte de verdade. O resolver calcula a compatibilidade
a partir de `ProfileFan` e `ProfileRating`. Números antigos não foram convertidos em
interações porque não possuem autores reais.

## Frontend

O frontend continua usando Axios e estado local. `Friends` consome usuários reais,
solicitações e bloqueados. `BasicInfo` controla a relação. Os ícones originais de
fãs, confiável, legal e sexy foram mantidos e conectados aos agregados e controles
de avaliação. Nenhuma biblioteca de cache foi adicionada.

## Execução

```bash
cd backend
npm run migrate:social
npm run typecheck
npm test
npm run test:social:integration

cd ../frontend
npx --no-install tsc --noEmit
npm run build
```

## Validação manual

1. Abra dois usuários diferentes em sessões separadas.
2. Envie uma solicitação; confirme os estados enviado e recebido.
3. Aceite e verifique a lista real de amigos.
4. Marque fã e atribua níveis aos três ícones.
5. Atualize e remova cada avaliação clicando novamente no nível selecionado.
6. Remova a amizade e confirme que controles e agregados atribuídos desaparecem.
7. Refaça a amizade, crie interações e bloqueie; confirme a limpeza.
8. Desbloqueie e confirme que a amizade não é restaurada.
