import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('support/tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) { }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateSupportTicketDto) {
    return this.supportTicketsService.create(
      req.user.tenantId,
      req.user.email,
      body,
    );
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.supportTicketsService.findAll({
      role: req.user.role || 'EMPLOYEE',
      tenantId: req.user.tenantId,
      page,
      limit,
      status,
      search,
    });
  }

  @Patch(':id')
  updateStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateSupportTicketDto) {
    return this.supportTicketsService.updateStatus(
      id,
      { role: req.user.role || 'EMPLOYEE', tenantId: req.user.tenantId },
      body,
    );
  }
}
