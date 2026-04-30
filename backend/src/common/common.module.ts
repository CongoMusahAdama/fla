import { Module, Global } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

@Global()
@Module({
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class CommonModule {}
