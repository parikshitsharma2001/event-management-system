import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const port = parseInt(process.env.PORT || '8082');
    await app.listen(port);
    console.log(`Seating Service Running on Port ${port}`);
}

bootstrap();