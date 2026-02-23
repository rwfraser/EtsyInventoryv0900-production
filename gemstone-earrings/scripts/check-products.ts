// Quick check for existing products
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkProducts() {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count, 
             MIN(created_at) as first_created,
             MAX(created_at) as last_created
      FROM products
    `);
    
    const count = Number(result.rows[0].count);
    console.log(`\nProducts in database: ${count}`);
    
    if (count > 0) {
      console.log(`First created: ${result.rows[0].first_created}`);
      console.log(`Last created: ${result.rows[0].last_created}`);
      console.log('\n⚠️  You should run backfill script BEFORE migration');
      console.log('   npx tsx scripts/backfill-skus.ts\n');
    } else {
      console.log('\n✅ No products exist - migration can be applied directly');
      console.log('   npm run db:push\n');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkProducts();
