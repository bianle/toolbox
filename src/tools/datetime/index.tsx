import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, RefreshCwIcon } from 'lucide-react'

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
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  formatDateTime,
  parseDateTimeInput,
  type InputKind,
} from '@/tools/datetime/convert'

const KIND_OPTIONS: { value: InputKind; label: string }[] = [
  { value: 'auto', label: '自动识别' },
  { value: 'unix-s', label: 'Unix 秒' },
  { value: 'unix-ms', label: 'Unix 毫秒' },
  { value: 'iso', label: '日期字符串' },
]

const OUTPUT_ROWS: { key: keyof ReturnType<typeof formatDateTime>; label: string }[] =
  [
    { key: 'unixSeconds', label: 'Unix 秒' },
    { key: 'unixMillis', label: 'Unix 毫秒' },
    { key: 'isoUtc', label: 'ISO 8601（UTC）' },
    { key: 'isoLocal', label: 'ISO 8601（本地）' },
    { key: 'localYmdHms', label: '本地 YYYY-MM-DD HH:mm:ss' },
    { key: 'localString', label: '本地可读' },
    { key: 'utcString', label: 'UTC 可读' },
    { key: 'relative', label: '相对当前' },
  ]

function ResultRow({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
      <div className="min-w-44 shrink-0 text-sm text-muted-foreground">
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

export default function DateTimeTool() {
  const [input, setInput] = useState(() => String(Date.now()))
  const [kind, setKind] = useState<InputKind>('auto')
  const [nowTick, setNowTick] = useState(() => Date.now())

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      return { ok: false as const, error: null }
    }
    try {
      const date = parseDateTimeInput(trimmed, kind)
      return {
        ok: true as const,
        formats: formatDateTime(date, nowTick),
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '转换失败',
      }
    }
  }, [input, kind, nowTick])

  function fillNow() {
    const ms = Date.now()
    setNowTick(ms)
    setInput(String(ms))
    setKind('auto')
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field>
            <FieldLabel htmlFor="datetime-input">输入</FieldLabel>
            <Input
              id="datetime-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="1710000000、1710000000000 或 2024-03-15T12:00:00Z"
            />
          </Field>
          <Field>
            <FieldLabel>输入类型</FieldLabel>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as InputKind)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {KIND_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={fillNow}>
            <RefreshCwIcon data-icon="inline-start" />
            填入当前时间
          </Button>
        </div>
        <FieldDescription>
          自动识别时：绝对值 ≥ 1e11 视为毫秒，否则视为秒。全程本地转换。
        </FieldDescription>
      </FieldGroup>

      {result.ok ? (
        <div className="flex flex-col gap-3">
          {OUTPUT_ROWS.map((row) => (
            <ResultRow
              key={row.key}
              label={row.label}
              value={result.formats[row.key]}
            />
          ))}
        </div>
      ) : result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  )
}
