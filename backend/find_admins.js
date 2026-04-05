
const mongoose = require('mongoose');

async function findAdmins() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        const admins = await mongoose.connection.collection('users').find({ role: 'admin' }).toArray();
        console.log(JSON.stringify(admins, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

findAdmins();
