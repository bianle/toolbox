import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatDelimiter } from '@/tools/detect-delimiter/detect'
import { explodeText, type BangMode } from '@/tools/text-bang/segment'

const SAMPLE_DELIMITER = 'Alice, Bob, Carol, Dave, Eve'
const SAMPLE_JIEBA =
  '锤子手机的大爆炸可以把一句话打散成一个个词，点击即可复制。'

const COMMON_DELIMITERS: { value: string; label: string }[] = [
  { value: ', ', label: ',␠' },
  { value: ',', label: ',' },
  { value: '\t', label: '\\t' },
  { value: '|', label: '|' },
  { value: ';', label: ';' },
  { value: ' ', label: '空格' },
  { value: '，', label: '，' },
  { value: '、', label: '、' },
]

const MODES: { value: BangMode; label: string }[] = [
  { value: 'delimiter', label: '分隔符' },
  { value: 'jieba', label: 'jieba' },
]

export default function TextBangTool() {
  const [mode, setMode] = useState<BangMode>('delimiter')
  const [input, setInput] = useState(SAMPLE_DELIMITER)
  const [delimiter, setDelimiter] = useState(', ')
  const [tokens, setTokens] = useState<string[]>([])
  const [resolvedDelimiter, setResolvedDelimiter] = useState<string | null>(
    ', ',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { copy } = useCopyToClipboard()

  useEffect(() => {
    const text = input.trim()
    if (!text) {
      setTokens([])
      setError(null)
      setResolvedDelimiter(mode === 'delimiter' ? delimiter : null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = window.setTimeout(() => {
      void explodeText(text, mode, delimiter)
        .then((result) => {
          if (cancelled) return
          setTokens(result.tokens)
          setResolvedDelimiter(result.delimiter)
        })
        .catch((err) => {
          if (cancelled) return
          setTokens([])
          setError(err instanceof Error ? err.message : '切分失败')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [input, mode, delimiter])

  function switchMode(next: BangMode) {
    setMode(next)
    if (next === 'delimiter' && input === SAMPLE_JIEBA) {
      setInput(SAMPLE_DELIMITER)
    }
    if (next === 'jieba' && input === SAMPLE_DELIMITER) {
      setInput(SAMPLE_JIEBA)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel>切分方式</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {MODES.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={mode === item.value ? 'default' : 'outline'}
                onClick={() => switchMode(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <FieldDescription>
            默认按分隔符切分；需要中文分词时切换到 jieba。
          </FieldDescription>
        </Field>

        {mode === 'delimiter' ? (
          <Field>
            <FieldLabel htmlFor="text-bang-delimiter">分隔符</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DELIMITERS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="font-mono"
                    onClick={() => setDelimiter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <Input
                id="text-bang-delimiter"
                value={delimiter}
                onChange={(event) => setDelimiter(event.target.value)}
                className="max-w-40 font-mono"
                spellCheck={false}
                placeholder=", "
              />
            </div>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="text-bang-input">文本</FieldLabel>
          <Textarea
            id="text-bang-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴文本…"
            className="min-h-32 text-sm"
            spellCheck={false}
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">切分结果</span>
          {loading ? <Badge variant="outline">处理中…</Badge> : null}
          {!loading && tokens.length > 0 ? (
            <Badge variant="secondary">{tokens.length} 项</Badge>
          ) : null}
          {!loading && tokens.length > 0 ? (
            <Badge variant="outline">
              {mode === 'jieba'
                ? 'jieba'
                : `分隔符 ${formatDelimiter(resolvedDelimiter ?? '')}`}
            </Badge>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {tokens.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-lg p-3 ring-1 ring-foreground/10">
            {tokens.map((token, index) => (
              <button
                key={`${index}-${token}`}
                type="button"
                className="rounded-md px-2.5 py-1.5 font-mono text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted"
                title={`点击复制：${token}`}
                onClick={() => void copy(token, '已复制')}
              >
                {token}
              </button>
            ))}
          </div>
        ) : !loading && input.trim() === '' ? (
          <p className="text-sm text-muted-foreground">输入文本后自动切分。</p>
        ) : null}
      </div>
    </div>
  )
}
