import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types/request.types';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('admin')
  @Roles(Role.ADMIN)
  async runAdminAssistant(@Body() body: AiRequestDto, @Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant not found.');
    }
    return this.aiService.runAdminAssistant(body, tenantId);
  }
}
