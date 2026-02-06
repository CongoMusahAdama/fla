import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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

    @Get('admin/stats')
    getAdminStats() {
        return this.dashboardService.getAdminStats();
    }
}
