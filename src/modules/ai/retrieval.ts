import { prisma } from '@/lib/prisma'
import { embed } from './embedding'
import type { GameContext } from './types'

type RawRow = {
  id: string
  title: string
  slug: string
  description: string
  developer: string
  publisher: string
  similarity: number
}

export async function retrieveGames(query: string, limit = 6): Promise<GameContext[]> {
  const embedding = await embed(query)
  const vectorStr = `[${embedding.join(',')}]`

  // pgvector cosine distance: <=> (0 = identical). 1 - distance = similarity.
  const rows = await prisma.$queryRawUnsafe<RawRow[]>(
    `SELECT p.id, p.title, p.slug, p.description, p.developer, p.publisher,
            (1 - (pe.embedding <=> $1::vector))::float8 AS similarity
     FROM "ProductEmbedding" pe
     JOIN "Product" p ON p.id = pe."productId"
     WHERE p.status = 'ACTIVE'
     ORDER BY pe.embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    limit,
  )

  if (rows.length === 0) return []

  const enriched = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: {
      id: true,
      genres: { select: { name: true } },
      variants: { select: { platform: true, price: true, inventory: true } },
    },
  })

  const meta = new Map(enriched.map((p) => [p.id, p]))

  return rows.map((row) => {
    const p = meta.get(row.id)
    return {
      ...row,
      genres: p?.genres.map((g) => g.name) ?? [],
      platforms:
        p?.variants.map((v) => ({
          platform: v.platform,
          price: Number(v.price),
          inventory: v.inventory,
        })) ?? [],
    }
  })
}
