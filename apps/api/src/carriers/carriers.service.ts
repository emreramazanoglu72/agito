import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@Injectable()
export class CarriersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCarrierDto) {
    return this.prisma.carrier.create({
      data: {
        name: dto.name,
        code: dto.code,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(includeInactive = true) {
    return this.prisma.carrier.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCarrierDto) {
    const existing = await this.prisma.carrier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Carrier not found');
    }

    return this.prisma.carrier.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        code: dto.code ?? existing.code,
        logoUrl: dto.logoUrl ?? existing.logoUrl,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.carrier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Carrier not found');
    }

    const packageCount = await this.prisma.insurancePackage.count({
      where: { carriers: { some: { id } } },
    });
    if (packageCount > 0) {
      throw new BadRequestException('Carrier has active packages');
    }

    return this.prisma.carrier.delete({ where: { id } });
  }
}
