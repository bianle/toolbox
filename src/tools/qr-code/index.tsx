import { useEffect, useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import QRCode from 'qrcode'

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
import { Textarea } from '@/components/ui/textarea'

const SIZES = ['128', '256', '512'] as const
const LEVELS = [
  { value: 'L', label: 'L · 低' },
  { value: 'M', label: 'M · 中' },
  { value: 'Q', label: 'Q · 较高' },
  { value: 'H', label: 'H · 高' },
] as const

type ErrorLevel = (typeof LEVELS)[number]['value']

export default function QrCodeTool() {
  const [text, setText] = useState('https://example.com')
  const [size, setSize] = useState('256')
  const [level, setLevel] = useState<ErrorLevel>('M')
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const content = text.trim()
    if (!content) {
      setDataUrl('')
      setError(null)
      return
    }

    let cancelled = false
    void QRCode.toDataURL(content, {
      width: Number(size),
      margin: 2,
      errorCorrectionLevel: level,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (cancelled) return
        setDataUrl(url)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setDataUrl('')
        setError(err instanceof Error ? err.message : '生成失败')
      })

    return () => {
      cancelled = true
    }
  }, [text, size, level])

  function handleDownload() {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="qr-text">内容</FieldLabel>
          <Textarea
            id="qr-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="输入链接或文本…"
            className="min-h-28 font-mono text-sm"
          />
          <FieldDescription>本地生成，内容不会上传。</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>尺寸</FieldLabel>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SIZES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}px
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>容错级别</FieldLabel>
            <Select
              value={level}
              onValueChange={(value) => setLevel(value as ErrorLevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LEVELS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col items-start gap-3">
        <div className="flex size-64 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="二维码预览"
              className="size-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-sm text-muted-foreground">
              输入内容后自动生成
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={!dataUrl}
        >
          <DownloadIcon data-icon="inline-start" />
          下载 PNG
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
