import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { UsersModule } from '../users/users.module';
import { WithdrawalService } from './withdrawal.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Withdrawal.name, schema: WithdrawalSchema }]),
        forwardRef(() => OrdersModule),
        forwardRef(() => UsersModule),
        SettingsModule
    ],
    controllers: [PaymentsController],
    providers: [WithdrawalService],
    exports: [WithdrawalService],
})
export class PaymentsModule { }
