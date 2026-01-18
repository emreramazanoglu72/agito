import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prismaService: any;

    const mockPrismaService = {
        policyPayment: {
            count: jest.fn(),
            findMany: jest.fn(),
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
        prismaService = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        const tenantId = 'tenant-123';

        it('should return paginated payments with summary', async () => {
            const mockPayments = [{ id: 'pay-1', amount: 100, status: 'PENDING' }];
            const mockStats = [
                { status: 'PAID', _sum: { amount: 500 }, _count: { id: 5 } },
                { status: 'PENDING', _sum: { amount: 200 }, _count: { id: 2 } },
            ];

            mockPrismaService.policyPayment.count.mockResolvedValue(10);
            mockPrismaService.policyPayment.findMany.mockResolvedValue(mockPayments);
            mockPrismaService.policyPayment.groupBy.mockResolvedValue(mockStats);

            const result = await service.findAll(tenantId, { page: 1, limit: 10 });

            expect(result).toEqual({
                data: mockPayments,
                meta: {
                    total: 10,
                    page: 1,
                    lastPage: 1,
                },
                summary: {
                    total: 700,
                    collected: 500,
                    pending: 200,
                    overdue: 0,
                },
            });

            expect(prismaService.policyPayment.findMany).toHaveBeenCalled();
            expect(prismaService.policyPayment.groupBy).toHaveBeenCalled();
        });

        it('should apply search filters', async () => {
            mockPrismaService.policyPayment.count.mockResolvedValue(0);
            mockPrismaService.policyPayment.findMany.mockResolvedValue([]);
            mockPrismaService.policyPayment.groupBy.mockResolvedValue([]);

            await service.findAll(tenantId, { search: 'John', status: 'OVERDUE' });

            expect(prismaService.policyPayment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'OVERDUE',
                    policy: expect.objectContaining({
                        tenantId,
                        OR: expect.arrayContaining([
                            { policyNo: expect.any(Object) },
                            { employee: expect.objectContaining({ firstName: expect.any(Object) }) },
                        ])
                    })
                })
            }));
        });
    });

    describe('sendReminder', () => {
        it('should return success message', async () => {
            const result = await service.sendReminder('pay-123');
            expect(result).toEqual({
                success: true,
                message: expect.any(String),
            });
        });
    });
});
