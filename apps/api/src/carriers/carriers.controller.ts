import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.carriersService.findAll(includeInactive !== 'false');
  }

  @Post()
  create(@Body() body: CreateCarrierDto) {
    return this.carriersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCarrierDto) {
    return this.carriersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carriersService.remove(id);
  }
}
