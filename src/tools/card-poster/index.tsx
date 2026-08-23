import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DownloadIcon, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
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
  LAYOUT_LIMITS,
  SAMPLE_MARKDOWN,
  buildContentFontVars,
  buildGradient,
  getCanvasSize,
  getRatio,
  isFreeRatio,
  type CardRatio,
  type GradientDirection,
} from '@/tools/card-poster/themes'

const DEFAULT_PRESET = BG_PRESETS[0]

export default function CardPosterTool() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [ratioValue, setRatioValue] = useState<CardRatio>('free')
  const [canvasWidth, setCanvasWidth] = useState<number>(
    LAYOUT_LIMITS.width.default,
  )
  const [fontSize, setFontSize] = useState<number>(
    LAYOUT_LIMITS.fontSize.default,
  )
  const [contentPadding, setContentPadding] = useState<number>(
    LAYOUT_LIMITS.padding.default,
  )
  const [presetId, setPresetId] = useState<string | 'custom'>(DEFAULT_PRESET.id)
  const [colorStart, setColorStart] = useState(DEFAULT_PRESET.start)
  const [colorEnd, setColorEnd] = useState(DEFAULT_PRESET.end)
  const [colorMid, setColorMid] = useState<string | undefined>(DEFAULT_PRESET.mid)
  const [direction, setDirection] = useState<GradientDirection>(
    DEFAULT_PRESET.direction,
  )
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null)
  const [measuredHeight, setMeasuredHeight] = useState<number>()
  const cardRef = useRef<HTMLDivElement>(null)

  const freeMode = isFreeRatio(ratioValue)
  const canvas = getCanvasSize(ratioValue, canvasWidth, measuredHeight)
  const html = useMemo(() => renderMarkdown(markdown), [markdown])
  const backdrop = useMemo(() => {
    if (presetId !== 'custom') {
      const preset = BG_PRESETS.find((item) => item.id === presetId)
      if (preset) return preset.css
    }
    return buildGradient(colorStart, colorEnd, direction, colorMid)
  }, [presetId, colorStart, colorEnd, colorMid, direction])

  const framePadding = CARD_SURFACE.framePadding
  const outerRadius = 0
  const innerRadius = 8
  const previewScale = Math.min(1, 360 / canvas.width)
  const contentFontVars = buildContentFontVars(fontSize)

  useLayoutEffect(() => {
    if (!freeMode) {
      setMeasuredHeight(undefined)
      return
    }
    const node = cardRef.current
    if (!node) return

    const update = () => {
      setMeasuredHeight(node.offsetHeight)
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [freeMode, markdown, canvasWidth, fontSize, contentPadding, backdrop])

  function handleRatioChange(next: CardRatio) {
    setRatioValue(next)
    setCanvasWidth(getRatio(next).defaultWidth)
  }

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
      <div className="flex flex-col gap-3 rounded-lg border border-input p-3">
        <FieldLabel>背景设置</FieldLabel>

        <div className="grid gap-4 sm:grid-cols-3">
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

          <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-3 rounded-lg border border-input p-3">
        <FieldLabel>文字与布局</FieldLabel>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">文字大小</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {fontSize}px
              </span>
            </span>
            <input
              type="range"
              min={LAYOUT_LIMITS.fontSize.min}
              max={LAYOUT_LIMITS.fontSize.max}
              step={LAYOUT_LIMITS.fontSize.step}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="w-full accent-foreground"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">比例</span>
            <div className="flex flex-wrap gap-2">
              {CARD_RATIOS.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={ratioValue === item.value ? 'default' : 'outline'}
                  onClick={() => handleRatioChange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">整体宽度</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {canvasWidth}px
                </span>
              </span>
              <input
                type="range"
                min={LAYOUT_LIMITS.width.min}
                max={LAYOUT_LIMITS.width.max}
                step={LAYOUT_LIMITS.width.step}
                value={canvasWidth}
                onChange={(event) => setCanvasWidth(Number(event.target.value))}
                className="w-full accent-foreground"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">卡片边距</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {contentPadding}px
                </span>
              </span>
              <input
                type="range"
                min={LAYOUT_LIMITS.padding.min}
                max={LAYOUT_LIMITS.padding.max}
                step={LAYOUT_LIMITS.padding.step}
                value={contentPadding}
                onChange={(event) =>
                  setContentPadding(Number(event.target.value))
                }
                className="w-full accent-foreground"
              />
            </label>
          </div>
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
                width: canvas.width * previewScale,
                height: canvas.height * previewScale,
              }}
            >
              <div
                style={{
                  width: canvas.width,
                  height: freeMode ? undefined : canvas.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div
                  ref={cardRef}
                  className="card-poster-surface relative overflow-hidden"
                  style={{
                    width: canvas.width,
                    height: freeMode ? 'auto' : canvas.height,
                    background: backdrop,
                    boxSizing: 'border-box',
                    padding: framePadding,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: outerRadius,
                  }}
                >
                  <div
                    style={{
                      flex: freeMode ? undefined : 1,
                      minHeight: freeMode ? undefined : 0,
                      background: CARD_SURFACE.card,
                      color: CARD_SURFACE.textSecondary,
                      borderRadius: innerRadius,
                      border: `1px solid ${CARD_SURFACE.border}`,
                      boxShadow: CARD_SURFACE.shadow,
                      fontFamily: CARD_SURFACE.fontBody,
                      boxSizing: 'border-box',
                      padding: contentPadding,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: freeMode ? 'visible' : 'hidden',
                    }}
                  >
                    <div
                      className="card-poster-content"
                      style={
                        {
                          ...contentFontVars,
                          '--mp-text-primary': CARD_SURFACE.textPrimary,
                          '--mp-text-secondary': CARD_SURFACE.textSecondary,
                          '--mp-text-tertiary': CARD_SURFACE.textTertiary,
                          '--mp-primary': CARD_SURFACE.primary,
                          '--mp-bg-secondary': CARD_SURFACE.backgroundSecondary,
                          '--mp-bg-gray': CARD_SURFACE.backgroundGray,
                          '--mp-font-mono': CARD_SURFACE.fontMono,
                          flex: freeMode ? undefined : 1,
                          overflow: freeMode ? 'visible' : 'hidden',
                          wordWrap: 'break-word',
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
        .card-poster-content h1 {
          font-size: var(--dynamic-h1-size, 28px);
          font-weight: 700;
          color: var(--mp-text-primary);
          margin: 0 0 16px;
          line-height: 1.3;
        }
        .card-poster-content h2 {
          font-size: var(--dynamic-h2-size, 22px);
          font-weight: 600;
          color: var(--mp-text-secondary);
          margin: 24px 0 12px;
          line-height: 1.4;
        }
        .card-poster-content h3 {
          font-size: var(--dynamic-h3-size, 18px);
          font-weight: 600;
          color: var(--mp-text-secondary);
          margin: 20px 0 8px;
        }
        .card-poster-content p {
          font-size: var(--dynamic-font-size, 16px);
          color: var(--mp-text-secondary);
          margin: 0 0 16px;
          line-height: 1.7;
        }
        .card-poster-content ul,
        .card-poster-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }
        .card-poster-content li {
          font-size: var(--dynamic-font-size, 16px);
          color: var(--mp-text-secondary);
          margin-bottom: 8px;
          line-height: 1.6;
          display: list-item;
        }
        .card-poster-content blockquote {
          border-left: 4px solid #d1d5db;
          padding: 6px 0 6px 16px;
          margin: 12px 0;
          background: var(--mp-bg-secondary);
          color: var(--mp-text-tertiary);
          font-style: italic;
          font-size: var(--dynamic-quote-size, 16px);
        }
        .card-poster-content blockquote p {
          margin: 0;
          line-height: inherit;
        }
        .card-poster-content code {
          background: var(--mp-bg-gray);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--mp-font-mono);
          font-size: var(--dynamic-code-size, 14px);
          color: var(--mp-primary);
          display: inline;
          line-height: inherit;
          vertical-align: baseline;
        }
        .card-poster-content pre {
          background: var(--mp-text-primary);
          color: #e2e8f0;
          padding: 16px;
          border-radius: 6px;
          margin: 16px 0;
          display: block;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-all;
        }
        .card-poster-content pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }
        .card-poster-content a {
          color: var(--mp-primary);
          text-decoration: none;
          border-bottom: 1px solid var(--mp-primary);
        }
        .card-poster-content strong {
          font-weight: 700;
          color: var(--mp-text-primary);
        }
        .card-poster-content em {
          font-style: italic;
          color: var(--mp-primary);
        }
        .card-poster-content hr {
          border: 0;
          border-top: 1px solid #e6e6e6;
          margin: 16px 0;
        }
        .card-poster-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 16px auto;
          display: block;
        }
        .card-poster-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 14px;
          table-layout: fixed;
        }
        .card-poster-content th,
        .card-poster-content td {
          padding: 8px 12px;
          border: 1px solid #e6e6e6;
          text-align: left;
          word-break: break-word;
        }
        .card-poster-content th {
          background: #fafafa;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
