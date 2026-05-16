import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogisticsBranch, LogisticsBranchDocument } from './schemas/logistics-branch.schema';
import { SkynetLocation, SkynetLocationDocument } from './schemas/skynet-location.schema';
import skynetData from './skynet-data.json';

@Injectable()
export class LogisticsService implements OnModuleInit {
    private readonly logger = new Logger(LogisticsService.name);

    private readonly ZONE_FEES = {
        'Zone 1': 30,
        'Zone 2': 45,
        'Zone 3': 65,
        'Zone 4': 85,
        'Zone 5': 120,
    };

    constructor(
        @InjectModel(LogisticsBranch.name)
        private branchModel: Model<LogisticsBranchDocument>,
        @InjectModel(SkynetLocation.name)
        private locationModel: Model<SkynetLocationDocument>,
    ) { }

    async onModuleInit() {
        await this.seedBranches();
        await this.seedSkynetLocations();
    }

    private async seedBranches() {
        const headOffice = await this.branchModel.findOne({ name: 'Head Office (Accra)' });
        if (headOffice) return;

        this.logger.log('Seeding initial Skynet branches (Full Nationwide Data)...');
        // Clear old placeholders if any
        await this.branchModel.deleteMany({});
        const initialBranches = [
            {
                name: 'Head Office (Accra)',
                region: 'Greater Accra',
                city: 'Accra',
                address: 'Ground floor, Adabla Plaza, Behind Challenge Bookshop, Kokomlemle',
                phone: '0302230516',
                email: 'p.norteye@skynetexpressgh.com',
                basePrice: 25,
            },
            {
                name: 'Kumasi Branch',
                region: 'Ashanti',
                city: 'Kumasi',
                address: '297 Hudson Road, Asokwa',
                phone: '0322005717',
                email: 'e.barimah@skynetexpressgh.com',
                basePrice: 40,
            },
            {
                name: 'Takoradi Branch',
                region: 'Western',
                city: 'Takoradi',
                address: 'GPRTU Building, Opp. Takoradi Airport, 1st floor, office number 57, Takoradi Top 10',
                phone: '0558151515',
                email: 'e.darkwa@skynetexpressgh.com',
                basePrice: 45,
            },
            {
                name: 'Tamale Branch',
                region: 'Northern',
                city: 'Tamale',
                address: 'Yamusah Building, 3rd floor, Gumbihini, 4th office',
                phone: '0558161616',
                email: 't.damte@skynetexpressgh.com',
                basePrice: 65,
            },
            {
                name: 'Tema Branch',
                region: 'Greater Accra',
                city: 'Tema',
                address: 'Community one, Adjacent Vodafone Office',
                phone: '0362195280',
                email: 'a.paintsil@skynetexpressgh.com',
                basePrice: 30,
            },
            {
                name: 'Cape Coast Branch',
                region: 'Central',
                city: 'Cape Coast',
                address: 'SSNIT Office Complex, Commercial Street',
                phone: '0302230516',
                email: 'j.osei@skynetexpressgh.com',
                basePrice: 40,
            },
            {
                name: 'Koforidua Branch',
                region: 'Eastern',
                city: 'Koforidua',
                address: 'SSNIT Office Complex Building, Ogua, 2nd floor',
                phone: '0352291442',
                email: 'e.safoa@skynetexpressgh.com',
                basePrice: 35,
            },
            {
                name: 'Sunyani Branch',
                region: 'Bono',
                city: 'Sunyani',
                address: 'SSNIT Building, 3rd floor, Area 1, Opp. The Post Office',
                phone: '0551004444',
                email: 'j.sanbir@skynetexpressgh.com',
                basePrice: 45,
            },
            {
                name: 'Wa Branch',
                region: 'Upper West',
                city: 'Wa',
                address: '2nd Floor, Stanbic Bank Building, Maase Road opposite the Societe Generale Bank',
                phone: '0303966467',
                email: 's.bulla@skynetexpressgh.com',
                basePrice: 65,
            },
            {
                name: 'Bolgatanga Branch',
                region: 'Upper East',
                city: 'Bolgatanga',
                address: 'SSNIT Office Complex, Bolgatanga',
                phone: '0541674712',
                email: 'z.issahaku@skynetexpressgh.com',
                basePrice: 70,
            },
            {
                name: 'Ho Branch',
                region: 'Volta',
                city: 'Ho',
                address: 'SSNIT Office Complex Building, Ho',
                phone: '0551002222',
                email: 's.nartey@skynetexpressgh.com',
                basePrice: 40,
            },
            {
                name: 'Tarkwa Branch',
                region: 'Western',
                city: 'Tarkwa',
                address: 'SSNIT Building, 1st Floor',
                phone: '0553906496',
                email: 'p.tibil@skynetexpressgh.com',
                basePrice: 50,
            }
        ];

        await this.branchModel.insertMany(initialBranches);
        this.logger.log(`Successfully seeded ${initialBranches.length} branches.`);
    }

    private async seedSkynetLocations() {
        const count = await this.locationModel.countDocuments();
        if (count > 0) return;

        this.logger.log('Seeding Skynet locations from data file...');
        
        const locationsToSeed = skynetData.map(loc => ({
            ...loc,
            deliveryFee: this.ZONE_FEES[loc.zone as keyof typeof this.ZONE_FEES] || 50
        }));

        try {
            await this.locationModel.insertMany(locationsToSeed, { ordered: false });
            this.logger.log(`Successfully seeded ${locationsToSeed.length} Skynet locations.`);
        } catch (error) {
            this.logger.warn(`Some locations might have failed to seed (likely duplicates): ${error.message}`);
        }
    }

    async findAllBranches() {
        return this.branchModel.find({ isAvailable: true }).sort({ region: 1, city: 1 });
    }

    async findBranchesByRegion(region: string) {
        return this.branchModel.find({ region, isAvailable: true }).sort({ city: 1 });
    }

    async findBranchById(id: string) {
        return this.branchModel.findById(id);
    }

    async searchLocations(query: string) {
        if (!query || query.length < 2) return [];
        
        return this.locationModel.find({
            name: { $regex: query, $options: 'i' },
            isActive: true
        }).limit(20).sort({ name: 1 });
    }

    async getLocationByName(name: string) {
        return this.locationModel.findOne({ name, isActive: true });
    }

    async calculateDeliveryFee(locationName: string) {
        const location = await this.getLocationByName(locationName);
        if (!location) return null;
        return location.deliveryFee;
    }

    async getAllZones() {
        return Object.keys(this.ZONE_FEES);
    }
}
