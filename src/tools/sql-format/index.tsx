import { useState } from 'react'
import { format as formatSql, type SqlLanguage } from 'sql-formatter'

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

const SAMPLE = `select u.id,u.name,o.amount from users u left join orders o on u.id=o.user_id where u.status='active' and o.amount>100 order by o.amount desc`

const DIALECT_OPTIONS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server' },
]

const INDENT_OPTIONS = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
  { value: 'tab', label: 'Tab' },
] as const

const KEYWORD_CASE_OPTIONS = [
  { value: 'upper', label: '关键字大写' },
  { value: 'lower', label: '关键字小写' },
  { value: 'preserve', label: '保持原样' },
] as const

export default function SqlFormatTool() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dialect, setDialect] = useState<SqlLanguage>('sql')
  const [indent, setIndent] = useState('2')
  const [keywordCase, setKeywordCase] =
    useState<(typeof KEYWORD_CASE_OPTIONS)[number]['value']>('upper')

  function format() {
    try {
      const trimmed = input.trim()
      if (!trimmed) {
        setOutput('')
        setError(null)
        return
      }

      const formatted = formatSql(trimmed, {
        language: dialect,
        tabWidth: indent === 'tab' ? 1 : Number(indent),
        useTabs: indent === 'tab',
        keywordCase,
      })
      setOutput(formatted)
      setError(null)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : 'SQL 格式化失败')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={format}>格式化</Button>

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="sql-dialect">方言</FieldLabel>
          <Select
            value={dialect}
            onValueChange={(value) => {
              if (value) setDialect(value as SqlLanguage)
            }}
          >
            <SelectTrigger id="sql-dialect" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {DIALECT_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="sql-indent">缩进</FieldLabel>
          <Select
            value={indent}
            onValueChange={(value) => {
              if (value) setIndent(value)
            }}
          >
            <SelectTrigger id="sql-indent" className="w-28">
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

        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <FieldLabel htmlFor="sql-keyword-case">关键字</FieldLabel>
          <Select
            value={keywordCase}
            onValueChange={(value) => {
              if (value) {
                setKeywordCase(
                  value as (typeof KEYWORD_CASE_OPTIONS)[number]['value'],
                )
              }
            }}
          >
            <SelectTrigger id="sql-keyword-case" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {KEYWORD_CASE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴 SQL…"
          className="min-h-64 font-mono text-sm"
          spellCheck={false}
        />
        <CodeBlock
          code={output}
          language="sql"
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
