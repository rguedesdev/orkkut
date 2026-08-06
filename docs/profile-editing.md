# Edição de perfil

## Arquitetura

A edição reutiliza o mesmo `Profile`, schemas Zod, catálogos e upload de avatar do
onboarding. Não existe um fluxo de mídia ou um modelo paralelo. O formulário usa
React Hook Form com `zodResolver`; avatar, tags e catálogos continuam controlados
por `Controller`.

`myProfile` exige autenticação e devolve todos os dados do proprietário, inclusive
as configurações completas de privacidade. `updateMyProfile(data)` sempre deriva o
usuário do JWT e não aceita `userID` enviado pelo cliente.

## Atualizações parciais

O input diferencia:

- campo omitido: preserva o valor atual;
- campo `null` ou texto vazio normalizado: remove o valor;
- lista vazia: remove todas as relações da categoria;
- lista omitida: preserva as relações.

O frontend envia somente campos marcados como alterados pelo React Hook Form. O
`updatedAt` carregado é enviado como `expectedUpdatedAt`; uma versão antiga produz
erro `CONFLICT` e pede recarregamento.

Paixões e esportes são comparados com as relações atuais. Apenas vínculos novos são
inseridos e apenas vínculos removidos são excluídos. Itens inativos já relacionados
podem continuar visíveis ao proprietário e ser removidos, mas não podem ser incluídos
como uma nova seleção.

## Avatar

O upload usa `USER_AVATAR`. A nova mídia é validada e associada dentro da transação;
somente depois o avatar anterior vira órfão para a rotina segura de limpeza. Enviar
`avatarImageID: null` remove a associação. O avatar padrão `kon.jpg` é apenas um
fallback do frontend e não gera mídia no banco.

## Frase do perfil

`profilePhrase` é independente de `about`, opcional e limitada a 280 caracteres.
Ela alimenta o balão já existente no perfil. Quando não preenchida ou não visível,
o componente mantém a frase visual padrão anterior.

## Privacidade

As regras são aplicadas por `ProfileService.getByUserID` antes do GraphQL responder.
Elas cobrem avatar, frase, apresentação, idade, nascimento, gênero, país/região,
cidade, vida pessoal, interesses, paixões, esportes e atividades. `FRIENDS` permanece
oculto para terceiros enquanto não houver um modelo de amizade integrado.

## Execução e validação

```bash
cd backend
npm run migrate:onboarding
npm run typecheck
npm test
npm run test:onboarding:integration

cd ../frontend
npx --no-install tsc --noEmit
npm run build
```

Validação manual:

1. Entre em `/profile/<username>/edit`.
2. Edite a frase e um único campo; confirme que os demais permanecem.
3. Troque e remova o avatar; confirme o fallback `kon.jpg`.
4. Limpe tags e catálogos e salve listas vazias.
5. Defina campos como “Somente eu” e acesse o perfil por outro usuário.
6. Faça uma alteração, tente fechar a aba e confirme o aviso de dados não salvos.

