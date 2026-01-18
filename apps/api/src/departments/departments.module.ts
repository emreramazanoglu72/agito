import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { RedisService } from '../config/redis.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, RedisService, PrismaService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
