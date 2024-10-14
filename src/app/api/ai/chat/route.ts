import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { retrieveGames } from '@/modules/ai/retrieval'
import { streamChat } from '@/modules/ai/chat'
import { prisma } from '@/lib/prisma'
import type { ChatMessage } from '@/modules/ai/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json()

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUserMsg) {
    return new Response('Missing user message', { status: 400 })
  }

  // RAG: semantic search over game catalog
  const games = await retrieveGames(lastUserMsg.content, 6)

  // Personalise with order history for logged-in users
  let orderHistory: string | undefined
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (userId) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      select: { items: { select: { productTitle: true, platform: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (orders.length > 0) {
      const titles = orders
        .flatMap((o) => o.items.map((i) => `${i.productTitle} (${i.platform})`))
        .join(', ')
      orderHistory = `Previously purchased: ${titles}`
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(messages, games, orderHistory)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
