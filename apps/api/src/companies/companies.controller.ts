import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { updateCompanySchema } from './dto/update-company.schema';
import { parseWithSchema } from '../utils/zod';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Req() req: AuthenticatedRequest) {
    return this.companiesService.create(createCompanyDto, req.user.tenantId);
  }

  @Post('sync')
  sync(@Req() req: AuthenticatedRequest) {
    return this.companiesService.syncAll(req.user.tenantId);
  }

  @Get('search')
  search(@Query('q') query: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.search(query, req.user.tenantId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.companiesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: unknown,
    @Req() req: AuthenticatedRequest,
  ) {
    const payload = parseWithSchema(updateCompanySchema, updateCompanyDto);
    return this.companiesService.update(
      id,
      payload,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.remove(id, req.user.tenantId);
  }
}
