import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { PolicyTypesService } from './policy-types.service';
import { CreatePolicyTypeDto } from './dto/create-policy-type.dto';
import { UpdatePolicyTypeDto } from './dto/update-policy-type.dto';

@Controller('policy-types')
export class PolicyTypesController {
  constructor(private readonly policyTypesService: PolicyTypesService) {}

  @Post()
  create(
    @Body() createPolicyTypeDto: CreatePolicyTypeDto,
    @Headers('x-tenant-id')
    tenantId: string = '11111111-1111-1111-1111-111111111111',
  ) {
    // Fallback tenantId for dev/testing if not using proper auth guard extraction
    return this.policyTypesService.create(createPolicyTypeDto, tenantId);
  }

  @Get()
  findAll(
    @Headers('x-tenant-id')
    tenantId: string = '11111111-1111-1111-1111-111111111111',
  ) {
    return this.policyTypesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-tenant-id')
    tenantId: string = '11111111-1111-1111-1111-111111111111',
  ) {
    return this.policyTypesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePolicyTypeDto: UpdatePolicyTypeDto,
    @Headers('x-tenant-id')
    tenantId: string = '11111111-1111-1111-1111-111111111111',
  ) {
    return this.policyTypesService.update(id, updatePolicyTypeDto, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-tenant-id')
    tenantId: string = '11111111-1111-1111-1111-111111111111',
  ) {
    return this.policyTypesService.remove(id, tenantId);
  }
}
