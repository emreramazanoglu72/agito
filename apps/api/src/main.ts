import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix for Versioning
  app.setGlobalPrefix('api/v1');

  // 2. Security: Helmet (Security Headers)
  app.use(helmet());

  // 2. Security: Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Data Validation: Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra data sent
      transform: true, // Auto transform payloads to DTO instances
    }),
  );

  // 3. Documentation: Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Agito Case API')
    .setDescription('B2B Insurance Portal API Documentation')
    .setVersion('1.0')
    .addBearerAuth() // IMPORTANT for testing Auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4. CORS (Allow Frontend)
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3001', // Allow Next.js Frontend
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
