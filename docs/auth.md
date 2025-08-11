# Authentication and Authorization

## Stack

- **NextAuth.js v4** — session management, provider abstraction, JWT strategy
- **bcryptjs** — password hashing (cost factor 12)
- **JWT** — session tokens stored in an HTTP-only cookie

## Authentication Flow

### Registration

```
POST /api/auth/register
  → Zod validation (name, email, password, confirmPassword)
  → Check email uniqueness in DB
  → bcrypt.hash(password, 12)
  → prisma.user.create({ role: 'CUSTOMER' })
  → Return user profile (no password field)
```

The route never returns the hashed password. Role is always set to `CUSTOMER` at registration regardless of what the request body contains.

### Login

```
POST /api/auth/callback/credentials  (handled by NextAuth)
  → credentials provider authorize()
  → prisma.user.findUnique({ where: { email } })
  → bcrypt.compare(plaintext, hash)
  → Return { id, email, name, role } if valid, null if not
```

Returning `null` from `authorize()` causes NextAuth to redirect to the login page with an error. The error is intentionally vague ("Invalid email or password") — distinguishing between "email not found" and "wrong password" leaks information about which emails are registered.

### Session Token

After login, NextAuth calls the `jwt` callback to build the token:

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.role = user.role
  }
  return token
}
```

The `user` argument is only present on initial sign-in. On subsequent requests the callback receives only `token`, which already contains `id` and `role` from the first call.

The `session` callback makes these available on the session object:

```typescript
async session({ session, token }) {
  session.user.id = token.id
  session.user.role = token.role
  return session
}
```

`getServerSession(authOptions)` on any server-side call returns this augmented session with `id` and `role` available.

## RBAC

There are two roles: `CUSTOMER` and `ADMIN`.

### Enforcing RBAC in Route Handlers

Every admin route handler calls `requireAdmin()` before doing anything:

```typescript
function requireAdmin(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null  // null means "proceed"
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  const guard = requireAdmin(session)
  if (guard) return guard
  // ... admin logic
}
```

The distinction between 401 and 403 matters: 401 means "not authenticated" (no session), 403 means "authenticated but not authorized" (wrong role).

### Enforcing RBAC in Pages

The admin layout (`src/app/admin/layout.tsx`) checks the session server-side and redirects unauthenticated or non-admin users:

```typescript
const session = await getServerSession(authOptions)
if (!session?.user || session.user.role !== 'ADMIN') {
  redirect('/login')
}
```

This is the page-level guard. The API-level guard on route handlers is separate and must also exist — the page guard only prevents the UI from rendering, not direct API calls.

### Resource Ownership

Customer-facing routes that access user data (cart, orders) read the user ID from the session, never from the request body or URL:

```typescript
// Correct
const userId = (session.user as any).id

// Wrong — user could pass any ID
const userId = req.nextUrl.searchParams.get('userId')
```

The cart `updateItem` and `removeItem` operations additionally verify the item belongs to the authenticated user's cart before making any change:

```typescript
const item = await prisma.cartItem.findUnique({
  where: { id: itemId },
  include: { cart: true },
})
if (!item || item.cart.userId !== userId) {
  throw new Error('Cart item not found')
}
```

This prevents horizontal privilege escalation — user A cannot modify user B's cart by guessing item IDs.

## Password Security

- Hashed with bcrypt, cost factor 12
- bcrypt is slow by design — this makes brute-force attacks expensive
- The `password` field is never selected in Prisma queries that return user data to the client
- Password is only fetched in the NextAuth `authorize` function where the comparison happens

## Cookie Security

NextAuth stores the JWT in an HTTP-only, `Secure`, `SameSite=Lax` cookie by default. This means:
- JavaScript in the browser cannot read the token (XSS protection)
- The cookie is only sent over HTTPS in production
- CSRF is mitigated by SameSite

## Session Expiry

The default NextAuth JWT strategy issues tokens that expire in 30 days. After expiry the user is redirected to `/login`. The `NEXTAUTH_SECRET` environment variable is used to sign and verify the JWT.

## Auth

Credentials provider with bcrypt hashing. JWT sessions, no DB sessions.

## Registration

bcrypt cost 12. Email uniqueness enforced at DB level.

## Login

Credential login returns JWT with userId, email, and role.

## Profile

Users update display name, email, and password.

## Token Rotation

Refresh tokens rotate on every use. Old tokens invalidated.
