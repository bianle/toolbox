import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
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
import { convertAllCases } from '@/tools/case-convert/convert'

const SAMPLE = 'userName'

function ResultValue({ value }: { value: string }) {
  const { copied, copy } = useCopyToClipboard()

  if (!value) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="inline-flex max-w-full items-center gap-1">
      <span className="break-all font-mono text-sm">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6 shrink-0 text-muted-foreground"
        title={copied ? '已复制' : '复制'}
        aria-label={copied ? '已复制' : '复制'}
        onClick={() => void copy(value)}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}

export default function CaseConvertTool() {
  const [input, setInput] = useState(SAMPLE)

  const results = useMemo(() => convertAllCases(input), [input])

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="case-input">输入</FieldLabel>
          <Textarea
            id="case-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如 user_name、UserName、user-name…"
            className="min-h-24 font-mono text-sm"
            spellCheck={false}
          />
          <FieldDescription>
            自动识别驼峰、下划线、短横线等写法，并转换成常见命名风格。
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">风格</TableHead>
              <TableHead className="w-28">中文名</TableHead>
              <TableHead>结果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {item.label}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.nameZh}
                </TableCell>
                <TableCell>
                  <ResultValue value={item.value} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
