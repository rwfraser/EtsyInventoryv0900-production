import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/email';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token' },
      { status: 400 }
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: 'Email verified successfully', email: result.email },
    { status: 200 }
  );
}
