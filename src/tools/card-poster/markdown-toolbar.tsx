import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export type MarkdownFormat =
  | 'bold'
  | 'italic'
  | 'heading'
  | 'quote'
  | 'code'
  | 'link'
  | 'ul'
  | 'ol'

interface ApplyResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

function wrapInline(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string,
): ApplyResult {
  const selected = value.slice(start, end)
  const inner = selected || placeholder
  const next = value.slice(0, start) + before + inner + after + value.slice(end)
  const selectionStart = start + before.length
  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + inner.length,
  }
}

function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): ApplyResult {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const lineEndIndex = value.indexOf('\n', end)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  const block = value.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const nextBlock = lines
    .map((line, index) => {
      if (prefix === '1. ') return `${index + 1}. ${line}`
      return `${prefix}${line}`
    })
    .join('\n')
  const next =
    value.slice(0, lineStart) + nextBlock + value.slice(lineEnd)
  return {
    value: next,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length,
  }
}

export function applyMarkdownFormat(
  value: string,
  start: number,
  end: number,
  format: MarkdownFormat,
): ApplyResult {
  switch (format) {
    case 'bold':
      return wrapInline(value, start, end, '**', '**', '粗体文本')
    case 'italic':
      return wrapInline(value, start, end, '*', '*', '斜体文本')
    case 'heading':
      return prefixLines(value, start, end, '## ')
    case 'quote':
      return prefixLines(value, start, end, '> ')
    case 'code':
      if (start !== end && value.slice(start, end).includes('\n')) {
        return wrapInline(value, start, end, '```\n', '\n```', 'code')
      }
      return wrapInline(value, start, end, '`', '`', 'code')
    case 'link':
      return wrapInline(value, start, end, '[', '](url)', '链接文本')
    case 'ul':
      return prefixLines(value, start, end, '- ')
    case 'ol':
      return prefixLines(value, start, end, '1. ')
  }
}

const ACTIONS: {
  format: MarkdownFormat
  label: string
  icon: typeof BoldIcon
  group?: 'end'
}[] = [
  { format: 'bold', label: '粗体', icon: BoldIcon },
  { format: 'italic', label: '斜体', icon: ItalicIcon },
  { format: 'heading', label: '标题', icon: Heading2Icon },
  { format: 'quote', label: '引用', icon: QuoteIcon, group: 'end' },
  { format: 'code', label: '代码', icon: CodeIcon },
  { format: 'link', label: '链接', icon: LinkIcon, group: 'end' },
  { format: 'ul', label: '无序列表', icon: ListIcon },
  { format: 'ol', label: '有序列表', icon: ListOrderedIcon },
]

export function MarkdownToolbar({
  onFormat,
}: {
  onFormat: (format: MarkdownFormat) => void
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1"
      role="toolbar"
      aria-label="Markdown 格式"
    >
      {ACTIONS.map((action, index) => {
        const Icon = action.icon
        const prev = ACTIONS[index - 1]
        const showSep = index > 0 && prev?.group === 'end'
        return (
          <span key={action.format} className="contents">
            {showSep ? (
              <Separator orientation="vertical" className="mx-1 h-4" />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title={action.label}
              aria-label={action.label}
              onClick={() => onFormat(action.format)}
            >
              <Icon />
            </Button>
          </span>
        )
      })}
    </div>
  )
}
