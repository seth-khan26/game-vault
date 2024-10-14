import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { RegisterInput, UserProfile } from './types'

export async function registerUser(input: RegisterInput): Promise<UserProfile> {
  const { name, email, password } = input

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error('An account with this email already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      addresses: {
        select: {
          id: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          isDefault: true,
        },
      },
    },
  })

  return user
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      addresses: {
        select: {
          id: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          isDefault: true,
        },
      },
    },
  })

  return user
}
