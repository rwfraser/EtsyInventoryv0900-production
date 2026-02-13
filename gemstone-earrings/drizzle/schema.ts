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
  image1: text('image1'),
  image2: text('image2'),
  image3: text('image3'),
  image4: text('image4'),
  stock: integer('stock').default(0).notNull(),
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
