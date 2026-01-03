import { Controller, Get } from "@nestjs/common";
import { BaseHealthController } from "@app/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController extends BaseHealthController {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async getDependencies(): Promise<Record<string, string>> {
    const dbHealthy = await this.prisma.healthCheck();

    return {
      database: dbHealthy ? "healthy" : "unhealthy",
    };
  }
}
