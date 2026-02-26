import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        @InjectModel(Setting.name) private settingModel: Model<SettingDocument>
    ) { }

    async onModuleInit() {
        // Initialize default settings if they don't exist
        await this.ensureSetting('platform_commission', 10, 'Default platform commission percentage');
        await this.ensureSetting('withdrawal_minimum', 50, 'Minimum amount allowed for withdrawal');
        await this.ensureSetting('maintenance_mode', false, 'Whether the platform is in maintenance mode');
        await this.ensureSetting('automated_payouts', true, 'Whether payouts are automatically processed');
    }

    private async ensureSetting(key: string, defaultValue: any, description: string) {
        const existing = await this.settingModel.findOne({ key });
        if (!existing) {
            await this.settingModel.create({ key, value: defaultValue, description });
        }
    }

    async getSetting(key: string): Promise<any> {
        const setting = await this.settingModel.findOne({ key });
        return setting ? setting.value : null;
    }

    async setSetting(key: string, value: any) {
        return this.settingModel.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
    }

    async getAllSettings() {
        return this.settingModel.find().exec();
    }
}
