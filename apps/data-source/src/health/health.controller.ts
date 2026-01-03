import { Controller, Get } from "@nestjs/common";
import { BaseHealthController, HealthResponse } from "@app/common";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";

@Controller()
export class HealthController extends BaseHealthController {
  constructor(private rabbitmqService: RabbitMQService) {
    super();
  }

  protected async getDependencies(): Promise<Record<string, string>> {
    return {
      rabbitmq: "connected",
    };
  }
}
