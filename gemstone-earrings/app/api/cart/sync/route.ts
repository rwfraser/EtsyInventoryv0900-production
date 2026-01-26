import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { carts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { items } = await request.json();

    // Upsert cart (update if exists, create if not)
    const [existingCart] = await db.select().from(carts).where(eq(carts.userId, session.user.id));
    
    let cart;
    if (existingCart) {
      [cart] = await db.update(carts)
        .set({ items: JSON.stringify(items), updatedAt: new Date() })
        .where(eq(carts.userId, session.user.id))
        .returning();
    } else {
      [cart] = await db.insert(carts).values({
        userId: session.user.id,
        items: JSON.stringify(items),
      }).returning();
    }

    return NextResponse.json(
      { message: 'Cart synced successfully', cart },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cart sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync cart' },
      { status: 500 }
    );
  }
}
