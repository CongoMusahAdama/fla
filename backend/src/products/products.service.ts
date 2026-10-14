import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { WhatsappClickLog, WhatsappClickLogDocument } from './schemas/whatsapp-click-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { isVendorDocumented } from '../common/vendor-trust.util';
import { normalizeProductStockPayload } from './product-stock.util';
import { TtlCache } from '../common/ttl-cache.util';
import { accraDayKey, normalizeListingMode, showsWhatsappLead } from '../common/whatsapp-clicks.util';
import { normalizeWhatsAppPhone } from '../common/whatsapp.util';

const VENDOR_POPULATE_FIELDS =
  'uniqueVendorId region city area location bio shopName vendorTier businessRegistration businessRegistrationApprovedAt businessRegistrationSubmittedAt storeSlug phone whatsappClickBalance';

const LIST_PRODUCT_FIELDS =
  'name price images imageLabels sizes stock colorStock sizeStock variantStock vendorId vendorName uniqueVendorId description hasSizes hasColors colors tailoringTime region city area vendorLocation vendorBio vendorTier storeSlug category listingMode rating reviewCount originalPrice isFeatured createdAt isActive';

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
    @InjectModel(WhatsappClickLog.name) private whatsappClickLogModel: Model<WhatsappClickLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  bustPublicCaches() {
    this.catalogCache.clear();
    this.suggestionsCache.clear();
  }

  private catalogCacheKey(query: Record<string, unknown>): string | null {
    // Never cache admin/vendor inventory (showAll) — freshness matters more there.
    if (query.showAll === 'true') return null;
    const keys = [
      'page', 'limit', 'sort', 'filter', 'category', 'region', 'city', 'area', 'search',
      'minPrice', 'maxPrice', 'priceLt', 'priceGt', 'vendorId', 'isFeatured',
    ];
    const parts: string[] = [];
    for (const k of keys) {
      const v = query[k];
      if (v !== undefined && v !== null && v !== '') parts.push(`${k}=${String(v)}`);
    }
    return parts.sort().join('&') || 'default';
  }

  async onModuleInit() {
    try {
      await this.whatsappClickLogModel.collection.dropIndex('productId_1_buyerKey_1_dayKey_1');
    } catch {
      // Fresh databases never had the once-a-day unique index.
    }
    try {
      await this.whatsappClickLogModel.collection.createIndex(
        { buyerKey: 1 },
        { unique: true, name: 'buyerKey_once_per_vendor' },
      );
    } catch (err: any) {
      this.logger.warn(`WhatsApp click unique index: ${err?.message || err}`);
    }
    this.backfillEmptyProductAreas().catch((err) =>
      this.logger.error(`Area backfill failed: ${err.message}`),
    );

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

  /** Fill area on older listings from the vendor profile. Never overwrites an area already set. */
  private async backfillEmptyProductAreas() {
    const vendors = await this.userModel
      .find({
        role: 'vendor',
        $or: [
          { area: { $type: 'string', $nin: [''] } },
          { location: { $type: 'string', $nin: [''] } },
        ],
      })
      .select('area location city')
      .lean();
    for (const vendor of vendors) {
      const area = String((vendor as any).area || (vendor as any).location || '').trim();
      if (area.length >= 2) {
        await this.productModel.updateMany(
          {
            vendorId: (vendor as any)._id,
            $or: [{ area: { $exists: false } }, { area: null }, { area: '' }],
          },
          { $set: { area } },
        );
      }
      const city = String((vendor as any).city || '').trim();
      if (city.length < 2) continue;
      await this.productModel.updateMany(
        {
          vendorId: (vendor as any)._id,
          $or: [{ city: { $exists: false } }, { city: null }, { city: '' }],
        },
        { $set: { city } },
      );
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const payload = normalizeProductStockPayload(createProductDto as any) as any;
    payload.listingMode = normalizeListingMode(payload.listingMode);
    if (payload.vendorId) {
      const vendor = await this.userModel
        .findById(payload.vendorId)
        .select('region city area location')
        .lean()
        .exec();
      if (vendor) {
        if (!payload.region && (vendor as any).region) payload.region = (vendor as any).region;
        if (!payload.city && (vendor as any).city) payload.city = (vendor as any).city;
        if (!payload.area && ((vendor as any).area || (vendor as any).location)) {
          payload.area = (vendor as any).area || (vendor as any).location;
        }
      }
    }
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
    if (!p.city && vendor?.city) {
      p.city = vendor.city;
    }
    if (!p.area && (vendor?.area || vendor?.location)) {
      p.area = vendor.area || vendor.location;
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
    this.applyWhatsappLead(p);
    return p;
  }

  /** Public flag only. Phone and remaining clicks stay off the product payload. */
  private applyWhatsappLead(p: any) {
    const vendor = p.vendorId && typeof p.vendorId === 'object' ? p.vendorId : null;
    const listingMode = normalizeListingMode(p.listingMode);
    p.listingMode = listingMode;
    const balance = Number(vendor?.whatsappClickBalance || 0);
    const hasPhone = Boolean(normalizeWhatsAppPhone(vendor?.phone));
    // One prepaid balance covers every listing. Copy the vendor before stripping
    // phone and balance — list queries reuse one vendor object, and deleting
    // those fields hid WhatsApp on every product after the first.
    p.whatsappLeadAvailable = showsWhatsappLead(listingMode) && balance > 0 && hasPhone;
    if (vendor) {
      const safeVendor = { ...vendor };
      delete safeVendor.phone;
      delete safeVendor.whatsappClickBalance;
      p.vendorId = safeVendor;
    }
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
        'uniqueVendorId region city area location bio shopName vendorTier businessRegistration businessRegistrationApprovedAt businessRegistrationSubmittedAt storeSlug phone whatsappClickBalance',
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
      // Read phone and balance off the shared vendor before mapping. One vendor
      // record is reused for every product, so the flag must be decided here and
      // applied to every listing, not only the first.
      const leadOpen =
        Number(vendor?.whatsappClickBalance || 0) > 0 &&
        Boolean(normalizeWhatsAppPhone(vendor?.phone));
      const vendorCopy = vendor
        ? { ...vendor, phone: undefined, whatsappClickBalance: undefined }
        : p.vendorId;
      const mapped = this.mapProductForClient(
        { ...p, vendorId: vendorCopy },
        { listView: true },
      );
      if (vendor) mapped.whatsappLeadAvailable = leadOpen;
      return mapped;
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

    if (query.city) {
      await this.addPlaceFilter(filters, query.city, 'city');
    }

    if (query.area) {
      await this.addPlaceFilter(filters, query.area, 'area');
    }

    if (query.search) {
      const term = String(query.search).trim().slice(0, 120);
      if (term.length >= 1 && term.length < 3) {
        const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(safe, 'i');
        const existingAnd = Array.isArray(filters.$and) ? filters.$and : [];
        filters.$and = [...existingAnd, { $or: [{ name: rx }, { vendorName: rx }] }];
      } else if (term.length >= 3) {
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

  /** City is a prefix (Tamale matches Tamale and older "Tamale, Gumani"). Area can be one letter. */
  private async addPlaceFilter(
    filters: Record<string, unknown>,
    raw: unknown,
    mode: 'city' | 'area',
  ) {
    const text = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!text) return;
    const safe = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(mode === 'city' ? `^${safe}` : safe, 'i');
    const vendorFields = mode === 'city' ? ['city', 'area', 'location'] : ['area', 'location'];
    const vendors = await this.userModel
      .find({ $or: vendorFields.map((field) => ({ [field]: regex })) })
      .select('_id')
      .lean()
      .exec();
    const vendorIds = vendors.map((vendor: any) => vendor._id);
    const placeMatch: Record<string, unknown>[] = mode === 'city'
      ? [{ city: regex }, { area: regex }]
      : [{ area: regex }];
    if (vendorIds.length) {
      const loose: Record<string, unknown>[] = [
        { [mode]: { $exists: false } },
        { [mode]: null },
        { [mode]: '' },
        { [mode]: regex },
      ];
      if (mode === 'city') loose.push({ area: regex });
      placeMatch.push({ vendorId: { $in: vendorIds }, $or: loose });
    }
    const existingAnd = Array.isArray(filters.$and) ? filters.$and : [];
    filters.$and = [...existingAnd, { $or: placeMatch }];
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
      .select(LIST_PRODUCT_FIELDS)
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

  /**
   * Open the vendor WhatsApp.
   * One buyer phone is charged once for that vendor. A later tap from the same
   * number still opens the chat and does not spend another click.
   */
  async consumeWhatsappClick(
    productId: string,
    opts: { userId?: string; buyerPhone?: string },
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.productModel
      .findById(productId)
      .select('name listingMode isActive vendorId')
      .lean()
      .exec();
    if (!product || product.isActive === false) {
      throw new NotFoundException('Product not found');
    }
    if (!showsWhatsappLead(product.listingMode)) {
      throw new BadRequestException('This listing does not open WhatsApp.');
    }

    const vendor = await this.userModel
      .findById(product.vendorId)
      .select('phone whatsappClickBalance role')
      .lean()
      .exec();
    const phone = normalizeWhatsAppPhone((vendor as any)?.phone);
    if (!phone) {
      throw new BadRequestException('This vendor has not added a WhatsApp number yet.');
    }

    const message = `Hello, I saw "${product.name}" on FLA and I am interested.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const paused = {
      available: false,
      whatsappLeadAvailable: false,
      message: 'WhatsApp contact is unavailable until this vendor recharges.',
    };

    let buyerPhone = '';
    const requester = opts.userId ? String(opts.userId) : '';
    if (requester) {
      const buyer = await this.userModel.findById(requester).select('phone').lean().exec();
      buyerPhone = normalizeWhatsAppPhone((buyer as any)?.phone) || '';
    }
    if (!buyerPhone) {
      buyerPhone = normalizeWhatsAppPhone(opts.buyerPhone) || '';
    }
    if (!buyerPhone) {
      throw new BadRequestException('Enter your WhatsApp number.');
    }

    const actorKey = `phone:${buyerPhone}`;
    const buyerKey = `vendor:${String(product.vendorId)}:${actorKey}`;
    const liveBalance = Number((vendor as any)?.whatsappClickBalance || 0);

    const already = await this.whatsappClickLogModel
      .findOne({ vendorId: product.vendorId, actorKey })
      .select('_id')
      .lean()
      .exec();
    if (already) {
      if (liveBalance < 1) {
        return { available: true, url, charged: false, alreadyCounted: true, whatsappLeadAvailable: false };
      }
      return { available: true, url, charged: false, alreadyCounted: true, whatsappLeadAvailable: true };
    }

    const decremented = await this.userModel
      .findOneAndUpdate(
        { _id: product.vendorId, whatsappClickBalance: { $gte: 1 } },
        { $inc: { whatsappClickBalance: -1 } },
        { new: true },
      )
      .select('whatsappClickBalance')
      .lean()
      .exec();

    if (!decremented) return paused;

    const remaining = Number((decremented as any).whatsappClickBalance || 0);
    try {
      await this.whatsappClickLogModel.create({
        vendorId: product.vendorId,
        productId: product._id,
        actorKey,
        buyerKey,
        dayKey: accraDayKey(),
      });
    } catch (err: any) {
      await this.userModel
        .updateOne({ _id: product.vendorId }, { $inc: { whatsappClickBalance: 1 } })
        .exec();
      if (err?.code === 11000) {
        const live = remaining + 1;
        return {
          available: true,
          url,
          charged: false,
          alreadyCounted: true,
          whatsappLeadAvailable: live > 0,
        };
      }
      throw err;
    }

    this.bustPublicCaches();
    return {
      available: true,
      url,
      charged: true,
      whatsappLeadAvailable: remaining > 0,
    };
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
    } as any) as any;
    payload.listingMode = normalizeListingMode(payload.listingMode);

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
    if (term.length < 1) return [];

    const cacheKey = term.toLowerCase();
    const cached = this.suggestionsCache.get(cacheKey);
    if (cached) return cached;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const short = term.length < 3;
    // One or two letters are dropped by the text index, so match the name directly.
    let productNames = short
      ? await this.productModel
        .find({ isActive: true, name: { $regex: escaped, $options: 'i' } })
        .limit(5)
        .select('name')
        .lean()
        .exec()
      : await this.productModel
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

    const vendorNames = short
      ? await this.userModel
        .find({ role: 'vendor', shopName: { $regex: escaped, $options: 'i' } })
        .limit(5)
        .select('shopName')
        .lean()
        .exec()
      : await this.userModel
        .find({ role: 'vendor', $text: { $search: term } })
        .limit(5)
        .select('shopName')
        .lean()
        .exec()
        .catch(async () => this.userModel
          .find({ role: 'vendor', shopName: { $regex: escaped, $options: 'i' } })
          .limit(5)
          .select('shopName')
          .lean()
          .exec());

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
