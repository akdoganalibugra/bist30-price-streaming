import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { RabbitMQConsumerModule } from './rabbitmq-consumer/rabbitmq-consumer.module';
import { RedisModule } from './redis/redis.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule, RabbitMQConsumerModule, RedisModule, WebSocketModule],
  controllers: [HealthController],
})
export class AppModule {}
