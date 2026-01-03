import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@app/common';

async function bootstrap() {
  const logger = new Logger('SocketServer');
  
  const port = process.env.SOCKET_SERVER_PORT || 3001;
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const queue = process.env.RABBITMQ_QUEUE || 'price_updates';
  
  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule, {
    logger: false, // Use custom logger
  });

  // Connect RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: queue,
      queueOptions: {
        durable: true,
      },
      noAck: false, // Manual acknowledgment
      prefetchCount: 10,
    },
  });

  // Enable CORS for WebSocket connections
  app.enableCors();

  await app.startAllMicroservices();
  await app.listen(port);
  
  logger.info(`Socket Server started on port ${port}`);
  logger.info(`RabbitMQ Consumer connected to queue: ${queue}`);
}

bootstrap();

