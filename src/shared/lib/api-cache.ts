// Долгосрочный кеш для API ответов
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

const DEFAULT_TTL = 10 * 60 * 1000 // 10 минут по умолчанию

export function getCached<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const age = Date.now() - entry.timestamp
  if (age > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCached<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// Очистка старых записей каждые 5 минут (только в браузере)
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

