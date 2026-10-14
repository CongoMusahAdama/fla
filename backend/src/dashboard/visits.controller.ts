import { Body, Controller, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class VisitsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('visit')
  recordVisit(@Body() body: { visitorId?: string }) {
    return this.dashboardService.recordVisit(body?.visitorId);
  }
}
