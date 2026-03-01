import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(query: any = {}): Promise<Product[]> {
    const filters: any = {};

    // Default to only active products unless showAll is true (for admin)
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

    if (query.search) {
      // Find vendors that match the search term
      const matchingVendors = await this.userModel.find({
        role: 'vendor',
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { shopName: { $regex: query.search, $options: 'i' } },
          { businessName: { $regex: query.search, $options: 'i' } }
        ]
      }).select('_id').exec();

      const matchingVendorIds = matchingVendors.map(v => v._id);

      filters.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { vendorName: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { vendorId: { $in: matchingVendorIds } }
      ];
    }

    if (query.vendorId) {
      filters.vendorId = query.vendorId;
    }

    let q = this.productModel.find(filters).populate('vendorId', 'uniqueVendorId');

    if (query.sort === 'latest' || query.filter === 'New Arrival') {
      q = q.sort({ createdAt: -1 });
    } else if (query.sort === 'best' || query.filter === 'Best Seller') {
      q = q.sort({ rating: -1, reviewCount: -1 });
    }

    if (query.limit) {
      q = q.limit(parseInt(query.limit));
    }

    const products = await q.exec();

    // Map to ensure uniqueVendorId is top-level for frontend convenience
    return products.map(p => {
      const productObj = p.toObject();
      if (!productObj.uniqueVendorId && productObj.vendorId && (productObj.vendorId as any).uniqueVendorId) {
        productObj.uniqueVendorId = (productObj.vendorId as any).uniqueVendorId;
      }
      return productObj;
    });
  }

  async findByVendor(vendorId: string): Promise<Product[]> {
    const products = await this.productModel.find({ vendorId: vendorId }).populate('vendorId', 'uniqueVendorId').exec();
    return products.map(p => {
      const productObj = p.toObject();
      if (!productObj.uniqueVendorId && productObj.vendorId && (productObj.vendorId as any).uniqueVendorId) {
        productObj.uniqueVendorId = (productObj.vendorId as any).uniqueVendorId;
      }
      return productObj;
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).populate('vendorId', 'uniqueVendorId').exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const productObj = product.toObject();
    if (!productObj.uniqueVendorId && productObj.vendorId && (productObj.vendorId as any).uniqueVendorId) {
      productObj.uniqueVendorId = (productObj.vendorId as any).uniqueVendorId;
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
}
