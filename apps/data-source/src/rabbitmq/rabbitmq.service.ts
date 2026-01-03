import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@app/config';
import { Logger } from '@app/common';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;
  private readonly logger = new Logger('RabbitMQ');

  private readonly rabbitmqUrl: string;
  private readonly queue: string;

  constructor(private configService: ConfigService) {
    this.rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    this.queue = configService.get('RABBITMQ_QUEUE', 'price_updates');
  }

  async onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.rabbitmqUrl],
        queue: this.queue,
        queueOptions: {
          durable: true,
        },
      },
    });

    await this.client.connect();
    this.logger.info('Connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.info('Disconnected from RabbitMQ');
  }

  async publish(pattern: string, data: any): Promise<void> {
    this.client.emit(pattern, data).subscribe({
      error: (err) => {
        this.logger.error('Failed to publish message', err);
      },
    });
  }
}
