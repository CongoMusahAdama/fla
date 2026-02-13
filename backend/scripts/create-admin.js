const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fla_fashion';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const usersCollection = db.collection('users');

        const adminEmail = 'admin@fla.com';
        const adminPassword = 'adminpassword';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const adminUser = {
            email: adminEmail,
            password: hashedPassword,
            name: 'FLA Admin',
            role: 'admin',
            status: 'active',
            createdAt: new Date(),
        };

        const existingAdmin = await usersCollection.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists.');
            // Update password just in case
            await usersCollection.updateOne({ email: adminEmail }, { $set: { password: hashedPassword } });
            console.log('Admin password updated to default.');

        } else {
            await usersCollection.insertOne(adminUser);
            console.log('Admin user created successfully.');
        }

        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await client.close();
    }
}

createAdmin();
