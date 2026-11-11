require('dotenv').config();
const { Client } = require('pg');

const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  // Fix "Painter" under Car Repair provider → category should be Painting
  await c.query(`UPDATE services SET category='Painting' WHERE name='Painter' AND category='Car Repair'`);
  // Fix "Rohit Electronics" → Appliance Repair
  await c.query(`UPDATE services SET category='Appliance Repair' WHERE name='Rohit Electronics Limited'`);
  // Fix "Rahul-Carpainter" → Carpenter
  await c.query(`UPDATE services SET category='Carpenter' WHERE name='Rahul-Carpainter'`);
  // Fix "AC repair" under Car Repair → AC Repair
  await c.query(`UPDATE services SET category='AC Repair' WHERE name='AC repair' AND category='Car Repair'`);
  // Remove duplicate "Gourav Car Repair" entries (keep only 1)
  const dups = await c.query(`SELECT id FROM services WHERE name='Gourav Car Repair' ORDER BY "createdAt" ASC`);
  if (dups.rows.length > 1) {
    const toDelete = dups.rows.slice(1).map(r => r.id);
    await c.query(`DELETE FROM services WHERE id = ANY($1)`, [toDelete]);
    console.log(`Deleted ${toDelete.length} duplicate Gourav Car Repair entries`);
  }
  console.log('Fixed service categories');

  const show = await c.query(`
    SELECT s.name, s.category, p.name as provider FROM services s
    JOIN providers p ON s."providerId" = p.id
    WHERE p.name = 'Riya Car Repair' ORDER BY s.name
  `);
  console.log('Riya Car Repair services:');
  console.table(show.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });
