const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla';

const productSchema = new mongoose.Schema({
    images: [String],
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

async function fixImages() {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    for (const product of products) {
        let updated = false;
        const newImages = product.images.map((img, idx) => {
            if (img.startsWith('blob:')) {
                updated = true;
                // Use a placeholder image based on index or just product-1.jpg
                return `/product-${(idx % 5) + 1}.jpg`;
            }
            return img;
        });

        if (updated) {
            product.images = newImages;
            await product.save();
            console.log(`Updated product: ${product.name || product._id}`);
        }
    }

    console.log('Done fixing images');
    await mongoose.disconnect();
}

fixImages().catch(err => {
    console.error(err);
    process.exit(1);
});
