import mongoose from "mongoose";

const uri = process.env.MONGODB_URI as string;

const OrkkutDB = mongoose.createConnection(uri, {
  dbName: "OrkutDB",
});

OrkkutDB.on("connected", () => {
  console.log("Conectado ao OrkutDB");
});

OrkkutDB.on("error", (err) => {
  console.error("Erro na conexão ao OrkutDB:", err);
});

export { OrkkutDB };
