import { pgTable, unique, text, timestamp, foreignKey, numeric, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	unique("verification_tokens_identifier_token_unique").on(table.identifier, table.token),
	unique("verification_tokens_token_unique").on(table.token),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text(),
	role: text().default('user').notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const carts = pgTable("carts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	items: text().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("carts_user_id_unique").on(table.userId),
]);

export const orders = pgTable("orders", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	items: text().notNull(),
	shippingAddress: text("shipping_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: text("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_session_token_unique").on(table.sessionToken),
]);

export const chatMessages = pgTable("chat_messages", {
	id: text().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	functionName: text("function_name"),
	functionArgs: text("function_args"),
	functionResult: text("function_result"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSessions.id],
			name: "chat_messages_session_id_chat_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	imageUrl: text("image_url"),
	category: text(),
	image1: text(),
	image2: text(),
	image3: text(),
	image4: text(),
	stock: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	enhancedImage1: text("enhanced_image1"),
	enhancedImage2: text("enhanced_image2"),
	enhancedImage3: text("enhanced_image3"),
	enhancedImage4: text("enhanced_image4"),
	originalDescription: text("original_description"),
	aiDescription: text("ai_description"),
	aiKeywords: text("ai_keywords"),
	aiProcessedAt: timestamp("ai_processed_at", { mode: 'string' }),
	aiModelUsed: text("ai_model_used"),
	embeddingVector: text("embedding_vector"),
	sku: text().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	sessionToken: text("session_token").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow().notNull(),
	messageCount: integer("message_count").default(0).notNull(),
	userAgent: text("user_agent"),
	ipAddress: text("ip_address"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_sessions_user_id_users_id_fk"
		}).onDelete("set null"),
	unique("chat_sessions_session_token_unique").on(table.sessionToken),
]);

export const chatAnalytics = pgTable("chat_analytics", {
	id: text().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	productsViewed: text("products_viewed"),
	productsAddedToCart: text("products_added_to_cart"),
	queryType: text("query_type"),
	userSatisfaction: integer("user_satisfaction"),
	conversionOccurred: integer("conversion_occurred").default(0),
	totalCostUsd: numeric("total_cost_usd", { precision: 10, scale:  4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSessions.id],
			name: "chat_analytics_session_id_chat_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const productTryonAssets = pgTable("product_tryon_assets", {
	id: text().primaryKey().notNull(),
	productId: text("product_id").notNull(),
	leftEarringUrl: text("left_earring_url"),
	rightEarringUrl: text("right_earring_url"),
	realWorldWidth: numeric("real_world_width", { precision: 6, scale:  2 }),
	realWorldHeight: numeric("real_world_height", { precision: 6, scale:  2 }),
	anchorPointX: numeric("anchor_point_x", { precision: 4, scale:  3 }),
	anchorPointY: numeric("anchor_point_y", { precision: 4, scale:  3 }),
	reflectivity: numeric({ precision: 3, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_tryon_assets_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("product_tryon_assets_product_id_unique").on(table.productId),
]);

export const tryonSessions = pgTable("tryon_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	sessionToken: text("session_token").notNull(),
	selfieUrl: text("selfie_url"),
	faceLandmarks: text("face_landmarks"),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tryon_sessions_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const tryonResults = pgTable("tryon_results", {
	id: text().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	productId: text("product_id").notNull(),
	resultImageUrl: text("result_image_url"),
	renderingTime: integer("rendering_time"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [tryonSessions.id],
			name: "tryon_results_session_id_tryon_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "tryon_results_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	keyHash: text("key_hash").notNull(),
	keyPrefix: text("key_prefix").notNull(),
	createdById: text("created_by_id"),
	isActive: integer("is_active").default(1).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "api_keys_created_by_id_users_id_fk"
		}).onDelete("set null"),
	unique("api_keys_key_hash_unique").on(table.keyHash),
]);
