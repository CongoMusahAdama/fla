import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillboardsService } from './billboards.service';
import { CreateBillboardDto } from './dto/create-billboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('billboards')
export class BillboardsController {
  constructor(private readonly billboardsService: BillboardsService) {}

  /** Public: currently scheduled hero ads */
  @Get('active')
  findActive(@Query('slot') slot?: string) {
    const normalized =
      slot === 'hero_main' || slot === 'hero_side' ? slot : undefined;
    return this.billboardsService.findActive(normalized);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.billboardsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() body: CreateBillboardDto) {
    return this.billboardsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateBillboardDto>) {
    return this.billboardsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billboardsService.remove(id);
  }
}
