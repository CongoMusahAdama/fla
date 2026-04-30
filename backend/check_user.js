const mongoose = require('mongoose');

const uri = "mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla";

async function checkUser() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const bcrypt = require('bcrypt');
        // Check for admin user
        const user = await User.findOne({ role: 'admin' });

        if (user) {
            console.log(`SUCCESS: Admin user found!`);
            console.log(`Email: ${user.email}`);
            console.log(`Status: ${user.status}`);
            
            // Resetting password to Admin123!
            const newPassword = await bcrypt.hash('Admin123!', 8);
            await User.updateOne({ _id: user._id }, { $set: { password: newPassword } });
            console.log(`Password has been successfully reset to: Admin123!`);
        } else {
            console.log(`FAILURE: No admin user found in database!`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
