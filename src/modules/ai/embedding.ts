const BASE_URL = process.env.EMBEDDING_BASE_URL!
const MODEL = process.env.EMBEDDING_MODEL!
const API_KEY = process.env.EMBEDDING_API_KEY!

// Calls HuggingFace feature-extraction endpoint.
// bge-small-en-v1.5 returns a 384-dim float array per input.
export async function embed(text: string): Promise<number[]> {
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
  // HF returns [[...]] for feature-extraction (batch outer array)
  return Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[])
}
