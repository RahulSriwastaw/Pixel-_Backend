import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("customer"), // customer, creator
  createdAt: timestamp("created_at").defaultNow(),
});

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bio: text("bio").notNull(),
  profileImage: text("profile_image").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("0.0"),
  totalOrders: integer("total_orders").default(0),
});

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryTimeHours: integer("delivery_time_hours").notNull(),
  category: text("category").notNull(), // YouTube Thumbnail, Poster, Banner
  image: text("image").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("0.0"),
  likes: integer("likes").default(0),
  ordersCount: integer("orders_count").default(0),
  badge: text("badge"), // Top, Trending, New, null
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => designs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending"),
  instructions: text("instructions"),
  logoUrl: text("logo_url"),
  referenceImages: text("reference_images").array(),
  preferredColors: text("preferred_colors").array(),
  useOfficialColors: boolean("use_official_colors").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => designs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(), // Snapshot of name
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCreatorSchema = createInsertSchema(creators).omit({ id: true });
export const insertDesignSchema = createInsertSchema(designs).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Extended types for frontend display
export type DesignWithCreator = Design & { creator: Creator & { user: User } };
