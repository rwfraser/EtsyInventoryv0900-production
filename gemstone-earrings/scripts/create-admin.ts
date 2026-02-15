// One-time script to create or promote admin user
// Run with: npx tsx scripts/create-admin.ts

import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@myearringadvisor.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function createOrPromoteAdmin() {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingUser.length > 0) {
      // User exists - promote to admin
      const [updated] = await db
        .update(users)
        .set({ 
          role: 'admin',
          emailVerified: new Date(), // Mark as verified
        })
        .where(eq(users.email, ADMIN_EMAIL))
        .returning();
      
      console.log(`✅ User ${updated.email} promoted to admin`);
      console.log(`   ID: ${updated.id}`);
    } else {
      // Create new admin user
      const hashedPassword = await hash(ADMIN_PASSWORD, 12);
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: ADMIN_NAME,
          role: 'admin',
          emailVerified: new Date(), // Pre-verified
        })
        .returning();
      
      console.log(`✅ Admin user created:`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`\n⚠️  IMPORTANT: Change this password after first login!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOrPromoteAdmin();
