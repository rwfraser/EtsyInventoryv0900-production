import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// One-time setup endpoint to promote the first admin
// Should be disabled after initial setup
export async function POST(request: NextRequest) {
  try {
    // Simple protection - require secret key
    const { secret, email } = await request.json();
    
    if (secret !== process.env.INITIAL_ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Check if any admin already exists
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (existingAdmins.length > 0) {
      return NextResponse.json(
        { 
          error: 'Admin already exists',
          message: 'This endpoint can only be used once to create the initial admin'
        },
        { status: 403 }
      );
    }

    // Find and promote user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Promote to admin and ensure verified
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: 'admin',
        emailVerified: user.emailVerified || new Date(),
      })
      .where(eq(users.email, email))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Initial admin created successfully',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Initial admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to promote user' },
      { status: 500 }
    );
  }
}
