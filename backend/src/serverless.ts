import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { assertProductionEnv } from './common/env-secrets.util';
import { configureApp } from './app.setup';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

/** Built once per warm Vercel instance so Mongo connections and module setup are reused. */
let cached: Promise<Handler> | null = null;

async function createHandler(): Promise<Handler> {
  assertProductionEnv();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cached) {
    cached = createHandler().catch((err) => {
      cached = null;
      throw err;
    });
  }
  const app = await cached;
  app(req, res);
}
