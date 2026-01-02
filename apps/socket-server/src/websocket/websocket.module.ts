import { Module } from '@nestjs/common';
import { PricesGateway } from './prices.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [PricesGateway],
})
export class WebSocketModule {}
