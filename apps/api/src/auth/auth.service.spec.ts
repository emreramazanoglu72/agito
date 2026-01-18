import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    const mockPrismaService = {
        tenant: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        company: {
            create: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const mockActivitiesService = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ActivitiesService, useValue: mockActivitiesService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        const mockTenant = {
            id: 'tenant-123',
            name: 'Test Company',
            domain: 'test.com',
            isActive: true,
        };

        const mockUser = {
            id: 'user-123',
            email: 'test@test.com',
            passwordHash: 'hashed-password',
            role: 'HR_MANAGER',
            isActive: true,
        };

        it('should throw UnauthorizedException when email is empty', async () => {
            await expect(
                service.login({ email: '', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when password is empty', async () => {
            await expect(
                service.login({ email: 'test@test.com', password: '' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when email has no domain', async () => {
            await expect(
                service.login({ email: 'invalid-email', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when tenant not found', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(null);

            await expect(
                service.login({ email: 'test@test.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when user not found', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
            mockPrismaService.user.findFirst.mockResolvedValue(null);

            await expect(
                service.login({ email: 'test@test.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when password is invalid', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
            mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                service.login({ email: 'test@test.com', password: 'wrong-password' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should return tokens and user info on successful login', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
            mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
            mockPrismaService.refreshToken.create.mockResolvedValue({});
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login({
                email: 'test@test.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.role).toBe('HR_MANAGER');
            expect(result.tenantId).toBe('tenant-123');
            expect(result.tenantName).toBe('Test Company');
            expect(jwtService.sign).toHaveBeenCalled();
        });

        it('should normalize email to lowercase', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
            mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
            mockPrismaService.refreshToken.create.mockResolvedValue({});
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await service.login({
                email: 'TEST@TEST.COM',
                password: 'password123',
            });

            expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
                where: {
                    email: 'test@test.com',
                    tenantId: 'tenant-123',
                    isActive: true,
                },
            });
        });
    });

    describe('refresh', () => {
        it('should throw UnauthorizedException when refresh token is empty', async () => {
            await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token not found', async () => {
            mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

            await expect(service.refresh('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when token is revoked', async () => {
            mockPrismaService.refreshToken.findUnique.mockResolvedValue({
                revokedAt: new Date(),
                user: { isActive: true },
                tenant: { isActive: true },
            });

            await expect(service.refresh('revoked-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when token is expired', async () => {
            mockPrismaService.refreshToken.findUnique.mockResolvedValue({
                revokedAt: null,
                expiresAt: new Date(Date.now() - 1000),
                user: { isActive: true },
                tenant: { isActive: true },
            });

            await expect(service.refresh('expired-token')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('logout', () => {
        it('should not throw when refresh token is empty', async () => {
            await expect(service.logout('')).resolves.not.toThrow();
        });

        it('should revoke the refresh token', async () => {
            mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

            await service.logout('valid-token');

            expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
        });
    });

    describe('register', () => {
        const validPayload = {
            email: 'new@newcompany.com',
            password: 'password123',
            companyName: 'New Company',
            taxNumber: '1234567890',
            contactName: 'John Doe',
        };

        it('should throw BadRequestException when required fields are missing', async () => {
            await expect(
                service.register({
                    email: '',
                    password: 'password123',
                    companyName: 'Test',
                    taxNumber: '123',
                    contactName: 'John',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when email domain is invalid', async () => {
            await expect(
                service.register({
                    ...validPayload,
                    email: 'invalid-email',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException when tenant already exists', async () => {
            mockPrismaService.tenant.findUnique.mockResolvedValue({ id: 'existing' });

            await expect(service.register(validPayload)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw ConflictException when user already exists', async () => {
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

            await expect(service.register(validPayload)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should create tenant, user, and company on successful registration', async () => {
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.create.mockResolvedValue({
                id: 'new-tenant',
                name: 'New Company',
            });
            mockPrismaService.user.create.mockResolvedValue({
                id: 'new-user',
                email: 'new@newcompany.com',
                role: 'HR_MANAGER',
            });
            mockPrismaService.company.create.mockResolvedValue({
                id: 'new-company',
                name: 'New Company',
            });
            mockPrismaService.refreshToken.create.mockResolvedValue({});
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

            const result = await service.register(validPayload);

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.role).toBe('HR_MANAGER');
            expect(mockPrismaService.tenant.create).toHaveBeenCalled();
            expect(mockPrismaService.user.create).toHaveBeenCalled();
            expect(mockPrismaService.company.create).toHaveBeenCalled();
            expect(mockActivitiesService.log).toHaveBeenCalled();
        });
    });
});
