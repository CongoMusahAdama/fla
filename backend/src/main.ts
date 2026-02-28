import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Enable CORS with specific whitelist for security
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://fadlanstore.netlify.app',
      'http://flamingo-store1.com',
      'https://flamingo-store1.com',
      'http://www.flamingo-store1.com',
      'https://www.flamingo-store1.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  // Enable body parser with higher limit
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Set global prefix
  app.setGlobalPrefix('api');

  // Serve uploads
  const path = require('path');
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`🌍 Health Check at http://localhost:${port}/api`);
}
bootstrap();
