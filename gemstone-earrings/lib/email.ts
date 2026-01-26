import { Resend } from 'resend';
import { db } from './db';
import { users, verificationTokens } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this email
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

  // Create new token
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email for Gemstone Earrings',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9333ea;">Welcome to Gemstone Earrings!</h1>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
}

export async function verifyEmailToken(token: string) {
  const [verificationToken] = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token));

  if (!verificationToken) {
    return { success: false, message: 'Invalid token' };
  }

  if (verificationToken.expires < new Date()) {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
    return { success: false, message: 'Token expired' };
  }

  // Mark user as verified
  await db.update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, verificationToken.identifier));

  // Delete the token
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  return { success: true, email: verificationToken.identifier };
}
