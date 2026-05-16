import { Controller, Get, Param, Query } from '@nestjs/common';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Get('branches')
    async getBranches(@Query('region') region?: string) {
        if (region) {
            return this.logisticsService.findBranchesByRegion(region);
        }
        return this.logisticsService.findAllBranches();
    }

    @Get('branches/:id')
    async getBranchById(@Param('id') id: string) {
        return this.logisticsService.findBranchById(id);
    }

    @Get('locations/search')
    async searchLocations(@Query('q') query: string) {
        return this.logisticsService.searchLocations(query);
    }

    @Get('locations/:name/fee')
    async getDeliveryFee(@Param('name') name: string) {
        const fee = await this.logisticsService.calculateDeliveryFee(name);
        return { fee };
    }

    @Get('zones')
    async getZones() {
        return this.logisticsService.getAllZones();
    }
}
