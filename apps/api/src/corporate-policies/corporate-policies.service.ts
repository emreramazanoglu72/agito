import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateCorporatePolicyDto } from './dto/update-corporate-policy.dto';
import { ActivateCorporatePolicyDto } from './dto/activate-corporate-policy.dto';
import { PolicyTypeEnum, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class CorporatePoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { role: string; tenantId: string; status?: string }) {
    const where: any = {};
    if (params.role !== 'ADMIN') {
      where.tenantId = params.tenantId;
    }
    if (params.status) {
      where.status = params.status;
    }

    return this.prisma.corporatePolicy.findMany({
      where,
      include: {
        application: true,
        package: true,
        carrier: true,
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { role: string; tenantId: string }) {
    const policy = await this.prisma.corporatePolicy.findUnique({
      where: { id },
      include: {
        application: true,
        package: true,
        carrier: true,
        company: true,
      },
    });
    if (!policy) {
      throw new NotFoundException('Corporate policy not found');
    }
    if (user.role !== 'ADMIN' && policy.tenantId !== user.tenantId) {
      throw new NotFoundException('Corporate policy not found');
    }
    return policy;
  }

  async update(
    id: string,
    dto: UpdateCorporatePolicyDto,
    user: { role: string; tenantId: string },
  ) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Not authorized');
    }
    await this.prisma.corporatePolicy.updateMany({
      where: { id, tenantId: user.tenantId },
      data: {
        status: dto.status as any,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    const updated = await this.prisma.corporatePolicy.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        application: true,
        package: true,
        carrier: true,
        company: true,
      },
    });
    if (!updated) {
      throw new NotFoundException('Corporate policy not found');
    }
    return updated;
  }

  private calculatePremium(type: PolicyTypeEnum, age: number): number {
    const basePrice: Record<PolicyTypeEnum, number> = {
      TSS: 3000,
      OSS: 12000,
      LIFE: 500,
      FERDI_KAZA: 200,
    };
    const riskFactor = age > 45 ? 1.5 : 1.0;
    return (basePrice[type] || 1000) * riskFactor;
  }

  private calculateAge(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    if (!hasBirthdayPassed) {
      age -= 1;
    }
    return age;
  }

  private async generatePolicyNo(
    tenantId: string,
    db: PrismaService | Prisma.TransactionClient,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomUUID().split('-')[0].toUpperCase();
      const policyNo = `AGT-${new Date().getFullYear()}-${suffix}`;
      const existing = await db.policy.findUnique({
        where: { policyNo_tenantId: { policyNo, tenantId } },
      });
      if (!existing) {
        return policyNo;
      }
    }
    throw new Error('Failed to generate unique policy number');
  }

  async activate(
    id: string,
    dto: ActivateCorporatePolicyDto,
    user: { role: string; tenantId: string },
  ) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Not authorized');
    }

    const policy = await this.prisma.corporatePolicy.findUnique({
      where: { id },
      include: { application: true, package: true, carrier: true },
    });
    if (!policy || policy.tenantId !== user.tenantId) {
      throw new NotFoundException('Corporate policy not found');
    }

    const companyId =
      policy.companyId || policy.application?.companyId || null;
    if (!companyId) {
      throw new BadRequestException('Company not linked');
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId: user.tenantId,
        companyId,
        ...(dto.employeeIds?.length
          ? { id: { in: dto.employeeIds } }
          : {}),
      },
    });
    if (employees.length === 0) {
      throw new BadRequestException('No employees found');
    }

    const policyType = dto.policyType as PolicyTypeEnum;
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    let createdCount = 0;
    let totalPremium = 0;

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const employee of employees) {
        const age = this.calculateAge(employee.birthDate);
        const premium = this.calculatePremium(policyType, age);
        const policyNo = await this.generatePolicyNo(user.tenantId, tx);

        await tx.policy.create({
          data: {
            policyNo,
            type: policyType,
            status: 'ACTIVE',
            startDate,
            endDate,
            premium,
            tenantId: user.tenantId,
            companyId,
            employeeId: employee.id,
            coverages: {
              create: [
                { name: 'Ana Teminat', limit: 100000, description: 'Yatarak Tedavi' },
                { name: 'Ayakta Tedavi', limit: 5000, description: 'Muayene, Tahlil, Rontgen' },
              ],
            },
            payments: {
              create: [
                { installmentNo: 1, amount: premium / 2, dueDate: new Date() },
                {
                  installmentNo: 2,
                  amount: premium / 2,
                  dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                },
              ],
            },
          },
        });
        createdCount += 1;
        totalPremium += premium;
      }

      await tx.corporatePolicy.updateMany({
        where: { id, tenantId: user.tenantId },
        data: {
          status: 'ACTIVE',
          policyType,
          startDate,
          endDate,
        },
      });

      const updated = await tx.corporatePolicy.findFirst({
        where: { id, tenantId: user.tenantId },
        include: { application: true, package: true, carrier: true, company: true },
      });

      if (!updated) {
        throw new NotFoundException('Corporate policy not found');
      }

      return updated;
    });

    return {
      policy: updated,
      report: {
        createdCount,
        employeeCount: employees.length,
        totalPremium,
      },
    };
  }
}
