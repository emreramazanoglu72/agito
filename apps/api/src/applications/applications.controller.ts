import { Body, Controller, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateApplicationUpdateDto } from './dto/create-application-update.dto';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateApplicationDto) {
    return this.applicationsService.create(
      req.user.tenantId,
      body,
      req.user.email,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.applicationsService.findAll({
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.applicationsService.findOne(id, {
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateApplicationDto) {
    return this.applicationsService.updateStatus(id, body, {
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.applicationsService.uploadDocument(req.user.tenantId, id, file);
  }

  @Post(':id/updates')
  addUpdate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateApplicationUpdateDto,
  ) {
    return this.applicationsService.addUpdate(req.user.tenantId, id, body.message);
  }
}
