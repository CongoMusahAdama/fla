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
        const { orders } = await this.ordersService.findByUser(userId, 1, 100); // Fetch last 100 for stats
        const wishlist = await this.wishlistService.findByUser(userId);

        const nonCancelled = orders.filter(o => o.status !== 'cancelled');

        const totalSpent = nonCancelled.reduce((sum, order) => sum + order.totalAmount, 0);

        // Spending for the current day only (resets at midnight, server time).
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaySpent = nonCancelled.reduce((sum, order) => {
            const ref = (order as any).paidAt || (order as any).createdAt;
            if (ref && new Date(ref) >= startOfToday) {
                return sum + order.totalAmount;
            }
            return sum;
        }, 0);

        const activeOrders = orders.filter(o =>
            !['delivered', 'cancelled'].includes(o.status)
        ).length;

        const wishlistCount = wishlist.items.length;

        const user = await this.usersService.findOneById(userId);

        return {
            totalSpent,
            todaySpent,
            activeOrders,
            wishlistCount,
            walletBalance: user?.walletBalance || 0,
            recentOrders: orders.slice(0, 5)
        };
    }

    async getVendorStats(userId: string) {
        const { orders } = await this.ordersService.findByVendor(userId, 1, 100); // Fetch last 100 for stats
        const products = await this.productsService.findByVendor(userId);

        const paidOrders = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled' && o.isPaid);

        const totalRevenue = paidOrders
            .reduce((sum, order) => sum + (order.vendorShare || (order.totalAmount * 0.9)), 0);

        // Revenue earned for the current day only (resets at midnight, server time).
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayRevenue = paidOrders.reduce((sum, order) => {
            const ref = (order as any).paidAt || (order as any).createdAt;
            if (ref && new Date(ref) >= startOfToday) {
                return sum + (order.vendorShare || (order.totalAmount * 0.9));
            }
            return sum;
        }, 0);

        const pendingRevenue = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled' && !o.isPaid)
            .reduce((sum, order) => sum + (order.vendorShare || (order.totalAmount * 0.9)), 0);

        const activeOrders = orders.filter(o =>
            !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
        ).length;

        const totalSales = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled')
            .length;

        const user = await this.usersService.findOneById(userId);

        return {
            totalRevenue,
            todayRevenue,
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
        // Fetch aggregation stats from services instead of loading all data into memory
        const stats = await this.ordersService.getAdminDashboardStats();

        const [totalUsers, totalVendors, totalProducts] = await Promise.all([
            this.usersService.countAll(),
            this.usersService.countByRole('vendor'),
            this.productsService.countCatalog(),
        ]);

        // Recent limit
        const recentOrders = await this.ordersService.getRecentOrders(10);

        // Chart Data
        const chartData = await this.ordersService.getRevenueChartData();

        return {
            totalRevenue: stats.totalRevenue,
            totalCommission: stats.totalCommission,
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders: stats.totalOrders,
            completedTransactions: stats.completedTransactions,
            pendingOrders: stats.pendingOrders,
            recentOrders,
            chartData
        };
    }
}
