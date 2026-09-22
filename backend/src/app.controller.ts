import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Lightweight probe for Render / uptime monitors */
  @SkipThrottle()
  @Get('health')
  health() {
    return { ok: true, service: 'fla-api', ts: new Date().toISOString() };
  }
}
