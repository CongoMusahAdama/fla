import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { FLA_CONSTANTS } from '../common/constants';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        @InjectModel(Setting.name) private settingModel: Model<SettingDocument>
    ) { }

    async onModuleInit() {
        // Initialize default settings if they don't exist
        await this.ensureSetting(
            'platform_commission',
            FLA_CONSTANTS.DEFAULT_COMMISSION_RATE,
            'Default platform commission percentage',
        );
        await this.ensureSetting('withdrawal_minimum', 50, 'Minimum amount allowed for withdrawal');
        await this.ensureSetting('maintenance_mode', false, 'Whether the platform is in maintenance mode');
        await this.ensureSetting('automated_payouts', true, 'Whether payouts are automatically processed');
        await this.ensureSetting('vendor_auto_approval', false, 'Whether vendors are automatically approved after registration');
        await this.ensureSetting(
            'product_categories',
            [
                'Electronics',
                'Home goods',
                'Kitchen',
                'Beauty/cosmetics',
                'Accessories',
                'Clothing',
                'Shoes',
                'Bags',
                'Used items',
                'Wholesaler',
                'For men',
                'For women',
                'Children/Toys',
                'Furniture',
                'Food/beverages',
                'Hardware items',
                'Building materials',
                'Refurbished items',
                'Unisex',
            ],
            'Product categories shown in shop filters and vendor product forms',
        );

        // Migrate legacy default 6% → 3% only when still on the old seed value
        const commission = await this.settingModel.findOne({ key: 'platform_commission' }).exec();
        if (commission && Number(commission.value) === 6) {
            commission.value = FLA_CONSTANTS.DEFAULT_COMMISSION_RATE;
            await commission.save();
        }
    }

    private async ensureSetting(key: string, defaultValue: any, description: string) {
        const existing = await this.settingModel.findOne({ key }).exec();
        if (!existing) {
            await this.settingModel.create({ key, value: defaultValue, description });
        }
    }

    async getSetting(key: string): Promise<any> {
        const setting = await this.settingModel.findOne({ key }).exec();
        return setting ? setting.value : null;
    }

    async setSetting(key: string, value: any) {
        let next = value;
        if (key === 'product_categories') {
            const list = Array.isArray(value) ? value : [];
            const seen = new Set<string>();
            next = [];
            for (const item of list) {
                const s = String(item ?? '').trim();
                if (!s || s.toLowerCase() === 'all product' || s.toLowerCase() === 'all') continue;
                const k = s.toLowerCase();
                if (seen.has(k)) continue;
                seen.add(k);
                next.push(s);
            }
            if (!next.length) {
                next = await this.getSetting('product_categories');
            }
        }
        return this.settingModel.findOneAndUpdate(
            { key },
            { value: next },
            { upsert: true, new: true }
        ).exec();
    }

    async getAllSettings() {
        return this.settingModel.find().exec();
    }
}
