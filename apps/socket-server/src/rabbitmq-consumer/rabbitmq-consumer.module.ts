import { Module } from '@nestjs/common';
import { RabbitMQConsumerService } from './rabbitmq-consumer.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [RabbitMQConsumerService],
  exports: [RabbitMQConsumerService],
})
export class RabbitMQConsumerModule {}
