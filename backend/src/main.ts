import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { assertProductionEnv } from './common/env-secrets.util';
import { configureApp } from './app.setup';

async function bootstrap() {
  assertProductionEnv();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  configureApp(app);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`🌍 Health Check at http://localhost:${port}/api`);
}
bootstrap();
