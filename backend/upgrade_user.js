
const mongoose = require('mongoose');

async function upgradeUser() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        console.log('Connected to DB');
        
        const result = await mongoose.connection.collection('users').updateOne(
            { name: /BIG M/i },
            { 
                $set: { 
                    role: 'vendor', 
                    status: 'active',
                    shopName: 'BIG M TECHNOLOGIES',
                    uniqueVendorId: 'BIGM001',
                    location: 'Accra',
                    phone: '0531878243',
                    walletBalance: 0,
                    pendingBalance: 0
                } 
            }
        );
        
        console.log('Update result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

upgradeUser();
