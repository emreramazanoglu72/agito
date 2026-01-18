import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { Prisma } from '@prisma/client';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createdByEmail: string | undefined, dto: CreateSupportTicketDto) {
    if (!tenantId) {
      throw new BadRequestException('Tenant is required');
    }

    return this.prisma.supportTicket.create({
      data: {
        tenantId,
        subject: dto.subject.trim(),
        category: dto.category.trim(),
        message: dto.message.trim(),
        createdByEmail,
      },
    });
  }

  async findAll(params: {
    role: string;
    tenantId: string;
    status?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Number(params.limit) || 10);

    const where: Prisma.SupportTicketWhereInput = {};
    if (params.role !== 'ADMIN') {
      where.tenantId = params.tenantId;
    }
    if (params.status) {
      where.status = params.status as any;
    }
    if (params.search) {
      where.OR = [
        { subject: { contains: params.search, mode: 'insensitive' } },
        { message: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateStatus(
    id: string,
    user: { role: string; tenantId: string },
    dto: UpdateSupportTicketDto,
  ) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Not authorized');
    }
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    await this.prisma.supportTicket.updateMany({
      where: { id, tenantId: user.tenantId },
      data: { status: dto.status as any },
    });
    const updated = await this.prisma.supportTicket.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!updated) {
      throw new NotFoundException('Support ticket not found');
    }
    return updated;
  }
}
