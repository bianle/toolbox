import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  htmlToCsv,
  SAMPLE_HTML,
  SAMPLE_TABLE_HTML,
  UL_DEFAULT_HEADERS,
  type HtmlSource,
} from '@/tools/html-to-csv/convert'

const PREVIEW_ROWS = 12

const SOURCE_LABELS: Record<Exclude<HtmlSource, 'auto'> | 'auto', string> = {
  auto: '自动识别',
  table: 'Table 表格',
  ul: 'UL 列表',
}

export default function HtmlToCsvTool() {
  const [input, setInput] = useState(SAMPLE_HTML)
  const [source, setSource] = useState<HtmlSource>('auto')
  const [skipActions, setSkipActions] = useState(true)
  const [useHeaders, setUseHeaders] = useState(true)
  const [headersText, setHeadersText] = useState(UL_DEFAULT_HEADERS.join(', '))
  const { copied, copy } = useCopyToClipboard()

  const customHeaders = useMemo(
    () =>
      headersText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [headersText],
  )

  const result = useMemo(
    () =>
      htmlToCsv(input, {
        source,
        skipActions,
        customHeaders:
          useHeaders && source !== 'table' ? customHeaders : undefined,
      }),
    [input, source, skipActions, useHeaders, customHeaders],
  )

  const previewRows = result.rows.slice(0, PREVIEW_ROWS)
  const showFirstRowAsHeader =
    result.source === 'table' || (result.source === 'ul' && useHeaders)
  const headerRow = showFirstRowAsHeader ? previewRows[0] : null
  const bodyRows = showFirstRowAsHeader ? previewRows.slice(1) : previewRows
  const colCount = (headerRow ?? previewRows[0] ?? []).length

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="html-input">HTML</FieldLabel>
          <Textarea
            id="html-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 HTML 表格或列表…"
            className="min-h-52 font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setInput(SAMPLE_HTML)}
            >
              载入 UL 示例
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setInput(SAMPLE_TABLE_HTML)}
            >
              载入 Table 示例
            </Button>
          </div>
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-40">
            <FieldLabel>数据源</FieldLabel>
            <Select
              value={source}
              onValueChange={(value) => {
                if (value) setSource(value as HtmlSource)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="skip-actions" className="cursor-pointer">
              跳过操作列
            </FieldLabel>
            <Switch
              id="skip-actions"
              checked={skipActions}
              onCheckedChange={setSkipActions}
            />
          </Field>

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="use-headers" className="cursor-pointer">
              添加表头行
            </FieldLabel>
            <Switch
              id="use-headers"
              checked={useHeaders}
              onCheckedChange={setUseHeaders}
            />
          </Field>
        </div>

        {useHeaders ? (
          <Field>
            <FieldLabel htmlFor="csv-headers">表头（逗号分隔）</FieldLabel>
            <Input
              id="csv-headers"
              value={headersText}
              onChange={(event) => setHeadersText(event.target.value)}
              placeholder="列1, 列2, 列3"
              spellCheck={false}
            />
            <FieldDescription>
              Table 自带表头时会保留；UL 列表可在此自定义表头。
            </FieldDescription>
          </Field>
        ) : null}
      </FieldGroup>

      {result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}

      {result.rows.length > 0 ? (
        <>
          <Field>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel>
                预览
                {result.source ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    来源：{SOURCE_LABELS[result.source]}
                  </span>
                ) : null}
              </FieldLabel>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copy(result.csv)}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? '已复制' : '复制 CSV'}
              </Button>
            </div>
            <div className="rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {Array.from({ length: colCount }, (_, index) => (
                      <TableHead key={index}>
                        {headerRow?.[index] || `列 ${index + 1}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bodyRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="text-muted-foreground">
                        {rowIndex + 1 + (showFirstRowAsHeader ? 1 : 0)}
                      </TableCell>
                      {Array.from({ length: colCount }, (_, colIndex) => (
                        <TableCell
                          key={colIndex}
                          className="max-w-48 truncate font-mono text-sm"
                          title={row[colIndex] ?? ''}
                        >
                          {row[colIndex] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {result.rows.length > PREVIEW_ROWS ? (
              <FieldDescription>
                仅预览前 {PREVIEW_ROWS} 行，共 {result.rows.length} 行。
              </FieldDescription>
            ) : (
              <FieldDescription>共 {result.rows.length} 行。</FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel>CSV 输出</FieldLabel>
            <CodeBlock
              code={result.csv}
              placeholder="CSV 结果…"
              copyable
              className="min-h-48"
            />
          </Field>
        </>
      ) : input.trim() && !result.error ? (
        <p className="text-sm text-muted-foreground">等待有效 HTML 输入…</p>
      ) : null}
    </div>
  )
}
