import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@app/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error Prisma client type issue
      this.$on('query', (e) => {
        this.logger.log(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Successfully connected to MySQL database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to MySQL database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from MySQL database');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
