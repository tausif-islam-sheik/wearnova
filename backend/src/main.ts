import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { execSync } from 'child_process';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  if (process.env.NODE_ENV !== 'production') {
    try {
      execSync(`lsof -ti :${process.env.PORT ?? 4000} | xargs kill 2>/dev/null`, { stdio: 'ignore' });
    } catch {
      /* noop */
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.setGlobalPrefix('api');

  // Stripe webhooks need the raw JSON body for signature verification.
  // Register the raw parser before the default JSON parser for this route only.
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Wearnova API')
      .setDescription('Backend API for the Wearnova peer-to-peer fashion marketplace')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
