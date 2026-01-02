import { Module } from '@nestjs/common';
import { PriceGeneratorService } from './price-generator.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  providers: [PriceGeneratorService],
})
export class PriceGeneratorModule {}
