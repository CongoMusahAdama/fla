"use client";
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
    Chat,
    Channel,
    Window,
    ChannelHeader,
    MessageList,
    Thread,
    LoadingIndicator,
    MessageComposer,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import { useAuth } from '@/context/AuthContext';

interface DisputeChatProps {
    disputeId: string;
}

export const DisputeChat: React.FC<DisputeChatProps> = ({ disputeId }) => {
    const { user, token } = useAuth();
    const [client, setClient] = useState<StreamChat | null>(null);
    const [channel, setChannel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initChat = async () => {
            if (!user || !token) return;

            try {
                // 1. Get Stream Token from Backend
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const tokenRes = await fetch(`${api}/auth/stream-token`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                });
                const { token: streamToken } = await tokenRes.json();

                // 2. Initialize Stream Client
                const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'your_stream_api_key';
                const chatClient = StreamChat.getInstance(apiKey);

                await chatClient.connectUser(
                    {
                        id: user.id,
                        name: user.shopName || user.name,
                        image: user.profileImage,
                    },
                    streamToken
                );

                // 3. Join the Dispute Channel
                const channelId = `dispute-${disputeId}`;
                const disputeChannel = chatClient.channel('messaging', channelId);
                
                await disputeChannel.watch();

                setClient(chatClient);
                setChannel(disputeChannel);
            } catch (error) {
                console.error('Error initializing Stream Chat:', error);
            } finally {
                setLoading(false);
            }
        };

        initChat();

        return () => {
            if (client) client.disconnectUser();
        };
    }, [disputeId, user, token]);

    if (loading) return <div className="flex items-center justify-center h-96"><LoadingIndicator /></div>;
    if (!client || !channel) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Dispute War-Room Unavailable</div>;

    return (
        <div className="h-[600px] border border-slate-100 rounded-[32px] overflow-hidden bg-white shadow-2xl">
            <Chat client={client} theme="messaging light">
                <Channel channel={channel}>
                    <Window>
                        <ChannelHeader />
                        <MessageList />
                        <MessageComposer />
                    </Window>
                    <Thread />
                </Channel>
            </Chat>
        </div>
    );
};
