import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../database/prisma.service';
import { CreatePolicyDto, PolicyType } from './dto/create-policy.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PoliciesService implements OnModuleInit {
  private readonly logger = new Logger(PoliciesService.name);
  private readonly index = 'policies';

  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

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
              policyNo: { type: 'keyword' },
              type: { type: 'keyword' },
              status: { type: 'keyword' },
              employeeName: { type: 'text' },
              companyId: { type: 'keyword' },
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
                  fields: ['policyNo^3', 'employeeName^2', 'type'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [{ term: { tenantId } }],
          },
        },
      });

      // @ts-ignore
      return result.hits.hits.map((hit) => hit._source);
    } catch (e) {
      this.logger.error(`ES search failed: ${e.message}`);
      return [];
    }
  }

  // SYNC: Reindex all policies from DB to ES
  async syncAll(tenantId: string) {
    const policies = await this.prisma.policy.findMany({
      where: { tenantId },
      include: { employee: true },
    });
    this.logger.log(`Syncing ${policies.length} policies to Elasticsearch...`);

    const operations = policies.flatMap((doc) => [
      { index: { _index: this.index, _id: doc.id } },
      {
        policyNo: doc.policyNo,
        type: doc.type,
        status: doc.status,
        employeeName: doc.employee
          ? `${doc.employee.firstName} ${doc.employee.lastName}`
          : '',
        companyId: doc.companyId,
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
    return { count: policies.length, success: true };
  }

  private calculatePremium(type: PolicyType, age: number): number {
    const basePrice = {
      [PolicyType.TSS]: 3000,
      [PolicyType.OSS]: 12000,
      [PolicyType.LIFE]: 500,
      [PolicyType.FERDI_KAZA]: 200,
    };

    // Age risk factor
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

  async create(createPolicyDto: CreatePolicyDto, tenantId: string) {
    // 1. Fetch Employee to get age and company
    const employee = await this.prisma.employee.findUnique({
      where: { id: createPolicyDto.employeeId },
      include: { company: true },
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException('Employee not found');
    }

    // 2. Calculate Age
    const age = this.calculateAge(employee.birthDate);

    // 3. Calculate Premium (Business Logic)
    const premium = this.calculatePremium(createPolicyDto.type, age);

    // 4. Generate Policy No
    const policyNo = await this.generatePolicyNo(tenantId, this.prisma);

    // 5. Create Policy with Relations
    const policy = await this.prisma.policy.create({
      data: {
        policyNo,
        type: createPolicyDto.type,
        startDate: new Date(createPolicyDto.startDate),
        endDate: new Date(createPolicyDto.endDate),
        premium,
        tenantId,
        employeeId: employee.id,
        companyId: employee.companyId,
        coverages: {
          create: [
            {
              name: 'Ana Teminat',
              limit: 100000,
              description: 'Yatarak Tedavi',
            },
            {
              name: 'Ayakta Tedavi',
              limit: 5000,
              description: 'Muayene, Tahlil, Röntgen',
            },
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
      include: {
        coverages: true,
        payments: true,
      },
    });

    // Dual-Write: Index to Elasticsearch
    try {
      await this.elasticsearchService.index({
        index: this.index,
        id: policy.id,
        document: {
          policyNo: policy.policyNo,
          type: policy.type,
          status: policy.status,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          companyId: policy.companyId,
          tenantId,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to index policy ${policy.id}: ${e.message}`);
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.POLICY_CREATED,
      title: 'Yeni poliçe oluşturuldu',
      description: `${policy.policyNo} nolu poliçe kaydedildi (₺${policy.premium})`,
      targetId: policy.id,
      targetType: 'Policy',
      tenantId,
    });

    return policy;
  }

  async findAll(filterDto: any, tenantId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      companyId,
      status,
      startDate,
      endDate,
      employeeId,
    } = filterDto || {};
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (companyId) {
      where.companyId = companyId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { policyNo: { contains: search, mode: 'insensitive' } },
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.policy.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          employee: true,
          company: true,
        },
      }),
      this.prisma.policy.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async assignPolicy(policyId: string, employeeId: string, tenantId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId, tenantId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    if (policy.companyId !== employee.companyId) {
      throw new BadRequestException(
        'Policy and employee must belong to the same company',
      );
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.policy.updateMany({
        where: { id: policyId, tenantId },
        data: { employeeId },
      }),
      this.prisma.policy.findFirst({ where: { id: policyId, tenantId } }),
    ]);

    if (!updated) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    // Update Elasticsearch
    try {
      await this.elasticsearchService.update({
        index: this.index,
        id: updated.id,
        doc: {
          employeeName: `${employee.firstName} ${employee.lastName}`,
        },
      });
    } catch (e) {
      this.logger.error(
        `Failed to update ES index for policy ${policyId}: ${e.message}`,
      );
    }

    await this.activitiesService.log({
      type: ActivityType.POLICY_UPDATED,
      title: 'Poliçe ataması güncellendi',
      description: `${policy.policyNo} poliçesi yeni çalışana atandı`,
      targetId: updated.id,
      targetType: 'Policy',
      tenantId,
    });

    return updated;
  }

  async findOne(id: string, tenantId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, tenantId },
      include: {
        employee: true,
        company: true,
        coverages: true,
        payments: {
          orderBy: { installmentNo: 'asc' },
        },
        documents: true,
      },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return policy;
  }
}
