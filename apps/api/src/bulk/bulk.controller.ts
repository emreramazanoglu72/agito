import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkService } from './bulk.service';
import { CreateBulkOperationDto } from './dto/create-bulk.dto';

@Controller('bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateBulkOperationDto,
    @Req() req: any,
  ) {
    // In real app: Validate file type (Excel)
    return this.bulkService.startBulkJob(file, body, req.user?.tenantId);
  }

  @Post(':id/commit')
  async commit(
    @Param('id') id: string,
    @Body() body: { mappings: any },
    @Req() req: any,
  ) {
    return this.bulkService.commitBulkJob(
      id,
      body.mappings,
      req.user?.tenantId,
    );
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Req() req: any) {
    return this.bulkService.getJobStatus(id, req.user?.tenantId);
  }
}
