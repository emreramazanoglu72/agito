import { Controller, Get, Param, Patch, Query, Req, Body, Post } from '@nestjs/common';
import { CorporatePoliciesService } from './corporate-policies.service';
import { UpdateCorporatePolicyDto } from './dto/update-corporate-policy.dto';
import { ActivateCorporatePolicyDto } from './dto/activate-corporate-policy.dto';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('corporate-policies')
export class CorporatePoliciesController {
  constructor(private readonly corporatePoliciesService: CorporatePoliciesService) { }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.corporatePoliciesService.findAll({
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
      status,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.corporatePoliciesService.findOne(id, {
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateCorporatePolicyDto,
  ) {
    return this.corporatePoliciesService.update(id, body, {
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }

  @Post(':id/activate')
  activate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ActivateCorporatePolicyDto,
  ) {
    return this.corporatePoliciesService.activate(id, body, {
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
    });
  }
}
