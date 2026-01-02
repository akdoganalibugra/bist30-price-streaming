import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule, PrismaModule, CustomersModule],
  controllers: [HealthController],
})
export class AppModule {}
