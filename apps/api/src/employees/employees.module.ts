import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { PrismaService } from '../database/prisma.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node:
          configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, PrismaService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
