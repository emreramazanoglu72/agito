import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentFilterDto } from './dto/department-filter.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.departmentsService.create(
      createDepartmentDto,
      req.user.tenantId,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() filter: DepartmentFilterDto) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.departmentsService.findAll(req.user.tenantId, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.departmentsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.departmentsService.update(
      id,
      updateDepartmentDto,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.departmentsService.remove(id, req.user.tenantId);
  }
}
