import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UnauthorizedException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('count')
  getCount(@Query() query: any) {
    return this.productsService.countAll(query);
  }

  @Get('suggestions')
  getSuggestions(@Query('search') search: string) {
    return this.productsService.getSuggestions(search);
  }

  @Get('grouped')
  findGroupedByVendor() {
    return this.productsService.findGroupedByVendor();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      throw new UnauthorizedException('Unauthorized - Only vendors can create products');
    }
    // Set the vendorId to the current user's ID
    createProductDto.vendorId = req.user.userId;
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(@Query() query: any, @Res({ passthrough: true }) res: Response) {
    // Cache public product listings for 30s (huge improvement for repeat visitors)
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user);
  }
}
