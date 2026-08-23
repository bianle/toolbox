import { useEffect, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  convertData,
  DATA_FORMATS,
  SAMPLE_BY_FORMAT,
  type DataFormat,
} from '@/tools/data-convert/convert'

export default function DataConvertTool() {
  const [from, setFrom] = useState<DataFormat>('json')
  const [to, setTo] = useState<DataFormat>('yaml')
  const [input, setInput] = useState(SAMPLE_BY_FORMAT.json)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInput(SAMPLE_BY_FORMAT[from])
    setOutput('')
    setError(null)
  }, [from])

  function convert() {
    try {
      setOutput(convertData(input, from, to))
      setError(null)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : '转换失败')
    }
  }

  function swapFormats() {
    const nextFrom = to
    const nextTo = from
    setFrom(nextFrom)
    setTo(nextTo)
    if (output) {
      setInput(output)
      setOutput(input)
      setError(null)
    } else {
      setInput(SAMPLE_BY_FORMAT[nextFrom])
      setOutput('')
      setError(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-36">
          <FieldLabel>源格式</FieldLabel>
          <Select
            value={from}
            onValueChange={(value) => {
              if (value) setFrom(value as DataFormat)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DATA_FORMATS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Button
          type="button"
          variant="outline"
          size="icon"
          title="交换格式"
          aria-label="交换格式"
          onClick={swapFormats}
        >
          <ArrowLeftRight />
        </Button>

        <Field className="w-36">
          <FieldLabel>目标格式</FieldLabel>
          <Select
            value={to}
            onValueChange={(value) => {
              if (value) setTo(value as DataFormat)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DATA_FORMATS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Button onClick={convert}>转换</Button>
      </div>

      <FieldDescription>
        以对象模型互转。XML 多根或数组会包一层 root；TOML 根节点需为对象且不含
        null。
      </FieldDescription>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel htmlFor="data-convert-input">输入</FieldLabel>
          </div>
          <Textarea
            id="data-convert-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`粘贴 ${from.toUpperCase()}…`}
            className="min-h-72 font-mono text-sm"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel>结果</FieldLabel>
          </div>
          <CodeBlock
            code={output}
            language={to === 'xml' ? 'xml' : to}
            placeholder="输出结果…"
            copyable
            className="min-h-72"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
