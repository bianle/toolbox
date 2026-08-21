import { useEffect, useMemo, useState } from 'react'
import { DownloadIcon, DicesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AVATAR_STYLES,
  avatarDataUri,
  avatarToPngBlob,
  randomSeed,
  type StyleKey,
} from '@/tools/diceface/avatar'
import { bytesFromHex, sha256Hex } from '@/tools/diceface/hash'

const SIZES = ['128', '256', '512'] as const

export default function DiceFaceTool() {
  const [seed, setSeed] = useState('alice@example.com')
  const [hash, setHash] = useState('')
  const [style, setStyle] = useState<StyleKey>('identicon')
  const [size, setSize] = useState('256')
  const [bgMode, setBgMode] = useState<'auto' | 'none'>('auto')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const trimmed = seed.trim()
    if (!trimmed) {
      setHash('')
      return
    }

    let cancelled = false
    void sha256Hex(trimmed).then((value) => {
      if (!cancelled) setHash(value)
    })

    return () => {
      cancelled = true
    }
  }, [seed])

  const previewSrc = useMemo(() => {
    const trimmed = seed.trim()
    if (!trimmed || !hash) return null

    const bytes = bytesFromHex(hash)
    const background =
      bgMode === 'auto'
        ? bytes[bytes.length - 1]! % 2 === 0
          ? '#f3f0f7'
          : null
        : null

    return avatarDataUri({
      seed: trimmed,
      style,
      size: Number(size),
      background,
    })
  }, [seed, hash, style, size, bgMode])

  async function handleDownload() {
    const trimmed = seed.trim()
    if (!trimmed || !hash) return

    setDownloading(true)
    try {
      const bytes = bytesFromHex(hash)
      const background =
        bgMode === 'auto'
          ? bytes[bytes.length - 1]! % 2 === 0
            ? '#f3f0f7'
            : null
          : null

      const blob = await avatarToPngBlob({
        seed: trimmed,
        style,
        size: Number(size),
        background,
      })
      if (!blob) return

      const link = document.createElement('a')
      link.download = `diceface-${hash.slice(0, 8)}.png`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor="diceface-seed">Seed / 输入</FieldLabel>
            <Input
              id="diceface-seed"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="邮箱、用户名或任意字符串…"
              spellCheck={false}
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSeed(randomSeed())}
          >
            <DicesIcon data-icon="inline-start" />
            随机
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>风格</FieldLabel>
            <Select
              value={style}
              onValueChange={(value) => setStyle(value as StyleKey)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {AVATAR_STYLES.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

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
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>背景</FieldLabel>
            <Select
              value={bgMode}
              onValueChange={(value) => setBgMode(value as 'auto' | 'none')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="auto">自动</SelectItem>
                  <SelectItem value="none">透明</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col items-center gap-3">
        <div
          className="flex size-60 items-center justify-center overflow-hidden rounded-xl ring-1 ring-foreground/10"
          style={{
            backgroundImage: `
              linear-gradient(45deg, var(--border) 25%, transparent 25%),
              linear-gradient(-45deg, var(--border) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, var(--border) 75%),
              linear-gradient(-45deg, transparent 75%, var(--border) 75%)
            `,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="头像预览"
              className="size-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-sm text-muted-foreground">
              请输入内容以生成头像
            </p>
          )}
        </div>
        <p className="max-w-full break-all font-mono text-xs text-muted-foreground">
          {hash ? `${hash.slice(0, 16)}…` : '—'}
        </p>
      </div>

      <div>
        <Button
          onClick={() => void handleDownload()}
          disabled={!previewSrc || downloading}
        >
          <DownloadIcon data-icon="inline-start" />
          {downloading ? '导出中…' : '下载 PNG'}
        </Button>
      </div>
    </div>
  )
}
