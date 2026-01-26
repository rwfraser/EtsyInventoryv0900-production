import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

async function addRoleAndPromoteAdmin() {
  try {
    console.log('Starting migration...');
    
    // Check if role column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (result.rows.length === 0) {
      console.log('Adding role column to users table...');
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN role text DEFAULT 'user' NOT NULL
      `);
      console.log('Role column added successfully');
    } else {
      console.log('Role column already exists');
    }
    
    // Promote rogeridaho@gmail.com to admin
    console.log('Promoting rogeridaho@gmail.com to admin...');
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'rogeridaho@gmail.com'))
      .returning();
    
    if (updatedUser) {
      console.log(`Successfully promoted ${updatedUser.email} to admin`);
    } else {
      console.log('User rogeridaho@gmail.com not found');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addRoleAndPromoteAdmin();
