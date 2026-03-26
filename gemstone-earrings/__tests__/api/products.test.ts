import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  },
}));

// Mock API authentication to always succeed in tests
vi.mock('@/lib/api-auth', () => ({
  validateApiKey: vi.fn().mockResolvedValue({ valid: true, keyId: 'test-key', keyName: 'Test Key' }),
  unauthorizedResponse: vi.fn((message: string) => new Response(JSON.stringify({ error: message }), { status: 401 })),
}));

import { GET } from '@/app/api/products/route';
import { db } from '@/lib/db';

// Helper to create mock request
function createMockRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/products', {
    headers: { 'Authorization': 'Bearer mea_test_key_12345678901234567890' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/products', () => {
  it('returns products array when database has products', async () => {
    const mockProducts = [
      {
        id: 'test-id-1',
        sku: 'Aa1a01',
        name: 'Amethyst Studs',
        description: 'Beautiful amethyst earrings',
        price: '29.99',
        imageUrl: null,
        category: 'Earrings',
        image1: 'https://example.com/img1.jpg',
        image2: null,
        image3: null,
        image4: null,
        enhancedImage1: null,
        enhancedImage2: null,
        enhancedImage3: null,
        enhancedImage4: null,
        stock: 5,
        originalDescription: null,
        aiDescription: null,
        aiKeywords: null,
        aiProcessedAt: null,
        aiModelUsed: null,
        embeddingVector: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockProducts),
      }),
    } as any);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(1);
    expect(data.products[0].pair_id).toBe('DB_test-id-1');
    expect(data.products[0].setting.product_title).toBe('Amethyst Studs');
  });

  it('returns empty array when database is empty', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(0);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('Connection failed')),
      }),
    } as any);

    const response = await GET(createMockRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('builds images array from all image fields', async () => {
    const mockProducts = [
      {
        id: 'test-id-2',
        sku: 'Aa1a02',
        name: 'Ruby Drops',
        description: null,
        price: '49.99',
        imageUrl: 'https://example.com/legacy.jpg',
        category: 'Earrings',
        image1: 'https://example.com/img1.jpg',
        image2: 'https://example.com/img2.jpg',
        image3: null,
        image4: null,
        enhancedImage1: null,
        enhancedImage2: null,
        enhancedImage3: null,
        enhancedImage4: null,
        stock: 3,
        originalDescription: null,
        aiDescription: null,
        aiKeywords: null,
        aiProcessedAt: null,
        aiModelUsed: null,
        embeddingVector: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockProducts),
      }),
    } as any);

    const response = await GET(createMockRequest());
    const data = await response.json();

    // Should include image1, image2, and legacy imageUrl (not null image3/image4)
    expect(data.products[0].images).toHaveLength(3);
    expect(data.products[0].images).toContain('https://example.com/img1.jpg');
    expect(data.products[0].images).toContain('https://example.com/img2.jpg');
    expect(data.products[0].images).toContain('https://example.com/legacy.jpg');
  });
});
