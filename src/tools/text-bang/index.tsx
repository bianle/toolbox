import { useEffect, useMemo, useState } from 'react'
import { Bomb, CheckIcon, CopyIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { cutWords } from '@/tools/text-bang/segment'

const SAMPLE =
  '锤子手机的大爆炸可以把一句话打散成一个个词，点击即可复制。'

export default function TextBangTool() {
  const [input, setInput] = useState(SAMPLE)
  const [words, setWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const { copied, copy } = useCopyToClipboard()
  const { copy: copyWord } = useCopyToClipboard()

  useEffect(() => {
    const text = input.trim()
    if (!text) {
      setWords([])
      setError(null)
      setSelected(new Set())
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = window.setTimeout(() => {
      void cutWords(text)
        .then((tokens) => {
          if (cancelled) return
          setWords(tokens)
          setSelected(new Set())
        })
        .catch((err) => {
          if (cancelled) return
          setWords([])
          setError(err instanceof Error ? err.message : '分词失败')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [input])

  const selectedText = useMemo(() => {
    return [...selected]
      .sort((a, b) => a - b)
      .map((index) => words[index])
      .join('')
  }, [selected, words])

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="text-bang-input">文本</FieldLabel>
          <Textarea
            id="text-bang-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴一句话…"
            className="min-h-32 text-sm"
            spellCheck={false}
          />
          <FieldDescription>
            本地 jieba-wasm 分词，类似锤子「大爆炸」：点词复制，多选后可合并复制。
          </FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setInput(SAMPLE)}
          >
            <Bomb data-icon="inline-start" />
            填入示例
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void copy(selectedText)}
            disabled={!selectedText}
          >
            {copied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {copied ? '已复制' : '复制所选'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            disabled={selected.size === 0}
          >
            清空选择
          </Button>
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">分词结果</span>
          {loading ? <Badge variant="outline">分词中…</Badge> : null}
          {!loading && words.length > 0 ? (
            <Badge variant="secondary">{words.length} 词</Badge>
          ) : null}
          {selected.size > 0 ? (
            <Badge variant="outline">已选 {selected.size}</Badge>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {words.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-lg p-3 ring-1 ring-foreground/10">
            {words.map((word, index) => {
              const isSelected = selected.has(index)
              return (
                <button
                  key={`${index}-${word}`}
                  type="button"
                  className={cn(
                    'rounded-md px-2.5 py-1.5 font-mono text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted',
                    isSelected &&
                      'bg-primary text-primary-foreground ring-primary',
                  )}
                  title="单击复制 · 再点可选中/取消"
                  onClick={(event) => {
                    if (event.shiftKey || event.metaKey || event.ctrlKey) {
                      toggleSelect(index)
                      return
                    }
                    void copyWord(word, '已复制')
                  }}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    toggleSelect(index)
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    toggleSelect(index)
                  }}
                >
                  {word}
                </button>
              )
            })}
          </div>
        ) : !loading && input.trim() === '' ? (
          <p className="text-sm text-muted-foreground">输入文本后自动分词。</p>
        ) : null}

        <FieldDescription>
          单击复制单词；右键或 Ctrl/⌘+单击多选，再用「复制所选」。
        </FieldDescription>
      </div>
    </div>
  )
}
