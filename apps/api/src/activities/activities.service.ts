import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ActivityType } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    type: ActivityType;
    title: string;
    description?: string;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetType?: string;
    tenantId: string;
  }) {
    return this.prisma.activity.create({
      data,
    });
  }

  async findAll(tenantId: string, limit: number = 20) {
    return this.prisma.activity.findMany({
      where: { tenantId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
