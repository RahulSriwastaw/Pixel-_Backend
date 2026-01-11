import { db } from "./db";
import {
  users, creators, designs, orders, reviews,
  type InsertUser, type InsertDesign, type InsertOrder, type InsertReview,
  type User, type Creator, type Design, type Order, type Review
} from "@shared/schema";
import { eq, desc, ilike, and, or } from "drizzle-orm";

export interface IStorage {
  // Users & Creators
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCreator(id: number): Promise<(Creator & { user: User }) | undefined>;
  getCreators(): Promise<(Creator & { user: User })[]>;
  createCreator(userId: number, bio: string, profileImage: string): Promise<Creator>;

  // Designs
  getDesign(id: number): Promise<(Design & { creator: Creator & { user: User } }) | undefined>;
  getDesigns(filters?: { category?: string; creatorId?: number; search?: string }): Promise<(Design & { creator: Creator & { user: User } })[]>;
  createDesign(design: InsertDesign): Promise<Design>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<(Order & { design: Design })[]>;

  // Reviews
  getReviewsByDesign(designId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCreator(id: number): Promise<(Creator & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(creators)
      .innerJoin(users, eq(creators.userId, users.id))
      .where(eq(creators.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].creators,
      user: result[0].users
    };
  }

  async getCreators(): Promise<(Creator & { user: User })[]> {
    const result = await db
      .select()
      .from(creators)
      .innerJoin(users, eq(creators.userId, users.id));
    
    return result.map(r => ({ ...r.creators, user: r.users }));
  }

  async createCreator(userId: number, bio: string, profileImage: string): Promise<Creator> {
    const [creator] = await db.insert(creators).values({
      userId,
      bio,
      profileImage,
      rating: "5.0",
      totalOrders: 0
    }).returning();
    return creator;
  }

  async getDesign(id: number): Promise<(Design & { creator: Creator & { user: User } }) | undefined> {
    const result = await db
      .select()
      .from(designs)
      .innerJoin(creators, eq(designs.creatorId, creators.id))
      .innerJoin(users, eq(creators.userId, users.id))
      .where(eq(designs.id, id));

    if (result.length === 0) return undefined;

    return {
      ...result[0].designs,
      creator: {
        ...result[0].creators,
        user: result[0].users
      }
    };
  }

  async getDesigns(filters?: { category?: string; creatorId?: number; search?: string }): Promise<(Design & { creator: Creator & { user: User } })[]> {
    let query = db
      .select()
      .from(designs)
      .innerJoin(creators, eq(designs.creatorId, creators.id))
      .innerJoin(users, eq(creators.userId, users.id))
      .$dynamic();

    if (filters?.category) {
      query = query.where(eq(designs.category, filters.category));
    }
    
    if (filters?.creatorId) {
      query = query.where(eq(designs.creatorId, filters.creatorId));
    }

    if (filters?.search) {
      query = query.where(ilike(designs.title, `%${filters.search}%`));
    }

    const result = await query;
    return result.map(r => ({
      ...r.designs,
      creator: {
        ...r.creators,
        user: r.users
      }
    }));
  }

  async createDesign(design: InsertDesign): Promise<Design> {
    const [d] = await db.insert(designs).values(design).returning();
    return d;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [o] = await db.insert(orders).values(order).returning();
    return o;
  }

  async getOrdersByUser(userId: number): Promise<(Order & { design: Design })[]> {
    const result = await db
      .select()
      .from(orders)
      .innerJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
      
    return result.map(r => ({ ...r.orders, design: r.designs }));
  }

  async getReviewsByDesign(designId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.designId, designId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [r] = await db.insert(reviews).values(review).returning();
    return r;
  }
}

export const storage = new DatabaseStorage();
