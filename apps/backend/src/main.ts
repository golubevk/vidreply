import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8080',
      'http://localhost:5173',
    ],
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS Backend running on http://localhost:${port}`);
  console.log(`API available at http://localhost:${port}/api`);
}

bootstrap();
