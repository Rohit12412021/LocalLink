/**
 * Run once to seed production Neon DB with demo providers.
 * Usage: node seed-production.js
 * Requires DATABASE_URL in environment.
 */
require('dotenv').config();
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const PROVIDERS = [
  {
    name: 'Ramesh Auto Works', category: 'Mechanic', location: 'Dharuhera, Haryana',
    experience: '8 years', phone: '9876543210',
    about: 'Expert in car servicing, engine repair, and AC recharge. Trusted by 200+ customers.',
    price: '₹500 onwards', rating: 4.8, reviewCount: 47,
    lat: 28.205, lng: 76.795, email: 'ramesh.mechanic@demo.locallink',
    services: [
      { name: 'Car Servicing', price: '₹500', desc: 'Full car service including oil change' },
      { name: 'AC Recharge', price: '₹800', desc: 'Car AC gas refill and check' },
      { name: 'Engine Repair', price: '₹1500 onwards', desc: 'Engine diagnostics and repair' },
    ],
  },
  {
    name: 'Sunil Plumbing Services', category: 'Plumber', location: 'Rewari, Haryana',
    experience: '5 years', phone: '9812345678',
    about: 'Fast and reliable plumbing. Available for emergency leaks and installations.',
    price: '₹300 onwards', rating: 4.6, reviewCount: 32,
    lat: 28.197, lng: 76.615, email: 'sunil.plumber@demo.locallink',
    services: [
      { name: 'Pipe Leak Repair', price: '₹300', desc: 'Fix leaking pipes quickly' },
      { name: 'Tap Installation', price: '₹200', desc: 'Install new taps and fittings' },
      { name: 'Bathroom Fitting', price: '₹1200', desc: 'Complete bathroom plumbing setup' },
    ],
  },
  {
    name: 'Vijay Electrical Solutions', category: 'Electrician', location: 'Dharuhera, Haryana',
    experience: '10 years', phone: '9988776655',
    about: 'Licensed electrician for home and commercial wiring, fan installation.',
    price: '₹400 onwards', rating: 4.9, reviewCount: 61,
    lat: 28.21, lng: 76.8, email: 'vijay.electric@demo.locallink',
    services: [
      { name: 'Fan Installation', price: '₹400', desc: 'Install ceiling and table fans' },
      { name: 'Wiring Repair', price: '₹600', desc: 'Fix faulty wiring and switches' },
      { name: 'Inverter Setup', price: '₹1000', desc: 'Install and configure home inverter' },
    ],
  },
  {
    name: 'Priya Home Care', category: 'Cleaning', location: 'Manesar, Haryana',
    experience: '3 years', phone: '9870001234',
    about: 'Professional home cleaning. Deep cleaning, sofa, and kitchen cleaning.',
    price: '₹600 onwards', rating: 4.7, reviewCount: 28,
    lat: 28.356, lng: 76.938, email: 'priya.cleaning@demo.locallink',
    services: [
      { name: 'Home Deep Clean', price: '₹600', desc: 'Complete deep cleaning of home' },
      { name: 'Kitchen Cleaning', price: '₹400', desc: 'Deep clean kitchen and appliances' },
      { name: 'Sofa Cleaning', price: '₹300 per seat', desc: 'Professional sofa shampooing' },
    ],
  },
  {
    name: 'Deepak Painting Works', category: 'Painting', location: 'Bhiwadi, Rajasthan',
    experience: '7 years', phone: '9765432100',
    about: 'Interior and exterior painting at affordable rates.',
    price: '₹15 per sq ft', rating: 4.5, reviewCount: 19,
    lat: 28.2, lng: 76.857, email: 'deepak.painter@demo.locallink',
    services: [
      { name: 'Interior Painting', price: '₹15 per sq ft', desc: 'Interior wall painting' },
      { name: 'Exterior Painting', price: '₹18 per sq ft', desc: 'Weather-resistant exterior' },
      { name: 'POP Work', price: '₹800 onwards', desc: 'Plaster of Paris ceiling work' },
    ],
  },
  {
    name: 'Arjun Wood Craft', category: 'Carpenter', location: 'Dharuhera, Haryana',
    experience: '12 years', phone: '9871234560',
    about: 'Custom furniture, door repair, and modular kitchen work.',
    price: '₹700 onwards', rating: 4.8, reviewCount: 35,
    lat: 28.203, lng: 76.792, email: 'arjun.carpenter@demo.locallink',
    services: [
      { name: 'Door Repair', price: '₹700', desc: 'Fix stuck or broken doors' },
      { name: 'Custom Furniture', price: '₹5000 onwards', desc: 'Made-to-order wooden furniture' },
      { name: 'Modular Kitchen', price: '₹20000 onwards', desc: 'Modular kitchen installation' },
    ],
  },
  {
    name: 'Cool Breeze AC Services', category: 'AC Repair', location: 'Gurugram, Haryana',
    experience: '6 years', phone: '9988001122',
    about: 'AC installation, gas refill, servicing and repair for all brands.',
    price: '₹500 onwards', rating: 4.6, reviewCount: 42,
    lat: 28.459, lng: 77.026, email: 'coolbreeze.ac@demo.locallink',
    services: [
      { name: 'AC Servicing', price: '₹500', desc: 'Full AC cleaning and service' },
      { name: 'Gas Refill', price: '₹1200', desc: 'AC refrigerant gas refill' },
      { name: 'AC Installation', price: '₹1500', desc: 'New AC installation' },
    ],
  },
  {
    name: 'Quick Fix Mobile Repair', category: 'Mobile Repair', location: 'Dharuhera, Haryana',
    experience: '4 years', phone: '9870011223',
    about: 'All mobile phones repaired. Screen replacement, battery, charging port.',
    price: '₹200 onwards', rating: 4.4, reviewCount: 55,
    lat: 28.206, lng: 76.796, email: 'quickfix.mobile@demo.locallink',
    services: [
      { name: 'Screen Replacement', price: '₹500 onwards', desc: 'Original screen replacement' },
      { name: 'Battery Replacement', price: '₹300', desc: 'Battery replacement for all models' },
      { name: 'Software Repair', price: '₹200', desc: 'Software flash and repair' },
    ],
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  const passwordHash = await bcrypt.hash('Demo@12345', 10);

  for (const p of PROVIDERS) {
    // Check if user already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [p.email]);
    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`User already exists: ${p.email}`);
    } else {
      userId = uuidv4();
      await client.query(
        `INSERT INTO users (id, name, email, "passwordHash", role, "emailVerified", "authMethod", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'Provider', true, 'password', NOW(), NOW())`,
        [userId, p.name, p.email, passwordHash]
      );
      console.log(`Created user: ${p.email}`);
    }

    // Check if provider already exists
    const existingProvider = await client.query('SELECT id FROM providers WHERE "userId" = $1', [userId]);
    let providerId;

    if (existingProvider.rows.length > 0) {
      providerId = existingProvider.rows[0].id;
      // Update category to make sure it's correct
      await client.query('UPDATE providers SET category = $1 WHERE id = $2', [p.category, providerId]);
      console.log(`Provider already exists, updated: ${p.name}`);
    } else {
      providerId = uuidv4();
      await client.query(
        `INSERT INTO providers (id, name, category, location, experience, phone, whatsapp, about, price, rating, "reviewCount", available, latitude, longitude, "userId", gallery, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, true, $11, $12, $13, '', NOW(), NOW())`,
        [providerId, p.name, p.category, p.location, p.experience, p.phone, p.about, p.price, p.rating, p.reviewCount, p.lat, p.lng, userId]
      );
      console.log(`Created provider: ${p.name} (${p.category})`);

      // Add services
      for (const svc of p.services) {
        const svcId = uuidv4();
        await client.query(
          `INSERT INTO services (id, name, price, description, "providerId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [svcId, svc.name, svc.price, svc.desc, providerId]
        );
      }
      console.log(`  Added ${p.services.length} services`);
    }
  }

  // Show final counts
  const counts = await client.query('SELECT category, COUNT(*) FROM providers GROUP BY category ORDER BY category');
  console.log('\nProviders by category:');
  counts.rows.forEach(r => console.log(`  ${r.category}: ${r.count}`));

  await client.end();
  console.log('\nDone!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
