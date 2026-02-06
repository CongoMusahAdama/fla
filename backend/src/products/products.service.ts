import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(query: any = {}): Promise<Product[]> {
    const filters: any = { isActive: true };

    if (query.category && query.category !== 'All') {
      filters.category = query.category;
    }

    if (query.isFeatured) {
      filters.isFeatured = query.isFeatured === 'true';
    }

    if (query.search) {
      filters.name = { $regex: query.search, $options: 'i' };
    }

    if (query.vendorId) {
      filters.vendorId = query.vendorId;
    }

    let q = this.productModel.find(filters);

    if (query.sort === 'latest') {
      q = q.sort({ createdAt: -1 });
    }

    if (query.limit) {
      q = q.limit(parseInt(query.limit));
    }

    return q.exec();
  }

  async findByVendor(vendorId: string): Promise<Product[]> {
    return this.productModel.find({ vendorId: vendorId }).exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return existingProduct;
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return deletedProduct;
  }
}
