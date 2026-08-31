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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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
  csvToHtml,
  formatDelimiterLabel,
  SAMPLE_CSV,
  type CsvDelimiter,
} from '@/tools/csv-to-html/convert'

const PREVIEW_ROWS = 12

const DELIMITER_OPTIONS: { value: CsvDelimiter; label: string }[] = [
  { value: 'auto', label: '自动识别' },
  { value: ',', label: '逗号 ,' },
  { value: '\t', label: '制表符 \\t' },
  { value: ';', label: '分号 ;' },
  { value: '|', label: '竖线 |' },
]

export default function CsvToHtmlTool() {
  const [input, setInput] = useState(SAMPLE_CSV)
  const [delimiter, setDelimiter] = useState<CsvDelimiter>('auto')
  const [useHeaderRow, setUseHeaderRow] = useState(true)
  const [pretty, setPretty] = useState(true)
  const { copied, copy } = useCopyToClipboard()

  const result = useMemo(
    () =>
      csvToHtml(input, {
        delimiter,
        useHeaderRow,
        pretty,
      }),
    [input, delimiter, useHeaderRow, pretty],
  )

  const previewRows = result.rows.slice(0, PREVIEW_ROWS)
  const headerRow = useHeaderRow ? previewRows[0] : null
  const bodyRows = useHeaderRow ? previewRows.slice(1) : previewRows
  const colCount = (headerRow ?? previewRows[0] ?? []).length

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="csv-input">CSV</FieldLabel>
          <Textarea
            id="csv-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 CSV 文本…"
            className="min-h-52 font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setInput(SAMPLE_CSV)}
            >
              载入示例
            </Button>
          </div>
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-40">
            <FieldLabel>分隔符</FieldLabel>
            <Select
              value={delimiter}
              onValueChange={(value) => {
                if (value) setDelimiter(value as CsvDelimiter)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DELIMITER_OPTIONS.map((item) => (
                    <SelectItem key={item.label} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="use-header-row" className="cursor-pointer">
              首行作为表头
            </FieldLabel>
            <Switch
              id="use-header-row"
              checked={useHeaderRow}
              onCheckedChange={setUseHeaderRow}
            />
          </Field>

          <Field orientation="horizontal" className="w-auto items-center gap-2 pb-2">
            <FieldLabel htmlFor="pretty-html" className="cursor-pointer">
              格式化 HTML
            </FieldLabel>
            <Switch
              id="pretty-html"
              checked={pretty}
              onCheckedChange={setPretty}
            />
          </Field>
        </div>
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
                <span className="ml-2 font-normal text-muted-foreground">
                  分隔符：{formatDelimiterLabel(result.delimiter)}
                </span>
              </FieldLabel>
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
                        {rowIndex + 1}
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
            <FieldLabel>HTML 输出</FieldLabel>
            <CodeBlock
              code={result.html}
              language="html"
              placeholder="HTML 结果…"
              copyable
              className="min-h-48"
            />
          </Field>
        </>
      ) : input.trim() && !result.error ? (
        <p className="text-sm text-muted-foreground">等待有效 CSV 输入…</p>
      ) : null}
    </div>
  )
}
