import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filter: any) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      policy: {
        tenantId,
      },
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.companyId) {
      where.policy.companyId = filter.companyId;
    }

    if (filter.search) {
      where.policy = {
        ...where.policy,
        OR: [
          { policyNo: { contains: filter.search, mode: 'insensitive' } },
          {
            employee: {
              firstName: { contains: filter.search, mode: 'insensitive' },
            },
          },
          {
            employee: {
              lastName: { contains: filter.search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.policyPayment.count({ where }),
      this.prisma.policyPayment.findMany({
        where,
        take: limit,
        skip,
        orderBy: { dueDate: 'asc' },
        include: {
          policy: {
            include: {
              employee: true,
              company: true,
            },
          },
        },
      }),
    ]);

    // Stats calculation (Global for tenant, ignores search for overview)
    // If we want filtered stats, use 'where'
    // Stats calculation (Filtered)
    // If companyId is provided, stats should reflect that company
    const statsWhere: any = { policy: { tenantId } };
    if (filter.companyId) {
      statsWhere.policy.companyId = filter.companyId;
    }

    const stats = await this.prisma.policyPayment.groupBy({
      by: ['status'],
      where: statsWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    const summary = {
      total: stats.reduce(
        (acc, curr) => acc + Number(curr._sum.amount || 0),
        0,
      ),
      collected: stats.find((s) => s.status === 'PAID')?._sum.amount || 0,
      pending: stats.find((s) => s.status === 'PENDING')?._sum.amount || 0,
      overdue: stats.find((s) => s.status === 'OVERDUE')?._sum.amount || 0,
    };

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
      summary,
    };
  }

  async sendReminder(id: string) {
    // Mock email sending logic
    console.log(`Sending reminder for payment ${id} or company ${id}`);
    // Check if ID is for a payment or company (assuming payment ID for now based on request)
    // In reality, this would fetch contact info and send an email via SMTP/SendGrid
    return {
      success: true,
      message: 'Duyuru/Hatırlatma e-postası başarıyla kuyruğa alındı.',
    };
  }
}
