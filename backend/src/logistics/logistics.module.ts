import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsBranch, LogisticsBranchSchema } from './schemas/logistics-branch.schema';
import { SkynetLocation, SkynetLocationSchema } from './schemas/skynet-location.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LogisticsBranch.name, schema: LogisticsBranchSchema },
            { name: SkynetLocation.name, schema: SkynetLocationSchema }
        ])
    ],
    providers: [LogisticsService],
    controllers: [LogisticsController],
    exports: [LogisticsService]
})
export class LogisticsModule { }
