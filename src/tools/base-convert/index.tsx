import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

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
  COMMON_BASES,
  formatBigInt,
  parseBigInt,
} from '@/tools/base-convert/convert'

const BASE_OPTIONS = Array.from({ length: 35 }, (_, index) => index + 2)

function ResultRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
      <div className="min-w-28 text-sm text-muted-foreground">{label}</div>
      <Input
        value={value}
        readOnly
        className="flex-1 font-mono text-sm"
      />
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

export default function BaseConvertTool() {
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState('10')

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      return { ok: false as const, error: null }
    }
    try {
      const value = parseBigInt(trimmed, Number(fromBase))
      return {
        ok: true as const,
        value,
        outputs: COMMON_BASES.map((base) => ({
          ...base,
          text: formatBigInt(value, base.value),
        })),
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '转换失败',
      }
    }
  }, [input, fromBase])

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field>
            <FieldLabel htmlFor="base-input">输入</FieldLabel>
            <Input
              id="base-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="例如 255、FF、11111111"
            />
          </Field>
          <Field>
            <FieldLabel>输入进制</FieldLabel>
            <Select value={fromBase} onValueChange={setFromBase}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BASE_OPTIONS.map((base) => (
                    <SelectItem key={base} value={String(base)}>
                      {base} 进制
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <FieldDescription>
          支持 2–36 进制，使用 BigInt，可处理较大整数；本地转换。
        </FieldDescription>
      </FieldGroup>

      {result.ok ? (
        <div className="flex flex-col gap-3">
          {result.outputs.map((item) => (
            <ResultRow
              key={item.value}
              label={item.label}
              value={item.text}
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
