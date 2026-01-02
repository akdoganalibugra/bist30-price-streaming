import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@app/common';

async function bootstrap() {
  const logger = new Logger('DataSource');
  
  const port = process.env.DATA_SOURCE_PORT || 3002;
  
  const app = await NestFactory.create(AppModule, {
    logger: false, // Use custom logger
  });

  await app.listen(port);
  logger.info(`Data Source service started on port ${port}`);
}

bootstrap();
