import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { isVendorDocumented } from '../common/vendor-trust.util';

const VENDOR_POPULATE_FIELDS =
  'uniqueVendorId region location bio shopName status ghanaCardFront selfie isVerified isIdentityVerified verificationStatus kycApprovedAt';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  onModuleInit() {
    // Run the auto-archiver every hour
    setInterval(async () => {
      try {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        
        const result = await this.productModel.updateMany(
          {
            stock: { $lte: 0 },
            soldOutAt: { $lt: twoDaysAgo },
            isActive: true
          },
          {
            $set: { isActive: false }
          }
        ).exec();

        if (result.modifiedCount > 0) {
          this.logger.log(`Auto-archived ${result.modifiedCount} products that were sold out for over 48 hours.`);
        }
      } catch (err) {
        this.logger.error(`Error running auto-archiver: ${err.message}`);
      }
    }, 60 * 60 * 1000); // 1 hour interval
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  private mapProductForClient(p: any) {
    const vendor = p.vendorId && typeof p.vendorId === 'object' ? p.vendorId : null;
    if (!p.uniqueVendorId && vendor?.uniqueVendorId) {
      p.uniqueVendorId = vendor.uniqueVendorId;
    }
    if (!p.region && vendor?.region) {
      p.region = vendor.region;
    }
    if (!p.vendorLocation && vendor?.location) {
      p.vendorLocation = vendor.location;
    }
    if (!p.vendorBio && vendor?.bio) {
      p.vendorBio = vendor.bio;
    }
    if (!p.vendorName && vendor?.shopName) {
      p.vendorName = vendor.shopName;
    }
    p.vendorDocumented = isVendorDocumented(vendor);
    return p;
  }

  private async buildProductFilters(query: any): Promise<Record<string, unknown>> {
    const filters: Record<string, unknown> = {};

    if (query.showAll !== 'true') {
      filters.isActive = true;
    }

    if (query.category && query.category !== 'All Product' && query.category !== 'All') {
      filters.category = query.category;
    }

    if (query.filter === 'On Discount') {
      filters.originalPrice = { $exists: true, $gt: 0 };
    }

    if (query.isFeatured) {
      filters.isFeatured = query.isFeatured === 'true';
    }

    if (query.region) {
      filters.region = query.region;
    }

    if (query.search) {
      const matchingVendors = await this.userModel.find({
        role: 'vendor',
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { shopName: { $regex: query.search, $options: 'i' } },
          { businessName: { $regex: query.search, $options: 'i' } },
        ],
      }).select('_id').lean().exec();

      const matchingVendorIds = matchingVendors.map((v) => v._id);

      filters.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { vendorName: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { region: { $regex: query.search, $options: 'i' } },
        { vendorId: { $in: matchingVendorIds } },
      ];
    }

    if (query.vendorId) {
      filters.vendorId = query.vendorId;
    }

    return filters;
  }

  async findAll(query: any = {}): Promise<Product[] | {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const filters = await this.buildProductFilters(query);
    const paginate = query.page !== undefined && query.page !== '';

    let q = this.productModel.find(filters)
      .populate('vendorId', VENDOR_POPULATE_FIELDS)
      .lean();

    if (query.sort === 'latest' || query.filter === 'New Arrival') {
      q = q.sort({ createdAt: -1 });
    } else if (query.sort === 'best' || query.filter === 'Best Seller') {
      q = q.sort({ rating: -1, reviewCount: -1 });
    } else {
      q = q.sort({ createdAt: -1 });
    }

    if (paginate) {
      const page = Math.max(1, parseInt(String(query.page), 10) || 1);
      const pageSize = Math.min(48, Math.max(1, parseInt(String(query.limit), 10) || 12));
      const total = await this.productModel.countDocuments(filters).exec();
      const products = await q
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec() as any[];

      return {
        products: products.map((p) => this.mapProductForClient(p)),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    if (query.limit) {
      q = q.limit(parseInt(query.limit, 10));
    }

    const products = await q.exec() as any[];
    return products.map((p) => this.mapProductForClient(p));
  }

  async countAll(query: any = {}): Promise<number> {
    const filters: any = { isActive: true };
    if (query.category && query.category !== 'All Product') filters.category = query.category;
    if (query.region) filters.region = query.region;
    return this.productModel.countDocuments(filters).exec();
  }

  /** Total products in catalog (admin dashboard) */
  async countCatalog(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async findByVendor(vendorId: string): Promise<Product[]> {
    const products = await this.productModel.find({ vendorId: vendorId }).populate('vendorId', VENDOR_POPULATE_FIELDS).exec();
    return products.map(p => {
      const productObj = p.toObject();
      if (!productObj.uniqueVendorId && productObj.vendorId && (productObj.vendorId as any).uniqueVendorId) {
        productObj.uniqueVendorId = (productObj.vendorId as any).uniqueVendorId;
      }
      if (!productObj.region && productObj.vendorId && (productObj.vendorId as any).region) {
        productObj.region = (productObj.vendorId as any).region;
      }
      if (!productObj.vendorBio && productObj.vendorId && (productObj.vendorId as any).bio) {
        productObj.vendorBio = (productObj.vendorId as any).bio;
      }
      if (!productObj.vendorName && productObj.vendorId && (productObj.vendorId as any).shopName) {
        productObj.vendorName = (productObj.vendorId as any).shopName;
      }
      if (!productObj.vendorLocation && productObj.vendorId && (productObj.vendorId as any).location) {
        productObj.vendorLocation = (productObj.vendorId as any).location;
      }
      return productObj;
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).populate('vendorId', 'uniqueVendorId region location bio shopName').exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const productObj = product.toObject() as any;
    if (!productObj.uniqueVendorId && productObj.vendorId && (productObj.vendorId as any).uniqueVendorId) {
      productObj.uniqueVendorId = (productObj.vendorId as any).uniqueVendorId;
    }
    if (!productObj.region && productObj.vendorId && (productObj.vendorId as any).region) {
      productObj.region = (productObj.vendorId as any).region;
    }
    if (!productObj.vendorBio && productObj.vendorId && (productObj.vendorId as any).bio) {
      productObj.vendorBio = (productObj.vendorId as any).bio;
    }
    if (!productObj.vendorName && productObj.vendorId && (productObj.vendorId as any).shopName) {
      productObj.vendorName = (productObj.vendorId as any).shopName;
    }
    if (!productObj.vendorLocation && productObj.vendorId && (productObj.vendorId as any).location) {
      productObj.vendorLocation = (productObj.vendorId as any).location;
    }
    return productObj as any;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: any): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Ownership check: Only the vendor who created it or an admin can update
    if (user.role !== 'admin' && product.vendorId.toString() !== user.userId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    return updatedProduct as Product;
  }

  async remove(id: string, user: any): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Ownership check: Only the vendor who created it or an admin can delete
    if (user.role !== 'admin' && product.vendorId.toString() !== user.userId) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    return await this.productModel.findByIdAndDelete(id).exec() as any;
  }

  async getSuggestions(searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) return [];

    const productNames = await this.productModel
      .find({ 
        isActive: true,
        name: { $regex: searchTerm, $options: 'i' } 
      })
      .limit(5)
      .select('name')
      .exec();

    const vendorNames = await this.userModel
      .find({
        role: 'vendor',
        shopName: { $regex: searchTerm, $options: 'i' }
      })
      .limit(5)
      .select('shopName')
      .exec();

    // Map to simple structure and remove duplicates if any
    const suggestions = [
      ...productNames.map(p => ({ text: p.name, type: 'product' })),
      ...vendorNames.map(v => ({ text: v.shopName, type: 'vendor' }))
    ];

    // Remove potential duplicates (e.g. product name same as vendor name)
    const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.text)))
      .map(text => suggestions.find(s => s.text === text));

    return uniqueSuggestions;
  }

  async findGroupedByVendor(): Promise<any[]> {
    return this.productModel.aggregate([
      { $match: { isActive: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$vendorId',
          vendorName: { $first: '$vendorName' },
          uniqueVendorId: { $first: '$uniqueVendorId' },
          region: { $first: '$region' },
          products: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          vendorId: '$_id',
          vendorName: 1,
          uniqueVendorId: 1,
          region: 1,
          products: { $slice: ['$products', 9] }
        }
      },
      { $limit: 20 }
    ]).exec();
  }
}
