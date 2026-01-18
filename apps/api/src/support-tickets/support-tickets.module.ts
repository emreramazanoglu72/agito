import { Module } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService, PrismaService],
})
export class SupportTicketsModule {}
