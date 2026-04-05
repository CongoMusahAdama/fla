const mongoose = require('mongoose');

async function checkProducts() {
  const uri = "mongodb+srv://BIGM:Musah_12345@bigm.ndxmq4v.mongodb.net/fla?retryWrites=true&w=majority&appName=fla";
  await mongoose.connect(uri);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const products = await Product.find({});
  console.log('Total products:', products.length);
  if (products.length > 0) {
    console.log('First product vendorId:', products[0].vendorId);
  }
  await mongoose.disconnect();
}

checkProducts();
