import type { ChatMessage, GameContext } from './types'

const BASE_URL = process.env.LLM_BASE_URL!
const MODEL = process.env.LLM_MODEL!
const API_KEY = process.env.LLM_API_KEY!

function buildSystemPrompt(games: GameContext[], orderHistory?: string): string {
  const catalog =
    games.length > 0
      ? games
          .map((g) => {
            const platforms = g.platforms
              .map(
                (p) =>
                  `${p.platform} $${p.price.toFixed(2)}${p.inventory < 10 ? ` ⚠ only ${p.inventory} left` : ''}`,
              )
              .join(' | ')
            return `• ${g.title} [${g.genres.join(', ')}] — ${platforms}\n  ${g.description}`
          })
          .join('\n\n')
      : 'No games matched the query.'

  return `You are GameVault's AI Game Advisor — an expert on PS4 and PS5 games. Help customers find games they'll love.

RELEVANT CATALOG (retrieved via semantic search):
${catalog}

${orderHistory ? `CUSTOMER PURCHASE HISTORY:\n${orderHistory}\n` : ''}
Rules:
- Only recommend games from the catalog above.
- Mention price and which platform(s) each game is on.
- Flag low stock (⚠) as "nearly sold out" to create urgency.
- Be friendly, concise, and enthusiastic. Max 3-4 recommendations per reply.
- If the catalog has nothing relevant, say so honestly and suggest the customer browse the store.`
}

// Streams text chunks from the OpenAI-compatible LLM endpoint.
export async function* streamChat(
  messages: ChatMessage[],
  games: GameContext[],
  orderHistory?: string,
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(games, orderHistory)

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LLM API [${res.status}]: ${body}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') return

      try {
        const parsed = JSON.parse(payload)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content as string
      } catch {
        // skip malformed SSE chunk
      }
    }
  }
}
