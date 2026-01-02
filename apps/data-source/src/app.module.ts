import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { PriceGeneratorModule } from './price-generator/price-generator.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule, RabbitMQModule, PriceGeneratorModule],
  controllers: [HealthController],
})
export class AppModule {}
