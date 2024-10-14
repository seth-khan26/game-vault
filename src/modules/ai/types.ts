export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GameContext {
  id: string
  title: string
  slug: string
  description: string
  developer: string
  publisher: string
  genres: string[]
  platforms: { platform: string; price: number; inventory: number }[]
  similarity: number
}
