import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { Logger, randomBetween, BIST30_SYMBOLS, PriceUpdate } from '@app/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class PriceGeneratorService implements OnApplicationBootstrap {
  private readonly logger = new Logger('PriceGeneratorService');
  private readonly priceState = new Map<string, number>();

  private readonly minInterval: number;
  private readonly maxInterval: number;
  private readonly boundedDeltaPercent: number;
  private readonly initialMin: number;
  private readonly initialMax: number;

  constructor(
    private configService: ConfigService,
    private rabbitmqService: RabbitMQService,
  ) {
    this.minInterval = configService.getNumber('PRICE_GENERATION_MIN_INTERVAL_MS', 50);
    this.maxInterval = configService.getNumber('PRICE_GENERATION_MAX_INTERVAL_MS', 500);
    this.boundedDeltaPercent = configService.getNumber('PRICE_BOUNDED_DELTA_PERCENT', 1.0);
    this.initialMin = configService.getNumber('PRICE_INITIAL_MIN', 10);
    this.initialMax = configService.getNumber('PRICE_INITIAL_MAX', 100);
  }

  onApplicationBootstrap() {
    this.start();
  }

  start(): void {
    this.logger.info('Starting price generation', {
      symbols: BIST30_SYMBOLS.length,
      minInterval: this.minInterval,
      maxInterval: this.maxInterval,
      boundedDelta: `±${this.boundedDeltaPercent}%`,
    });

    // Initialize price generation for all symbols
    BIST30_SYMBOLS.forEach((symbol) => {
      this.scheduleNextUpdate(symbol);
    });
  }

  private scheduleNextUpdate(symbol: string): void {
    const interval = randomBetween(this.minInterval, this.maxInterval);

    setTimeout(() => {
      const ohlc = this.generateOHLC(symbol);
      this.rabbitmqService.publish(ohlc);
      this.scheduleNextUpdate(symbol); // Recursive scheduling
    }, interval);
  }

  private generateOHLC(symbol: string): PriceUpdate {
    // Get previous close or initialize
    const prevClose = this.priceState.get(symbol) || randomBetween(this.initialMin, this.initialMax);

    // Calculate new close with bounded random walk (±1.0%)
    const deltaPercent = this.boundedDeltaPercent / 100;
    const delta = randomBetween(-deltaPercent, deltaPercent);
    const close = prevClose * (1 + delta);

    // OHLC calculation
    const open = prevClose;
    const high = Math.max(open, close) * (1 + randomBetween(0, deltaPercent));
    const low = Math.min(open, close) * (1 - randomBetween(0, deltaPercent));

    // Save current close as next iteration's prevClose
    this.priceState.set(symbol, close);

    return {
      symbol,
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      dataTimestamp: new Date().toISOString(),
    };
  }
}
