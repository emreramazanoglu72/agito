import { Module } from '@nestjs/common';
import { InsurancePackagesService } from './insurance-packages.service';
import { InsurancePackagesController } from './insurance-packages.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [InsurancePackagesController],
  providers: [InsurancePackagesService, PrismaService],
})
export class InsurancePackagesModule {}
