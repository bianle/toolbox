import { useState } from 'react'

import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
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

const INDENT_OPTIONS = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
  { value: '8', label: '8 空格' },
  { value: 'tab', label: 'Tab' },
] as const

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => [key, sortJsonKeys(record[key])]),
    )
  }
  return value
}

export default function JsonFormatTool() {
  const [input, setInput] = useState(
    '{\n  "hello": "world",\n  "zebra": 1,\n  "apple": true\n}',
  )
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sortKeys, setSortKeys] = useState(true)
  const [indent, setIndent] = useState('2')

  function format(pretty: boolean) {
    try {
      let parsed: unknown = JSON.parse(input)
      if (sortKeys) {
        parsed = sortJsonKeys(parsed)
      }
      const space: string | number =
        !pretty ? 0 : indent === 'tab' ? '\t' : Number(indent)
      setOutput(JSON.stringify(parsed, null, space))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 解析失败')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => format(true)}>格式化</Button>

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="json-sort-keys" className="cursor-pointer">
            字段排序
          </FieldLabel>
          <Switch
            id="json-sort-keys"
            checked={sortKeys}
            onCheckedChange={setSortKeys}
          />
        </Field>

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="json-indent">缩进</FieldLabel>
          <Select
            value={indent}
            onValueChange={(value) => {
              if (value) setIndent(value)
            }}
          >
            <SelectTrigger id="json-indent" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {INDENT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Button variant="outline" onClick={() => format(false)}>
          压缩
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴 JSON…"
          className="min-h-64 font-mono text-sm"
        />
        <CodeBlock
          code={output}
          language="json"
          placeholder="输出结果…"
          copyable
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
