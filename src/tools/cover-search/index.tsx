import { useEffect, useRef, useState } from 'react'
import {
  CheckIcon,
  Disc3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
  LoaderCircleIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'

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
  ARTWORK_SIZES,
  artworkFilename,
  artworkUrl,
  COVER_ENTITY_OPTIONS,
  downloadArtwork,
  LIMIT_OPTIONS,
  searchCovers,
  STOREFRONTS,
  type CoverEntity,
  type CoverResult,
} from '@/tools/cover-search/fetch-cover'

interface Filters {
  entity: CoverEntity
  country: string
  limit: number
  size: number
}

const DEFAULT_FILTERS: Filters = {
  entity: 'album',
  country: 'hk',
  limit: 50,
  size: 1200,
}

const SUGGESTIONS = [
  '周杰伦',
  '五月天',
  'Taylor Swift',
  'Adele',
  '宇多田ヒカル',
  'BTS',
]

function CoverCard({
  result,
  size,
}: {
  result: CoverResult
  size: number
}) {
  const { copied, copy } = useCopyToClipboard()
  const [downloading, setDownloading] = useState(false)
  const large = artworkUrl(result.artwork, size)
  const preview = artworkUrl(result.artwork, 600)
  const year = result.releaseDate?.slice(0, 4) ?? null

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadArtwork(large, artworkFilename(result, size))
      toast.success(`已下载 ${size}×${size} 封面`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border">
      <a
        href={large}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-square overflow-hidden bg-muted"
        title="查看大图"
      >
        <img
          src={preview}
          alt={`${result.artist} - ${result.title}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate font-medium" title={result.title}>
            {result.title}
          </p>
          <p
            className="truncate text-xs text-muted-foreground"
            title={result.artist}
          >
            {result.artist}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {result.album ? (
            <span className="max-w-full truncate">{result.album}</span>
          ) : null}
          {year ? <span>{year}</span> : null}
          {result.genre ? <span>{result.genre}</span> : null}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <Button
            type="button"
            size="sm"
            className="min-w-0 flex-1"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            {downloading ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <DownloadIcon data-icon="inline-start" />
            )}
            {downloading ? '下载中' : '下载'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void copy(large, '已复制封面链接')}
            title="复制封面链接"
            aria-label="复制封面链接"
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
          </Button>
          {result.link ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
              title="在 Apple Music 打开"
            >
              <a
                href={result.link}
                target="_blank"
                rel="noreferrer"
                aria-label="在 Apple Music 打开"
              >
                <ExternalLinkIcon />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CoverSearchTool() {
  const [term, setTerm] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<CoverResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runSearch(
    termOverride?: string,
    filtersOverride?: Filters,
  ) {
    const nextTerm = (termOverride ?? term).trim()
    if (!nextTerm) {
      setError('请输入关键词')
      return
    }

    const nextFilters = filtersOverride ?? filters

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setResults([])
    setSearched(false)

    try {
      const data = await searchCovers(
        {
          term: nextTerm,
          entity: nextFilters.entity,
          country: nextFilters.country,
          limit: nextFilters.limit,
        },
        controller.signal,
      )
      if (controller.signal.aborted) return
      setResults(data)
      setSearched(true)
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : '搜索失败')
      setSearched(true)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function applyFilters(patch: Partial<Filters>, rerun = true) {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (rerun) void runSearch(term, next)
  }

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="cover-term">关键词</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="cover-term"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void runSearch()
                }
              }}
              placeholder="歌曲、专辑或歌手名，如 周杰伦 / Taylor Swift"
              spellCheck={false}
            />
            <Button
              type="button"
              className="shrink-0"
              onClick={() => void runSearch()}
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
            数据来自 Apple iTunes Search API，无需登录。封面版权归原作者所有，请勿用于侵权用途。
          </FieldDescription>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel>类型</FieldLabel>
            <Select
              value={filters.entity}
              onValueChange={(value) =>
                applyFilters({ entity: value as CoverEntity })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {COVER_ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>地区</FieldLabel>
            <Select
              value={filters.country}
              onValueChange={(value) => applyFilters({ country: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STOREFRONTS.map((storefront) => (
                    <SelectItem key={storefront.code} value={storefront.code}>
                      {storefront.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>数量</FieldLabel>
            <Select
              value={String(filters.limit)}
              onValueChange={(value) =>
                applyFilters({ limit: Number(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LIMIT_OPTIONS.map((limit) => (
                    <SelectItem key={limit} value={String(limit)}>
                      {limit} 个
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>封面尺寸</FieldLabel>
            <Select
              value={String(filters.size)}
              onValueChange={(value) =>
                applyFilters({ size: Number(value) }, false)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ARTWORK_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} × {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">试试：</span>
          {SUGGESTIONS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setTerm(item)
                void runSearch(item)
              }}
              disabled={loading}
            >
              {item}
            </Button>
          ))}
        </div>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          搜索失败：{error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {loading
              ? '搜索中…'
              : results.length > 0
                ? `共 ${results.length} 个结果`
                : searched
                  ? '没有匹配的封面'
                  : ''}
          </p>
          <span className="text-xs text-muted-foreground">
            下载尺寸 {filters.size} × {filters.size}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-xl border p-3"
              >
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((result) => (
              <CoverCard
                key={result.id}
                result={result}
                size={filters.size}
              />
            ))}
          </div>
        ) : null}

        {!loading && !searched && !error ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <Disc3Icon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              输入关键词开始搜索，或点击上方推荐歌手。
            </p>
          </div>
        ) : null}

        {!loading && searched && results.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            没有找到封面，试试更换关键词或切换地区。
          </p>
        ) : null}
      </section>
    </div>
  )
}
