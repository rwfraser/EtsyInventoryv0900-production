import { relations } from "drizzle-orm/relations";
import { users, carts, orders, sessions, chatSessions, chatMessages, chatAnalytics, products, productTryonAssets, tryonSessions, tryonResults, apiKeys } from "./schema";

export const cartsRelations = relations(carts, ({one}) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	carts: many(carts),
	orders: many(orders),
	sessions: many(sessions),
	chatSessions: many(chatSessions),
	tryonSessions: many(tryonSessions),
	apiKeys: many(apiKeys),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id]
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({one, many}) => ({
	chatMessages: many(chatMessages),
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
	chatAnalytics: many(chatAnalytics),
}));

export const chatAnalyticsRelations = relations(chatAnalytics, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatAnalytics.sessionId],
		references: [chatSessions.id]
	}),
}));

export const productTryonAssetsRelations = relations(productTryonAssets, ({one}) => ({
	product: one(products, {
		fields: [productTryonAssets.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	productTryonAssets: many(productTryonAssets),
	tryonResults: many(tryonResults),
}));

export const tryonSessionsRelations = relations(tryonSessions, ({one, many}) => ({
	user: one(users, {
		fields: [tryonSessions.userId],
		references: [users.id]
	}),
	tryonResults: many(tryonResults),
}));

export const tryonResultsRelations = relations(tryonResults, ({one}) => ({
	tryonSession: one(tryonSessions, {
		fields: [tryonResults.sessionId],
		references: [tryonSessions.id]
	}),
	product: one(products, {
		fields: [tryonResults.productId],
		references: [products.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.createdById],
		references: [users.id]
	}),
}));