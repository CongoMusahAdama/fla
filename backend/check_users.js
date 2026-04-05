
const mongoose = require('mongoose');

async function checkUsers() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        console.log('Connected to DB');
        
        const users = await mongoose.connection.collection('users').find({}).toArray();
        console.log('Total Users:', users.length);
        console.log(JSON.stringify(users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            shopName: u.shopName,
            status: u.status
        })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
