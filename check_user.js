const mongoose = require('mongoose');

const uri = "mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla";

async function checkUser() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Check for the specific email mentioned by the user
        const emailToCheck = "musahcongoadama@gmail.com";
        const user = await User.findOne({ email: { $regex: new RegExp(`^${emailToCheck}$`, 'i') } });

        if (user) {
            console.log(`SUCCESS: User found for ${emailToCheck}`);
            console.log(`Role: ${user.role}`);
            console.log(`Status: ${user.status}`);
        } else {
            console.log(`FAILURE: No user found with email: ${emailToCheck}`);

            // Let's list the first 5 users to see what emails are registered
            const someUsers = await User.find({}).limit(5);
            console.log("\nSome registered emails in DB:");
            someUsers.forEach(u => console.log(`- ${u.email}`));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
