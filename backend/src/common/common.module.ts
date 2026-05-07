import { Module, Global } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';
import { SmileIdService } from './smileid.service';

@Global()
@Module({
  providers: [TurnstileService, SmileIdService],
  exports: [TurnstileService, SmileIdService],
})
export class CommonModule {}
