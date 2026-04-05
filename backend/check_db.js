
const mongoose = require('mongoose');

async function checkProducts() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        console.log('Connected to DB');
        
        const products = await mongoose.connection.collection('products').find({}).sort({ createdAt: -1 }).toArray();
        console.log('Total Products:', products.length);
        console.log(JSON.stringify(products.map(p => ({
            id: p._id,
            name: p.name,
            createdAt: p.createdAt,
            isActive: p.isActive,
            vendorName: p.vendorName,
            vendorId: p.vendorId
        })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkProducts();
