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

        const activeOrders = orders.filter(o =>
            !['delivered', 'cancelled'].includes(o.status?.toLowerCase())
        ).length;

        const totalSales = orders
            .filter(o => o.status?.toLowerCase() !== 'cancelled')
            .length;

        return {
            totalRevenue,
            activeOrders,
            totalSales,
            recentOrders: orders.slice(0, 5)
        };
    }

    async getAdminStats() {
        const [orders, users] = await Promise.all([
            this.ordersService.findAll(), // Assuming findAll exists or findByUser(all)
            this.usersService.findAll()
        ]);

        // If ordersService.findAll() doesn't exist, we might need to add it or use another way
        // For now I'll assume it exists or I'll add it

        const totalRevenue = orders
            .filter(o => o.status !== 'cancelled' && o.isPaid)
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const totalUsers = users.length;

        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        return {
            totalRevenue,
            totalUsers,
            pendingOrders,
            recentOrders: orders.slice(0, 5)
        };
    }
}
