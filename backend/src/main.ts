import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Enable security headers with Helmet
  const compression = require('compression');
  const helmet = require('helmet');
  const cookieParser = require('cookie-parser');
  app.use(compression()); // Gzip all responses — reduces payload by 60-80%
  app.use(cookieParser());
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "*"], // Temporarily broad for dev, should be restricted to API in prod
      },
    },
  }));

  // Enable CORS with specific whitelist for security
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://flamingo-store1.com',
    'https://flamingo-store1.com',
    'http://www.flamingo-store1.com',
    'https://www.flamingo-store1.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  // Allow any Vercel deployment URL (production alias + preview builds).
  const vercelOriginPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, mobile apps, same-origin) send no Origin.
      if (!origin || allowedOrigins.includes(origin) || vercelOriginPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  // Enable body parser with reasonable limit
  const express = require('express');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Enable validation with strict whitelisting
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Set global prefix
  app.setGlobalPrefix('api');

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve uploads
  const path = require('path');
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`🌍 Health Check at http://localhost:${port}/api`);
}
bootstrap();
