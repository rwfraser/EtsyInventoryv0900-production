// Backfill SKUs for existing products
// Run BEFORE applying migration with: npx tsx scripts/backfill-skus.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { products } from '../drizzle/schema';
import { sql } from 'drizzle-orm';
import { SKUGenerator } from '../lib/skuGenerator';

async function backfillSKUs() {
  console.log('\n🔄 Backfilling SKUs for existing products...\n');

  try {
    // Check if sku column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sku'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('⚠️  SKU column already exists. This script should be run BEFORE migration.');
      console.log('   If you need to re-backfill, drop the column first or use a different approach.');
      process.exit(1);
    }

    // Add SKU column as nullable first
    console.log('📝 Adding SKU column (nullable)...');
    await db.execute(sql`ALTER TABLE products ADD COLUMN sku TEXT`);

    // Get all existing products ordered by creation date
    console.log('📊 Fetching existing products...');
    const existingProducts = await db.execute(sql`
      SELECT id, name, created_at 
      FROM products 
      ORDER BY created_at ASC
    `);

    if (existingProducts.rows.length === 0) {
      console.log('✅ No existing products found. SKU column added, ready for migration.');
      console.log('   You can now run: npm run db:push');
      return;
    }

    console.log(`   Found ${existingProducts.rows.length} products to backfill`);

    // Generate sequential SKUs starting from Aa1a01
    let currentSKU = SKUGenerator.getStartingSKU();
    const skuUpdates: Array<{ id: string; sku: string; name: string }> = [];

    for (const row of existingProducts.rows) {
      skuUpdates.push({
        id: row.id as string,
        sku: currentSKU,
        name: row.name as string,
      });

      // Generate next SKU
      const result = SKUGenerator.nextSKU(currentSKU);
      if (!result.success) {
        throw new Error(`Failed to generate SKU after ${currentSKU}: ${result.error}`);
      }
      currentSKU = result.sku!;
    }

    // Update each product with its SKU
    console.log('\n📝 Assigning SKUs to products...');
    for (const update of skuUpdates) {
      await db.execute(sql`
        UPDATE products 
        SET sku = ${update.sku} 
        WHERE id = ${update.id}
      `);
      console.log(`   ${update.sku} → ${update.name}`);
    }

    // Now make the column NOT NULL and add unique constraint
    console.log('\n🔒 Making SKU column NOT NULL and adding unique constraint...');
    await db.execute(sql`ALTER TABLE products ALTER COLUMN sku SET NOT NULL`);
    await db.execute(sql`ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku)`);

    console.log('\n✅ Backfill complete!');
    console.log(`   Assigned SKUs: ${skuUpdates[0].sku} to ${skuUpdates[skuUpdates.length - 1].sku}`);
    console.log(`   Next available SKU: ${currentSKU}`);
    console.log('\n⚠️  IMPORTANT: The migration file 0003_sticky_sentinel.sql has already been');
    console.log('   applied manually by this script. You should either:');
    console.log('   1. Delete 0003_sticky_sentinel.sql to prevent re-running it');
    console.log('   2. Or mark it as applied in your migration tracking');

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    console.error('\nYou may need to manually rollback changes:');
    console.error('   ALTER TABLE products DROP COLUMN sku;');
    throw error;
  }
}

// Run backfill
backfillSKUs()
  .then(() => {
    console.log('\n✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed!\n');
    console.error(error);
    process.exit(1);
  });
