import { Controller } from '@nestjs/common';
import { BaseHealthController } from '@app/common';
import { RabbitMQConsumerService } from '../rabbitmq-consumer/rabbitmq-consumer.service';
import { RedisService } from '../redis/redis.service';

@Controller()
export class HealthController extends BaseHealthController {
  constructor(
    private rabbitmqConsumerService: RabbitMQConsumerService,
    private redisService: RedisService,
  ) {
    super();
  }

  protected async getDependencies(): Promise<Record<string, string>> {
    return {
      rabbitmq: this.rabbitmqConsumerService.isConnected() ? 'connected' : 'disconnected',
      redis: this.redisService.isConnected() ? 'connected' : 'disconnected',
    };
  }
}
