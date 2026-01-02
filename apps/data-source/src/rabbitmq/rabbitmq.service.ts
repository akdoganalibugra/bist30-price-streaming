import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { Logger, connectWithRetry } from '@app/common';
import * as amqp from 'amqplib';
import { PriceUpdate } from '@app/common';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger('RabbitMQService');

  private readonly rabbitmqUrl: string;
  private readonly exchange: string;
  private readonly queue: string;
  private readonly routingKey: string;

  constructor(private configService: ConfigService) {
    this.rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    this.exchange = configService.get('RABBITMQ_EXCHANGE', 'prices');
    this.queue = configService.get('RABBITMQ_QUEUE', 'price_updates');
    this.routingKey = configService.get('RABBITMQ_ROUTING_KEY', 'price.update');
  }

  async onModuleInit() {
    await this.connect();
  }

  async connect(): Promise<void> {
    await connectWithRetry(
      async () => {
        this.connection = await amqp.connect(this.rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        // Declare direct exchange
        await this.channel.assertExchange(this.exchange, 'direct', { durable: true });

        // Declare queue
        await this.channel.assertQueue(this.queue, { durable: true });

        // Bind queue to exchange with routing key
        await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

        this.logger.info('Connected to RabbitMQ', {
          exchange: this.exchange,
          queue: this.queue,
          routingKey: this.routingKey,
        });

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

  async publish(priceUpdate: PriceUpdate): Promise<void> {
    if (!this.channel) {
      this.logger.error('Cannot publish: RabbitMQ channel not initialized');
      return;
    }

    try {
      const message = JSON.stringify(priceUpdate);
      this.channel.publish(this.exchange, this.routingKey, Buffer.from(message), {
        persistent: true,
        contentType: 'application/json',
      });

      this.logger.debug('Published price update', { symbol: priceUpdate.symbol });
    } catch (error) {
      this.logger.error('Failed to publish message', error);
    }
  }

  isConnected(): boolean {
    return !!this.channel;
  }
}
