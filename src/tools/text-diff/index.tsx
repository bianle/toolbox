import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CheckIcon,
  Columns2,
  CopyIcon,
  Rows2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import {
  SAMPLE_LEFT,
  SAMPLE_RIGHT,
  computeDiff,
  renderDiffHtml,
  type DiffView,
} from '@/tools/text-diff/diff'

import 'diff2html/bundles/css/diff2html.min.css'

const VIEW_OPTIONS: {
  value: DiffView
  label: string
  icon: typeof Columns2
}[] = [
  { value: 'side-by-side', label: '左右对照', icon: Columns2 },
  { value: 'line-by-line', label: '统一视图', icon: Rows2 },
]

export default function TextDiffTool() {
  const [left, setLeft] = useState(SAMPLE_LEFT)
  const [right, setRight] = useState(SAMPLE_RIGHT)
  const [view, setView] = useState<DiffView>('side-by-side')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const { copied, copy } = useCopyToClipboard()

  const result = useMemo(
    () => computeDiff(left, right, ignoreWhitespace),
    [left, right, ignoreWhitespace],
  )

  const html = useMemo(() => {
    if (left === right) return ''
    return renderDiffHtml(result.patch, view)
  }, [left, right, result.patch, view])

  const identical = left === right

  function swap() {
    setLeft(right)
    setRight(left)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-8 items-center gap-2 text-sm">
          <Switch
            checked={ignoreWhitespace}
            onCheckedChange={setIgnoreWhitespace}
          />
          忽略空白差异
        </label>

        <Button
          type="button"
          variant="outline"
          size="icon"
          title="交换左右"
          aria-label="交换左右"
          onClick={swap}
        >
          <ArrowLeftRight />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel htmlFor="text-diff-left">原文</FieldLabel>
          </div>
          <Textarea
            id="text-diff-left"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            placeholder="粘贴原文…"
            className="min-h-56 font-mono text-sm"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel htmlFor="text-diff-right">对比</FieldLabel>
          </div>
          <Textarea
            id="text-diff-right"
            value={right}
            onChange={(event) => setRight(event.target.value)}
            placeholder="粘贴对比文本…"
            className="min-h-56 font-mono text-sm"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex h-7 flex-wrap items-center justify-between gap-2">
          <FieldLabel>差异</FieldLabel>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div
              className="inline-flex rounded-md border border-input p-px"
              role="group"
              aria-label="视图切换"
            >
              {VIEW_OPTIONS.map((item) => {
                const Icon = item.icon
                const active = view === item.value
                return (
                  <Button
                    key={item.value}
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    title={item.label}
                    aria-label={item.label}
                    aria-pressed={active}
                    className={cn(
                      active && 'bg-muted text-foreground',
                      !active && 'text-muted-foreground',
                    )}
                    onClick={() => setView(item.value)}
                  >
                    <Icon />
                  </Button>
                )
              })}
            </div>

            {identical ? (
              <span className="text-muted-foreground">内容相同</span>
            ) : (
              <>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{result.added}
                </span>
                <span className="font-mono tabular-nums text-red-700 dark:text-red-400">
                  −{result.removed}
                </span>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={identical}
              onClick={() => void copy(result.patch, '已复制 patch')}
            >
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied ? '已复制' : '复制 patch'}
            </Button>
          </div>
        </div>

        {identical ? (
          <p className="text-sm text-muted-foreground">两端文本一致，无差异。</p>
        ) : (
          <div
            className="text-diff-html overflow-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  )
}
