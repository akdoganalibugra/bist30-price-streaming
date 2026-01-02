import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { Logger, connectWithRetry, PriceUpdate } from '@app/common';
import * as amqp from 'amqplib';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger('RabbitMQConsumer');

  private readonly rabbitmqUrl: string;
  private readonly queue: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    this.queue = configService.get('RABBITMQ_QUEUE', 'price_updates');
  }

  async onModuleInit() {
    await this.connect();
    await this.consumeMessages();
  }

  async connect(): Promise<void> {
    await connectWithRetry(
      async () => {
        this.connection = await amqp.connect(this.rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        // Set prefetch to 10 messages
        await this.channel.prefetch(10);

        this.logger.info('Connected to RabbitMQ', { queue: this.queue });

        // Handle connection errors
        this.connection.on('error', (err) => {
          this.logger.error('RabbitMQ connection error', err);
        });

        this.connection.on('close', () => {
          this.logger.warn('RabbitMQ connection closed, reconnecting...');
          setTimeout(() => this.connect(), 5000);
        });
      },
      {
        maxRetries: 10,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        onRetry: (attempt, delay, error) => {
          this.logger.warn(`RabbitMQ connection retry ${attempt}`, { delay, error: error.message });
        },
      },
    );
  }

  async consumeMessages(): Promise<void> {
    if (!this.channel) {
      this.logger.error('Cannot consume: RabbitMQ channel not initialized');
      return;
    }

    this.logger.info('Starting message consumption', { queue: this.queue });

    await this.channel.consume(
      this.queue,
      async (msg) => {
        if (msg) {
          try {
            const priceUpdate: PriceUpdate = JSON.parse(msg.content.toString());
            await this.redisService.updatePrice(priceUpdate);
            this.channel.ack(msg);
            
            this.logger.debug('Processed price update', { symbol: priceUpdate.symbol });
          } catch (error) {
            this.logger.error('Failed to process message', error);
            this.channel.nack(msg, false, false); // Reject without requeue
          }
        }
      },
      { noAck: false },
    );
  }

  isConnected(): boolean {
    return !!this.channel;
  }
}
