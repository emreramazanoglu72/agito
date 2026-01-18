import { Module } from '@nestjs/common';
import { CorporatePoliciesService } from './corporate-policies.service';
import { CorporatePoliciesController } from './corporate-policies.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [CorporatePoliciesController],
  providers: [CorporatePoliciesService, PrismaService],
})
export class CorporatePoliciesModule {}
