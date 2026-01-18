import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { UpdatePolicyTypeDto } from './dto/update-policy-type.dto';

@Injectable()
export class PolicyTypesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPolicyTypeDto: CreatePolicyTypeDto, tenantId: string) {
    return this.prisma.policyType.create({
      data: {
        ...createPolicyTypeDto,
        tenantId,
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.policyType.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { policies: true },
        },
      },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.policyType.findFirst({
      where: { id, tenantId },
    });
  }

  async update(id: string, updatePolicyTypeDto: UpdatePolicyTypeDto, tenantId: string) {
    await this.prisma.policyType.updateMany({
      where: { id, tenantId },
      data: updatePolicyTypeDto,
    });
    const updated = await this.prisma.policyType.findFirst({
      where: { id, tenantId },
    });
    if (!updated) {
      throw new NotFoundException('Policy type not found');
    }
    return updated;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.policyType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Policy type not found');
    }
    await this.prisma.policyType.deleteMany({
      where: { id, tenantId },
    });
    return existing;
  }
}
