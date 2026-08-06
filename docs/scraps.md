# Scraps

Scraps são recados públicos exibidos no perfil do destinatário. Eles não são chat, feed ou comentários e não possuem respostas encadeadas.

## Persistência e permissões

- `Scrap`: autor, destinatário, texto, contexto opcional de resposta, idempotência e soft delete.
- `ScrapMedia`: associação ordenada de até quatro mídias.
- `ScrapbookSettings`: privacidade de leitura/escrita e preferência de notificações.
- Leitura padrão: usuários autenticados.
- Escrita padrão: amigos.
- Somente autor edita. Autor, destinatário ou administrador excluem.
- O destinatário responde criando um novo scrap independente no mural do autor.
- Bloqueio em qualquer direção impede escrita e resposta.

## Imagens

O frontend envia cada arquivo para `POST /uploads/images?purpose=SCRAP_IMAGE` e depois informa os IDs na mutation. São aceitos JPG, PNG e WebP, com até 10 MB por arquivo e quatro imagens por scrap. O processamento existente corrige orientação, remove metadados ao converter para WebP e limita dimensões. Uploads não associados entram na limpeza de órfãos já configurada.

As URLs de `SCRAP_IMAGE` recebem assinatura temporária de uma hora. O endpoint rejeita acesso direto sem assinatura, evitando que o ID de uma imagem contorne a privacidade do mural.

## Proteções

- Conteúdo de texto puro, sem HTML, até 2000 caracteres e três links HTTP(S).
- React renderiza o conteúdo sem `dangerouslySetInnerHTML`.
- Idempotência por `authorUserID + clientMutationID`.
- Limite persistente: 10 scraps/10 minutos para amigos e 3/hora para não amigos.
- Limite de armazenamento: 5000 scraps ativos por autor.
- Cursor composto por `createdAt + id`, máximo de 30 itens por página.
- Transações e filtros por versão evitam associação dupla e edições concorrentes.

## Edição

Não foi aplicada janela de 15 minutos. O autor pode corrigir texto e imagens enquanto o scrap estiver ativo. Toda edição define `editedAt` e é indicada no frontend.

## Evento de domínio

Após a confirmação da transação é emitido `scrap.created` com `scrapID`, `authorUserID` e `recipientUserID`. Não há consumidor enquanto o projeto não possuir infraestrutura geral de notificações.

## Execução

```bash
cd backend
npm run migrate:scraps
npm test
npm run typecheck

cd ../frontend
npx tsc --noEmit
npm run build
```
