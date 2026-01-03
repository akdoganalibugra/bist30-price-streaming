import { Injectable, OnModuleInit } from "@nestjs/common";
import { Controller } from "@nestjs/common";
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from "@nestjs/microservices";
import { ConfigService } from "@app/config";
import { Logger, PriceUpdate } from "@app/common";
import { RedisService } from "../redis/redis.service";

@Controller()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger("RabbitMQConsumer");

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.logger.info("RabbitMQ Consumer initialized");
  }

  @MessagePattern("price_update")
  async handlePriceUpdate(
    @Payload() data: PriceUpdate,
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.info(`Received price update for ${data.symbol}`);

      // Update price in Redis
      await this.redisService.updatePrice(data);

      // Acknowledge message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Failed to process price update for ${data.symbol}`,
        error,
      );

      // Reject message without requeue
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, false);
    }
  }
}
