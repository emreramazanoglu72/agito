import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node:
          configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService, PrismaService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
