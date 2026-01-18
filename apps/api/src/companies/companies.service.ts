import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyInput } from './dto/update-company.schema';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '@prisma/client';

// Elasticsearch response types - Exported for controller return types
export interface CompanyEsDocument {
  name: string;
  taxId: string;
  city?: string;
  tenantId: string;
}

interface EsHit<T> {
  _source: T;
}

@Injectable()
export class CompaniesService implements OnModuleInit {
  private readonly logger = new Logger(CompaniesService.name);
  private readonly index = 'companies';

  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly activitiesService: ActivitiesService,
  ) { }

  async onModuleInit() {
    await this.checkAndCreateIndex();
  }

  // 1. Index Management: Ensure Index exists with optimizations
  private async checkAndCreateIndex() {
    const indexExists = await this.elasticsearchService.indices.exists({
      index: this.index,
    });
    if (!indexExists) {
      this.logger.log(`Creating index: ${this.index}`);
      await this.elasticsearchService.indices.create({
        index: this.index,
        mappings: {
          properties: {
            name: { type: 'text' }, // Standard text analyzer
            taxId: { type: 'keyword' }, // Exact match
            city: { type: 'keyword' }, // Filtering
            tenantId: { type: 'keyword' },
          },
        },
      });
    }
  }

  // 2. Dual-Write: DB + Elastic
  async create(createCompanyDto: CreateCompanyDto, tenantId: string) {
    // Transaction: Save to DB first
    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        tenantId,
      },
    });

    // Then Index to Elastic (Fire and Forget or Await based on consistency needs)
    try {
      await this.elasticsearchService.index({
        index: this.index,
        id: company.id,
        document: {
          name: company.name,
          taxId: company.taxId,
          city: company.city,
          tenantId,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to index company ${company.id}: ${e.message}`);
      // In real app: Push to a retry queue
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.COMPANY_CREATED,
      title: 'Yeni şirket eklendi',
      description: `${company.name} sisteme kaydedildi`,
      targetId: company.id,
      targetType: 'Company',
      tenantId,
    });

    return company;
  }

  // 3. Search: Elastic Power
  async search(query: string, tenantId: string) {
    if (!query) return [];

    const result = await this.elasticsearchService.search({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'taxId'], // Name is 3x more important
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [{ term: { tenantId } }],
        },
      },
    });

    const hits = result.hits.hits as EsHit<CompanyEsDocument>[];
    return hits.map((hit) => hit._source);
  }

  async findAll(tenantId: string) {
    return this.prisma.company.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.company.findFirst({
      where: { id, tenantId },
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyInput, tenantId: string) {
    const existing = await this.prisma.company.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    // Update DB
    const [, company] = await this.prisma.$transaction([
      this.prisma.company.updateMany({
        where: { id, tenantId },
        data: updateCompanyDto,
      }),
      this.prisma.company.findFirst({ where: { id, tenantId } }),
    ]);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update Index
    try {
      await this.elasticsearchService.update({
        index: this.index,
        id: company.id,
        doc: {
          name: company.name,
          taxId: company.taxId,
          city: company.city,
          tenantId,
        },
      });
    } catch (e) {
      this.logger.error(
        `Failed to update index for company ${id}: ${e.message}`,
      );
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.COMPANY_UPDATED,
      title: 'Şirket güncellendi',
      description: `${company.name} bilgileri güncellendi`,
      targetId: company.id,
      targetType: 'Company',
      tenantId,
    });

    return company;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.company.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.company.deleteMany({
      where: { id, tenantId },
    });

    // Remove from Index
    try {
      await this.elasticsearchService.delete({
        index: this.index,
        id: existing.id,
      });
    } catch (e) {
      this.logger.error(
        `Failed to delete index for company ${id}: ${e.message}`,
      );
    }

    // Log activity
    await this.activitiesService.log({
      type: ActivityType.COMPANY_DELETED,
      title: 'Şirket silindi',
      description: `${existing.name} sistemden kaldırıldı`,
      targetId: id,
      targetType: 'Company',
      tenantId,
    });

    return existing;
  }

  // 4. Resilience: Sync Tool (DB -> Elastic)
  async syncAll(tenantId: string) {
    const companies = await this.prisma.company.findMany({
      where: { tenantId },
    });
    this.logger.log(
      `Syncing ${companies.length} companies to Elasticsearch...`,
    );

    // Bulk Insert
    const operations = companies.flatMap((doc) => [
      { index: { _index: this.index, _id: doc.id } },
      { name: doc.name, taxId: doc.taxId, city: doc.city, tenantId },
    ]);

    if (operations.length > 0) {
      const bulkResponse = await this.elasticsearchService.bulk({ operations });
      if (bulkResponse.errors) {
        this.logger.error('Bulk sync had errors');
      } else {
        this.logger.log('Bulk sync completed successfully');
      }
    }
    return { count: companies.length, success: true };
  }
}
