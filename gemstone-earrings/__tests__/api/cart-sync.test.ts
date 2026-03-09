import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

import { POST } from '@/app/api/cart/sync/route';
import { db } from '@/lib/db';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/cart/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/cart/sync', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(makeRequest({ items: [] }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const response = await POST(makeRequest({ items: [] }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('creates new cart when user has no existing cart', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } });

    // No existing cart
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    // Insert returns new cart
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: 'cart-1', userId: 'user-1', items: '[]', updatedAt: new Date() },
        ]),
      }),
    } as any);

    const response = await POST(makeRequest({ items: [{ id: 'prod-1', quantity: 2 }] }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('synced');
  });

  it('updates existing cart', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } });

    // Existing cart found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 'cart-1', userId: 'user-1', items: '[]', updatedAt: new Date() },
        ]),
      }),
    } as any);

    // Update returns updated cart
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'cart-1', userId: 'user-1', items: '[{"id":"prod-1","quantity":3}]', updatedAt: new Date() },
          ]),
        }),
      }),
    } as any);

    const response = await POST(makeRequest({ items: [{ id: 'prod-1', quantity: 3 }] }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('synced');
  });
});
