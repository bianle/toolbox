import { useMemo, useState } from 'react'
import { ArrowLeftRightIcon, CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  parseColor,
  swapRgbBgr,
  toCssRgb,
  toCsv,
  toHex,
  type ColorChannels,
} from '@/tools/rgb-bgr/convert'

const SAMPLE = '#FF5733'

function CopyValue({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
      <div className="min-w-28 shrink-0 text-sm text-muted-foreground">
        {label}
      </div>
      <Input value={value} readOnly className="flex-1 font-mono text-sm" />
      <Button
        type="button"
        variant="secondary"
        className="shrink-0"
        onClick={() => void copy(value)}
        disabled={!value}
      >
        {copied ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <CopyIcon data-icon="inline-start" />
        )}
        {copied ? '已复制' : '复制'}
      </Button>
    </div>
  )
}

function ColorPanel({
  title,
  orderLabel,
  color,
}: {
  title: string
  orderLabel: string
  color: ColorChannels
}) {
  const hex = toHex(color)
  const css = toCssRgb(color)
  const csv = toCsv(color)

  return (
    <div className="flex flex-col gap-3 rounded-lg p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <div
          className="size-14 shrink-0 rounded-md ring-1 ring-foreground/15"
          style={{ backgroundColor: hex }}
          title={hex}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{orderLabel}</div>
          <div className="mt-0.5 font-mono text-sm">{hex}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <CopyValue label="Hex" value={hex} />
        <CopyValue label="CSS" value={css} />
        <CopyValue label="通道" value={csv} />
      </div>
    </div>
  )
}

export default function RgbBgrTool() {
  const [input, setInput] = useState(SAMPLE)

  const result = useMemo(() => {
    const parsed = parseColor(input)
    if (!parsed.ok) return parsed
    const swapped = swapRgbBgr(parsed.color)
    return {
      ok: true as const,
      rgb: parsed.color,
      bgr: swapped,
    }
  }, [input])

  function swapInput() {
    if (!result.ok) return
    setInput(toHex(result.bgr))
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="rgb-bgr-input">颜色</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="rgb-bgr-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="#FF5733 · rgb(255,87,51) · 255,87,51"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={swapInput}
              disabled={!result.ok}
            >
              <ArrowLeftRightIcon data-icon="inline-start" />
              交换写入
            </Button>
          </div>
          <FieldDescription>
            支持 #RGB / #RRGGBB、0xRRGGBB、rgb(r,g,b)、R,G,B。互转即交换 R
            与 B（OpenCV 常用 BGR）。
          </FieldDescription>
        </Field>
      </FieldGroup>

      {result.ok ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ColorPanel
            title="RGB"
            orderLabel="R → G → B（常见 Web / CSS）"
            color={result.rgb}
          />
          <ColorPanel
            title="BGR"
            orderLabel="B → G → R（OpenCV 内存序）"
            color={result.bgr}
          />
        </div>
      ) : (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      )}

      {result.ok ? (
        <p className="text-sm text-muted-foreground">
          同一颜色在 OpenCV 中常写成{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            Scalar({result.rgb.b}, {result.rgb.g}, {result.rgb.r})
          </code>
          （按 B,G,R）。
        </p>
      ) : null}
    </div>
  )
}
