import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from '@app/common';
import { ConfigService } from '@app/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // CORS
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.getNumber('PORT', 3000);

  await app.listen(port);
  logger.log(`🚀 Customer API listening on port ${port}`);
}
bootstrap();
