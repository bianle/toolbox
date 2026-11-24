import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { GH_PROXY_PREFIXES, toProxyText } from '@/tools/github-proxy/convert'

const SAMPLE = 'git clone https://github.com/junegunn/fzf.git'

function CopyRow({ value }: { value: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex items-center gap-2">
      <Input value={value} readOnly className="flex-1 font-mono text-sm" />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="shrink-0"
        disabled={!value}
        title={copied ? '已复制' : '复制'}
        aria-label={copied ? '已复制' : '复制'}
        onClick={() => void copy(value)}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}

export default function GithubProxyTool() {
  const [input, setInput] = useState(SAMPLE)

  const results = useMemo(
    () =>
      GH_PROXY_PREFIXES.map((prefix) => toProxyText(input, prefix)).filter(
        Boolean,
      ),
    [input],
  )

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="gh-proxy-input">GitHub 链接</FieldLabel>
          <Input
            id="gh-proxy-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 GitHub 链接或 git clone 命令…"
            className="font-mono text-sm"
            spellCheck={false}
          />
          <FieldDescription>
            每个加速前缀各生成一条，直接替换文本中的链接并保留
            <code className="mx-1">git clone …</code>
            等命令其余部分；已有加速前缀会自动替换，也支持
            <code className="mx-1">git@github.com:</code>
            与省略协议的写法。
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel>加速链接</FieldLabel>
        <div className="flex flex-col gap-2">
          {results.length ? (
            results.map((value) => <CopyRow key={value} value={value} />)
          ) : (
            <p className="text-sm text-muted-foreground">输入链接后自动生成</p>
          )}
        </div>
      </Field>
    </div>
  )
}
