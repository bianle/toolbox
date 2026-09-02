import { useMemo, useState } from 'react'

import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  SAMPLE,
  STAT_ROWS,
  countText,
} from '@/tools/text-count/count'

export default function TextCountTool() {
  const [input, setInput] = useState(SAMPLE)
  const stats = useMemo(() => countText(input), [input])

  return (
    <div className="flex flex-col gap-4">
      <FieldDescription>
        输入即统计。字符按 Unicode 码点；汉字按 Han 脚本；显示宽度按东亚宽度（汉字 2、英文 1）；英文词按连续字母/数字。
      </FieldDescription>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel htmlFor="text-count-input">文本</FieldLabel>
          </div>
          <Textarea
            id="text-count-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴或输入文本…"
            className="min-h-72 font-mono text-sm"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-7 items-center">
            <FieldLabel>统计</FieldLabel>
          </div>
          <Field>
            <dl className="divide-y divide-border rounded-lg border border-input">
              {STAT_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="flex items-baseline justify-between gap-4 px-3 py-2.5"
                  title={row.hint}
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="font-mono text-sm tabular-nums">
                    {stats[row.key].toLocaleString('zh-CN')}
                  </dd>
                </div>
              ))}
            </dl>
          </Field>
        </div>
      </div>
    </div>
  )
}
