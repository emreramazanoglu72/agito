import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { StorageModule } from '../storage/storage.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [StorageModule, ActivitiesModule, ConfigModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
