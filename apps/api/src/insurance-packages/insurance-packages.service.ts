import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInsurancePackageDto } from './dto/create-insurance-package.dto';
import { UpdateInsurancePackageDto } from './dto/update-insurance-package.dto';

@Injectable()
export class InsurancePackagesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateInsurancePackageDto) {
    const carrierConnect = dto.carrierIds?.length
      ? { carriers: { connect: dto.carrierIds.map((id) => ({ id })) } }
      : {};
    return this.prisma.insurancePackage.create({
      data: {
        name: dto.name,
        tier: dto.tier,
        priceRange: dto.priceRange,
        focus: dto.focus,
        highlights: dto.highlights || [],
        minEmployees: dto.minEmployees,
        isActive: dto.isActive ?? true,
        ...carrierConnect,
      },
      include: { carriers: true },
    });
  }

  findAll(includeInactive = true) {
    return this.prisma.insurancePackage.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { carriers: true },
    });
  }

  async update(id: string, dto: UpdateInsurancePackageDto) {
    const existing = await this.prisma.insurancePackage.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Package not found');
    }
    return this.prisma.insurancePackage.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        tier: dto.tier ?? existing.tier,
        priceRange: dto.priceRange ?? existing.priceRange,
        focus: dto.focus ?? existing.focus,
        highlights: dto.highlights ?? existing.highlights,
        minEmployees: dto.minEmployees ?? existing.minEmployees,
        isActive: dto.isActive ?? existing.isActive,
        ...(dto.carrierIds
          ? { carriers: { set: dto.carrierIds.map((carrierId) => ({ id: carrierId })) } }
          : {}),
      },
      include: { carriers: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.insurancePackage.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Package not found');
    }
    return this.prisma.insurancePackage.delete({
      where: { id },
    });
  }
}
