import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesModule } from '../activities/activities.module';
import { StorageModule } from '../storage/storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ActivitiesModule, StorageModule, ConfigModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, PrismaService],
})
export class ApplicationsModule {}
