import { Body, Controller, Get, Param, Patch, Post, Delete, Query } from '@nestjs/common';
import { InsurancePackagesService } from './insurance-packages.service';
import { CreateInsurancePackageDto } from './dto/create-insurance-package.dto';
import { UpdateInsurancePackageDto } from './dto/update-insurance-package.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class InsurancePackagesController {
  constructor(private readonly packagesService: InsurancePackagesService) {}

  @Get('packages')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.packagesService.findAll(includeInactive !== 'false');
  }

  @Public()
  @Get('public/packages')
  findPublic() {
    return this.packagesService.findAll(false);
  }

  @Post('packages')
  create(@Body() body: CreateInsurancePackageDto) {
    return this.packagesService.create(body);
  }

  @Patch('packages/:id')
  update(@Param('id') id: string, @Body() body: UpdateInsurancePackageDto) {
    return this.packagesService.update(id, body);
  }

  @Delete('packages/:id')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
