import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const shippingAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(5, 'Valid postal code required'),
  country: z.string().min(1, 'Country is required'),
})

export const addToCartSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  saveAddress: z.boolean().optional().default(false),
})

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  developer: z.string().min(1, 'Developer is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  releaseDate: z.string().min(1, 'Release date is required'),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  genreIds: z.array(z.string()).min(1, 'At least one genre required'),
  images: z
    .array(
      z.object({
        url: z.string().url('Valid URL required'),
        alt: z.string().min(1, 'Alt text required'),
        isPrimary: z.boolean().default(false),
      }),
    )
    .min(1, 'At least one image required'),
  variants: z
    .array(
      z.object({
        platform: z.enum(['PS4', 'PS5']),
        sku: z.string().min(1, 'SKU required'),
        price: z.number().positive('Price must be positive'),
        inventory: z.number().int().min(0, 'Inventory cannot be negative'),
      }),
    )
    .min(1, 'At least one variant required'),
})

export const orderStatusSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
})

export const inventoryUpdateSchema = z.object({
  variantId: z.string().min(1),
  inventory: z.number().int().min(0),
})

export const catalogFilterSchema = z.object({
  platform: z.enum(['PS4', 'PS5']).optional(),
  genre: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
  availability: z.enum(['in-stock', 'all']).optional(),
  sort: z
    .enum(['relevance', 'newest', 'price_asc', 'price_desc', 'popularity'])
    .optional()
    .default('newest'),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(48).optional().default(12),
})
