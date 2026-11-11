require('dotenv').config();
const { Client } = require('pg');

const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  // Ensure category column exists
  await c.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS category varchar(80) DEFAULT NULL');
  console.log('Column ensured');

  // Set each service category = its provider category (if not already set)
  const r = await c.query(`
    UPDATE services s
    SET category = p.category
    FROM providers p
    WHERE s."providerId" = p.id
    AND s.category IS NULL
    RETURNING s.name, s.category
  `);
  console.log(`Updated ${r.rowCount} services with their provider category`);

  // Show all services with categories
  const show = await c.query(`
    SELECT s.name as service, s.category, p.name as provider
    FROM services s
    JOIN providers p ON s."providerId" = p.id
    ORDER BY s.category, s.name
  `);
  console.table(show.rows);
  await c.end();
}).catch(e => { console.error(e.message); process.exit(1); });
