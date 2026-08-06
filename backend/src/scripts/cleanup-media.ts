import MediaService from "../graphql/modules/media/service.js";
import { OrkkutDB } from "../plugins/mongoose.js";

await OrkkutDB.asPromise();
const result = await MediaService.cleanup();
console.log(
  `Limpeza concluída: ${result.scanned} verificadas, ${result.deleted} removidas, ${result.failed} falhas.`,
);
await OrkkutDB.close();
