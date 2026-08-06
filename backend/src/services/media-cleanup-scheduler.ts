import type { FastifyInstance } from "fastify";

import MediaService from "../graphql/modules/media/service.js";

const registerMediaCleanupScheduler = (app: FastifyInstance) => {
  let timer: NodeJS.Timeout | null = null;

  const runCleanup = async () => {
    try {
      const result = await MediaService.cleanup();
      if (result.scanned > 0) app.log.info(result, "Limpeza automática de mídia concluída");
    } catch (error) {
      app.log.error({ error }, "Falha na limpeza automática de mídia");
    }
  };

  app.addHook("onReady", async () => {
    void runCleanup();
    const minutes = Math.max(
      1,
      Number(process.env.MEDIA_CLEANUP_INTERVAL_MINUTES ?? 60),
    );
    timer = setInterval(() => void runCleanup(), minutes * 60 * 1000);
    timer.unref();
  });

  app.addHook("onClose", async () => {
    if (timer) clearInterval(timer);
  });
};

export { registerMediaCleanupScheduler };
