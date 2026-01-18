import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(
    @Req()
    req: {
      user: { userId: string; email: string; role: string; tenantId: string };
    },
  ) {
    return this.usersService.findOne(req.user.userId, req.user.tenantId);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  updateProfile(
    @Req() req: { user: { userId: string; tenantId: string } },
    @Body() body: { name?: string; email?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(
      req.user.userId,
      req.user.tenantId,
      body,
      file,
    );
  }

  @Post('change-password')
  changePassword(
    @Req() req: { user: { userId: string; tenantId: string } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.userId,
      req.user.tenantId,
      body.currentPassword,
      body.newPassword,
    );
  }
}
