import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

@Injectable()
export class DashboardService {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly wishlistService: WishlistService,
        private readonly productsService: ProductsService,
        private readonly usersService: UsersService,
    ) { }

    async getCustomerStats(userId: string) {
        const orders = await this.ordersService.findByUser(userId);
        const wishlist = await this.wishlistService.findByUser(userId);

        const totalSpent = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const activeOrders = orders.filter(o =>
            !['delivered', 'cancelled'].includes(o.status)
        ).length;

        const wishlistCount = wishlist.items.length;

        return {
            totalSpent,
            activeOrders,
            wishlistCount,
            recentOrders: orders.slice(0, 5)
        };
    }

    async getVendorStats(userId: string) {
        const orders = await this.ordersService.findByVendor(userId);
        const products = await this.productsService.findByVendor(userId);

        const totalRevenue = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled' && o.isPaid)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const pendingRevenue = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled' && !o.isPaid)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const activeOrders = orders.filter(o =>
            !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
        ).length;

        const totalSales = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled')
            .length;

        const user = await this.usersService.findOneById(userId);

        return {
            totalRevenue,
            pendingRevenue,
            activeOrders,
            totalSales,
            recentOrders: orders.slice(0, 5),
            withdrawalHistory: user?.withdrawalHistory || []
        };
    }

    async requestWithdrawal(userId: string, amount: number) {
        const user = await this.usersService.findOneById(userId);
        if (!user) throw new Error('User not found');

        // Logic for checking available balance would go here
        // For now we just add it to history with 'pending' status

        const withdrawal = {
            amount,
            status: 'pending',
            createdAt: new Date()
        };

        const currentHistory = user.withdrawalHistory || [];
        await this.usersService.update(userId, {
            withdrawalHistory: [withdrawal, ...currentHistory]
        } as any);

        return withdrawal;
    }

    async getAdminStats() {
        const [orders, users, products] = await Promise.all([
            this.ordersService.findAll(),
            this.usersService.findAll(),
            this.productsService.findAll({ showAll: 'true' })
        ]);

        const totalRevenue = orders
            .filter(o => o.status !== 'cancelled' && o.isPaid)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const totalCommission = totalRevenue * 0.1; // 10% Platform Commission

        const escrowBalance = orders
            .filter(o => o.status !== 'cancelled' && !o.isPaid)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const totalUsers = users.length;
        const totalVendors = users.filter((u: any) => u.role === 'vendor').length;
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const completedTransactions = orders.filter(o => o.status === 'delivered' || o.isPaid).length;

        return {
            totalRevenue,
            totalCommission,
            escrowBalance,
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders,
            completedTransactions,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            recentOrders: orders.slice(0, 10)
        };
    }
}
