import { Role } from '@prisma/client'

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: Role
  createdAt: Date
  addresses: {
    id: string
    line1: string
    line2: string | null
    city: string
    state: string
    postalCode: string
    country: string
    isDefault: boolean
  }[]
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}
