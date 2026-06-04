import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private assertAdmin(req: { user?: { role?: string } }) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  private assertAdminOrSelf(req: { user?: { role?: string; userId?: string } }, targetId: string) {
    if (req.user?.role === 'admin') return;
    if (req.user?.userId === targetId) return;
    throw new ForbiddenException('You do not have permission to access this user');
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req, @Body() createUserDto: CreateUserDto) {
    this.assertAdmin(req);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Request() req) {
    this.assertAdmin(req);
    return this.usersService.findAll();
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard('jwt'))
  findPending(@Request() req) {
    this.assertAdmin(req);
    return this.usersService.findPendingVendors();
  }

  @Get('admin/kyc')
  @UseGuards(AuthGuard('jwt'))
  findKycRecords(
    @Request() req,
    @Query('status') status?: 'pending' | 'active' | 'rejected' | 'banned' | 'all',
  ) {
    this.assertAdmin(req);
    return this.usersService.findKycVendors(status || 'all');
  }

  /** Public vendor storefront profile */
  @Get('vendor/:id/profile')
  getVendorProfile(@Param('id') id: string) {
    return this.usersService.getPublicVendorProfile(id);
  }

  @Post('admin/resync-paystack-splits')
  @UseGuards(AuthGuard('jwt'))
  resyncPaystackSplits(@Request() req) {
    this.assertAdmin(req);
    return this.usersService.resyncAllVendorPaystackSplits();
  }

  @Patch('admin/:id/status')
  @UseGuards(AuthGuard('jwt'))
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'rejected' | 'pending' | 'banned' },
  ) {
    this.assertAdmin(req);
    return this.usersService.updateStatus(id, body.status);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Request() req, @Param('id') id: string) {
    this.assertAdminOrSelf(req, id);
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.assertAdminOrSelf(req, id);
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Request() req, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.usersService.remove(id);
  }
}
