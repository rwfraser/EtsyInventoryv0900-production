import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// This route should be called once to set up the role column and promote the initial admin
// After running once, you should delete or protect this route
export async function POST() {
  try {
    // Check if role column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (result.rows.length === 0) {
      // Add role column
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN role text DEFAULT 'user' NOT NULL
      `);
    }
    
    // Promote rogeridaho@gmail.com to admin
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'rogeridaho@gmail.com'))
      .returning();
    
    if (updatedUser) {
      return NextResponse.json({
        success: true,
        message: `Successfully promoted ${updatedUser.email} to admin`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'User rogeridaho@gmail.com not found',
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error.message,
    }, { status: 500 });
  }
}
