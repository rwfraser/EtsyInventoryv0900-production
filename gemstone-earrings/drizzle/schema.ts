import { pgTable, text, timestamp, unique, numeric, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'), // 'user' or 'admin'
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: unique().on(table.identifier, table.token),
}));

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const carts = pgTable('carts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  items: text('items').notNull(), // JSON string
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text('sku').notNull().unique(), // Physical location: Rack-Shelf-Tray-Bin-Item (e.g., Aa1a01)
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  category: text('category'),
  
  // Original images (uploaded by user)
  image1: text('image1'),
  image2: text('image2'),
  image3: text('image3'),
  image4: text('image4'),
  
  // AI-enhanced images (processed by Gemini using baseline reference)
  enhancedImage1: text('enhanced_image1'),
  enhancedImage2: text('enhanced_image2'),
  enhancedImage3: text('enhanced_image3'),
  enhancedImage4: text('enhanced_image4'),
  
  stock: integer('stock').default(0).notNull(),
  
  // AI-enhanced content fields
  originalDescription: text('original_description'), // User-provided description
  aiDescription: text('ai_description'),             // AI-generated description (ChatGPT)
  aiKeywords: text('ai_keywords'),                   // JSON array of SEO keywords
  aiProcessedAt: timestamp('ai_processed_at'),       // When AI processing completed
  aiModelUsed: text('ai_model_used'),                // e.g., "gemini-3-pro-image-preview, gpt-5.2"
  embeddingVector: text('embedding_vector'),         // For RAG (JSON serialized vector)
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // pending, processing, shipped, delivered, cancelled
  items: text('items').notNull(), // JSON string
  shippingAddress: text('shipping_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat sessions - tracks individual chat conversations
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null for guest users
  sessionToken: text('session_token').notNull().unique(), // For guest session tracking
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  messageCount: integer('message_count').default(0).notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// Chat messages - individual messages in a conversation
export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user', 'assistant', 'system', 'function'
  content: text('content').notNull(),
  functionName: text('function_name'), // If role is 'function', which function was called
  functionArgs: text('function_args'), // JSON string of function arguments
  functionResult: text('function_result'), // JSON string of function result
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Chat analytics - track performance and insights
export const chatAnalytics = pgTable('chat_analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  productsViewed: text('products_viewed'), // JSON array of product IDs
  productsAddedToCart: text('products_added_to_cart'), // JSON array of product IDs
  queryType: text('query_type'), // 'product_search', 'support', 'general', etc.
  userSatisfaction: integer('user_satisfaction'), // 1-5 rating, null if not provided
  conversionOccurred: integer('conversion_occurred').default(0), // 0 or 1 (boolean)
  totalCostUsd: numeric('total_cost_usd', { precision: 10, scale: 4 }), // OpenAI API cost
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Virtual Try-On Sessions - tracks when users try on earrings
export const tryonSessions = pgTable('tryon_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null for guest users
  sessionToken: text('session_token').notNull(), // For guest session tracking
  selfieUrl: text('selfie_url'), // Vercel Blob URL for uploaded selfie
  faceLandmarks: text('face_landmarks'), // JSON string of detected facial landmarks
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Auto-cleanup after 24 hours
});

// Try-On Results - stores rendered images of earrings on users
export const tryonResults = pgTable('tryon_results', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => tryonSessions.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  resultImageUrl: text('result_image_url'), // Vercel Blob URL for rendered image
  renderingTime: integer('rendering_time'), // Milliseconds taken to render
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Product Try-On Assets - metadata for overlay rendering
export const productTryonAssets = pgTable('product_tryon_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  leftEarringUrl: text('left_earring_url'), // Transparent PNG for left ear
  rightEarringUrl: text('right_earring_url'), // Transparent PNG for right ear (or mirrored)
  realWorldWidth: numeric('real_world_width', { precision: 6, scale: 2 }), // Width in millimeters
  realWorldHeight: numeric('real_world_height', { precision: 6, scale: 2 }), // Height in millimeters
  anchorPointX: numeric('anchor_point_x', { precision: 4, scale: 3 }), // X coordinate (0-1) for attachment point
  anchorPointY: numeric('anchor_point_y', { precision: 4, scale: 3 }), // Y coordinate (0-1) for attachment point
  reflectivity: numeric('reflectivity', { precision: 3, scale: 2 }), // 0-1 for lighting effects
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
