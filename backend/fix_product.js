
const mongoose = require('mongoose');

async function fixProduct() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        console.log('Connected to DB');
        
        const bigM = await mongoose.connection.collection('users').findOne({ name: /BIG M/i });
        const result = await mongoose.connection.collection('products').updateOne(
            { name: "Tribal" }, // Fix the old one for test
            { 
                $set: { 
                    isActive: true, 
                    vendorId: bigM._id,
                    vendorName: bigM.shopName,
                    uniqueVendorId: bigM.uniqueVendorId,
                    region: bigM.region || 'Accra'
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

fixProduct();
