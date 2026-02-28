import { db } from '../db';
import { products } from '@/drizzle/schema';
import { sql, and, gte, lte, like, or } from 'drizzle-orm';

/**
 * Search for products based on criteria
 */
export async function searchProducts(params: {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  products?: any[];
  count?: number;
  error?: string;
}> {
  try {
    const {
      query,
      minPrice,
      maxPrice,
      category,
      limit = 5,
    } = params;

    // Build where conditions
    const conditions = [];

    // Search by name or description if query provided
    if (query) {
      conditions.push(
        or(
          like(products.name, `%${query}%`),
          like(products.description, `%${query}%`),
          like(products.aiDescription, `%${query}%`),
          like(products.aiKeywords, `%${query}%`)
        )
      );
    }

    // Price range
    if (minPrice !== undefined) {
      conditions.push(gte(products.price, minPrice.toString()));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, maxPrice.toString()));
    }

    // Category filter
    if (category) {
      conditions.push(like(products.category, `%${category}%`));
    }

    // Only show products in stock
    conditions.push(gte(products.stock, 1));

    // Execute query
    let query_builder = db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        aiDescription: products.aiDescription,
        price: products.price,
        category: products.category,
        stock: products.stock,
        image1: products.image1,
        image2: products.image2,
        image3: products.image3,
        image4: products.image4,
      })
      .from(products);
    
    // Only add where clause if we have conditions
    if (conditions.length > 0) {
      query_builder = query_builder.where(and(...conditions));
    }
    
    const results = await query_builder
      .limit(Math.min(limit, 10))
      .execute();

    // Format results for GPT
    const formattedProducts = results.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.aiDescription || p.description,
      price: parseFloat(p.price),
      category: p.category,
      inStock: p.stock > 0,
      stockCount: p.stock,
      images: [p.image1, p.image2, p.image3, p.image4].filter(Boolean),
    }));

    return {
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
    };
  } catch (error) {
    console.error('searchProducts error:', error);
    return {
      success: false,
      error: 'Failed to search products',
    };
  }
}

/**
 * Get detailed information about a specific product
 */
export async function getProductDetails(params: {
  productId: string;
}): Promise<{
  success: boolean;
  product?: any;
  error?: string;
}> {
  try {
    const { productId } = params;

    const [product] = await db
      .select()
      .from(products)
      .where(sql`${products.id} = ${productId}`)
      .limit(1)
      .execute();

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    // Format product details
    const formattedProduct = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.aiDescription || product.description,
      originalDescription: product.description,
      price: parseFloat(product.price),
      category: product.category,
      stock: product.stock,
      inStock: product.stock > 0,
      images: [
        product.image1,
        product.image2,
        product.image3,
        product.image4,
      ].filter(Boolean),
      aiKeywords: product.aiKeywords ? JSON.parse(product.aiKeywords) : [],
      createdAt: product.createdAt,
    };

    return {
      success: true,
      product: formattedProduct,
    };
  } catch (error) {
    console.error('getProductDetails error:', error);
    return {
      success: false,
      error: 'Failed to get product details',
    };
  }
}

/**
 * Add product to cart
 * Note: This returns instructions for the frontend to handle
 * The actual cart manipulation happens on the client side
 */
export async function addToCart(params: {
  productId: string;
  quantity?: number;
}): Promise<{
  success: boolean;
  message?: string;
  product?: any;
  error?: string;
}> {
  try {
    const { productId, quantity = 1 } = params;

    // Verify product exists and is in stock
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        image1: products.image1,
      })
      .from(products)
      .where(sql`${products.id} = ${productId}`)
      .limit(1)
      .execute();

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    if (product.stock < quantity) {
      return {
        success: false,
        error: `Only ${product.stock} items in stock`,
      };
    }

    // Return success with product info
    // The frontend will handle actually adding to cart
    return {
      success: true,
      message: `Added ${quantity} x ${product.name} to cart`,
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity,
        image: product.image1,
      },
    };
  } catch (error) {
    console.error('addToCart error:', error);
    return {
      success: false,
      error: 'Failed to add to cart',
    };
  }
}

/**
 * Get cart contents
 * Note: This is a placeholder - actual cart is managed on frontend
 */
export async function getCartContents(params: {}): Promise<{
  success: boolean;
  message: string;
  cartItems?: number;
}> {
  // Since cart is managed on the frontend (CartContext),
  // we return a message indicating the user should check their cart icon
  return {
    success: true,
    message: 'Cart contents are displayed in the cart icon at the top of the page. I can help you add items to your cart!',
    cartItems: 0, // Frontend will show actual count
  };
}

/**
 * Initiate virtual try-on for a product
 * This returns instructions for the frontend to launch the try-on interface
 */
export async function startVirtualTryOn(params: {
  productId: string;
  productName: string;
}): Promise<{
  success: boolean;
  action: string;
  productId: string;
  productName: string;
  message: string;
}> {
  try {
    const { productId, productName } = params;

    // Verify product exists
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        image1: products.image1,
      })
      .from(products)
      .where(sql`${products.id} = ${productId}`)
      .limit(1)
      .execute();

    if (!product) {
      return {
        success: false,
        action: 'none',
        productId,
        productName,
        message: 'Product not found. Please try a different product.',
      };
    }

    return {
      success: true,
      action: 'start_tryon', // Frontend will recognize this action
      productId: product.id,
      productName: product.name,
      message: `Great! Let's see how the ${product.name} look on you. I'll open the virtual try-on feature where you can upload a photo or use your camera.`,
    };
  } catch (error) {
    console.error('startVirtualTryOn error:', error);
    return {
      success: false,
      action: 'none',
      productId: params.productId,
      productName: params.productName,
      message: 'Sorry, the virtual try-on feature is temporarily unavailable. Please try again later.',
    };
  }
}

/**
 * Execute a function call from GPT
 */
export async function executeFunctionCall(
  functionName: string,
  args: any
): Promise<any> {
  console.log(`Executing function: ${functionName}`, args);

  switch (functionName) {
    case 'searchProducts':
      return await searchProducts(args);

    case 'getProductDetails':
      return await getProductDetails(args);

    case 'addToCart':
      return await addToCart(args);

    case 'getCartContents':
      return await getCartContents(args);

    case 'startVirtualTryOn':
      return await startVirtualTryOn(args);

    default:
      return {
        success: false,
        error: `Unknown function: ${functionName}`,
      };
  }
}
