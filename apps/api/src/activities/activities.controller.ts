import { Controller, Get, Query, Req } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) { }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.activitiesService.findAll(
      req.user.tenantId,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
