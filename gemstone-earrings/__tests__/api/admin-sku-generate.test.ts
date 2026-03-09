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
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

import { GET, POST } from '@/app/api/admin/sku/generate/route';
import { db } from '@/lib/db';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/sku/generate', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('returns 401 when user is not admin', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user', email: 'user@test.com' } });

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('returns starting SKU when database is empty', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Recent products query: select → from → orderBy → limit
        return {
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any;
      } else {
        // Collision check query: select → from → where → limit
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any;
      }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sku).toBe('Aa1a01');
  });

  it('returns next sequential SKU when products exist', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    // First call: get recent products (returns one)
    // Second call: get all SKUs
    // Third call: collision check (none)
    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Recent products query
        return {
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ sku: 'Aa1a01', createdAt: new Date() }]),
            }),
          }),
        } as any;
      } else if (callCount === 2) {
        // All SKUs query
        return {
          from: vi.fn().mockResolvedValue([{ sku: 'Aa1a01' }]),
        } as any;
      } else {
        // Collision check query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any;
      }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sku).toBe('Aa1a02');
  });
});

describe('POST /api/admin/sku/generate (validate)', () => {
  it('returns 401 when not admin', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'Aa1a01' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns valid=false for invalid SKU format', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'invalid' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain('Invalid SKU format');
  });

  it('returns valid=true and available=true for unused valid SKU', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'Aa1a01' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.available).toBe(true);
  });

  it('returns valid=true and available=false for existing SKU', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ sku: 'Aa1a01' }]),
        }),
      }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'Aa1a01' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.available).toBe(false);
  });

  it('returns 400 when SKU is not provided', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });

    const request = new NextRequest('http://localhost:3000/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });
});
