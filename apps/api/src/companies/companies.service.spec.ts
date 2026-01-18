import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '@prisma/client';

describe('CompaniesService', () => {
    let service: CompaniesService;

    const mockPrismaService = {
        company: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn(),
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

    const tenantId = 'tenant-123';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompaniesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ElasticsearchService, useValue: mockElasticsearchService },
                { provide: ActivitiesService, useValue: mockActivitiesService },
            ],
        }).compile();

        service = module.get<CompaniesService>(CompaniesService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createCompanyDto = {
            name: 'Test Company',
            taxId: '1234567890',
            city: 'Istanbul',
        };

        const createdCompany = {
            id: 'company-123',
            ...createCompanyDto,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create a company in DB and index to Elasticsearch', async () => {
            mockPrismaService.company.create.mockResolvedValue(createdCompany);
            mockElasticsearchService.index.mockResolvedValue({});

            const result = await service.create(createCompanyDto, tenantId);

            expect(result).toEqual(createdCompany);
            expect(mockPrismaService.company.create).toHaveBeenCalledWith({
                data: { ...createCompanyDto, tenantId },
            });
            expect(mockElasticsearchService.index).toHaveBeenCalledWith({
                index: 'companies',
                id: 'company-123',
                document: {
                    name: 'Test Company',
                    taxId: '1234567890',
                    city: 'Istanbul',
                    tenantId,
                },
            });
            expect(mockActivitiesService.log).toHaveBeenCalledWith({
                type: ActivityType.COMPANY_CREATED,
                title: 'Yeni şirket eklendi',
                description: 'Test Company sisteme kaydedildi',
                targetId: 'company-123',
                targetType: 'Company',
                tenantId,
            });
        });

        it('should still return company even if ES indexing fails', async () => {
            mockPrismaService.company.create.mockResolvedValue(createdCompany);
            mockElasticsearchService.index.mockRejectedValue(new Error('ES Error'));

            const result = await service.create(createCompanyDto, tenantId);

            expect(result).toEqual(createdCompany);
        });
    });

    describe('findAll', () => {
        it('should return all companies for a tenant', async () => {
            const companies = [
                { id: 'c1', name: 'Company 1', tenantId },
                { id: 'c2', name: 'Company 2', tenantId },
            ];
            mockPrismaService.company.findMany.mockResolvedValue(companies);

            const result = await service.findAll(tenantId);

            expect(result).toEqual(companies);
            expect(mockPrismaService.company.findMany).toHaveBeenCalledWith({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return a single company', async () => {
            const company = { id: 'company-123', name: 'Test', tenantId };
            mockPrismaService.company.findFirst.mockResolvedValue(company);

            const result = await service.findOne('company-123', tenantId);

            expect(result).toEqual(company);
            expect(mockPrismaService.company.findFirst).toHaveBeenCalledWith({
                where: { id: 'company-123', tenantId },
            });
        });

        it('should return null when company not found', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue(null);

            const result = await service.findOne('nonexistent', tenantId);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        const existingCompany = {
            id: 'company-123',
            name: 'Old Name',
            taxId: '111',
            tenantId,
        };

        const updatedCompany = {
            ...existingCompany,
            name: 'New Name',
        };

        it('should throw NotFoundException when company does not exist', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue(null);

            await expect(
                service.update('nonexistent', { name: 'New Name' }, tenantId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update company in DB and Elasticsearch', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue(existingCompany);
            mockPrismaService.$transaction.mockResolvedValue([{}, updatedCompany]);
            mockElasticsearchService.update.mockResolvedValue({});

            const result = await service.update(
                'company-123',
                { name: 'New Name' },
                tenantId,
            );

            expect(result).toEqual(updatedCompany);
            expect(mockElasticsearchService.update).toHaveBeenCalled();
            expect(mockActivitiesService.log).toHaveBeenCalledWith({
                type: ActivityType.COMPANY_UPDATED,
                title: 'Şirket güncellendi',
                description: 'New Name bilgileri güncellendi',
                targetId: 'company-123',
                targetType: 'Company',
                tenantId,
            });
        });
    });

    describe('remove', () => {
        const existingCompany = {
            id: 'company-123',
            name: 'Test Company',
            tenantId,
        };

        it('should throw NotFoundException when company does not exist', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue(null);

            await expect(service.remove('nonexistent', tenantId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should delete company from DB and Elasticsearch', async () => {
            mockPrismaService.company.findFirst.mockResolvedValue(existingCompany);
            mockPrismaService.company.deleteMany.mockResolvedValue({ count: 1 });
            mockElasticsearchService.delete.mockResolvedValue({});

            const result = await service.remove('company-123', tenantId);

            expect(result).toEqual(existingCompany);
            expect(mockPrismaService.company.deleteMany).toHaveBeenCalledWith({
                where: { id: 'company-123', tenantId },
            });
            expect(mockElasticsearchService.delete).toHaveBeenCalledWith({
                index: 'companies',
                id: 'company-123',
            });
            expect(mockActivitiesService.log).toHaveBeenCalledWith({
                type: ActivityType.COMPANY_DELETED,
                title: 'Şirket silindi',
                description: 'Test Company sistemden kaldırıldı',
                targetId: 'company-123',
                targetType: 'Company',
                tenantId,
            });
        });
    });

    describe('search', () => {
        it('should return empty array when query is empty', async () => {
            const result = await service.search('', tenantId);

            expect(result).toEqual([]);
            expect(mockElasticsearchService.search).not.toHaveBeenCalled();
        });

        it('should return search results from Elasticsearch', async () => {
            const esResponse = {
                hits: {
                    hits: [
                        { _source: { name: 'Company 1', taxId: '111', tenantId } },
                        { _source: { name: 'Company 2', taxId: '222', tenantId } },
                    ],
                },
            };
            mockElasticsearchService.search.mockResolvedValue(esResponse);

            const result = await service.search('Company', tenantId);

            expect(result).toEqual([
                { name: 'Company 1', taxId: '111', tenantId },
                { name: 'Company 2', taxId: '222', tenantId },
            ]);
        });
    });

    describe('syncAll', () => {
        it('should sync all companies to Elasticsearch', async () => {
            const companies = [
                { id: 'c1', name: 'Company 1', taxId: '111', city: 'Istanbul' },
                { id: 'c2', name: 'Company 2', taxId: '222', city: 'Ankara' },
            ];
            mockPrismaService.company.findMany.mockResolvedValue(companies);
            mockElasticsearchService.bulk.mockResolvedValue({ errors: false });

            const result = await service.syncAll(tenantId);

            expect(result).toEqual({ count: 2, success: true });
            expect(mockElasticsearchService.bulk).toHaveBeenCalled();
        });

        it('should handle empty company list', async () => {
            mockPrismaService.company.findMany.mockResolvedValue([]);

            const result = await service.syncAll(tenantId);

            expect(result).toEqual({ count: 0, success: true });
            expect(mockElasticsearchService.bulk).not.toHaveBeenCalled();
        });
    });
});
