import { Module } from '@nestjs/common';
import { PolicyTypesService } from './policy-types.service';
import { PolicyTypesController } from './policy-types.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [PolicyTypesController],
  providers: [PolicyTypesService, PrismaService],
})
export class PolicyTypesModule {}
