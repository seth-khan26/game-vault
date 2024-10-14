/**
 * Run with: npm run seed:embeddings
 *
 * Embeds every active product and upserts into the ProductEmbedding table.
 * Requires the pgvector migration to have been applied first.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = process.env.EMBEDDING_BASE_URL!
const MODEL = process.env.EMBEDDING_MODEL!
const API_KEY = process.env.EMBEDDING_API_KEY!

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/models/${MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding API [${res.status}]: ${body}`)
  }

  const data = await res.json()
  return Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[])
}

function buildDocument(product: {
  title: string
  description: string
  developer: string
  publisher: string
  genres: { name: string }[]
  variants: { platform: string; price: { toString(): string } }[]
}): string {
  const platforms = product.variants.map((v) => `${v.platform} ($${v.price})`).join(', ')
  const genres = product.genres.map((g) => g.name).join(', ')
  return [
    `${product.title} — ${genres} game by ${product.developer}.`,
    product.description,
    `Available on: ${platforms}.`,
    `Published by: ${product.publisher}.`,
  ].join('\n')
}

async function main() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: {
      genres: { select: { name: true } },
      variants: { select: { platform: true, price: true } },
    },
  })

  console.log(`Embedding ${products.length} products...`)

  for (const product of products) {
    try {
      const text = buildDocument(product)
      const embedding = await embed(text)
      const vectorStr = `[${embedding.join(',')}]`

      await prisma.$executeRawUnsafe(
        `INSERT INTO "ProductEmbedding" ("productId", "embedding", "updatedAt")
         VALUES ($1, $2::vector, now())
         ON CONFLICT ("productId")
         DO UPDATE SET "embedding" = $2::vector, "updatedAt" = now()`,
        product.id,
        vectorStr,
      )

      console.log(`  ✓ ${product.title}`)

      // Polite rate-limiting for HF free tier
      await new Promise((r) => setTimeout(r, 250))
    } catch (err) {
      console.error(`  ✗ ${product.title}:`, err)
    }
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
