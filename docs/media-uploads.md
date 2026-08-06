# Upload de imagens

## Arquitetura

O binário não passa pelo GraphQL. O frontend envia `multipart/form-data` para
`POST /uploads/images?purpose=...`, autenticado com o mesmo JWT Bearer usado no
GraphQL. O backend usa `@fastify/multipart`, processa a imagem com `sharp` e a
grava através de `StorageService`.

Finalidades aceitas:

- `COMMUNITY_AVATAR`: até 5 MB;
- `COMMUNITY_COVER`: até 10 MB;
- `TOPIC_FEATURED`: até 10 MB.
- `USER_AVATAR`: até 5 MB; aceita JWT normal ou token temporário de onboarding.

São aceitos JPEG, PNG e WebP. Extensão, MIME declarado e formato real precisam
coincidir. SVG e GIF não são aceitos. As imagens têm orientação corrigida,
metadados removidos, dimensões limitadas e saída WebP.

## Fluxo

1. O endpoint autentica o usuário e valida finalidade, quantidade e tamanho.
2. Cria um `Media` com status `PENDING` e chave aleatória.
3. Valida o conteúdo real e processa a imagem.
4. Grava no driver local ou S3 compatível.
5. Marca a mídia como `READY` e retorna seu ID e URL.
6. O frontend envia esse ID em uma mutation GraphQL.
7. O serviço confirma proprietário, status, finalidade e ausência de outro vínculo.
8. A mídia é vinculada à comunidade ou ao tópico.

Uploads prontos começam com prazo de órfão. A associação remove esse prazo. Isso
permite limpar arquivos de formulários abandonados sem apagar mídias vinculadas.
Ao trocar, remover ou sair do formulário, o frontend também chama
`DELETE /uploads/images/:id`; o backend só aceita a exclusão se a mídia pertencer
ao usuário autenticado e continuar sem vínculo. Assim, uploads descartados são
normalmente removidos imediatamente.

## GraphQL

Campos adicionados:

- `Community.avatarImageID`, `avatarImage`, `coverImageID`, `coverImage`, `canEdit`;
- `Topic.featuredImageID`, `featuredImage`, `canEdit`;
- query `media(id: ID!)`.

Mutations:

- `createCommunity` aceita `avatarImageID` e `coverImageID`;
- `updateCommunity(id, data)` cria, troca ou remove essas referências;
- `createTopic` aceita `featuredImageID`;
- `updateTopic(id, data)` cria, troca ou remove essa referência.

Enviar `null` remove uma imagem; omitir o campo mantém a referência atual.

## Armazenamento

As variáveis estão documentadas em `backend/.env.example`.

- `STORAGE_DRIVER=local`: grava em `.uploads`; somente desenvolvimento.
- `STORAGE_DRIVER=s3`: usa a API S3 e funciona com AWS S3, R2 e MinIO.

Em produção, configure bucket, endpoint/região, credenciais e
`STORAGE_PUBLIC_BASE_URL`. O frontend nunca recebe credenciais. As imagens são
servidas por `GET /uploads/images/:id`, o que mantém a chave interna encapsulada.

## Migração e manutenção

```bash
cd backend
npm run migrate:media
npm run media:cleanup
```

Execute `media:cleanup` periodicamente (por exemplo, uma vez por hora via cron).
A limpeza é idempotente: remove do storage antes de marcar `DELETED`; falhas são
registradas e voltam a ser tentadas.

O backend também inicia essa limpeza automaticamente e repete conforme
`MEDIA_CLEANUP_INTERVAL_MINUTES` (60 minutos por padrão). O comando manual pode
ser mantido como operação administrativa adicional.

Ao excluir um tópico, sua imagem já é desvinculada e entra no período de carência.
O projeto ainda não possui mutation de exclusão de comunidade; quando ela for
criada, deve chamar `MediaService.orphan` para avatar e capa após confirmar a
exclusão do recurso.

## Limitação do editor

O editor de tópicos atual armazena texto puro. Imagens dentro do corpo não foram
habilitadas para evitar HTML inseguro. A imagem de destaque é plenamente suportada
na criação e edição. Um editor rico futuro deve usar um formato estruturado e
sanitização antes de reutilizar este fluxo para imagens embutidas.

## Testes

```bash
cd backend && npm test
cd frontend && npx tsc --noEmit
```

Os testes cobrem permissões, propriedade/status/finalidade da mídia, reutilização,
extensão/MIME/tamanho, validação do conteúdo real, conversão e falha do storage.
