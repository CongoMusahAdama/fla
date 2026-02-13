import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('customer/stats')
    getCustomerStats(@Request() req) {
        return this.dashboardService.getCustomerStats(req.user.userId);
    }

    @Get('vendor/stats')
    getVendorStats(@Request() req) {
        return this.dashboardService.getVendorStats(req.user.userId);
    }

    @Post('vendor/withdraw')
    async withdraw(@Request() req, @Body() body: { amount: number }) {
        return this.dashboardService.requestWithdrawal(req.user.userId, body.amount);
    }

    @Get('admin/stats')
    getAdminStats() {
        return this.dashboardService.getAdminStats();
    }
}
