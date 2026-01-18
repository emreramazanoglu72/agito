import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from './dto/employee.schemas';
import { parseWithSchema } from '../utils/zod';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  create(@Body() createEmployeeDto: unknown, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    const payload = parseWithSchema(createEmployeeSchema, createEmployeeDto);
    return this.employeesService.create(payload, req.user.tenantId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() filter: EmployeeFilterDto) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.employeesService.findAll(req.user.tenantId, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.employeesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    const payload = parseWithSchema(updateEmployeeSchema, updateEmployeeDto);
    return this.employeesService.update(
      id,
      payload,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.employeesService.remove(id, req.user.tenantId);
  }
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.employeesService.uploadDocument(id, file, req.user.tenantId);
  }
}
