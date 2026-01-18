import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { R2Service } from '../storage/r2.service';
import { ActivityType } from '@prisma/client';

describe('EmployeesService', () => {
    let service: EmployeesService;

    const mockPrismaService = {
        employee: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        employeeDocument: {
            create: jest.fn(),
        },
        company: {
            findFirst: jest.fn(),
        },
        $queryRaw: jest.fn(),
        $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    const mockElasticsearchService = {
        indices: {
            exists: jest.fn().mockResolvedValue(true),
            create: jest.fn(),
        },
        index: jest.fn(),
        search: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        bulk: jest.fn(),
    };

    const mockActivitiesService = {
        log: jest.fn(),
    };

    const mockR2Service = {
        uploadFile: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('http://localhost'),
    };

    const tenantId = 'tenant-123';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployeesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ElasticsearchService, useValue: mockElasticsearchService },
                { provide: ActivitiesService, useValue: mockActivitiesService },
                { provide: R2Service, useValue: mockR2Service },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<EmployeesService>(EmployeesService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createEmployeeDto = {
            firstName: 'John',
            lastName: 'Doe',
            tcNo: '12345678901',
            email: 'john.doe@test.com',
            phoneNumber: '5551234567',
            companyId: 'company-123',
            position: 'Developer',
        };

        const createdEmployee = {
            id: 'employee-123',
            ...createEmployeeDto,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create an employee and index to Elasticsearch', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue({ id: 'company-123', name: 'Test Co' });
            mockPrismaService.employee.create.mockResolvedValue(createdEmployee);
            mockElasticsearchService.index.mockResolvedValue({});

            const result = await service.create(createEmployeeDto, tenantId);

            expect(result).toEqual(createdEmployee);
            expect(mockPrismaService.employee.create).toHaveBeenCalled();
            expect(mockElasticsearchService.index).toHaveBeenCalled();
            expect(mockActivitiesService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ActivityType.EMPLOYEE_CREATED,
                    targetId: 'employee-123',
                    targetType: 'Employee',
                    tenantId,
                }),
            );
        });

        it('should continue even if ES indexing fails', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue({ id: 'company-123', name: 'Test Co' });
            mockPrismaService.employee.create.mockResolvedValue(createdEmployee);
            mockElasticsearchService.index.mockRejectedValue(new Error('ES Error'));

            const result = await service.create(createEmployeeDto, tenantId);

            expect(result).toEqual(createdEmployee);
        });
    });

    describe('findAll', () => {
        const employees = [
            { id: 'e1', firstName: 'John', lastName: 'Doe', tenantId, _count: { policies: 0 } },
            { id: 'e2', firstName: 'Jane', lastName: 'Smith', tenantId, _count: { policies: 1 } },
        ];

        beforeEach(() => {
            const mockEmployees = [
                { id: 'e1', firstName: 'John', lastName: 'Doe', tenantId, _count: { policies: 0 } },
                { id: 'e2', firstName: 'Jane', lastName: 'Smith', tenantId, _count: { policies: 1 } },
            ];
            mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);
            mockPrismaService.employee.count.mockResolvedValue(2);
        });

        it('should return paginated employees', async () => {
            const result = await service.findAll(tenantId, { page: 1, limit: 10 });

            expect(mockPrismaService.employee.findMany).toHaveBeenCalled();
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
            expect(result).toHaveProperty('totalPages');
            expect(result.data).toBeDefined();
        });

        it('should apply search filter', async () => {
            const mockEmployee = { id: 'e1', firstName: 'John', lastName: 'Doe', tenantId, _count: { policies: 0 } };
            mockPrismaService.employee.findMany.mockResolvedValue([mockEmployee]);
            mockPrismaService.employee.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, {
                page: 1,
                limit: 10,
                search: 'John',
            });

            expect(result.data).toHaveLength(1);
        });
    });

    describe('findOne', () => {
        const employee = {
            id: 'employee-123',
            firstName: 'John',
            lastName: 'Doe',
            tenantId,
            company: { id: 'company-123', name: 'Test Company' },
            department: { id: 'dept-123', name: 'IT' },
            policies: [],
        };

        it('should return a single employee with relations', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValue(employee);

            const result = await service.findOne('employee-123', tenantId);

            expect(result).toBeDefined();
            expect(result?.id).toBe('employee-123');
            expect(mockPrismaService.employee.findFirst).toHaveBeenCalled();
        });

        it('should return null when employee not found', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValue(null);

            const result = await service.findOne('nonexistent', tenantId);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        const existingEmployee = {
            id: 'employee-123',
            firstName: 'John',
            lastName: 'Doe',
            tenantId,
        };

        const updatedEmployee = {
            ...existingEmployee,
            firstName: 'Johnny',
        };

        it('should throw NotFoundException when employee does not exist', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValue(null);

            await expect(
                service.update('nonexistent', { firstName: 'Johnny' }, tenantId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update employee and reindex to Elasticsearch', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValueOnce(existingEmployee);
            mockPrismaService.$transaction.mockResolvedValue([{}, updatedEmployee]);
            mockPrismaService.employee.findFirst.mockResolvedValueOnce(updatedEmployee);
            mockElasticsearchService.update.mockResolvedValue({});

            const result = await service.update(
                'employee-123',
                { firstName: 'Johnny' },
                tenantId,
            );

            expect(result).toBeDefined();
            expect(mockActivitiesService.log).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        const existingEmployee = {
            id: 'employee-123',
            firstName: 'John',
            lastName: 'Doe',
            tenantId,
        };

        it('should throw NotFoundException when employee does not exist', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValue(null);

            await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should delete employee and remove from Elasticsearch', async () => {
            mockPrismaService.employee.findFirst.mockResolvedValue(existingEmployee);
            mockPrismaService.employee.deleteMany.mockResolvedValue({ count: 1 });
            mockElasticsearchService.delete.mockResolvedValue({});

            const result = await service.remove('employee-123', tenantId);

            expect(result).toEqual(existingEmployee);
            expect(mockPrismaService.employee.deleteMany).toHaveBeenCalled();
            expect(mockElasticsearchService.delete).toHaveBeenCalled();
            expect(mockActivitiesService.log).toHaveBeenCalled();
        });
    });

    describe('uploadDocument', () => {
        const employee = {
            id: 'employee-123',
            firstName: 'John',
            lastName: 'Doe',
            tenantId,
        };

        const mockFile = {
            originalname: 'document.pdf',
            buffer: Buffer.from('test content'),
            mimetype: 'application/pdf',
        } as Express.Multer.File;

        it('should throw NotFoundException when employee does not exist', async () => {
            mockPrismaService.employee.findUnique.mockResolvedValue(null);

            await expect(
                service.uploadDocument('nonexistent', mockFile, tenantId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should upload document and create record', async () => {
            mockPrismaService.employee.findUnique.mockResolvedValue(employee);
            mockR2Service.uploadFile.mockResolvedValue('documents/doc-123.pdf');
            mockPrismaService.employeeDocument.create.mockResolvedValue({
                id: 'doc-123',
                fileName: 'document.pdf',
                fileUrl: 'https://cdn.example.com/documents/doc-123.pdf',
            });

            const result = await service.uploadDocument(
                'employee-123',
                mockFile,
                tenantId,
            );

            expect(result).toBeDefined();
            expect(mockR2Service.uploadFile).toHaveBeenCalled();
            expect(mockPrismaService.employeeDocument.create).toHaveBeenCalled();
        });
    });

    describe('search', () => {
        it('should return empty array when query is empty', async () => {
            const result = await service.search('', tenantId);

            expect(result).toEqual([]);
            expect(mockElasticsearchService.search).not.toHaveBeenCalled();
        });

        it('should return fuzzy search results from Elasticsearch', async () => {
            const esResponse = {
                hits: {
                    hits: [
                        {
                            _source: {
                                firstName: 'John',
                                lastName: 'Doe',
                                fullName: 'John Doe',
                                tenantId,
                            },
                        },
                    ],
                },
            };
            mockElasticsearchService.search.mockResolvedValue(esResponse);

            const result = await service.search('John', tenantId);

            expect(result).toHaveLength(1);
            expect(result[0].fullName).toBe('John Doe');
        });
    });
});
