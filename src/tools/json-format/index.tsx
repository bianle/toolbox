import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

export default function JsonFormatTool() {
  const [input, setInput] = useState('{\n  "hello": "world"\n}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()

  function format(pretty: boolean) {
    try {
      const parsed: unknown = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, pretty ? 2 : 0))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 解析失败')
      setOutput('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => format(true)}>格式化</Button>
        <Button variant="outline" onClick={() => format(false)}>
          压缩
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copy(output)}
          disabled={!output}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? '已复制' : '复制结果'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴 JSON…"
          className="min-h-64 font-mono text-sm"
        />
        <Textarea
          value={output}
          readOnly
          placeholder="输出结果…"
          className="min-h-64 font-mono text-sm"
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
