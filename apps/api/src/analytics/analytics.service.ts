import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../config/redis.service';

type PolicyStatus = 'ACTIVE' | 'CANCELLED' | 'PENDING_RENEWAL' | 'EXPIRED';
type OperationStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL_SUCCESS';
type PolicyType = 'TSS' | 'OSS' | 'LIFE' | 'FERDI_KAZA';

@Injectable()
export class AnalyticsService {
  private readonly cacheTtlSec = 60;
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private buildMonthRange(months: number) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const labels: string[] = [];
    const keys: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      labels.push(cursor.toLocaleDateString('tr-TR', { month: 'short' }));
      keys.push(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { start, end, labels, keys };
  }

  private getMonthKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  private getChangeSummary(current: number, previous: number) {
    if (!previous) {
      return { value: '0%', tone: 'neutral' };
    }
    const diff = ((current - previous) / previous) * 100;
    const rounded = Math.round(diff);
    if (rounded === 0) {
      return { value: '0%', tone: 'neutral' };
    }
    return {
      value: `${rounded > 0 ? '+' : ''}${rounded}%`,
      tone: rounded > 0 ? 'positive' : 'negative',
    };
  }

  async getDashboard(range: string | undefined, tenantId: string) {
    const key = `dashboard:${tenantId}:${range || '6m'}`;
    const cached = await this.redis.get<any>(key);
    if (cached) {
      return cached;
    }

    const months = range === '12m' ? 12 : 6;
    const { start, end, labels, keys } = this.buildMonthRange(months);

    const [
      policies,
      totalPolicies,
      activePolicies,
      pendingRenewals,
      totalCompanies,
      totalEmployees,
      totalPremiumAgg,
      operations,
    ] = await Promise.all([
      this.prisma.policy.findMany({
        where: {
          tenantId,
          OR: [
            { startDate: { gte: start, lte: end } },
            { endDate: { gte: start, lte: end } },
          ],
        },
        select: {
          startDate: true,
          endDate: true,
          type: true,
          status: true,
          premium: true,
        },
      }),
      this.prisma.policy.count({ where: { tenantId } }),
      this.prisma.policy.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.policy.count({
        where: { tenantId, status: 'PENDING_RENEWAL' },
      }),
      this.prisma.company.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.policy.aggregate({
        _sum: { premium: true },
        where: { tenantId },
      }),
      this.prisma.bulkOperation.findMany({
        where: { tenantId },
        select: {
          id: true,
          type: true,
          status: true,
          fileName: true,
          totalRows: true,
          processedRows: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
    ]);

    const newCounts = keys.map(() => 0);
    const renewalCounts = keys.map(() => 0);
    const typeCounts: Record<PolicyType, number> = {
      TSS: 0,
      OSS: 0,
      LIFE: 0,
      FERDI_KAZA: 0,
    };

    policies.forEach((policy) => {
      const startIndex = keys.indexOf(this.getMonthKey(policy.startDate));
      const endIndex = keys.indexOf(this.getMonthKey(policy.endDate));
      if (startIndex >= 0) {
        newCounts[startIndex] += 1;
      }
      if (
        endIndex >= 0 &&
        policy.status !== 'CANCELLED' &&
        policy.status !== 'EXPIRED'
      ) {
        renewalCounts[endIndex] += 1;
      }
      const type = policy.type as PolicyType;
      if (typeCounts[type] !== undefined) {
        typeCounts[type] += 1;
      }
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [
      renewedThisMonth,
      renewedPreviousMonth,
      premiumThisMonthAgg,
      premiumPreviousMonthAgg,
    ] = await Promise.all([
      this.prisma.policy.count({
        where: {
          tenantId,
          endDate: { gte: monthStart, lte: monthEnd },
          status: { notIn: ['CANCELLED', 'EXPIRED'] as PolicyStatus[] },
        },
      }),
      this.prisma.policy.count({
        where: {
          tenantId,
          endDate: { gte: prevStart, lte: prevEnd },
          status: { notIn: ['CANCELLED', 'EXPIRED'] as PolicyStatus[] },
        },
      }),
      this.prisma.policy.aggregate({
        _sum: { premium: true },
        where: { tenantId, startDate: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.policy.aggregate({
        _sum: { premium: true },
        where: { tenantId, startDate: { gte: prevStart, lte: prevEnd } },
      }),
    ]);

    const totalPremium = Number(totalPremiumAgg._sum?.premium || 0);
    const premiumThisMonth = Number(premiumThisMonthAgg._sum?.premium || 0);
    const premiumPreviousMonth = Number(
      premiumPreviousMonthAgg._sum?.premium || 0,
    );

    const completedStatuses: OperationStatus[] = [
      'COMPLETED',
      'PARTIAL_SUCCESS',
    ];
    const failedStatuses: OperationStatus[] = ['FAILED'];
    const queuedStatuses: OperationStatus[] = ['QUEUED', 'PROCESSING'];

    const completedOps = operations.filter((op) =>
      completedStatuses.includes(op.status as OperationStatus),
    );
    const failedOps = operations.filter((op) =>
      failedStatuses.includes(op.status as OperationStatus),
    );
    const backlogOps = operations.filter((op) =>
      queuedStatuses.includes(op.status as OperationStatus),
    );

    const avgProcessingHours = completedOps.length
      ? completedOps.reduce(
          (sum, op) => sum + (op.updatedAt.getTime() - op.createdAt.getTime()),
          0,
        ) /
        completedOps.length /
        (1000 * 60 * 60)
      : 0;
    const successRate =
      completedOps.length + failedOps.length
        ? Math.round(
            (completedOps.length / (completedOps.length + failedOps.length)) *
              100,
          )
        : 0;

    const recentBulkOperations = operations.slice(0, 10);
    const bulkStatusSummary = operations.reduce<
      Record<OperationStatus, number>
    >(
      (acc, operation) => {
        acc[operation.status as OperationStatus] =
          (acc[operation.status as OperationStatus] || 0) + 1;
        return acc;
      },
      {
        QUEUED: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0,
        PARTIAL_SUCCESS: 0,
      },
    );

    const payload = {
      stats: {
        totalPolicies,
        totalCompanies,
        totalEmployees,
        activePolicies,
        pendingRenewals,
        renewedThisMonth,
        totalPremium,
      },
      changes: {
        renewedThisMonth: this.getChangeSummary(
          renewedThisMonth,
          renewedPreviousMonth,
        ),
        totalPremium: this.getChangeSummary(
          premiumThisMonth,
          premiumPreviousMonth,
        ),
      },
      chart: {
        labels,
        datasets: [
          {
            label: 'Yeni Poliçeler',
            data: newCounts,
            fill: true,
            borderColor: '#0f766e',
            backgroundColor: 'rgba(15, 118, 110, 0.12)',
            tension: 0.4,
          },
          {
            label: 'Yenileme Takvimi',
            data: renewalCounts,
            fill: true,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            tension: 0.4,
          },
        ],
      },
      doughnut: {
        labels: ['TSS', 'OSS', 'LIFE', 'Ferdi Kaza'],
        datasets: [
          {
            data: [
              typeCounts.TSS,
              typeCounts.OSS,
              typeCounts.LIFE,
              typeCounts.FERDI_KAZA,
            ],
            backgroundColor: ['#0ea5a4', '#38bdf8', '#f59e0b', '#f97316'],
            hoverBackgroundColor: ['#0f766e', '#0284c7', '#d97706', '#ea580c'],
            borderWidth: 0,
          },
        ],
      },
      operations: {
        slaTarget: 95,
        avgProcessingHours: Number(avgProcessingHours.toFixed(1)),
        successRate,
        backlog: backlogOps.length,
      },
      bulkOperations: {
        summary: bulkStatusSummary,
        recent: recentBulkOperations.map((op) => ({
          id: op.id,
          type: op.type,
          status: op.status,
          fileName: op.fileName,
          totalRows: op.totalRows,
          processedRows: op.processedRows,
          createdAt: op.createdAt,
          updatedAt: op.updatedAt,
        })),
      },
    };

    await this.redis.set(key, payload, this.cacheTtlSec);
    return payload;
  }
}
