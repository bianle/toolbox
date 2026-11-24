export type CoverEntity = 'album' | 'song' | 'musicVideo'

export interface CoverEntityOption {
  value: CoverEntity
  label: string
}

export interface Storefront {
  code: string
  name: string
}

export interface CoverSearchQuery {
  term: string
  entity: CoverEntity
  country: string
  limit: number
}

export interface CoverResult {
  id: string
  artist: string
  title: string
  album: string | null
  artwork: string
  link: string | null
  releaseDate: string | null
  genre: string | null
  trackCount: number | null
  country: string | null
  copyright: string | null
}

interface ItunesRawResult {
  wrapperType?: string
  artistName?: string
  collectionName?: string
  trackName?: string
  artworkUrl60?: string
  artworkUrl100?: string
  collectionViewUrl?: string
  trackViewUrl?: string
  releaseDate?: string
  primaryGenreName?: string
  trackCount?: number
  country?: string
  copyright?: string
  collectionId?: number
  trackId?: number
}

const ENDPOINT = 'https://itunes.apple.com/search'
const REQUEST_TIMEOUT_MS = 12000
const MIN_REQUEST_INTERVAL_MS = 1000

export const COVER_ENTITY_OPTIONS: CoverEntityOption[] = [
  { value: 'album', label: '专辑' },
  { value: 'song', label: '单曲' },
  { value: 'musicVideo', label: '音乐视频' },
]

export const STOREFRONTS: Storefront[] = [
  { code: 'us', name: '美国' },
  { code: 'hk', name: '香港' },
  { code: 'tw', name: '台湾' },
  { code: 'jp', name: '日本' },
  { code: 'gb', name: '英国' },
  { code: 'au', name: '澳大利亚' },
  { code: 'ca', name: '加拿大' },
  { code: 'de', name: '德国' },
  { code: 'fr', name: '法国' },
  { code: 'sg', name: '新加坡' },
  { code: 'my', name: '马来西亚' },
  { code: 'kr', name: '韩国' },
]

export const LIMIT_OPTIONS = [20, 50, 100, 200] as const
export const ARTWORK_SIZES = [600, 1200, 1500, 2000] as const

export function artworkUrl(url: string, size: number) {
  return url.replace(/\/\d+x\d+bb(\.[a-z0-9]+)?$/i, `/${size}x${size}bb$1`)
}

export function artworkFilename(result: CoverResult, size: number) {
  const base = [result.artist, result.album ?? result.title]
    .filter(Boolean)
    .join(' - ')
  const safe = base
    .replace(/[\p{Cc}\\/:*?"<>|]+/gu, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(result.artwork)?.[1] ?? 'jpg'
  return `${safe || 'cover'}-${size}.${ext.toLowerCase()}`
}

export async function downloadArtwork(url: string, filename: string) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`封面下载失败（HTTP ${response.status}）`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

let lastRequestAt = 0

async function waitForRequestSlot(signal?: AbortSignal) {
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now()
  if (wait > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, wait))
  }
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  lastRequestAt = Date.now()
}

function normalizeResult(
  raw: ItunesRawResult,
  index: number,
): CoverResult | null {
  const artwork = raw.artworkUrl100 ?? raw.artworkUrl60
  if (!artwork) return null

  const title = (raw.trackName ?? raw.collectionName ?? '').trim() || '未命名'
  const artist = (raw.artistName ?? '').trim() || '未知艺术家'
  const album = (raw.collectionName ?? '').trim()

  return {
    id: `${raw.collectionId ?? raw.trackId ?? 'item'}-${index}`,
    artist,
    title,
    album: album && album !== title ? album : null,
    artwork,
    link: raw.collectionViewUrl ?? raw.trackViewUrl ?? null,
    releaseDate: raw.releaseDate ?? null,
    genre: raw.primaryGenreName?.trim() || null,
    trackCount: raw.trackCount ?? null,
    country: raw.country ?? null,
    copyright: raw.copyright ?? null,
  }
}

export async function searchCovers(
  query: CoverSearchQuery,
  signal?: AbortSignal,
): Promise<CoverResult[]> {
  if (!query.term.trim()) return []

  await waitForRequestSlot(signal)

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      term: query.term.trim(),
      entity: query.entity,
      media: 'music',
      country: query.country,
      limit: String(query.limit),
    })

    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })

    if (response.status === 403) {
      throw new Error('请求过于频繁，请稍后再试')
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = (await response.json()) as {
      results?: ItunesRawResult[]
    }
    if (!Array.isArray(data.results)) return []

    return data.results
      .map((item, index) => normalizeResult(item, index))
      .filter((item): item is CoverResult => item !== null)
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    if (controller.signal.aborted) {
      throw new Error('请求超时')
    }
    throw error instanceof Error ? error : new Error('搜索失败')
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
