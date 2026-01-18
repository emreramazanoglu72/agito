import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { R2Service } from '../storage/r2.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private configService: ConfigService,
  ) {}

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(
    id: string,
    tenantId: string,
    data: { name?: string; email?: string },
    avatar?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found');
    }

    let avatarUrl: string | undefined = undefined;
    if (avatar) {
      const key = await this.r2Service.uploadFile(avatar);
      avatarUrl = `${this.configService.get('R2_PUBLIC_URL')}/${key}`;
    }

    const dataToUpdate = {
      name: data.name,
      email: data.email,
      ...(avatarUrl && { avatarUrl }),
    };

    await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: dataToUpdate,
    });

    const updated = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  async changePassword(
    id: string,
    tenantId: string,
    currentPass: string,
    newPass: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(currentPass, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);

    await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { passwordHash },
    });

    return { success: true };
  }
}
