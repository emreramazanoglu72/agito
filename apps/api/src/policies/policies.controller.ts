import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyFilterDto } from './dto/policy-filter.dto';
import { AssignPolicyDto } from './dto/assign-policy.dto';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) { }

  @Post()
  create(@Body() createPolicyDto: CreatePolicyDto, @Req() req: AuthenticatedRequest) {
    return this.policiesService.create(createPolicyDto, req.user.tenantId);
  }

  @Get()
  findAll(@Query() filterDto: PolicyFilterDto, @Req() req: AuthenticatedRequest) {
    return this.policiesService.findAll(filterDto, req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.policiesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: AssignPolicyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.policiesService.assignPolicy(
      id,
      body.employeeId,
      req.user.tenantId,
    );
  }
}
