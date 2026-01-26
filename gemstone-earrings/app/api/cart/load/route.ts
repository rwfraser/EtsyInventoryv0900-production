import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { carts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [cart] = await db.select().from(carts).where(eq(carts.userId, session.user.id));

    if (!cart) {
      return NextResponse.json(
        { items: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { items: JSON.parse(cart.items) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cart load error:', error);
    return NextResponse.json(
      { error: 'Failed to load cart' },
      { status: 500 }
    );
  }
}
