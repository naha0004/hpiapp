// Simple script to get Stripe price IDs for your products
const Stripe = require('stripe');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

async function getPrices() {
  try {
    console.log('Fetching your Stripe products and prices...\n');
    
    // Get the specific product
    const product = await stripe.products.retrieve('prod_Stixkm0zQHBXpZ');
    console.log('Product:', product.name, '(', product.id, ')');
    
    // Get prices for this product
    const prices = await stripe.prices.list({
      product: 'prod_Stixkm0zQHBXpZ',
    });
    
    console.log('Prices for this product:');
    prices.data.forEach(price => {
      console.log(`  - Price ID: ${price.id}`);
      console.log(`  - Amount: £${(price.unit_amount / 100).toFixed(2)}`);
      console.log(`  - Currency: ${price.currency}`);
      console.log('');
    });
    
    if (prices.data.length > 0) {
      console.log(`\nUse this Price ID in your code: ${prices.data[0].id}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getPrices();
