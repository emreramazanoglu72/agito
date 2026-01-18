import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string,
    @Query('policyId') policyId?: string,
    @Query('kind') kind?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.documentsService.findAll(req.user.tenantId, {
      employeeId,
      policyId,
      kind,
      search,
      category,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      kind: 'policy' | 'employee';
      policyId?: string;
      employeeId?: string;
      documentType?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.documentsService.uploadDocument(req.user.tenantId, body, file);
  }
}
