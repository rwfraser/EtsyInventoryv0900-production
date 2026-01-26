import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, orders } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// This route should be called once to set up the role column and promote the initial admin
// It also creates products and orders tables if they don't exist
export async function POST() {
  try {
    // Check if role column exists
    const roleCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `) as any;
    
    if (!roleCheck || roleCheck.length === 0) {
      // Add role column
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN role text DEFAULT 'user' NOT NULL
      `);
    }
    
    // Check if products table exists
    const productsCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'products'
    `) as any;
    
    if (!productsCheck || productsCheck.length === 0) {
      // Create products table
      await db.execute(sql`
        CREATE TABLE products (
          id text PRIMARY KEY,
          name text NOT NULL,
          description text,
          price numeric(10, 2) NOT NULL,
          image_url text,
          category text,
          stock integer DEFAULT 0 NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        )
      `);
    }
    
    // Check if orders table exists
    const ordersCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'orders'
    `) as any;
    
    if (!ordersCheck || ordersCheck.length === 0) {
      // Create orders table
      await db.execute(sql`
        CREATE TABLE orders (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total numeric(10, 2) NOT NULL,
          status text DEFAULT 'pending' NOT NULL,
          items text NOT NULL,
          shipping_address text,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        )
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
        message: `Successfully set up database and promoted ${updatedUser.email} to admin`,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Database setup complete. User rogeridaho@gmail.com not found for promotion.',
      });
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
