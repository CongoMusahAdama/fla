import { Injectable, Logger } from '@nestjs/common';
import { StreamChat } from 'stream-chat';

@Injectable()
export class StreamService {
    private chatClient: StreamChat;
    private readonly logger = new Logger(StreamService.name);

    constructor() {
        const apiKey = process.env.STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;

        if (apiKey && apiSecret) {
            this.chatClient = StreamChat.getInstance(apiKey, apiSecret);
        } else {
            this.logger.warn('STREAM_API_KEY or STREAM_API_SECRET is missing. Stream features will be disabled.');
        }
    }

    async createToken(userId: string): Promise<string> {
        if (!this.chatClient) return '';
        return this.chatClient.createToken(userId);
    }

    async createDisputeChannel(disputeId: string, customerId: string, vendorId: string, adminId: string = 'admin_general') {
        if (!this.chatClient) return null;

        try {
            // Upsert users to ensure they exist in Stream
            await this.chatClient.upsertUsers([
                { id: customerId, role: 'user' },
                { id: vendorId, role: 'user' },
                { id: adminId, role: 'admin' },
            ]);

            const channel = this.chatClient.channel('messaging', `dispute-${disputeId}`, {
                name: `Dispute Case #${disputeId.slice(-6).toUpperCase()}`,
                members: [customerId, vendorId, adminId],
                created_by_id: adminId,
            } as any);

            await channel.create();
            return channel;
        } catch (error) {
            this.logger.error(`Failed to create Stream channel: ${error.message}`);
            return null;
        }
    }

    async deleteChannel(disputeId: string) {
        if (!this.chatClient) return;
        const channel = this.chatClient.channel('messaging', `dispute-${disputeId}`);
        await channel.delete();
    }
}
