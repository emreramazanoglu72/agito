import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }
    return this.paymentsService.findAll(req.user.tenantId, query);
  }

  @Post(':id/remind')
  sendReminder(@Param('id') id: string) {
    return this.paymentsService.sendReminder(id);
  }
}
