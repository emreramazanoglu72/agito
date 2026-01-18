import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';

import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { BulkModule } from './bulk/bulk.module';
import { PoliciesModule } from './policies/policies.module';
import { EmployeesModule } from './employees/employees.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentsModule } from './documents/documents.module';
import { DepartmentsModule } from './departments/departments.module';
import { PolicyTypesModule } from './policy-types/policy-types.module';
import { InsurancePackagesModule } from './insurance-packages/insurance-packages.module';
import { ApplicationsModule } from './applications/applications.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { CarriersModule } from './carriers/carriers.module';
import { CorporatePoliciesModule } from './corporate-policies/corporate-policies.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './activities/activities.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // 1. Config (Environment Variables)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Security: Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 3. Database (Postgres + Prisma)
    DatabaseModule,


    // 3. Elasticsearch
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node:
          configService.get<string>('ELASTIC_NODE') || 'http://localhost:9200',
        maxRetries: 10,
        requestTimeout: 60000,
      }),
      inject: [ConfigService],
    }),

    // 4. Features
    CompaniesModule,
    AuthModule,
    BulkModule,
    ActivitiesModule,
    PoliciesModule,
    EmployeesModule,
    DepartmentsModule,
    AnalyticsModule,
    PaymentsModule,
    DocumentsModule,
    InsurancePackagesModule,
    ApplicationsModule,
    SupportTicketsModule,
    CarriersModule,
    CorporatePoliciesModule,
    PolicyTypesModule,
    UsersModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD, // Order matters: Auth -> Roles
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
