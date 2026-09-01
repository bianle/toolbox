import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  mdToHtml,
  SAMPLE_MARKDOWN,
  type HtmlOutputMode,
} from '@/tools/md-to-html/convert'

const OUTPUT_MODE_OPTIONS: { value: HtmlOutputMode; label: string }[] = [
  { value: 'fragment', label: 'HTML 片段' },
  { value: 'document', label: '完整 HTML 文档' },
]

export default function MdToHtmlTool() {
  const [input, setInput] = useState(SAMPLE_MARKDOWN)
  const [gfm, setGfm] = useState(true)
  const [breaks, setBreaks] = useState(true)
  const [outputMode, setOutputMode] = useState<HtmlOutputMode>('fragment')
  const [documentTitle, setDocumentTitle] = useState('Document')
  const { copied, copy } = useCopyToClipboard()

  const result = useMemo(
    () =>
      mdToHtml(input, {
        gfm,
        breaks,
        outputMode,
        documentTitle,
      }),
    [input, gfm, breaks, outputMode, documentTitle],
  )

  const previewHtml = useMemo(
    () =>
      mdToHtml(input, {
        gfm,
        breaks,
        outputMode: 'fragment',
      }).html,
    [input, gfm, breaks],
  )

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="md-input">Markdown</FieldLabel>
          <Textarea
            id="md-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 Markdown 文本…"
            className="min-h-52 font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setInput(SAMPLE_MARKDOWN)}
            >
              载入示例
            </Button>
          </div>
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-44">
            <FieldLabel>输出格式</FieldLabel>
            <Select
              value={outputMode}
              onValueChange={(value) => {
                if (value) setOutputMode(value as HtmlOutputMode)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {OUTPUT_MODE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {outputMode === 'document' ? (
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="document-title">文档标题</FieldLabel>
              <Input
                id="document-title"
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder="Document"
              />
            </Field>
          ) : null}

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="gfm" className="cursor-pointer">
              GFM
            </FieldLabel>
            <Switch id="gfm" checked={gfm} onCheckedChange={setGfm} />
          </Field>

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="breaks" className="cursor-pointer">
              换行转 &lt;br&gt;
            </FieldLabel>
            <Switch id="breaks" checked={breaks} onCheckedChange={setBreaks} />
          </Field>
        </div>
      </FieldGroup>

      {result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}

      {input.trim() && !result.error ? (
        <>
          <Field>
            <FieldLabel>预览</FieldLabel>
            <div className="md-to-html-preview rounded-lg border bg-card p-4 text-sm leading-relaxed">
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-muted-foreground">等待有效 Markdown 输入…</p>
              )}
            </div>
          </Field>

          <Field>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel>HTML 输出</FieldLabel>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copy(result.html)}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? '已复制' : '复制 HTML'}
              </Button>
            </div>
            <CodeBlock
              code={result.html}
              language="html"
              placeholder="HTML 结果…"
              copyable
              className="min-h-48"
            />
            {outputMode === 'document' ? (
              <FieldDescription>
                已包含 &lt;!DOCTYPE html&gt; 与完整文档结构。
              </FieldDescription>
            ) : (
              <FieldDescription>输出为可直接嵌入页面的 HTML 片段。</FieldDescription>
            )}
          </Field>
        </>
      ) : null}

      <style>{`
        .md-to-html-preview h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 1rem;
          line-height: 1.3;
        }
        .md-to-html-preview h2 {
          font-size: 1.375rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.4;
        }
        .md-to-html-preview h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }
        .md-to-html-preview p {
          margin: 0 0 1rem;
        }
        .md-to-html-preview ul,
        .md-to-html-preview ol {
          margin: 0 0 1rem;
          padding-left: 1.5rem;
        }
        .md-to-html-preview li {
          margin: 0.25rem 0;
        }
        .md-to-html-preview blockquote {
          margin: 0 0 1rem;
          padding-left: 1rem;
          border-left: 3px solid var(--border);
          color: var(--muted-foreground);
        }
        .md-to-html-preview pre {
          margin: 0 0 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          background: var(--muted);
          overflow-x: auto;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }
        .md-to-html-preview code {
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
        }
        .md-to-html-preview :not(pre) > code {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background: var(--muted);
        }
        .md-to-html-preview table {
          width: 100%;
          margin: 0 0 1rem;
          border-collapse: collapse;
        }
        .md-to-html-preview th,
        .md-to-html-preview td {
          border: 1px solid var(--border);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .md-to-html-preview th {
          background: var(--muted);
          font-weight: 600;
        }
        .md-to-html-preview hr {
          margin: 1.5rem 0;
          border: none;
          border-top: 1px solid var(--border);
        }
        .md-to-html-preview a {
          color: var(--primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
