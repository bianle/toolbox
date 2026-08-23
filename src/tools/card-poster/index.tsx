import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { DownloadIcon, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { exportCardPng, exportCardSvg } from '@/tools/card-poster/export'
import { renderMarkdown } from '@/tools/card-poster/markdown'
import {
  BG_PRESETS,
  CARD_RATIOS,
  CARD_SURFACE,
  GRADIENT_DIRECTIONS,
  SAMPLE_MARKDOWN,
  buildGradient,
  getRatio,
  type CardRatio,
  type GradientDirection,
} from '@/tools/card-poster/themes'

const DEFAULT_PRESET = BG_PRESETS[0]

export default function CardPosterTool() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [ratioValue, setRatioValue] = useState<CardRatio>('3:4')
  const [presetId, setPresetId] = useState<string | 'custom'>(DEFAULT_PRESET.id)
  const [colorStart, setColorStart] = useState(DEFAULT_PRESET.start)
  const [colorEnd, setColorEnd] = useState(DEFAULT_PRESET.end)
  const [colorMid, setColorMid] = useState<string | undefined>(DEFAULT_PRESET.mid)
  const [direction, setDirection] = useState<GradientDirection>(
    DEFAULT_PRESET.direction,
  )
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const ratio = getRatio(ratioValue)
  const html = useMemo(() => renderMarkdown(markdown), [markdown])

  const backdrop = useMemo(() => {
    if (presetId !== 'custom') {
      const preset = BG_PRESETS.find((item) => item.id === presetId)
      if (preset) return preset.css
    }
    return buildGradient(colorStart, colorEnd, direction, colorMid)
  }, [presetId, colorStart, colorEnd, colorMid, direction])

  const framePadding = ratio.value === '9:16' ? 56 : 48
  const cardRadius = 28
  const previewScale = Math.min(1, 360 / ratio.width)

  function applyPreset(id: string) {
    const preset = BG_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setPresetId(preset.id)
    setColorStart(preset.start)
    setColorEnd(preset.end)
    setColorMid(preset.mid)
    setDirection(preset.direction)
  }

  function markCustom() {
    setPresetId('custom')
    setColorMid(undefined)
  }

  async function handleExport(format: 'png' | 'svg') {
    const node = cardRef.current
    if (!node) return
    if (!markdown.trim()) {
      toast.error('请先输入 Markdown')
      return
    }

    setExporting(format)
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      const filename = `card-poster-${stamp}.${format}`
      if (format === 'png') {
        await exportCardPng(node, filename)
      } else {
        await exportCardSvg(node, filename)
      }
      toast.success(format === 'png' ? '已下载 PNG' : '已下载 SVG')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldDescription>
        把 Markdown 排成分享卡片，导出 SVG / PNG，适合小红书与朋友圈。本地生成，不上传。
      </FieldDescription>

      <div className="flex flex-col gap-3 rounded-lg border border-input p-3">
        <FieldLabel>背景设置</FieldLabel>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">预设背景</span>
          <div className="flex flex-wrap gap-2">
            {BG_PRESETS.map((preset) => {
              const active = presetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.id}
                  aria-label={`预设 ${preset.id}`}
                  aria-pressed={active}
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    'size-10 rounded-md border-2 transition-transform',
                    active
                      ? 'scale-105 border-foreground'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ background: preset.preview }}
                />
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">自定义颜色</span>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">起始色</span>
                <input
                  type="color"
                  value={colorStart}
                  onChange={(event) => {
                    markCustom()
                    setColorStart(event.target.value)
                  }}
                  className="size-8 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">结束色</span>
                <input
                  type="color"
                  value={colorEnd}
                  onChange={(event) => {
                    markCustom()
                    setColorEnd(event.target.value)
                  }}
                  className="size-8 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
              </label>
            </div>
          </div>

          <div className="flex w-44 flex-col gap-2">
            <span className="text-sm text-muted-foreground">渐变方向</span>
            <Select
              value={direction}
              onValueChange={(value) => {
                if (!value) return
                markCustom()
                setDirection(value as GradientDirection)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {GRADIENT_DIRECTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <FieldLabel>比例</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {CARD_RATIOS.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={ratioValue === item.value ? 'default' : 'outline'}
                onClick={() => setRatioValue(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={exporting !== null}
            onClick={() => void handleExport('png')}
          >
            <ImageIcon data-icon="inline-start" />
            {exporting === 'png' ? '导出中…' : '下载 PNG'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exporting !== null}
            onClick={() => void handleExport('svg')}
          >
            <DownloadIcon data-icon="inline-start" />
            {exporting === 'svg' ? '导出中…' : '下载 SVG'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="card-poster-md">Markdown</FieldLabel>
          <Textarea
            id="card-poster-md"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="输入 Markdown…"
            className="min-h-[28rem] font-mono text-sm"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <FieldLabel>预览</FieldLabel>
          <div className="flex min-h-[28rem] items-start justify-center overflow-auto rounded-lg border border-input bg-muted/20 p-4">
            <div
              style={{
                width: ratio.width * previewScale,
                height: ratio.height * previewScale,
              }}
            >
              <div
                style={{
                  width: ratio.width,
                  height: ratio.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div
                  ref={cardRef}
                  className="card-poster-surface relative overflow-hidden"
                  style={{
                    width: ratio.width,
                    height: ratio.height,
                    background: backdrop,
                    boxSizing: 'border-box',
                    padding: framePadding,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      background: CARD_SURFACE.card,
                      color: CARD_SURFACE.foreground,
                      borderRadius: cardRadius,
                      border: `1px solid ${CARD_SURFACE.border}`,
                      boxShadow: CARD_SURFACE.shadow,
                      fontFamily: CARD_SURFACE.fontBody,
                      boxSizing: 'border-box',
                      padding:
                        ratio.value === '9:16' ? '56px 48px' : '48px 44px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 999,
                        background: CARD_SURFACE.accent,
                        marginBottom: 28,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="card-poster-content"
                      style={
                        {
                          '--card-fg': CARD_SURFACE.foreground,
                          '--card-muted': CARD_SURFACE.muted,
                          '--card-accent': CARD_SURFACE.accent,
                          '--card-display': CARD_SURFACE.fontDisplay,
                          '--card-body': CARD_SURFACE.fontBody,
                          flex: 1,
                          overflow: 'hidden',
                        } as CSSProperties
                      }
                      dangerouslySetInnerHTML={{
                        __html:
                          html ||
                          '<p style="opacity:0.5">在左侧输入 Markdown…</p>',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .card-poster-content h1,
        .card-poster-content h2,
        .card-poster-content h3 {
          font-family: var(--card-display);
          font-weight: 600;
          line-height: 1.25;
          margin: 0 0 0.55em;
          color: var(--card-fg);
        }
        .card-poster-content h1 { font-size: 52px; letter-spacing: -0.02em; }
        .card-poster-content h2 { font-size: 34px; margin-top: 1.1em; }
        .card-poster-content h3 { font-size: 26px; margin-top: 1em; }
        .card-poster-content p {
          font-size: 24px;
          line-height: 1.7;
          margin: 0 0 0.9em;
          color: var(--card-fg);
        }
        .card-poster-content ul,
        .card-poster-content ol {
          margin: 0 0 1em;
          padding-left: 1.2em;
          font-size: 22px;
          line-height: 1.7;
        }
        .card-poster-content li { margin: 0.25em 0; }
        .card-poster-content blockquote {
          margin: 1em 0;
          padding: 0.2em 0 0.2em 0.9em;
          border-left: 4px solid var(--card-accent);
          color: var(--card-muted);
          font-family: var(--card-display);
          font-size: 26px;
          line-height: 1.6;
        }
        .card-poster-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.9em;
          padding: 0.1em 0.35em;
          border-radius: 6px;
          background: color-mix(in oklab, var(--card-accent) 14%, transparent);
        }
        .card-poster-content pre {
          margin: 0.8em 0 1em;
          padding: 0.9em 1em;
          border-radius: 14px;
          overflow: auto;
          background: color-mix(in oklab, var(--card-fg) 6%, transparent);
          font-size: 18px;
          line-height: 1.55;
        }
        .card-poster-content pre code {
          padding: 0;
          background: transparent;
        }
        .card-poster-content a {
          color: var(--card-accent);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .card-poster-content strong { font-weight: 700; }
        .card-poster-content em { font-style: italic; }
        .card-poster-content hr {
          border: 0;
          border-top: 1px solid color-mix(in oklab, var(--card-fg) 14%, transparent);
          margin: 1.4em 0;
        }
      `}</style>
    </div>
  )
}
