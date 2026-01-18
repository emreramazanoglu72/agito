import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesService } from './policies.service';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PolicyType } from './dto/create-policy.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';

describe('PoliciesService', () => {
    let service: PoliciesService;
    let prismaService: any;
    let activitiesService: any;
    let elasticsearchService: any;

    const mockPrismaService = {
        policy: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
        },
        employee: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    const mockActivitiesService = {
        log: jest.fn(),
    };

    const mockElasticsearchService = {
        indices: {
            exists: jest.fn(),
            create: jest.fn(),
        },
        index: jest.fn(),
        search: jest.fn(),
        bulk: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PoliciesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ActivitiesService, useValue: mockActivitiesService },
                { provide: ElasticsearchService, useValue: mockElasticsearchService },
            ],
        }).compile();

        service = module.get<PoliciesService>(PoliciesService);
        prismaService = module.get<PrismaService>(PrismaService);
        activitiesService = module.get<ActivitiesService>(ActivitiesService);
        elasticsearchService = module.get<ElasticsearchService>(ElasticsearchService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const tenantId = 'tenant-123';
        const createDto = {
            employeeId: 'emp-123',
            type: PolicyType.TSS,
            startDate: new Date('2024-01-01').toISOString(),
            endDate: new Date('2025-01-01').toISOString(),
        };

        const mockEmployee = {
            id: 'emp-123',
            tenantId,
            companyId: 'comp-123',
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('1990-01-01'),
            company: { id: 'comp-123', name: 'Test Corp' },
        };

        const mockPolicy = {
            id: 'policy-123',
            policyNo: 'AGT-2024-XYZ',
            type: PolicyType.TSS,
            startDate: new Date(createDto.startDate),
            endDate: new Date(createDto.endDate),
            premium: 1000,
            tenantId,
            employeeId: mockEmployee.id,
            companyId: mockEmployee.companyId,
            status: 'ACTIVE',
        };

        it('should create a policy successfully', async () => {
            mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
            mockPrismaService.policy.findUnique.mockResolvedValue(null); // For policyNo generation check
            mockPrismaService.policy.create.mockResolvedValue(mockPolicy);

            const result = await service.create(createDto, tenantId);

            expect(result).toBeDefined();
            expect(prismaService.employee.findUnique).toHaveBeenCalledWith({
                where: { id: createDto.employeeId },
                include: { company: true },
            });
            expect(prismaService.policy.create).toHaveBeenCalled();
            expect(elasticsearchService.index).toHaveBeenCalled();
            expect(activitiesService.log).toHaveBeenCalledWith(expect.objectContaining({
                type: ActivityType.POLICY_CREATED,
                tenantId,
            }));
        });

        it('should throw NotFoundException if employee not found', async () => {
            mockPrismaService.employee.findUnique.mockResolvedValue(null);

            await expect(service.create(createDto, tenantId)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if employee belongs to different tenant', async () => {
            mockPrismaService.employee.findUnique.mockResolvedValue({
                ...mockEmployee,
                tenantId: 'other-tenant',
            });

            await expect(service.create(createDto, tenantId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        const tenantId = 'tenant-123';
        const mockPolicies = [
            { id: '1', policyNo: 'POL-1', tenantId },
            { id: '2', policyNo: 'POL-2', tenantId }
        ];

        it('should return paginated policies', async () => {
            mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies);
            mockPrismaService.policy.count.mockResolvedValue(2);

            const result = await service.findAll({ page: 1, limit: 10 }, tenantId);

            expect(result).toEqual({
                data: mockPolicies,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
            expect(prismaService.policy.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId } }));
        });

        it('should apply filters correctly', async () => {
            mockPrismaService.policy.findMany.mockResolvedValue([]);
            mockPrismaService.policy.count.mockResolvedValue(0);

            const filters = { status: 'ACTIVE', search: 'John' };
            await service.findAll(filters, tenantId);

            expect(prismaService.policy.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    tenantId,
                    status: 'ACTIVE',
                    OR: expect.arrayContaining([
                        { policyNo: { contains: 'John', mode: 'insensitive' } },
                    ])
                })
            }));
        });
    });

    describe('assignPolicy', () => {
        const tenantId = 'tenant-123';
        const policyId = 'policy-123';
        const employeeId = 'emp-456';
        const companyId = 'comp-123';

        const mockPolicy = { id: policyId, tenantId, companyId, policyNo: 'POL-1' };
        const mockEmployee = { id: employeeId, tenantId, companyId, firstName: 'Jane', lastName: 'Doe' };
        const mockUpdatedPolicy = { ...mockPolicy, employeeId };

        it('should assign policy to a new employee', async () => {
            mockPrismaService.policy.findFirst
                .mockResolvedValueOnce(mockPolicy) // Initial check
                .mockResolvedValueOnce(mockUpdatedPolicy); // Transaction result

            mockPrismaService.employee.findFirst.mockResolvedValue(mockEmployee);

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                // Mock transaction execution
                return [null, mockUpdatedPolicy];
            });

            const result = await service.assignPolicy(policyId, employeeId, tenantId);

            expect(result).toEqual(mockUpdatedPolicy);
            expect(activitiesService.log).toHaveBeenCalledWith(expect.objectContaining({
                type: ActivityType.POLICY_UPDATED,
            }));
            expect(elasticsearchService.update).toHaveBeenCalled();
        });

        it('should throw BadRequestException if companies do not match', async () => {
            mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);
            mockPrismaService.employee.findFirst.mockResolvedValue({ ...mockEmployee, companyId: 'comp-999' });

            await expect(service.assignPolicy(policyId, employeeId, tenantId)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if policy not found', async () => {
            mockPrismaService.policy.findFirst.mockResolvedValue(null);
            await expect(service.assignPolicy(policyId, employeeId, tenantId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        const tenantId = 'tenant-123';
        const policyId = 'policy-123';
        const mockPolicy = { id: policyId, tenantId, policyNo: 'POL-1' };

        it('should return a policy', async () => {
            mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);

            const result = await service.findOne(policyId, tenantId);
            expect(result).toEqual(mockPolicy);
        });

        it('should throw NotFoundException if policy not found', async () => {
            mockPrismaService.policy.findFirst.mockResolvedValue(null);
            await expect(service.findOne(policyId, tenantId)).rejects.toThrow(NotFoundException);
        });
    });
});
