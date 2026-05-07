import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { Support, SupportSchema } from './schemas/support.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Support.name, schema: SupportSchema }]),
    NotificationsModule
  ],
  controllers: [SupportController],
  providers: [SupportService]
})
export class SupportModule { }
