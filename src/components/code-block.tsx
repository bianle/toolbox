import { useMemo } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { highlightCode, type PrismLanguage } from '@/lib/prism'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: PrismLanguage | string
  placeholder?: string
  className?: string
  copyable?: boolean
}

export function CodeBlock({
  code,
  language = 'json',
  placeholder = '暂无内容',
  className,
  copyable = false,
}: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard()
  const html = useMemo(() => {
    if (!code) return ''
    return highlightCode(code, language)
  }, [code, language])

  return (
    <div className={cn('relative min-h-64', className)}>
      {copyable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 z-10 bg-background/80 text-muted-foreground hover:text-foreground"
          disabled={!code}
          title={copied ? '已复制' : '复制'}
          aria-label={copied ? '已复制' : '复制'}
          onClick={() => void copy(code, '已复制')}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      ) : null}

      {!code ? (
        <div className="flex h-full min-h-64 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground">
          {placeholder}
        </div>
      ) : (
        <pre className="code-block h-full min-h-64 overflow-auto rounded-lg border border-input bg-muted/30 p-3 pr-10 text-sm">
          <code
            className={`language-${language} font-mono text-sm leading-relaxed`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      )}
    </div>
  )
}
