import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Billboard, BillboardSchema } from './schemas/billboard.schema';
import { BillboardsService } from './billboards.service';
import { BillboardsController } from './billboards.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billboard.name, schema: BillboardSchema }]),
    AuthModule,
  ],
  controllers: [BillboardsController],
  providers: [BillboardsService],
  exports: [BillboardsService],
})
export class BillboardsModule {}
