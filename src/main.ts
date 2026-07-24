// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configura Prefixo Global das Rotas (ex: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api/v1');

  // 2. Validação Global de DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      forbidNonWhitelisted: true, // Retorna erro se enviarem campos inválidos
      transform: true, // Transforma payloads nos tipos dos DTOs
    }),
  );

  // 3. CORS ativado para comunicação com o Next.js
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Question Engine Backend rodando em: http://localhost:${port}/api/v1`);
}

bootstrap();