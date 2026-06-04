/**
 * Wipes test marketplace data from MongoDB.
 * Keeps: users with role "admin", platform settings, logistics seed data.
 *
 * Usage: npm run clear:test-data -- --confirm
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/schemas/user.schema';
import { Product } from '../src/products/schemas/product.schema';
import { Order } from '../src/orders/schemas/order.schema';
import { Wishlist } from '../src/wishlist/schemas/wishlist.schema';
import { Notification } from '../src/notifications/schemas/notification.schema';
import { Withdrawal } from '../src/payments/schemas/withdrawal.schema';
import { Support } from '../src/support/schemas/support.schema';
import { TempVerification } from '../src/common/schemas/temp-verification.schema';

async function deleteAll<T>(model: Model<T>, label: string) {
  const result = await model.deleteMany({}).exec();
  console.log(`  ${label}: ${result.deletedCount} removed`);
  return result.deletedCount ?? 0;
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('\nRefusing to run without --confirm\n');
    console.error('  npm run clear:test-data -- --confirm\n');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const orderModel = app.get<Model<Order>>(getModelToken(Order.name));
    const wishlistModel = app.get<Model<Wishlist>>(getModelToken(Wishlist.name));
    const notificationModel = app.get<Model<Notification>>(getModelToken(Notification.name));
    const withdrawalModel = app.get<Model<Withdrawal>>(getModelToken(Withdrawal.name));
    const supportModel = app.get<Model<Support>>(getModelToken(Support.name));
    const tempVerificationModel = app.get<Model<TempVerification>>(getModelToken(TempVerification.name));

    const adminUsers = await userModel.find({ role: 'admin' }).select('email name role').exec();
    const nonAdminCount = await userModel.countDocuments({ role: { $ne: 'admin' } }).exec();

    console.log('\n--- FLA test data cleanup ---\n');
    console.log(`Admins to keep (${adminUsers.length}):`);
    adminUsers.forEach((u) => console.log(`  - ${u.email} (${u.name || 'Admin'})`));
    console.log(`\nNon-admin users to delete: ${nonAdminCount}\n`);

    console.log('Deleting collections...');
    await deleteAll(orderModel, 'Orders');
    await deleteAll(productModel, 'Products');
    await deleteAll(wishlistModel, 'Wishlists');
    await deleteAll(notificationModel, 'Notifications');
    await deleteAll(withdrawalModel, 'Withdrawals');
    await deleteAll(supportModel, 'Disputes / support');
    await deleteAll(tempVerificationModel, 'Temp verifications');

    const userResult = await userModel.deleteMany({ role: { $ne: 'admin' } }).exec();
    console.log(`  Customers & vendors: ${userResult.deletedCount} removed`);

    const remainingUsers = await userModel.countDocuments().exec();
    const remainingProducts = await productModel.countDocuments().exec();
    const remainingOrders = await orderModel.countDocuments().exec();

    console.log('\n--- Done ---\n');
    console.log(`Users left: ${remainingUsers} (admins only expected)`);
    console.log(`Products left: ${remainingProducts}`);
    console.log(`Orders left: ${remainingOrders}`);
    console.log('Settings & logistics branches were not touched.\n');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Cleanup failed:', err?.message || err);
  process.exit(1);
});
