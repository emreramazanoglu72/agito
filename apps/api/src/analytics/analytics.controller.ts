import { Controller, Get, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('dashboard')
  getDashboard(@Query('range') range: string | undefined, @Req() req: AuthenticatedRequest) {
    return this.analyticsService.getDashboard(range, req.user.tenantId);
  }
}
