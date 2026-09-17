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
  sortJsonArray,
} from '@/tools/json-array-sort/sort'

const ROOT_ARRAY = '__root__'
const SELF_LABEL = '（按元素本身）'

const DIRECTION_OPTIONS = [
  { value: 'asc', label: '升序 A → Z' },
  { value: 'desc', label: '降序 Z → A' },
] as const

function toRootValue(path: string) {
  return path === '' ? ROOT_ARRAY : path
}

export default function JsonArraySortTool() {
  const [input, setInput] = useState(SAMPLE_JSON)
  const [arrayPath, setArrayPath] = useState('')
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

  const activeArrayPath = useMemo(() => {
    if (arrayFields.length === 0) return ''
    if (arrayFields.some((field) => field.path === arrayPath)) return arrayPath
    return arrayFields[0].path
  }, [arrayFields, arrayPath])

  const selectedArray = useMemo(() => {
    const value = resolvePath(parsed.data, activeArrayPath)
    return Array.isArray(value) ? value : null
  }, [parsed.data, activeArrayPath])

  const sortFields = useMemo(
    () => (selectedArray ? collectSortFields(selectedArray) : []),
    [selectedArray],
  )

  const activeSortField = useMemo(() => {
    if (sortFields.length === 0) return SELF_FIELD
    if (sortField === SELF_FIELD || !sortFields.includes(sortField)) {
      return sortFields[0]
    }
    return sortField
  }, [sortFields, sortField])

  const result = useMemo(() => {
    if (parsed.error || parsed.empty || arrayFields.length === 0) {
      return { output: '', error: null as string | null }
    }
    try {
      const sorted = sortJsonArray(
        parsed.data,
        activeArrayPath,
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
  }, [parsed, arrayFields, activeArrayPath, activeSortField, caseSensitive, direction])

  const error = parsed.error ?? result.error

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
            className="min-h-52 font-mono text-sm"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-48">
            <FieldLabel>数组字段</FieldLabel>
            <Select
              value={toRootValue(activeArrayPath)}
              onValueChange={(value) => {
                if (value) setArrayPath(value === ROOT_ARRAY ? '' : value)
              }}
              disabled={arrayFields.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="未发现数组" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {arrayFields.map((field) => (
                    <SelectItem
                      key={toRootValue(field.path)}
                      value={toRootValue(field.path)}
                    >
                      {field.label}（{field.length} 项）
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-44">
            <FieldLabel>排序字段</FieldLabel>
            <Select
              value={activeSortField}
              onValueChange={(value) => {
                if (value) setSortField(value)
              }}
              disabled={!selectedArray}
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
          自动识别 JSON 中的数组字段，多个时可选择；排序字段为数组元素的对象键。
          默认大小写不敏感（按语言环境，数字字符串按数值比较）；开启大小写敏感后
          按字符编码比较，大写字母排在小写字母之前。
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
