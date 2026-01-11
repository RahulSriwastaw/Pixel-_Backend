import { z } from 'zod';
import { insertUserSchema, insertDesignSchema, insertOrderSchema, insertReviewSchema, designs, creators, users, orders, reviews } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  designs: {
    list: {
      method: 'GET' as const,
      path: '/api/designs',
      input: z.object({
        category: z.string().optional(),
        sort: z.enum(['popular', 'newest', 'rating', 'price_asc', 'price_desc']).optional(),
        creatorId: z.coerce.number().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof designs.$inferSelect & { creator: typeof creators.$inferSelect & { user: typeof users.$inferSelect } }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/designs/:id',
      responses: {
        200: z.custom<typeof designs.$inferSelect & { creator: typeof creators.$inferSelect & { user: typeof users.$inferSelect } }>(),
        404: errorSchemas.notFound,
      },
    },
    getReviews: {
      method: 'GET' as const,
      path: '/api/designs/:id/reviews',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    }
  },
  creators: {
    list: {
      method: 'GET' as const,
      path: '/api/creators',
      responses: {
        200: z.array(z.custom<typeof creators.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/creators/:id',
      responses: {
        200: z.custom<typeof creators.$inferSelect & { user: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect & { design: typeof designs.$inferSelect }>()),
      },
    }
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
