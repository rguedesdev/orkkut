# Cadastro e onboarding

## Fluxo

O cadastro usa duas etapas dentro de um único React Hook Form validado por Zod.
Nome, username, senha, confirmação e convite permanecem somente na memória do
componente. Recarregar a página reinicia o processo e nenhuma senha é gravada em
storage, cookie ou URL.

1. `validateRegistrationStep` valida a primeira etapa sem criar documentos.
2. O backend reserva um `ObjectId` e devolve um JWT de onboarding válido por 30 minutos.
3. Esse JWT só pode enviar mídia com finalidade `USER_AVATAR`.
4. A segunda etapa carrega países, paixões e esportes do GraphQL.
5. `completeRegistration` revalida tudo e executa uma transação MongoDB.
6. Após o commit, retorna o JWT normal e o frontend faz login automático.

O botão “Pular por enquanto” envia um perfil vazio. Um documento `Profile` ainda
é criado para que a edição posterior tenha estrutura consistente.

## Persistência

- `User`: autenticação, nome, username, e-mail legado opcional e atributos sociais.
- `Profile`: avatar, apresentação, nascimento, localização, vida pessoal, tags e privacidade.
- `Passion` e `Sport`: catálogos administráveis no banco.
- `ProfilePassion` e `ProfileSport`: relações únicas, sem listas livres.

A transação cria usuário/perfil, associa avatar, cria relações e consome o convite.
Se duas contas disputarem o mesmo convite, somente uma confirma; a outra transação
é revertida sem usuário ou perfil parcial.

## GraphQL

Queries:

- `usernameAvailable(username)`;
- `invitationStatus(code)`;
- `passions(search)`;
- `sports(search)`;
- `countries(locale)`.
- `myProfile` (autenticada, sem filtragem dos dados do proprietário).

Mutations:

- `validateRegistrationStep(data)`;
- `completeRegistration(account, profile, onboardingToken)`;
- `updateMyProfile(data)`;
- `signIn(data)` aceita username ou e-mail legado no campo `login`.

## Formulários

O onboarding e a edição usam `zodResolver` + `useForm`. Avatar, tags e seleções
múltiplas usam `Controller`, mantendo o React Hook Form como única fonte dos dados.
`SearchableMultiSelect` e `TagsInput` são reutilizáveis.

## Privacidade

Avatar, frase, apresentação, idade, nascimento, gênero, localização, orientação,
relacionamento, filhos, cidade, fumo, bebida, interesses e catálogos possuem
níveis `PUBLIC`, `AUTHENTICATED`, `FRIENDS` e `PRIVATE`. A filtragem é feita no
backend. `FRIENDS` usa agora o vínculo persistido e aceito em `Friendship`, desde que
não exista bloqueio ativo. Consulte `docs/social-relationships.md` para as regras.

## Migração e testes

```bash
cd backend
npm run migrate:onboarding
npm test
npm run test:onboarding:integration

cd ../frontend
npx tsc --noEmit
```

A migration é idempotente: popula 15 paixões e 16 esportes, cria perfis legados,
copia hashes antigos para `passwordHash` e converte o índice de e-mail para parcial.
