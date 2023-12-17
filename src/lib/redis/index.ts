import { nanoid } from 'nanoid'

if (!process.env.REDIS_REST_URL) throw new Error('REDIS_REST_URL is not set.')
const redisUrl = new URL(process.env.REDIS_REST_URL)

const redisWriteToken = process.env.REDIS_REST_TOKEN
if (!redisWriteToken) throw new Error('REDIS_REST_TOKEN is not set.')

const redisReadToken = process.env.REDIS_REST_TOKEN_READ
if (!redisReadToken) throw new Error('REDIS_REST_TOKEN_READ is not set.')

export async function createShortLink(original: string, suggestion?: string) {
  const key = suggestion.toLowerCase() || nanoid(6)
  const originalUrl = new URL(original)

  const redisUrlClone = new URL(redisUrl)

  if (suggestion) {
    redisUrlClone.pathname = `/get/${key.toLowerCase()}`
    const redisRes = await fetch(redisUrlClone.href, {
      headers: { Authorization: `Bearer ${redisReadToken}` }
    })
    const { result } = (await redisRes.json()) as { result: string }
    if (typeof result === 'string') {
      throw new Error('Suggested ID already exists.')
    }
  }

  redisUrlClone.pathname = `/set/${key}`

  const redisRes = await fetch(redisUrlClone.href, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisWriteToken}` },
    body: originalUrl.href
  })

  const { result, error } = (await redisRes.json()) as {
    result?: string
    error?: string
  }

  if (error) {
    throw new Error(error)
  }

  if (typeof result !== 'string') {
    throw new Error('Failed to create short link.')
  }

  return { key, value: originalUrl.href }
}

export async function getShortLinkValue(key: string) {
  const redisUrlClone = new URL(redisUrl)
  redisUrlClone.pathname = `/get/${key.toLowerCase()}`

  const redisRes = await fetch(redisUrlClone.href, {
    headers: { Authorization: `Bearer ${redisReadToken}` }
  })

  const { result } = (await redisRes.json()) as { result: string }

  if (typeof result !== 'string') {
    throw new Error('Short link not found.')
  }

  return result
}

export async function getAllShortLink() {
  const redisUrlClone = new URL(redisUrl)
  redisUrlClone.pathname = '/keys/*'

  const keys = await fetch(redisUrlClone.href, {
    headers: { Authorization: `Bearer ${redisWriteToken}` }
  })

  const { result } = (await keys.json()) as { result: string[] }
  const data: { key: string; value: string }[] = []
  for (let i = 0; i < result.length; i++) {
    const key = result[i]
    const value = await getShortLinkValue(key)
    data.push({ key, value })
  }

  return data
}
