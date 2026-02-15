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
