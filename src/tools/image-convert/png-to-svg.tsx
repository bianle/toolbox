import { useMemo, useRef, useState } from 'react'
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ImageIcon,
  Loader2Icon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { FileDrop } from '@/tools/image-convert/file-drop'
import {
  convertPngToSvg,
  downloadText,
  readImageFile,
  replaceExtension,
  type RasterSource,
  type SvgResult,
  type TraceDetail,
  type TraceMode,
} from '@/tools/image-convert/convert'

const MODES: { value: TraceMode; label: string; hint: string }[] = [
  {
    value: 'mono',
    label: '黑白描摹（Potrace）',
    hint: '先二值化再描摹为路径，适合 logo、图标、线稿与签名。',
  },
  {
    value: 'color',
    label: '彩色描摹（ImageTracer）',
    hint: '量化颜色后逐层描摹，适合简单插画；照片效果一般。',
  },
  {
    value: 'embed',
    label: '无损内嵌（Base64）',
    hint: '把原图直接嵌入 SVG，像素完全无损，但不会变成可缩放路径。',
  },
]

const COLOR_OPTIONS = ['2', '4', '8', '16', '32', '64'] as const

const DETAILS: { value: TraceDetail; label: string }[] = [
  { value: 'low', label: '低（更快、更平滑）' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高（更多细节）' },
]

const MAX_EDGES = [
  { value: '512', label: '512 px' },
  { value: '1024', label: '1024 px' },
  { value: '2048', label: '2048 px' },
  { value: '4096', label: '4096 px' },
  { value: 'original', label: '原始尺寸' },
] as const

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function PngToSvgPanel() {
  const [source, setSource] = useState<RasterSource | null>(null)
  const [mode, setMode] = useState<TraceMode>('mono')
  const [threshold, setThreshold] = useState(128)
  const [invert, setInvert] = useState(false)
  const [colors, setColors] = useState('16')
  const [detail, setDetail] = useState<TraceDetail>('medium')
  const [maxEdge, setMaxEdge] = useState('2048')
  const [result, setResult] = useState<SvgResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const requestId = useRef(0)
  const { copied, copy } = useCopyToClipboard()

  const resultSize = useMemo(
    () => (result ? new Blob([result.svg]).size : 0),
    [result],
  )

  const currentMode = MODES.find((item) => item.value === mode)

  function clearResult() {
    requestId.current += 1
    setResult(null)
    setError(null)
    setBusy(false)
  }

  async function runConvert(target: RasterSource | null = source) {
    if (!target) return
    const id = ++requestId.current
    setBusy(true)
    setError(null)

    try {
      const value = await convertPngToSvg(target, {
        mode,
        threshold,
        invert,
        colors: Number(colors),
        detail,
        maxEdge: maxEdge === 'original' ? null : Number(maxEdge),
      })
      if (id !== requestId.current) return
      setResult(value)
    } catch (convertError) {
      if (id !== requestId.current) return
      setResult(null)
      setError(
        convertError instanceof Error ? convertError.message : '转换失败',
      )
    } finally {
      if (id === requestId.current) setBusy(false)
    }
  }

  async function handleFile(file: File) {
    requestId.current += 1
    setSource(null)
    setResult(null)
    setError(null)
    setBusy(true)

    try {
      const nextSource = await readImageFile(file)
      setSource(nextSource)
      await runConvert(nextSource)
    } catch (readError) {
      setBusy(false)
      setError(readError instanceof Error ? readError.message : '读取图片失败')
    }
  }

  function handleDownload() {
    if (!result || !source) return
    downloadText(
      result.svg,
      replaceExtension(source.name, 'svg'),
      'image/svg+xml;charset=utf-8',
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel>源图片</FieldLabel>
          <FileDrop
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
            title="拖放或点击选择图片"
            hint="支持 PNG / JPEG / WebP / GIF，最大 30MB"
            disabled={busy}
            onFile={(file) => void handleFile(file)}
          />
          {source ? (
            <div className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-foreground/10">
              <img
                src={source.dataUrl}
                alt=""
                className="size-12 rounded object-contain ring-1 ring-foreground/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{source.name}</p>
                <p className="text-xs text-muted-foreground">
                  {source.width} × {source.height} px
                </p>
              </div>
            </div>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>转换方式</FieldLabel>
          <Select
            value={mode}
            onValueChange={(value) => {
              setMode(value as TraceMode)
              clearResult()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>{currentMode?.hint}</FieldDescription>
        </Field>

        {mode === 'mono' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>二值化阈值</FieldLabel>
                <span className="font-mono text-sm text-muted-foreground">
                  {threshold}
                </span>
              </div>
              <Slider
                value={[threshold]}
                min={0}
                max={255}
                step={1}
                onValueChange={(values) => {
                  setThreshold(values[0] ?? 128)
                  clearResult()
                }}
              />
              <FieldDescription>
                阈值越高保留的深色区域越多。
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>最大边长</FieldLabel>
              <Select
                value={maxEdge}
                onValueChange={(value) => {
                  setMaxEdge(value)
                  clearResult()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {MAX_EDGES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>限制描摹尺寸可加快转换。</FieldDescription>
            </Field>

            <Field
              orientation="horizontal"
              className="items-center justify-between rounded-lg p-3 ring-1 ring-foreground/10 sm:col-span-2"
            >
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="invert">反色</FieldLabel>
                <FieldDescription>
                  深色背景上的浅色线条可开启。
                </FieldDescription>
              </div>
              <Switch
                id="invert"
                checked={invert}
                onCheckedChange={(checked) => {
                  setInvert(checked)
                  clearResult()
                }}
              />
            </Field>
          </div>
        ) : null}

        {mode === 'color' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>颜色数量</FieldLabel>
              <Select
                value={colors}
                onValueChange={(value) => {
                  setColors(value)
                  clearResult()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COLOR_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} 色
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>细节</FieldLabel>
              <Select
                value={detail}
                onValueChange={(value) => {
                  setDetail(value as TraceDetail)
                  clearResult()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DETAILS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>最大边长</FieldLabel>
              <Select
                value={maxEdge}
                onValueChange={(value) => {
                  setMaxEdge(value)
                  clearResult()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {MAX_EDGES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}

        {mode === 'embed' ? (
          <FieldDescription>
            不会有任何质量损失，但导出的 SVG 只是包的图片，体积会增大约 1/3。
          </FieldDescription>
        ) : null}
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void runConvert()}
          disabled={!source || busy}
        >
          {busy ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
          ) : (
            <ImageIcon data-icon="inline-start" />
          )}
          {busy ? '转换中…' : result ? '重新转换' : '转换为 SVG'}
        </Button>
        {result ? (
          <span className="text-xs text-muted-foreground">
            {result.width} × {result.height} px · {formatBytes(resultSize)}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">输出预览</p>
          <div
            className="flex h-72 items-center justify-center rounded-xl bg-white p-4 ring-1 ring-foreground/10 [&>svg]:h-full [&>svg]:w-full"
            style={CHECKERBOARD}
            aria-label="SVG 预览"
            dangerouslySetInnerHTML={{ __html: result.svg }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleDownload}>
              <DownloadIcon data-icon="inline-start" />
              下载 SVG
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void copy(result.svg)}
            >
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied ? '已复制' : '复制 SVG'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
