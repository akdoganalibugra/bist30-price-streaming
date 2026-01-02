import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { Logger, connectWithRetry, PriceUpdate } from '@app/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger('RedisService');

  private readonly redisHost: string;
  private readonly redisPort: number;
  private readonly hashKey: string;

  constructor(private configService: ConfigService) {
    this.redisHost = configService.get('REDIS_HOST', 'localhost');
    this.redisPort = configService.getNumber('REDIS_PORT', 6379);
    this.hashKey = configService.get('REDIS_HASH_KEY', 'prices:latest');
  }

  async onModuleInit() {
    await this.connect();
  }

  async connect(): Promise<void> {
    await connectWithRetry(
      async () => {
        this.client = new Redis({
          host: this.redisHost,
          port: this.redisPort,
          retryStrategy: () => null, // Disable built-in retry, use our own
          maxRetriesPerRequest: 3,
        });

        await this.client.ping();

        this.logger.info('Connected to Redis', {
          host: this.redisHost,
          port: this.redisPort,
          hashKey: this.hashKey,
        });

        this.client.on('error', (err) => {
          this.logger.error('Redis connection error', err);
        });

        this.client.on('close', () => {
          this.logger.warn('Redis connection closed, reconnecting...');
          setTimeout(() => this.connect(), 5000);
        });
      },
      {
        maxRetries: 10,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        onRetry: (attempt, delay, error) => {
          this.logger.warn(`Redis connection retry ${attempt}`, { delay, error: error.message });
        },
      },
    );
  }

  async updatePrice(priceUpdate: PriceUpdate): Promise<void> {
    if (!this.client) {
      this.logger.error('Cannot update price: Redis client not initialized');
      return;
    }

    try {
      // HSET prices:latest AKBNK '{"symbol":"AKBNK",...}'
      await this.client.hset(this.hashKey, priceUpdate.symbol, JSON.stringify(priceUpdate));
    } catch (error) {
      this.logger.error('Failed to update price in Redis', error);
    }
  }

  async getAllPrices(): Promise<PriceUpdate[]> {
    if (!this.client) {
      this.logger.error('Cannot get prices: Redis client not initialized');
      return [];
    }

    try {
      // HGETALL prices:latest
      const hash = await this.client.hgetall(this.hashKey);
      return Object.values(hash).map((json) => JSON.parse(json));
    } catch (error) {
      this.logger.error('Failed to get prices from Redis', error);
      return [];
    }
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }
}
