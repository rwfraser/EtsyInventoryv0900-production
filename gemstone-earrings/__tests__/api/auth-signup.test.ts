import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com', name: 'Test' }]),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock email
vi.mock('@/lib/email', () => ({
  generateVerificationToken: vi.fn().mockResolvedValue('mock-token'),
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

import { POST } from '@/app/api/auth/signup/route';
import { db } from '@/lib/db';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no existing user
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  } as any);

  // Default: insert succeeds
  vi.mocked(db.insert).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        { id: 'new-user-id', email: 'test@example.com', name: 'Test' },
      ]),
    }),
  } as any);
});

describe('POST /api/auth/signup', () => {
  it('returns 400 when email is missing', async () => {
    const response = await POST(makeRequest({ password: 'pass123', name: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 when password is missing', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com', name: 'Test' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 when name is missing', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com', password: 'pass123' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('creates user and sends verification email on valid input', async () => {
    const response = await POST(
      makeRequest({ email: 'new@example.com', password: 'password123', name: 'New User' })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toContain('User created successfully');
    expect(data.userId).toBe('new-user-id');
    expect(data.emailSent).toBe(true);
  });

  it('returns 400 when user already exists and is verified', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'existing-id', email: 'existing@example.com', emailVerified: new Date() },
        ]),
      }),
    } as any);

    const response = await POST(
      makeRequest({ email: 'existing@example.com', password: 'pass', name: 'Existing' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already exists');
  });

  it('resends verification when user exists but is unverified', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'unverified-id', email: 'unverified@example.com', emailVerified: null },
        ]),
      }),
    } as any);

    const response = await POST(
      makeRequest({ email: 'unverified@example.com', password: 'pass', name: 'Unverified' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resent).toBe(true);
  });
});
