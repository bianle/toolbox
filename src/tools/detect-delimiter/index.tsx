import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, ScanText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
  detectDelimiter,
  formatDelimiter,
  rowsToJson,
  rowsToTsv,
  splitByDelimiter,
} from '@/tools/detect-delimiter/detect'

const SAMPLE = `name, age, city
Alice, 30, Shanghai
Bob, 25, Beijing
Carol, 28, Shenzhen`

const PREVIEW_ROWS = 12

export default function DetectDelimiterTool() {
  const [input, setInput] = useState(SAMPLE)
  const [manualDelimiter, setManualDelimiter] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()
  const { copied: copiedJson, copy: copyJson } = useCopyToClipboard()
  const { copy: copyCell } = useCopyToClipboard()

  const detection = useMemo(() => detectDelimiter(input), [input])

  const activeDelimiter =
    manualDelimiter ?? detection.best?.delimiter ?? null

  const rows = useMemo(() => {
    if (activeDelimiter === null || activeDelimiter === '') return []
    return splitByDelimiter(input, activeDelimiter)
  }, [input, activeDelimiter])

  const previewRows = rows.slice(0, PREVIEW_ROWS)
  const colCount = previewRows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  )

  const hasResult = activeDelimiter !== null && activeDelimiter !== ''

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="delimiter-input">文本</FieldLabel>
          <Textarea
            id="delimiter-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setManualDelimiter(null)
            }}
            placeholder="粘贴多行分隔文本…"
            className="min-h-44 font-mono text-sm"
            spellCheck={false}
          />
          <FieldDescription>
            自动识别常见分隔符；也可在下方自定义。
          </FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setInput(SAMPLE)
              setManualDelimiter(null)
            }}
          >
            <ScanText data-icon="inline-start" />
            填入示例
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setManualDelimiter(null)}
            disabled={manualDelimiter === null}
          >
            恢复自动识别
          </Button>
        </div>

        <Field>
          <FieldLabel htmlFor="custom-delimiter">分隔符</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="custom-delimiter"
              value={activeDelimiter ?? ''}
              onChange={(event) => setManualDelimiter(event.target.value)}
              className="max-w-xs font-mono"
              spellCheck={false}
              placeholder="例如 , 或 ,␠"
            />
            {hasResult ? (
              <Badge variant="secondary">
                {formatDelimiter(activeDelimiter)}
              </Badge>
            ) : null}
            {manualDelimiter !== null ? (
              <Badge variant="outline">自定义</Badge>
            ) : detection.best ? (
              <Badge variant="outline">自动</Badge>
            ) : null}
          </div>
          <FieldDescription>
            可输入任意分隔符，例如 <span className="font-mono">,</span>、
            <span className="font-mono">, </span>、
            <span className="font-mono">|</span>。
          </FieldDescription>
        </Field>
      </FieldGroup>

      {hasResult && previewRows.length > 0 ? (
        <Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel>拆分预览</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copy(rowsToTsv(rows))}
                disabled={rows.length === 0}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? '已复制' : '复制 TSV'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copyJson(rowsToJson(rows))}
                disabled={rows.length === 0}
              >
                {copiedJson ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copiedJson ? '已复制' : '复制 JSON'}
              </Button>
            </div>
          </div>
          <div className="rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {Array.from({ length: colCount }, (_, index) => (
                    <TableHead key={index}>列 {index + 1}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="text-muted-foreground">
                      {rowIndex + 1}
                    </TableCell>
                    {Array.from({ length: colCount }, (_, colIndex) => {
                      const value = row[colIndex] ?? ''
                      return (
                        <TableCell
                          key={colIndex}
                          className="max-w-48 truncate p-0 font-mono"
                        >
                          <button
                            type="button"
                            className="block w-full truncate px-2 py-2 text-left hover:bg-muted/60"
                            title={value ? `点击复制：${value}` : undefined}
                            disabled={!value}
                            onClick={() =>
                              void copyCell(value, '已复制单元格')
                            }
                          >
                            {value}
                          </button>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > PREVIEW_ROWS ? (
            <FieldDescription>
              点击单元格可复制；仅预览前 {PREVIEW_ROWS} 行，共 {rows.length}{' '}
              行。
            </FieldDescription>
          ) : (
            <FieldDescription>
              点击单元格可复制；共 {rows.length} 行。
            </FieldDescription>
          )}
        </Field>
      ) : input.trim() && !hasResult ? (
        <p className="text-sm text-muted-foreground">
          未能自动识别分隔符，请在上方自定义。
        </p>
      ) : null}
    </div>
  )
}
