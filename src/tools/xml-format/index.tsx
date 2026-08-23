import { useState } from 'react'
import formatXml from 'xml-formatter'

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
import { Textarea } from '@/components/ui/textarea'

const INDENT_OPTIONS = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
  { value: '8', label: '8 空格' },
  { value: 'tab', label: 'Tab' },
] as const

const SAMPLE = `<root><user id="1"><name>Alice</name><city>Shanghai</city></user><user id="2"><name>Bob</name><city>Beijing</city></user></root>`

export default function XmlFormatTool() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indent, setIndent] = useState('2')

  function format(pretty: boolean) {
    try {
      const trimmed = input.trim()
      if (!trimmed) {
        setOutput('')
        setError(null)
        return
      }

      if (pretty) {
        const indentation = indent === 'tab' ? '\t' : ' '.repeat(Number(indent))
        setOutput(
          formatXml(trimmed, {
            indentation,
            collapseContent: true,
            lineSeparator: '\n',
          }),
        )
      } else {
        setOutput(formatXml.minify(trimmed, { collapseContent: true }))
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'XML 解析失败')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => format(true)}>格式化</Button>

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="xml-indent">缩进</FieldLabel>
          <Select
            value={indent}
            onValueChange={(value) => {
              if (value) setIndent(value)
            }}
          >
            <SelectTrigger id="xml-indent" className="w-32">
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
          placeholder="粘贴 XML…"
          className="min-h-64 font-mono text-sm"
          spellCheck={false}
        />
        <CodeBlock
          code={output}
          language="xml"
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
