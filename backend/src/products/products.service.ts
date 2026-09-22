import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { isVendorDocumented } from '../common/vendor-trust.util';
import { normalizeProductStockPayload } from './product-stock.util';
import { TtlCache } from '../common/ttl-cache.util';

const VENDOR_POPULATE_FIELDS =
  'uniqueVendorId region location bio shopName vendorTier businessRegistration businessRegistrationApprovedAt businessRegistrationSubmittedAt storeSlug';

/** Match frontend `NEW_ARRIVAL_MAX_AGE_DAYS` in src/lib/product-freshness.ts */
const NEW_ARRIVAL_MAX_AGE_DAYS = 30;

/** Same search/browse query → reuse result briefly (helps 100 people searching the same term). */
const CATALOG_CACHE_TTL_MS = 12_000;
const SUGGESTIONS_CACHE_TTL_MS = 20_000;

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);
  private readonly catalogCache = new TtlCache<any>(CATALOG_CACHE_TTL_MS, 250);
  private readonly suggestionsCache = new TtlCache<any[]>(SUGGESTIONS_CACHE_TTL_MS, 150);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  private bustPublicCaches() {
    this.catalogCache.clear();
    this.suggestionsCache.clear();
  }

  private catalogCacheKey(query: Record<string, unknown>): string | null {
    // Never cache admin/vendor inventory (showAll) — freshness matters more there.
    if (query.showAll === 'true') return null;
    const keys = [
      'page', 'limit', 'sort', 'filter', 'category', 'region', 'search',
      'minPrice', 'maxPrice', 'priceLt', 'priceGt', 'vendorId', 'isFeatured',
    ];
    const parts: string[] = [];
    for (const k of keys) {
      const v = query[k];
      if (v !== undefined && v !== null && v !== '') parts.push(`${k}=${String(v)}`);
    }
    return parts.sort().join('&') || 'default';
  }

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
    const payload = normalizeProductStockPayload(createProductDto as any);
    const createdProduct = new this.productModel(payload);
    const saved = await createdProduct.save();
    this.bustPublicCaches();
    return saved;
  }

  private mapProductForClient(p: any, options?: { listView?: boolean }) {
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
    if (!p.storeSlug && vendor?.storeSlug) {
      p.storeSlug = vendor.storeSlug;
    }
    // List views skip full populate under load — trust badge comes from a batched vendor lookup.
    if (vendor) {
      p.vendorDocumented = isVendorDocumented(vendor);
      p.vendorTier = isVendorDocumented(vendor) ? 'high' : (vendor.vendorTier === 'high' ? 'high' : 'low');
    } else if (p.vendorDocumented == null) {
      p.vendorDocumented = p.vendorTier === 'high';
    }
    // List payloads: keep first image only to cut JSON + bandwidth
    if (options?.listView && Array.isArray(p.images) && p.images.length > 1) {
      p.images = p.images.slice(0, 1);
    }
    return p;
  }

  /** One lean query for all vendors on a product page — keeps badges correct without N populates. */
  private async attachVendorTrust(products: any[]): Promise<any[]> {
    if (!products.length) return products;
    const ids = [
      ...new Set(
        products
          .map((p) => {
            const v = p.vendorId;
            if (!v) return '';
            if (typeof v === 'object') return String(v._id || v.id || '');
            return String(v);
          })
          .filter(Boolean),
      ),
    ];
    if (!ids.length) return products.map((p) => this.mapProductForClient(p, { listView: true }));

    const vendors = await this.userModel
      .find({ _id: { $in: ids } })
      .select(
        'uniqueVendorId region location bio shopName vendorTier businessRegistration businessRegistrationApprovedAt businessRegistrationSubmittedAt storeSlug',
      )
      .lean()
      .exec();
    const byId = new Map(vendors.map((v: any) => [String(v._id), v]));

    return products.map((p) => {
      const rawId =
        typeof p.vendorId === 'object' && p.vendorId
          ? String(p.vendorId._id || p.vendorId.id || '')
          : String(p.vendorId || '');
      const vendor = byId.get(rawId);
      return this.mapProductForClient({ ...p, vendorId: vendor || p.vendorId }, { listView: true });
    });
  }

  private async buildProductFilters(query: any): Promise<Record<string, unknown>> {
    const filters: Record<string, unknown> = {};

    if (query.showAll !== 'true') {
      filters.isActive = true;
      filters.stock = { $gt: 0 };
    }

    if (query.category && query.category !== 'All Product' && query.category !== 'All') {
      filters.category = query.category;
    }

    if (query.filter === 'On Discount') {
      filters.originalPrice = { $exists: true, $gt: 0 };
    }

    if (query.filter === 'New Arrival') {
      const since = new Date(Date.now() - NEW_ARRIVAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
      filters.createdAt = { $gte: since };
    }

    if (query.isFeatured) {
      filters.isFeatured = query.isFeatured === 'true';
    }

    if (query.region) {
      filters.region = query.region;
    }

    if (query.search) {
      const term = String(query.search).trim().slice(0, 120);
      if (term.length >= 2) {
        filters.$text = { $search: term };
      }
    }

    if (query.vendorId) {
      filters.vendorId = query.vendorId;
    }

    const price: Record<string, number> = {};
    if (query.minPrice !== undefined && query.minPrice !== '') {
      const min = parseFloat(String(query.minPrice));
      if (!Number.isNaN(min)) price.$gte = min;
    }
    if (query.maxPrice !== undefined && query.maxPrice !== '') {
      const max = parseFloat(String(query.maxPrice));
      if (!Number.isNaN(max)) price.$lte = max;
    }
    if (query.priceLt !== undefined && query.priceLt !== '') {
      const lt = parseFloat(String(query.priceLt));
      if (!Number.isNaN(lt)) price.$lt = lt;
    }
    if (query.priceGt !== undefined && query.priceGt !== '') {
      const gt = parseFloat(String(query.priceGt));
      if (!Number.isNaN(gt)) price.$gt = gt;
    }
    if (Object.keys(price).length > 0) {
      filters.price = price;
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
    const cacheKey = this.catalogCacheKey(query);
    if (cacheKey) {
      const cached = this.catalogCache.get(cacheKey);
      if (cached !== undefined) return cached;
    }

    const filters = await this.buildProductFilters(query);
    const paginate = query.page !== undefined && query.page !== '';

    // List/search: no populate — denormalized vendor fields on the product cut Mongo load
    // when many shoppers hit the same query at once (load-balancer friendly).
    let q = this.productModel.find(filters)
      .select(
        'name price images imageLabels sizes stock colorStock sizeStock variantStock vendorId vendorName uniqueVendorId description hasSizes hasColors colors tailoringTime region vendorLocation vendorBio vendorTier storeSlug category rating reviewCount originalPrice isFeatured createdAt isActive',
      )
      .lean();

    if (query.sort === 'latest' || query.filter === 'New Arrival') {
      q = q.sort({ createdAt: -1 });
    } else if (query.sort === 'best' || query.filter === 'Best Seller') {
      q = q.sort({ rating: -1, reviewCount: -1 });
    } else {
      q = q.sort({ createdAt: -1 });
    }

    let result: Product[] | {
      products: Product[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };

    if (paginate) {
      const page = Math.max(1, parseInt(String(query.page), 10) || 1);
      const maxPageSize = query.showAll === 'true' ? 100 : 48;
      const defaultPageSize = query.showAll === 'true' ? 24 : 12;
      const pageSize = Math.min(
        maxPageSize,
        Math.max(1, parseInt(String(query.limit), 10) || defaultPageSize),
      );
      const total = await this.productModel.countDocuments(filters).exec();
      const products = await q
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec() as any[];

      result = {
        products: await this.attachVendorTrust(products),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    } else {
      const unpaginatedCap = Math.min(48, Math.max(1, parseInt(String(query.limit), 10) || 48));
      q = q.limit(unpaginatedCap);
      const products = await q.exec() as any[];
      result = await this.attachVendorTrust(products);
    }

    if (cacheKey) this.catalogCache.set(cacheKey, result);
    return result;
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

  async countForVendor(vendorId: string): Promise<number> {
    return this.productModel.countDocuments({ vendorId }).exec();
  }

  async countGroupedByVendor(): Promise<Record<string, number>> {
    const rows = await this.productModel
      .aggregate([{ $group: { _id: '$vendorId', count: { $sum: 1 } } }])
      .exec();
    const out: Record<string, number> = {};
    for (const row of rows) {
      if (row._id) out[String(row._id)] = row.count;
    }
    return out;
  }

  async findByVendor(vendorId: string): Promise<Product[]> {
    const products = await this.productModel
      .find({ vendorId })
      .populate('vendorId', VENDOR_POPULATE_FIELDS)
      .lean()
      .exec() as any[];
    return products.map((p) => this.mapProductForClient(p));
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('vendorId', VENDOR_POPULATE_FIELDS)
      .lean()
      .exec() as any;
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.mapProductForClient(product) as any;
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

    const payload = normalizeProductStockPayload({
      ...product.toObject(),
      ...updateProductDto,
    } as any);

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();

    this.bustPublicCaches();
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

    const removed = await this.productModel.findByIdAndDelete(id).exec() as any;
    this.bustPublicCaches();
    return removed;
  }

  async getSuggestions(searchTerm: string) {
    const term = String(searchTerm || '').trim().slice(0, 80);
    if (term.length < 2) return [];

    const cacheKey = term.toLowerCase();
    const cached = this.suggestionsCache.get(cacheKey);
    if (cached) return cached;

    // Prefer text index (fast under concurrent typers); regex fallback if text finds nothing.
    let productNames = await this.productModel
      .find({ isActive: true, $text: { $search: term } })
      .limit(5)
      .select('name')
      .lean()
      .exec();

    if (!productNames.length) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      productNames = await this.productModel
        .find({
          isActive: true,
          name: { $regex: escaped, $options: 'i' },
        })
        .limit(5)
        .select('name')
        .lean()
        .exec();
    }

    const vendorNames = await this.userModel
      .find({
        role: 'vendor',
        $text: { $search: term },
      })
      .limit(5)
      .select('shopName')
      .lean()
      .exec()
      .catch(async () => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return this.userModel
          .find({
            role: 'vendor',
            shopName: { $regex: escaped, $options: 'i' },
          })
          .limit(5)
          .select('shopName')
          .lean()
          .exec();
      });

    const suggestions = [
      ...productNames.map((p) => ({ text: p.name, type: 'product' })),
      ...vendorNames.map((v) => ({ text: v.shopName, type: 'vendor' })),
    ].filter((s) => s.text);

    const uniqueSuggestions = Array.from(new Set(suggestions.map((s) => s.text))).map((text) =>
      suggestions.find((s) => s.text === text),
    );

    this.suggestionsCache.set(cacheKey, uniqueSuggestions);
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
