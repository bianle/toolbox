export interface RadioStation {
  stationuuid: string
  name: string
  url: string
  url_resolved: string
  homepage: string
  favicon: string
  tags: string
  country: string
  countrycode: string
  language: string
  votes: number
  codec: string
  bitrate: number
  hls: number
  lastcheckok: number
  clickcount: number
  clicktrend: number
}

export interface CountryOption {
  name: string
  iso_3166_1: string
  stationcount: number
}

export interface StationQuery {
  name?: string
  countrycode?: string
  language?: string
  tag?: string
  codec?: string
  order?: string
  offset?: number
  limit?: number
}

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
]

const REQUEST_TIMEOUT_MS = 8000

let preferredMirror = 0

async function fetchWithTimeout(url: string, signal?: AbortSignal) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    if (controller.signal.aborted) {
      throw new Error('请求超时')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function fetchRadioJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = null

  for (let attempt = 0; attempt < MIRRORS.length; attempt += 1) {
    const index = (preferredMirror + attempt) % MIRRORS.length
    try {
      const response = await fetchWithTimeout(`${MIRRORS[index]}${path}`, signal)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = (await response.json()) as T
      preferredMirror = index
      return data
    } catch (error) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      lastError = error
    }
  }

  throw new Error(
    lastError instanceof Error ? lastError.message : '电台服务暂时不可用',
  )
}

export async function fetchStations(
  query: StationQuery,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  params.set('hidebroken', 'true')
  params.set('order', query.order ?? 'clicktrend')
  params.set('offset', String(query.offset ?? 0))
  params.set('limit', String(query.limit ?? 30))

  if (query.name) params.set('name', query.name)
  if (query.countrycode) params.set('countrycode', query.countrycode)
  if (query.language) params.set('language', query.language)
  if (query.tag) params.set('tag', query.tag)
  if (query.codec) params.set('codec', query.codec)

  const data = await fetchRadioJson<RadioStation[]>(
    `/json/stations/search?${params.toString()}`,
    signal,
  )
  return Array.isArray(data) ? data : []
}

export async function fetchCountries(signal?: AbortSignal) {
  const data = await fetchRadioJson<CountryOption[]>(
    '/json/countries',
    signal,
  )
  if (!Array.isArray(data)) return []
  return data
    .filter((item) => item.iso_3166_1 && item.name)
    .sort(
      (a, b) =>
        b.stationcount - a.stationcount || a.name.localeCompare(b.name),
    )
}

export function getStreamUrl(station: RadioStation) {
  return (station.url_resolved || station.url || '').trim()
}

export function getWebsiteUrl(station: RadioStation) {
  const value = (station.homepage ?? '').trim()
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  return null
}

export function countryFlag(code: string) {
  if (!/^[a-z]{2}$/i.test(code)) return ''
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0)),
  )
}

export function dedupeStations(stations: RadioStation[]) {
  const seen = new Set<string>()
  return stations.filter((station) => {
    if (!station.stationuuid || seen.has(station.stationuuid)) return false
    seen.add(station.stationuuid)
    return true
  })
}

export function buildM3u(stations: RadioStation[]) {
  const lines: string[] = []
  for (const station of stations) {
    const url = getStreamUrl(station)
    if (!url) continue
    const name = (station.name.trim() || '未命名电台').replace(/\s+/g, ' ')
    lines.push(`#EXTINF:-1,${name}`, url)
  }
  return lines.length > 0 ? ['#EXTM3U', ...lines].join('\n') : ''
}
