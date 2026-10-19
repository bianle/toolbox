import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  ListMusicIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  buildM3u,
  countryFlag,
  dedupeStations,
  fetchCountries,
  fetchStations,
  getStreamUrl,
  getWebsiteUrl,
  type CountryOption,
  type RadioStation,
  type StationQuery,
} from '@/tools/radio-directory/fetch-radio'

const PAGE_SIZE = 30
const ALL = 'all'

const DEFAULT_FILTERS = {
  name: '',
  countrycode: ALL,
  language: '',
  tag: '',
  codec: ALL,
  order: 'clicktrend',
}

type Filters = typeof DEFAULT_FILTERS
type SearchMode = 'replace' | 'append'

const CODEC_OPTIONS = [
  { value: ALL, label: '全部编码' },
  { value: 'MP3', label: 'MP3' },
  { value: 'AAC', label: 'AAC' },
  { value: 'AAC+', label: 'AAC+' },
  { value: 'OGG', label: 'OGG' },
  { value: 'OPUS', label: 'OPUS' },
  { value: 'HLS', label: 'HLS' },
]

const ORDER_OPTIONS = [
  { value: 'clicktrend', label: '热门趋势' },
  { value: 'votes', label: '票数最高' },
  { value: 'clickcount', label: '点击最多' },
  { value: 'name', label: '名称排序' },
  { value: 'random', label: '随机发现' },
]

function buildQuery(filters: Filters, offset: number): StationQuery {
  return {
    name: filters.name.trim() || undefined,
    countrycode:
      filters.countrycode === ALL ? undefined : filters.countrycode,
    language: filters.language.trim() || undefined,
    tag: filters.tag.trim() || undefined,
    codec: filters.codec === ALL ? undefined : filters.codec,
    order: filters.order,
    offset,
    limit: PAGE_SIZE,
  }
}

function StationCard({ station }: { station: RadioStation }) {
  const { copied, copy } = useCopyToClipboard()
  const url = getStreamUrl(station)
  const website = getWebsiteUrl(station)
  const name = (station.name ?? '').trim() || '未命名电台'
  const flag = countryFlag(station.countrycode)
  const tags = (station.tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{name}</span>
          {flag ? (
            <span aria-hidden className="text-base leading-none">
              {flag}
            </span>
          ) : null}
          {station.country ? (
            <span className="text-xs text-muted-foreground">
              {station.country}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {station.codec ? <span>{station.codec}</span> : null}
          {station.bitrate > 0 ? <span>{station.bitrate} kbps</span> : null}
          {station.language ? (
            <span className="line-clamp-1">{station.language}</span>
          ) : null}
          {station.votes > 0 ? <span>{station.votes} 票</span> : null}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {tags.length > 5 ? (
              <Badge variant="outline">+{tags.length - 5}</Badge>
            ) : null}
          </div>
        ) : null}

        <p
          className="line-clamp-1 break-all font-mono text-xs text-muted-foreground"
          title={url}
        >
          {url}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void copy(url, '已复制流地址')}
          disabled={!url}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? '已复制' : '复制地址'}
        </Button>
        {website ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={website} target="_blank" rel="noreferrer">
              <ExternalLinkIcon data-icon="inline-start" />
              官网
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function RadioDirectoryTool() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [results, setResults] = useState<RadioStation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const queryRef = useRef<StationQuery | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { copied: m3uCopied, copy: copyM3u } = useCopyToClipboard()

  const m3u = useMemo(() => buildM3u(results), [results])

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function runSearch(mode: SearchMode, filtersOverride?: Filters) {
    if (mode === 'append' && (!hasMore || loading || loadingMore)) return

    const baseQuery =
      mode === 'replace'
        ? buildQuery(filtersOverride ?? filters, 0)
        : queryRef.current
    if (!baseQuery) return

    const query =
      mode === 'append'
        ? { ...baseQuery, offset: results.length }
        : baseQuery

    if (mode === 'replace') {
      abortRef.current?.abort()
      queryRef.current = query
      setResults([])
      setHasMore(false)
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const data = await fetchStations(query, controller.signal)
      if (controller.signal.aborted) return

      const stations = dedupeStations(data)
      setResults((prev) =>
        mode === 'append' ? dedupeStations([...prev, ...stations]) : stations,
      )
      setHasMore(data.length === PAGE_SIZE)
      setSearched(true)
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '加载失败')
      setSearched(true)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    void runSearch('replace', DEFAULT_FILTERS)
  }

  useEffect(() => {
    void runSearch('replace')
    return () => abortRef.current?.abort()
    // 进页加载一次热门电台
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchCountries(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setCountries(items)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="radio-name">电台名称</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="radio-name"
              value={filters.name}
              onChange={(event) => updateFilter('name', event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void runSearch('replace')
                }
              }}
              placeholder="搜索电台名，留空浏览热门"
              spellCheck={false}
            />
            <Button
              type="button"
              className="shrink-0"
              onClick={() => void runSearch('replace')}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              {loading ? '搜索中' : '搜索'}
            </Button>
          </div>
          <FieldDescription>
            数据来自 radio-browser.info。复制流地址后，可以直接粘贴到 VLC、foobar2000、MusicBee 等播放器。
          </FieldDescription>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel>国家 / 地区</FieldLabel>
            <Select
              value={filters.countrycode}
              onValueChange={(value) => updateFilter('countrycode', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>全部国家 / 地区</SelectItem>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.iso_3166_1}
                      value={country.iso_3166_1}
                    >
                      {country.name} ({country.iso_3166_1})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="radio-language">语言</FieldLabel>
            <Input
              id="radio-language"
              value={filters.language}
              onChange={(event) => updateFilter('language', event.target.value)}
              placeholder="如 english / chinese"
              spellCheck={false}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="radio-tag">标签</FieldLabel>
            <Input
              id="radio-tag"
              value={filters.tag}
              onChange={(event) => updateFilter('tag', event.target.value)}
              placeholder="如 jazz / news"
              spellCheck={false}
            />
          </Field>

          <Field>
            <FieldLabel>编码</FieldLabel>
            <Select
              value={filters.codec}
              onValueChange={(value) => updateFilter('codec', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CODEC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>排序</FieldLabel>
            <Select
              value={filters.order}
              onValueChange={(value) => updateFilter('order', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ORDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetFilters}
            disabled={loading}
          >
            <RefreshCwIcon data-icon="inline-start" />
            重置筛选
          </Button>
        </div>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          加载失败：{error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {loading
              ? '搜索中…'
              : results.length > 0
                ? `已加载 ${results.length} 个电台${hasMore ? '，可继续加载' : ''}`
                : searched
                  ? '没有匹配的电台'
                  : ''}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void copyM3u(m3u, '已复制 M3U 播放列表')}
            disabled={!m3u}
          >
            {m3uCopied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <ListMusicIcon data-icon="inline-start" />
            )}
            {m3uCopied ? '已复制' : '复制全部 M3U'}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : null}

        {!loading && results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {results.map((station) => (
              <StationCard key={station.stationuuid} station={station} />
            ))}
          </div>
        ) : null}

        {!loading && searched && results.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            没有找到电台，试试更换关键词或减少筛选条件。
          </p>
        ) : null}

        {!loading && hasMore ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void runSearch('append')}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : null}
            {loadingMore ? '加载中…' : '加载更多'}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
