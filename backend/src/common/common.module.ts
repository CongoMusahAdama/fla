import { Module, Global } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';
import { SmileIdService } from './smileid.service';
import { SmsService } from './sms.service';
import { StreamService } from './stream.service';
import { PaystackService } from './paystack.service';
import { ShuftiService } from './shufti.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TempVerification, TempVerificationSchema } from './schemas/temp-verification.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: TempVerification.name, schema: TempVerificationSchema }])
  ],
  providers: [TurnstileService, SmileIdService, SmsService, StreamService, PaystackService, ShuftiService],
  exports: [TurnstileService, SmileIdService, SmsService, StreamService, PaystackService, ShuftiService, MongooseModule],
})
export class CommonModule {}
