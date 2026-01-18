import { Module } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [CarriersController],
  providers: [CarriersService, PrismaService],
})
export class CarriersModule {}
