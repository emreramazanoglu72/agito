import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { R2Service } from '../storage/r2.service';
import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private configService: ConfigService,
    private activitiesService: ActivitiesService,
  ) {}

  async findAll(
    tenantId: string,
    filters?: {
      employeeId?: string;
      policyId?: string;
      kind?: string;
      search?: string;
      page?: number;
      limit?: number;
      category?: string;
    },
  ) {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(50, Math.max(1, filters?.limit || 12));
    const take = limit * page;
    const normalizedKind = String(filters?.kind || '').toLowerCase();
    const normalizedCategory = String(filters?.category || '').toLowerCase();
    const search = String(filters?.search || '').trim();
    const shouldIncludeEmployees = !normalizedKind || normalizedKind === 'employee';
    const shouldIncludePolicies = !normalizedKind || normalizedKind === 'policy';

    const employeeWhere: any = { tenantId };
    if (filters?.employeeId) {
      employeeWhere.employeeId = filters.employeeId;
    }
    if (normalizedCategory) {
      employeeWhere.type = { contains: normalizedCategory, mode: 'insensitive' };
    }
    if (search) {
      employeeWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const policyWhere: any = { policy: { tenantId } };
    if (filters?.policyId) {
      policyWhere.policyId = filters.policyId;
    }
    if (normalizedCategory) {
      policyWhere.type = { contains: normalizedCategory, mode: 'insensitive' };
    }
    if (search) {
      policyWhere.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { policy: { policyNo: { contains: search, mode: 'insensitive' } } },
        { policy: { employee: { firstName: { contains: search, mode: 'insensitive' } } } },
        { policy: { employee: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [employeeDocs, policyDocs, employeeTotal, policyTotal] = await Promise.all([
      shouldIncludeEmployees
        ? this.prisma.employeeDocument.findMany({
            where: employeeWhere,
            include: { employee: { include: { company: true } } },
            orderBy: { createdAt: 'desc' },
            take,
          })
        : Promise.resolve([]),
      shouldIncludePolicies
        ? this.prisma.policyDocument.findMany({
            where: policyWhere,
            include: {
              policy: {
                include: {
                  employee: true,
                  company: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take,
          })
        : Promise.resolve([]),
      shouldIncludeEmployees
        ? this.prisma.employeeDocument.count({ where: employeeWhere })
        : Promise.resolve(0),
      shouldIncludePolicies
        ? this.prisma.policyDocument.count({ where: policyWhere })
        : Promise.resolve(0),
    ]);

    const mappedEmployees = employeeDocs.map((doc) => ({
      id: doc.id,
      kind: 'employee',
      category: 'employee',
      title: doc.name,
      fileName: doc.name,
      fileUrl: doc.url,
      createdAt: doc.createdAt,
      employeeName: doc.employee
        ? `${doc.employee.firstName} ${doc.employee.lastName}`
        : null,
      policyNo: null,
      companyName: doc.employee?.company?.name ?? null,
      mimeType: doc.type,
      size: doc.size,
    }));

    const mappedPolicies = policyDocs.map((doc) => ({
      id: doc.id,
      kind: 'policy',
      category: doc.type?.toLowerCase() || 'policy',
      title: doc.fileName,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      createdAt: doc.createdAt,
      employeeName: doc.policy?.employee
        ? `${doc.policy.employee.firstName} ${doc.policy.employee.lastName}`
        : null,
      policyNo: doc.policy?.policyNo ?? null,
      companyName: doc.policy?.company?.name ?? null,
      mimeType: doc.type,
      size: null,
    }));

    const combined = [...mappedPolicies, ...mappedEmployees];
    const sorted = combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paged = sorted.slice((page - 1) * limit, page * limit);
    return {
      data: paged,
      meta: {
        page,
        limit,
        total: employeeTotal + policyTotal,
      },
    };
  }

  async uploadDocument(
    tenantId: string,
    body: {
      kind: 'policy' | 'employee';
      policyId?: string;
      employeeId?: string;
      documentType?: string;
    },
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const kind = String(body.kind || '').toLowerCase();
    if (kind !== 'policy' && kind !== 'employee') {
      throw new BadRequestException('Invalid document kind');
    }

    const key = await this.r2Service.uploadFile(file);
    const url = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;

    if (kind === 'employee') {
      if (!body.employeeId) {
        throw new BadRequestException('employeeId is required');
      }
      const employee = await this.prisma.employee.findFirst({
        where: { id: body.employeeId, tenantId },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const document = await this.prisma.employeeDocument.create({
        data: {
          employeeId: body.employeeId,
          tenantId,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          key,
          url,
        },
      });

      await this.activitiesService.log({
        type: 'EMPLOYEE_UPDATED',
        title: 'Calisan dokumani yuklendi',
        description: `${employee.firstName} ${employee.lastName} icin dokuman yuklendi.`,
        targetId: employee.id,
        targetType: 'Employee',
        tenantId,
      });

      return { id: document.id, url };
    }

    if (!body.policyId) {
      throw new BadRequestException('policyId is required');
    }
    const policy = await this.prisma.policy.findFirst({
      where: { id: body.policyId, tenantId },
    });
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const document = await this.prisma.policyDocument.create({
      data: {
        policyId: body.policyId,
        type: body.documentType || 'POLICY_PDF',
        fileName: file.originalname,
        fileUrl: url,
      },
    });

    await this.activitiesService.log({
      type: 'POLICY_UPDATED',
      title: 'Police dokumani yuklendi',
      description: `${policy.policyNo} dokumani eklendi.`,
      targetId: policy.id,
      targetType: 'Policy',
      tenantId,
    });

    return { id: document.id, url };
  }
}
