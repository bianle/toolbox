import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import {
  decodeUri,
  encodeUri,
  type UriMode,
} from '@/tools/uri-codec/codec'

const SAMPLE = 'https://example.com/search?q=你好 world&lang=zh-CN'

const MODES: { value: UriMode; label: string; hint: string }[] = [
  {
    value: 'component',
    label: 'Component',
    hint: 'encodeURIComponent，适合查询参数、片段',
  },
  {
    value: 'uri',
    label: 'URI',
    hint: 'encodeURI，保留 :/?&=# 等 URL 结构字符',
  },
]

export default function UriCodecTool() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<UriMode>('component')
  const { copied, copy } = useCopyToClipboard()

  const modeHint = useMemo(
    () => MODES.find((item) => item.value === mode)?.hint ?? '',
    [mode],
  )

  function encode() {
    try {
      setOutput(encodeUri(input, mode))
      setError(null)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : '编码失败')
    }
  }

  function decode() {
    const result = decodeUri(input, mode)
    if (!result.ok) {
      setOutput('')
      setError(result.error)
      return
    }
    setOutput(result.value)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel>模式</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {MODES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={mode === item.value ? 'default' : 'outline'}
                onClick={() => setMode(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <FieldDescription>{modeHint}</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={encode}>编码</Button>
        <Button variant="outline" onClick={decode}>
          解码
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <div className="flex h-7 items-center">
            <FieldLabel htmlFor="uri-input">输入</FieldLabel>
          </div>
          <Textarea
            id="uri-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴要编码或解码的文本…"
            className="min-h-48 font-mono text-sm"
            spellCheck={false}
          />
        </Field>

        <Field>
          <div className="flex h-7 items-center justify-between gap-2">
            <FieldLabel htmlFor="uri-output">结果</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!output}
              title={copied ? '已复制' : '复制'}
              aria-label={copied ? '已复制' : '复制'}
              onClick={() => void copy(output)}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </div>
          <Textarea
            id="uri-output"
            value={output}
            readOnly
            placeholder="输出结果…"
            className={cn(
              'min-h-48 font-mono text-sm',
              error && 'border-destructive',
            )}
          />
        </Field>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
