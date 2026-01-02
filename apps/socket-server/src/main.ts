import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@app/common';

async function bootstrap() {
  const logger = new Logger('SocketServer');
  
  const port = process.env.SOCKET_SERVER_PORT || 3001;
  
  const app = await NestFactory.create(AppModule, {
    logger: false, // Use custom logger
  });

  // Enable CORS for WebSocket connections
  app.enableCors();

  await app.listen(port);
  logger.info(`Socket Server started on port ${port}`);
}

bootstrap();
