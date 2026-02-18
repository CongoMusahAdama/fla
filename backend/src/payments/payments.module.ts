import { Module, forwardRef } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Withdrawal, WithdrawalSchema } from './schemas/withdrawal.schema';
import { UsersModule } from '../users/users.module';
import { WithdrawalService } from './withdrawal.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Withdrawal.name, schema: WithdrawalSchema }]),
        forwardRef(() => OrdersModule),
        forwardRef(() => UsersModule)
    ],
    controllers: [PaymentsController],
    providers: [PaystackService, WithdrawalService],
    exports: [PaystackService, WithdrawalService],
})
export class PaymentsModule { }
