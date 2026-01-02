import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * Centralized configuration service for environment variables
 * 
 * Wraps @nestjs/config ConfigService with type-safe getters
 * for application-specific environment variables.
 * 
 * @example
 * constructor(private configService: ConfigService) {}
 * 
 * const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://localhost:5672');
 */
@Injectable()
export class ConfigService {
  constructor(private readonly nestConfigService: NestConfigService) {}

  /**
   * Get environment variable with optional default value
   * 
   * @param key - Environment variable name
   * @param defaultValue - Default value if variable not found
   * @returns Value from environment or default
   */
  get<T = string>(key: string, defaultValue?: T): T {
    return this.nestConfigService.get<T>(key, defaultValue);
  }

  /**
   * Get environment variable or throw error if not found
   * 
   * @param key - Environment variable name
   * @returns Value from environment
   * @throws Error if variable not found
   */
  getOrThrow<T = string>(key: string): T {
    return this.nestConfigService.getOrThrow<T>(key);
  }

  /**
   * Get number from environment variable
   * 
   * @param key - Environment variable name
   * @param defaultValue - Default value if variable not found or not a number
   * @returns Parsed number or default
   */
  getNumber(key: string, defaultValue: number): number {
    const value = this.get(key);
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get boolean from environment variable
   * 
   * @param key - Environment variable name
   * @param defaultValue - Default value if variable not found
   * @returns Boolean value (true for 'true', '1', 'yes'; false otherwise)
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.get(key, String(defaultValue)).toLowerCase();
    return ['true', '1', 'yes'].includes(value);
  }
}
