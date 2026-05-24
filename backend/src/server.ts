import buildApp from "./app.js";

const app = await buildApp();

const port = Number(process.env.PORT);

await app.listen({ port });
console.log(`Servidor rodando na porta: ${port}`);
