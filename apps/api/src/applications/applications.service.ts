import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ActivitiesService } from '../activities/activities.service';
import { R2Service } from '../storage/r2.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private r2Service: R2Service,
    private configService: ConfigService,
  ) {}

  async create(tenantId: string, dto: CreateApplicationDto, userName?: string) {
    const pkg = await this.prisma.insurancePackage.findUnique({
      where: { id: dto.packageId },
      include: { carriers: true },
    });
    if (!pkg || !pkg.isActive) {
      throw new BadRequestException('Package not available');
    }

    if (dto.carrierId) {
      const carrier = await this.prisma.carrier.findUnique({
        where: { id: dto.carrierId },
      });
      if (!carrier || !carrier.isActive) {
        throw new BadRequestException('Carrier not available');
      }
      if (pkg.carriers.length > 0 && !pkg.carriers.some((item) => item.id === dto.carrierId)) {
        throw new BadRequestException('Carrier not allowed for package');
      }
    }

    const company = await this.prisma.company.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    if (!company) {
      throw new BadRequestException('Company not found for tenant');
    }

    const application = await this.prisma.application.create({
      data: {
        packageId: dto.packageId,
        carrierId: dto.carrierId,
        companyId: company.id,
        tenantId,
        companyName: dto.companyName,
        companyEmail: dto.companyEmail,
        companyPhone: dto.companyPhone,
        employeeCount: dto.employeeCount,
        employeeList: dto.employeeList || [],
        hasDocuments: dto.hasDocuments ?? false,
        status: 'SUBMITTED',
      },
    });

    await this.activitiesService.log({
      type: 'COMPANY_UPDATED',
      title: 'Basvuru olusturuldu',
      description: `${dto.companyName} basvuru gonderdi.`,
      targetId: application.id,
      targetType: 'Application',
      tenantId,
      userName,
    });

    return application;
  }

  async findAll(user: { role: string; tenantId: string }) {
    const where = user.role === 'ADMIN' ? {} : { tenantId: user.tenantId };
    return this.prisma.application.findMany({
      where,
      include: { package: true, carrier: true, company: true, corporatePolicy: true, documents: true, updates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { role: string; tenantId: string }) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { package: true, carrier: true, company: true, corporatePolicy: true, documents: true, updates: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (user.role !== 'ADMIN' && application.tenantId !== user.tenantId) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async updateStatus(id: string, dto: UpdateApplicationDto, user: { role: string; tenantId: string }) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { package: true, carrier: true, company: true, corporatePolicy: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Not authorized');
    }

    await this.prisma.application.updateMany({
      where: { id, tenantId: application.tenantId },
      data: {
        status: dto.status ?? application.status,
        adminNote: dto.adminNote ?? application.adminNote,
      },
    });

    const updated = await this.prisma.application.findFirst({
      where: { id, tenantId: application.tenantId },
      include: { package: true, carrier: true, company: true, corporatePolicy: true },
    });
    if (!updated) {
      throw new NotFoundException('Application not found');
    }

    if (
      (updated.status === 'APPROVED' || updated.status === 'ACTIVE') &&
      !application.corporatePolicy
    ) {
      await this.prisma.corporatePolicy.create({
        data: {
          tenantId: application.tenantId,
          applicationId: application.id,
          packageId: application.packageId,
          carrierId: application.carrierId || undefined,
          companyName: application.companyName,
          companyId: application.companyId || undefined,
          premiumRange: application.package?.priceRange,
          status: updated.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
        },
      });
    }

    await this.activitiesService.log({
      type: 'COMPANY_UPDATED',
      title: 'Basvuru guncellendi',
      description: `Basvuru durumu ${updated.status} olarak guncellendi.`,
      targetId: updated.id,
      targetType: 'Application',
      tenantId: application.tenantId,
    });

    return updated;
  }

  async uploadDocument(
    tenantId: string,
    applicationId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }
    const key = await this.r2Service.uploadFile(file);
    const url = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;
    const document = await this.prisma.applicationDocument.create({
      data: {
        applicationId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        key,
        url,
      },
    });

    await this.prisma.application.updateMany({
      where: { id: applicationId, tenantId },
      data: { hasDocuments: true },
    });

    await this.activitiesService.log({
      type: 'COMPANY_UPDATED',
      title: 'Basvuru dokumani yuklendi',
      description: `Basvuru #${applicationId} icin dokuman yuklendi.`,
      targetId: applicationId,
      targetType: 'Application',
      tenantId,
    });

    return document;
  }

  async addUpdate(
    tenantId: string,
    applicationId: string,
    message: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }
    return this.prisma.applicationUpdate.create({
      data: { applicationId, message },
    });
  }
}
