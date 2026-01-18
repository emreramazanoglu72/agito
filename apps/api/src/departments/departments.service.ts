import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentFilterDto } from './dto/department-filter.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { RedisService } from '../config/redis.service';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);
  private readonly cacheTtl = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private redis: RedisService,
  ) { }

  private getCacheKey(tenantId: string, companyId?: string) {
    return `departments:${tenantId}:${companyId || 'all'}`;
  }

  async create(data: CreateDepartmentDto, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: data.companyId, tenantId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (data.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: data.managerId, tenantId },
      });
      if (!manager || manager.companyId !== data.companyId) {
        throw new BadRequestException(
          'Manager must belong to the selected company',
        );
      }
    }

    const department = await this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive ?? true,
        companyId: data.companyId,
        tenantId,
        managerId: data.managerId,
      },
    });

    // Invalidate cache
    await this.redis.delByPattern(`departments:${tenantId}:*`);

    await this.activitiesService.log({
      type: ActivityType.DEPARTMENT_CREATED,
      title: 'Yeni departman eklendi',
      description: `${department.name} departmanı oluşturuldu`,
      targetId: department.id,
      targetType: 'Department',
      tenantId,
    });

    return department;
  }

  async findAll(tenantId: string, filter: DepartmentFilterDto) {
    const { page = 1, limit = 20, search, companyId, isActive } = filter || {};

    // Check cache for non-search queries
    if (!search) {
      const cacheKey = this.getCacheKey(tenantId, companyId);
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }
    }

    const where: any = { tenantId };

    if (companyId) {
      where.companyId = companyId;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        include: {
          company: true,
          manager: true,
          _count: { select: { employees: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.department.count({ where }),
    ]);

    const result = {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };

    // Cache result for non-search queries
    if (!search) {
      const cacheKey = this.getCacheKey(tenantId, companyId);
      await this.redis.set(cacheKey, result, this.cacheTtl);
      this.logger.debug(`Cached ${cacheKey} for ${this.cacheTtl}s`);
    }

    return result;
  }

  async findOne(id: string, tenantId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        company: true,
        manager: true,
        employees: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(id: string, data: UpdateDepartmentDto, tenantId: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    if (data.companyId && data.companyId !== existing.companyId) {
      throw new BadRequestException(
        'Company cannot be changed for a department',
      );
    }

    if (data.managerId) {
      const manager = await this.prisma.employee.findFirst({
        where: { id: data.managerId, tenantId },
      });
      if (!manager || manager.companyId !== existing.companyId) {
        throw new BadRequestException(
          'Manager must belong to the department company',
        );
      }
    }

    const [, department] = await this.prisma.$transaction([
      this.prisma.department.updateMany({
        where: { id, tenantId },
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          isActive: data.isActive,
          managerId: data.managerId,
        },
      }),
      this.prisma.department.findFirst({ where: { id, tenantId } }),
    ]);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Invalidate cache
    await this.redis.delByPattern(`departments:${tenantId}:*`);

    await this.activitiesService.log({
      type: ActivityType.DEPARTMENT_UPDATED,
      title: 'Departman güncellendi',
      description: `${department.name} departmanı güncellendi`,
      targetId: existing.id,
      targetType: 'Department',
      tenantId,
    });

    return department;
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { employees: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    if (existing._count.employees > 0) {
      throw new BadRequestException('Departmanda çalışan varken silinemez');
    }

    await this.prisma.department.deleteMany({
      where: { id, tenantId },
    });

    // Invalidate cache
    await this.redis.delByPattern(`departments:${tenantId}:*`);

    await this.activitiesService.log({
      type: ActivityType.DEPARTMENT_DELETED,
      title: 'Departman silindi',
      description: `${existing.name} departmanı silindi`,
      targetId: existing.id,
      targetType: 'Department',
      tenantId,
    });

    return existing;
  }
}
