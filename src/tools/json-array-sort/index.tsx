import { useMemo, useState } from 'react'

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
import { Textarea } from '@/components/ui/textarea'
import {
  collectSortFields,
  findArrayFields,
  resolvePath,
  SAMPLE_JSON,
  SELF_FIELD,
  sortJsonArrays,
} from '@/tools/json-array-sort/sort'

const SELF_LABEL = '（按元素本身）'

const DIRECTION_OPTIONS = [
  { value: 'asc', label: '升序 A → Z' },
  { value: 'desc', label: '降序 Z → A' },
] as const

export default function JsonArraySortTool() {
  const [input, setInput] = useState(SAMPLE_JSON)
  const [selectedPaths, setSelectedPaths] = useState<string[] | null>(null)
  const [sortField, setSortField] = useState(SELF_FIELD)
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [caseSensitive, setCaseSensitive] = useState(false)

  const parsed = useMemo(() => {
    const text = input.trim()
    if (!text) {
      return { data: undefined as unknown, error: null, empty: true }
    }
    try {
      return { data: JSON.parse(text) as unknown, error: null, empty: false }
    } catch (err) {
      return {
        data: undefined as unknown,
        error: err instanceof Error ? err.message : 'JSON 解析失败',
        empty: false,
      }
    }
  }, [input])

  const arrayFields = useMemo(
    () => (parsed.error ? [] : findArrayFields(parsed.data)),
    [parsed],
  )

  const activeArrayPaths = useMemo(() => {
    if (arrayFields.length === 0) return []
    if (selectedPaths === null) return [arrayFields[0].path]
    return selectedPaths.filter((path) =>
      arrayFields.some((field) => field.path === path),
    )
  }, [arrayFields, selectedPaths])

  const selectedArrays = useMemo(
    () =>
      activeArrayPaths
        .map((path) => resolvePath(parsed.data, path))
        .filter((value): value is unknown[] => Array.isArray(value)),
    [parsed.data, activeArrayPaths],
  )

  const sortFields = useMemo(() => {
    const fields = new Set<string>()
    for (const array of selectedArrays) {
      for (const field of collectSortFields(array)) fields.add(field)
    }
    return [...fields]
  }, [selectedArrays])

  const activeSortField = useMemo(() => {
    if (sortFields.length === 0) return SELF_FIELD
    if (sortField === SELF_FIELD || !sortFields.includes(sortField)) {
      return sortFields[0]
    }
    return sortField
  }, [sortFields, sortField])

  const result = useMemo(() => {
    if (parsed.error || parsed.empty || activeArrayPaths.length === 0) {
      return { output: '', error: null as string | null }
    }
    try {
      const sorted = sortJsonArrays(
        parsed.data,
        activeArrayPaths,
        activeSortField === SELF_FIELD ? null : activeSortField,
        { caseSensitive, descending: direction === 'desc' },
      )
      return { output: JSON.stringify(sorted, null, 2), error: null }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : '排序失败',
      }
    }
  }, [
    parsed,
    activeArrayPaths,
    activeSortField,
    caseSensitive,
    direction,
  ])

  const error = parsed.error ?? result.error

  function toggleArrayPath(path: string) {
    setSelectedPaths((prev) => {
      const current =
        prev ?? (arrayFields.length > 0 ? [arrayFields[0].path] : [])
      return current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path]
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="json-array-input">JSON</FieldLabel>
          <Textarea
            id="json-array-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 JSON…"
            className="min-h-52 max-h-96 overflow-auto font-mono text-sm"
            spellCheck={false}
          />
        </Field>

        <Field>
          <FieldLabel>数组字段（可多选）</FieldLabel>
          {arrayFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">未发现数组</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {arrayFields.map((field) => {
                const selected = activeArrayPaths.includes(field.path)
                return (
                  <Button
                    key={field.path || '__root__'}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    aria-pressed={selected}
                    onClick={() => toggleArrayPath(field.path)}
                  >
                    {field.label}（{field.length} 项）
                  </Button>
                )
              })}
            </div>
          )}
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-44">
            <FieldLabel>排序字段</FieldLabel>
            <Select
              value={activeSortField}
              onValueChange={(value) => {
                if (value) setSortField(value)
              }}
              disabled={selectedArrays.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="按元素本身" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortFields.length === 0 ? (
                    <SelectItem value={SELF_FIELD}>{SELF_LABEL}</SelectItem>
                  ) : (
                    sortFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-40">
            <FieldLabel>排序方向</FieldLabel>
            <Select
              value={direction}
              onValueChange={(value) => {
                if (value) setDirection(value as 'asc' | 'desc')
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DIRECTION_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field
            orientation="horizontal"
            className="w-auto items-center gap-2 pb-2"
          >
            <FieldLabel htmlFor="json-array-case" className="cursor-pointer">
              大小写敏感
            </FieldLabel>
            <Switch
              id="json-array-case"
              checked={caseSensitive}
              onCheckedChange={setCaseSensitive}
            />
          </Field>

          <Button
            type="button"
            variant="outline"
            className="mb-0.5"
            onClick={() => setInput(SAMPLE_JSON)}
          >
            载入示例
          </Button>
        </div>

        <FieldDescription>
          自动识别 JSON 中的数组字段，可多选并用同一排序字段一起排序；缺少该字段的
          数组保持原顺序。排序字段为数组元素的对象键。默认大小写不敏感（按语言环境，
          数字字符串按数值比较）；开启大小写敏感后按字符编码比较，大写字母排在小写
          字母之前。
        </FieldDescription>
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Field>
        <div className="flex h-7 items-center">
          <FieldLabel>排序结果</FieldLabel>
        </div>
        <CodeBlock
          code={result.output}
          language="json"
          placeholder="输出结果…"
          copyable
          className="min-h-72"
        />
      </Field>
    </div>
  )
}
