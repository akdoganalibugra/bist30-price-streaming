import { Controller, Get } from "@nestjs/common";

/**
 * Base Health Check Controller
 *
 * Provides a standard /health endpoint for all services.
 * Services can extend this controller and override getDependencies()
 * to report service-specific dependency health.
 *
 * @example
 * @Controller()
 * export class AppHealthController extends BaseHealthController {
 *   protected async getDependencies(): Promise<Record<string, string>> {
 *     return {
 *       rabbitmq: this.rabbitmqService.isConnected() ? 'connected' : 'disconnected',
 *       redis: this.redisService.isConnected() ? 'connected' : 'disconnected',
 *     };
 *   }
 * }
 *
 * Reference: specs/001-bist30-streaming-platform/spec.md (FR-015, FR-029, FR-037)
 */
@Controller()
export abstract class BaseHealthController {
  @Get("/health")
  async getHealth(): Promise<HealthResponse> {
    const dependencies = await this.getDependencies();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }

  /**
   * Override this method in service-specific health controllers
   * to report dependency statuses
   *
   * @returns Object mapping dependency names to status strings
   */
  protected async getDependencies(): Promise<Record<string, string>> {
    return {};
  }
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  dependencies: Record<string, string>;
}
