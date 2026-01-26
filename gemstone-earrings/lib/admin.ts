import { auth } from './auth';
import { redirect } from 'next/navigation';

/**
 * Server-side utility to check if the current user is an admin
 * Returns the session if admin, redirects to home if not
 */
export async function requireAdmin() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  if (session.user.role !== 'admin') {
    redirect('/');
  }
  
  return session;
}

/**
 * Server-side utility to check if user is admin without redirecting
 * Returns true if admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'admin';
}

/**
 * Server-side utility to get current user's role
 */
export async function getUserRole(): Promise<string | null> {
  const session = await auth();
  return session?.user?.role || null;
}
