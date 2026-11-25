import { useMemo, useRef, useState } from 'react'
import { DownloadIcon, Loader2Icon, ScanLineIcon } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { FileDrop } from '@/tools/image-convert/file-drop'
import {
  downloadDataUrl,
  getSvgInfo,
  rasterizeSvg,
  readFileAsText,
  replaceExtension,
  type SvgRasterResult,
} from '@/tools/image-convert/convert'

const BACKGROUNDS = [
  { value: 'transparent', label: '透明' },
  { value: '#ffffff', label: '白色' },
  { value: '#000000', label: '黑色' },
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

export function SvgToPngPanel() {
  const [svgText, setSvgText] = useState('')
  const [fileName, setFileName] = useState('image')
  const [width, setWidth] = useState('1024')
  const [background, setBackground] = useState('transparent')
  const [result, setResult] = useState<SvgRasterResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const requestId = useRef(0)

  const parsed = useMemo(() => {
    if (!svgText.trim()) {
      return { ok: false as const, info: null, error: null }
    }
    try {
      return { ok: true as const, info: getSvgInfo(svgText), error: null }
    } catch (parseError) {
      return {
        ok: false as const,
        info: null,
        error:
          parseError instanceof Error ? parseError.message : 'SVG 解析失败',
      }
    }
  }, [svgText])

  const outputWidth = Number(width)
  const validWidth = Number.isFinite(outputWidth) && outputWidth >= 1
  const outputHeight =
    parsed.ok && validWidth
      ? Math.max(
          1,
          Math.round((outputWidth * parsed.info.height) / parsed.info.width),
        )
      : null

  const displayError =
    error ?? (svgText.trim() && !parsed.ok ? parsed.error : null)

  const resultSize = useMemo(() => {
    if (!result) return 0
    const base64 = result.dataUrl.slice(result.dataUrl.indexOf(',') + 1)
    return Math.round(base64.length * 0.75)
  }, [result])

  function resetOutput() {
    requestId.current += 1
    setResult(null)
    setError(null)
    setBusy(false)
  }

  async function runConvert(text = svgText) {
    if (!text.trim()) return
    const id = ++requestId.current
    setBusy(true)
    setError(null)

    try {
      const targetWidth = Number(width)
      if (!Number.isFinite(targetWidth) || targetWidth < 1) {
        throw new Error('请输入有效的输出宽度')
      }
      const value = await rasterizeSvg(text, {
        width: targetWidth,
        background,
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
    if (!/\.svg$/i.test(file.name) && !file.type.includes('svg')) {
      setError('请选择 SVG 文件')
      return
    }

    resetOutput()
    setBusy(true)

    try {
      const text = await readFileAsText(file)
      setSvgText(text)
      setFileName(file.name)
      await runConvert(text)
    } catch (readError) {
      setBusy(false)
      setError(readError instanceof Error ? readError.message : '读取文件失败')
    }
  }

  function handleDownload() {
    if (!result) return
    downloadDataUrl(result.dataUrl, replaceExtension(fileName, 'png'))
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel>SVG 文件</FieldLabel>
          <FileDrop
            accept=".svg,image/svg+xml"
            title="拖放或点击选择 SVG 文件"
            hint="也可以直接在下方粘贴 SVG 代码"
            disabled={busy}
            onFile={(file) => void handleFile(file)}
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="svg-code">SVG 代码</FieldLabel>
            {parsed.ok ? (
              <span className="text-xs text-muted-foreground">
                {Math.round(parsed.info.width)} ×{' '}
                {Math.round(parsed.info.height)} px
              </span>
            ) : null}
          </div>
          <Textarea
            id="svg-code"
            value={svgText}
            onChange={(event) => {
              setSvgText(event.target.value)
              resetOutput()
            }}
            placeholder={'<svg xmlns="http://www.w3.org/2000/svg" …>…</svg>'}
            className="min-h-40 font-mono text-xs"
            spellCheck={false}
          />
          <FieldDescription>
            支持粘贴完整 SVG 或片段；转换在浏览器本地完成。
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="output-width">输出宽度</FieldLabel>
            <Input
              id="output-width"
              type="number"
              min={1}
              max={8192}
              step={1}
              value={width}
              onChange={(event) => {
                setWidth(event.target.value)
                resetOutput()
              }}
              className="font-mono"
            />
            <FieldDescription>
              {outputHeight
                ? `输出尺寸约为 ${Math.round(outputWidth)} × ${outputHeight} px，高度按比例计算。`
                : '高度会按原图比例自动计算，最大 8192 px。'}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>背景</FieldLabel>
            <Select
              value={background}
              onValueChange={(value) => {
                setBackground(value)
                resetOutput()
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BACKGROUNDS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>透明背景会保留 SVG 的 alpha 通道。</FieldDescription>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void runConvert()}
          disabled={!svgText.trim() || !parsed.ok || !validWidth || busy}
        >
          {busy ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
          ) : (
            <ScanLineIcon data-icon="inline-start" />
          )}
          {busy ? '转换中…' : result ? '重新转换' : '转换为 PNG'}
        </Button>
        {result ? (
          <span className="text-xs text-muted-foreground">
            {result.width} × {result.height} px · {formatBytes(resultSize)}
          </span>
        ) : null}
      </div>

      {displayError ? (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">输出预览</p>
          <div
            className="flex min-h-56 items-center justify-center rounded-xl p-4 ring-1 ring-foreground/10"
            style={CHECKERBOARD}
          >
            <img
              src={result.dataUrl}
              alt="PNG 预览"
              className="max-h-72 max-w-full object-contain"
            />
          </div>
          <div>
            <Button type="button" onClick={handleDownload}>
              <DownloadIcon data-icon="inline-start" />
              下载 PNG
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
