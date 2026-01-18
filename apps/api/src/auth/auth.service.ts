import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) { }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createRefreshToken(userId: string, tenantId: string) {
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        tenantId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async login(user: { email: string; password: string }) {
    const email = String(user.email || '')
      .trim()
      .toLowerCase();
    const password = String(user.password || '');
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const domain = email.split('@')[1];
    if (!domain) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { domain, isActive: true },
    });
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email, tenantId: tenant.id, isActive: true },
    });
    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: existingUser.email,
      role: existingUser.role,
      tenantId: tenant.id,
      sub: existingUser.id,
    };
    const refreshToken = await this.createRefreshToken(
      existingUser.id,
      tenant.id,
    );

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      role: existingUser.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true, tenant: true },
    });

    if (
      !record ||
      record.revokedAt ||
      record.expiresAt < new Date() ||
      !record.user?.isActive ||
      !record.tenant?.isActive
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const payload = {
      email: record.user.email,
      role: record.user.role,
      tenantId: record.tenantId,
      sub: record.userId,
    };

    const nextRefreshToken = await this.createRefreshToken(
      record.userId,
      record.tenantId,
    );

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: nextRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async register(payload: RegisterDto) {
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const companyName = String(payload.companyName || '').trim();
    const taxNumber = String(payload.taxNumber || '').trim();
    const contactName = String(payload.contactName || '').trim();

    if (!email || !password || !companyName || !taxNumber || !contactName) {
      throw new BadRequestException('Missing required fields');
    }

    const domain = email.split('@')[1];
    if (!domain) {
      throw new BadRequestException('Invalid email domain');
    }

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { domain },
    });
    if (existingTenant) {
      throw new ConflictException('Tenant already exists');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: companyName,
        domain,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'HR_MANAGER',
        name: contactName,
        tenantId: tenant.id,
      },
    });

    const company = await this.prisma.company.create({
      data: {
        name: companyName,
        taxId: taxNumber,
        tenantId: tenant.id,
      },
    });

    await this.activitiesService.log({
      type: 'COMPANY_CREATED',
      title: 'Yeni kurumsal hesap olusturuldu',
      description: `${companyName} sisteme kaydedildi.`,
      userId: user.id,
      userName: contactName,
      targetId: company.id,
      targetType: 'Company',
      tenantId: tenant.id,
    });

    const refreshToken = await this.createRefreshToken(user.id, tenant.id);
    const tokenPayload = {
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(tokenPayload),
      refresh_token: refreshToken,
      role: user.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
    };
  }
}
