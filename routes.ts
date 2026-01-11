import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingCreators = await storage.getCreators();
  if (existingCreators.length === 0) {
    console.log("Seeding database...");
    // Create users/creators
    const user1 = await storage.createUser({ 
      username: "alex_design", email: "alex@test.com", password: "password", name: "Alex Chen", role: "creator" 
    });
    const creator1 = await storage.createCreator(user1.id, "Professional graphic designer with 5 years of experience in branding and social media.", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400");

    const user2 = await storage.createUser({ 
      username: "sarah_studio", email: "sarah@test.com", password: "password", name: "Sarah Miller", role: "creator" 
    });
    const creator2 = await storage.createCreator(user2.id, "Specialist in high-conversion YouTube thumbnails and ad creatives.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400");

    // Create Designs
    await storage.createDesign({
      creatorId: creator1.id,
      title: "Viral Gaming Thumbnail Pack",
      description: "High CTR thumbnails for gaming channels. Includes 5 customizable PSD files.",
      price: "25.00",
      deliveryTimeHours: 24,
      category: "YouTube Thumbnail",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600",
      rating: "4.9",
      likes: 124,
      ordersCount: 45,
      badge: "Trending"
    });

    await storage.createDesign({
      creatorId: creator1.id,
      title: "Modern Tech Event Poster",
      description: "Clean, modern poster design for tech conferences and meetups.",
      price: "45.00",
      deliveryTimeHours: 48,
      category: "Poster",
      image: "https://images.unsplash.com/photo-1558655146-d09347e0b7a9?w=600",
      rating: "4.7",
      likes: 89,
      ordersCount: 22,
      badge: "Top Rated"
    });

    await storage.createDesign({
      creatorId: creator2.id,
      title: "E-commerce Sale Banner Set",
      description: "Complete set of social media banners for seasonal sales.",
      price: "30.00",
      deliveryTimeHours: 24,
      category: "Banner",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600",
      rating: "5.0",
      likes: 210,
      ordersCount: 89,
      badge: "Trending"
    });

    await storage.createDesign({
      creatorId: creator2.id,
      title: "Podcast Cover Art",
      description: "Eye-catching artwork for your new podcast.",
      price: "35.00",
      deliveryTimeHours: 48,
      category: "Poster",
      image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=600",
      rating: "4.8",
      likes: 56,
      ordersCount: 15,
      badge: "New"
    });
    console.log("Database seeded!");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data on startup
  seedDatabase();

  // Designs
  app.get(api.designs.list.path, async (req, res) => {
    try {
      const filters = req.query as { category?: string; sort?: string; creatorId?: string; search?: string };
      const designs = await storage.getDesigns({
        category: filters.category,
        creatorId: filters.creatorId ? parseInt(filters.creatorId) : undefined,
        search: filters.search
      });
      res.json(designs);
    } catch (e) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.designs.get.path, async (req, res) => {
    const design = await storage.getDesign(parseInt(req.params.id));
    if (!design) return res.status(404).json({ message: "Design not found" });
    res.json(design);
  });

  app.get(api.designs.getReviews.path, async (req, res) => {
    const reviews = await storage.getReviewsByDesign(parseInt(req.params.id));
    res.json(reviews);
  });

  // Creators
  app.get(api.creators.list.path, async (req, res) => {
    const creators = await storage.getCreators();
    res.json(creators);
  });

  app.get(api.creators.get.path, async (req, res) => {
    const creator = await storage.getCreator(parseInt(req.params.id));
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    res.json(creator);
  });

  // Orders (Dummy)
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    // Return empty list or dummy orders for now (since no real auth)
    res.json([]); 
  });

  // Auth (Dummy)
  app.post(api.auth.login.path, async (req, res) => {
    // Dummy login success
    const user = await storage.getUserByEmail(req.body.email);
    if (user && user.password === req.body.password) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  return httpServer;
}
