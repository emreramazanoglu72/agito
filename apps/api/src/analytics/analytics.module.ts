import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RedisService } from '../config/redis.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RedisService],
})
export class AnalyticsModule {}
