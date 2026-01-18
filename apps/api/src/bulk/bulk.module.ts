import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    ConfigModule,
    StorageModule,
  ],
  controllers: [BulkController],
  providers: [BulkService, PrismaService],
})
export class BulkModule { }
