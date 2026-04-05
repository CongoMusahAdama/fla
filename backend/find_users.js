
const mongoose = require('mongoose');

async function findUsers() {
    try {
        const uri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';
        await mongoose.connect(uri);
        const users = await mongoose.connection.collection('users').find({ name: /BIG M/i }).toArray();
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

findUsers();
