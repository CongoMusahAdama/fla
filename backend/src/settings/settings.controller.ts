import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getAll() {
        const settings = await this.settingsService.getAllSettings();
        // Return as a key-value object for easier frontend use
        return settings.reduce((acc: Record<string, any>, curr: any) => {
            const key = curr.key;
            acc[key] = curr.value;
            return acc;
        }, {});
    }

    @Patch()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(@Body() updates: Record<string, any>) {
        const results: any[] = [];
        for (const [key, value] of Object.entries(updates)) {
            const result = await this.settingsService.setSetting(key, value);
            results.push(result);
        }
        return results;
    }
}
