import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../database/prisma.service';
import { R2Service } from '../storage/r2.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType, Prisma } from '@prisma/client';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from './dto/employee.schemas';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { BadRequestException } from '@nestjs/common';

// Elasticsearch response types
interface EmployeeEsDocument {
  firstName: string;
  lastName: string;
  fullName: string;
  tcNo: string;
  companyId: string;
  departmentId?: string;
  tenantId: string;
}

interface EsHit<T> {
  _source: T;
}

@Injectable()
export class EmployeesService implements OnModuleInit {
  private readonly logger = new Logger(EmployeesService.name);
  private readonly index = 'employees';

  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private r2Service: R2Service,
    private configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) { }

  async onModuleInit() {
    await this.checkAndCreateIndex();
  }

  private async checkAndCreateIndex() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.index,
      });
      if (!indexExists) {
        this.logger.log(`Creating index: ${this.index}`);
        await this.elasticsearchService.indices.create({
          index: this.index,
          mappings: {
            properties: {
              firstName: { type: 'text' },
              lastName: { type: 'text' },
              fullName: { type: 'text' },
              tcNo: { type: 'keyword' },
              companyId: { type: 'keyword' },
              departmentId: { type: 'keyword' },
              tenantId: { type: 'keyword' },
            },
          },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to check/create ES index: ${e.message}`);
    }
  }

  // SEARCH: Elasticsearch-powered fuzzy search
  async search(query: string, tenantId: string) {
    if (!query) return [];

    try {
      const result = await this.elasticsearchService.search({
        index: this.index,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['fullName^3', 'firstName^2', 'lastName^2', 'tcNo'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [{ term: { tenantId } }],
          },
        },
      });

      const hits = result.hits.hits as EsHit<EmployeeEsDocument>[];
      return hits.map((hit) => hit._source);
    } catch (e) {
      this.logger.error(`ES search failed: ${e.message}`);
      return [];
    }
  }

  // SYNC: Reindex all employees from DB to ES
  async syncAll(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId },
    });
    this.logger.log(
      `Syncing ${employees.length} employees to Elasticsearch...`,
    );

    const operations = employees.flatMap((doc) => [
      { index: { _index: this.index, _id: doc.id } },
      {
        firstName: doc.firstName,
        lastName: doc.lastName,
        fullName: `${doc.firstName} ${doc.lastName}`,
        tcNo: doc.tcNo,
        companyId: doc.companyId,
        departmentId: doc.departmentId,
        tenantId,
      },
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.elasticsearchService.bulk({ operations });
      if (bulkResponse.errors) {
        this.logger.error('Bulk sync had errors');
      } else {
        this.logger.log('Bulk sync completed successfully');
      }
    }
    return { count: employees.length, success: true };
  }

  async uploadDocument(
    id: string,
    file: Express.Multer.File,
    tenantId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const key = await this.r2Service.uploadFile(file);
    const url = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;

    // Create Document Record
    await this.prisma.employeeDocument.create({
      data: {
        employeeId: id,
        tenantId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        key,
        url,
      },
    });

    return {
      message: 'File uploaded successfully',
      key,
      url,
    };
  }

  async create(data: CreateEmployeeInput, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: data.companyId, tenantId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (data.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: data.departmentId, tenantId },
      });
      if (!department || department.companyId !== data.companyId) {
        throw new BadRequestException('Department not found for this company');
      }
    }

    const employee = await this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        tcNo: data.tcNo,
        departmentId: data.departmentId,
        birthDate: data.birthDate ?? new Date(),
        tenantId,
        companyId: data.companyId,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    // Dual-Write: Index to Elasticsearch
    try {
      await this.elasticsearchService.index({
        index: this.index,
        id: employee.id,
        document: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: `${employee.firstName} ${employee.lastName}`,
          tcNo: employee.tcNo,
          companyId: employee.companyId,
          departmentId: employee.departmentId,
          tenantId,
        },
      });
    } catch (e) {
      this.logger.error(
        `Failed to index employee ${employee.id}: ${e.message}`,
      );
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.EMPLOYEE_CREATED,
      title: 'Yeni çalışan eklendi',
      description: `${employee.firstName} ${employee.lastName} sisteme kaydedildi`,
      targetId: employee.id,
      targetType: 'Employee',
      tenantId,
    });

    return employee;
  }

  async findAll(tenantId: string, filter: EmployeeFilterDto) {
    const {
      page = 1,
      limit = 30,
      companyId,
      search,
      departmentId,
    } = filter || {};
    const where: Prisma.EmployeeWhereInput = { tenantId };

    if (companyId) {
      where.companyId = companyId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { tcNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rawData, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          company: true,
          department: true,
          _count: { select: { policies: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      this.prisma.employee.count({ where }),
    ]);

    // Transform data to include computed fields
    const data = rawData.map(employee => ({
      ...employee,
      fullName: `${employee.firstName} ${employee.lastName}`,
      status: 'ACTIVE' as const, // Default status since not in DB
      activePoliciesCount: employee._count.policies,
    }));

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string, tenantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: { company: true, department: true },
    });

    if (!employee) return null;

    return {
      ...employee,
      fullName: `${employee.firstName} ${employee.lastName}`,
      status: 'ACTIVE' as const,
    };
  }

  async update(id: string, data: UpdateEmployeeInput, tenantId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    if (data.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: data.departmentId, tenantId },
      });
      if (!department || department.companyId !== existing.companyId) {
        throw new BadRequestException('Department not found for this company');
      }
    }

    const [, employee] = await this.prisma.$transaction([
      this.prisma.employee.updateMany({
        where: { id, tenantId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          tcNo: data.tcNo,
          departmentId: data.departmentId,
          avatarUrl: data.avatarUrl,
          email: data.email,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate,
        },
      }),
      this.prisma.employee.findFirst({ where: { id, tenantId } }),
    ]);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Dual-Write: Update Elasticsearch
    try {
      await this.elasticsearchService.update({
        index: this.index,
        id: employee.id,
        doc: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: `${employee.firstName} ${employee.lastName}`,
          tcNo: employee.tcNo,
          departmentId: employee.departmentId,
          tenantId,
        },
      });
    } catch (e) {
      this.logger.error(
        `Failed to update ES index for employee ${id}: ${e.message}`,
      );
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.EMPLOYEE_UPDATED,
      title: 'Çalışan güncellendi',
      description: `${employee.firstName} ${employee.lastName} bilgileri güncellendi`,
      targetId: employee.id,
      targetType: 'Employee',
      tenantId,
    });

    return employee;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.deleteMany({
      where: { id, tenantId },
    });

    // Dual-Write: Remove from Elasticsearch
    try {
      await this.elasticsearchService.delete({
        index: this.index,
        id: existing.id,
      });
    } catch (e) {
      this.logger.error(
        `Failed to delete ES index for employee ${id}: ${e.message}`,
      );
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.EMPLOYEE_DELETED,
      title: 'Çalışan silindi',
      description: `${existing.firstName} ${existing.lastName} sistemden kaldırıldı`,
      targetId: id,
      targetType: 'Employee',
      tenantId,
    });

    return existing;
  }
}
