import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = parseInt(process.env.PORT || '8081');
  await app.listen(port);
  console.log(`User Service Running on Port ${port}`);
}

bootstrap();