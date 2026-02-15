import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      // If user exists but is not verified, resend verification email
      if (!existingUser.emailVerified) {
        try {
          const token = await generateVerificationToken(email);
          const result = await sendVerificationEmail(email, token);
          
          if (result.success) {
            return NextResponse.json(
              { 
                message: 'Your account already exists but is not verified. We\'ve sent a new verification email.',
                resent: true 
              },
              { status: 200 }
            );
          } else {
            return NextResponse.json(
              { error: 'Your account exists but is not verified. Please contact support to verify your account.' },
              { status: 400 }
            );
          }
        } catch (err) {
          console.error('Failed to resend verification:', err);
          return NextResponse.json(
            { error: 'Your account exists but is not verified. Please contact support to verify your account.' },
            { status: 400 }
          );
        }
      }
      
      // User exists and is verified
      return NextResponse.json(
        { error: 'User with this email already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
    }).returning();

    // Generate and send verification email
    const token = await generateVerificationToken(email);
    const emailResult = await sendVerificationEmail(email, token);

    if (!emailResult.success) {
      console.error('Failed to send verification email to new user:', email);
      // User was created but email failed - they'll need to use resend or manual verification
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        userId: user.id,
        emailSent: emailResult.success
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
