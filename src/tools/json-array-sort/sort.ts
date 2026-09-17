export interface JsonArrayField {
  path: string
  label: string
  length: number
}

export interface SortOptions {
  caseSensitive?: boolean
  descending?: boolean
}

export const SELF_FIELD = '__self__'

export const SAMPLE_JSON = JSON.stringify(
  {
    users: [
      { name: 'Bob', age: 30, city: 'Beijing' },
      { name: 'alice', age: 25, city: 'Shanghai' },
      { name: 'Charlie', age: 35 },
    ],
    tags: ['Zebra', 'apple', 'Mango'],
  },
  null,
  2,
)

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function resolvePath(root: unknown, path: string): unknown {
  if (!path) return root
  return path.split('.').reduce<unknown>((acc, key) => {
    if (isPlainObject(acc)) return acc[key]
    return undefined
  }, root)
}

function setAtPath(root: unknown, path: string, value: unknown): unknown {
  if (!path) return value
  const keys = path.split('.')
  const clone = (node: unknown, index: number): unknown => {
    const record = isPlainObject(node) ? node : {}
    const next: Record<string, unknown> = { ...record }
    const key = keys[index]
    next[key] =
      index === keys.length - 1 ? value : clone(record[key], index + 1)
    return next
  }
  return clone(root, 0)
}

export function findArrayFields(root: unknown): JsonArrayField[] {
  if (Array.isArray(root)) {
    return [{ path: '', label: '根数组', length: root.length }]
  }

  const fields: JsonArrayField[] = []
  const walk = (node: unknown, path: string) => {
    if (!isPlainObject(node)) return
    for (const [key, value] of Object.entries(node)) {
      const next = path ? `${path}.${key}` : key
      if (Array.isArray(value)) {
        fields.push({ path: next, label: next, length: value.length })
      } else if (isPlainObject(value)) {
        walk(value, next)
      }
    }
  }
  walk(root, '')
  return fields
}

export function collectSortFields(items: unknown[]): string[] {
  const fields = new Set<string>()
  for (const item of items) {
    if (isPlainObject(item)) {
      for (const key of Object.keys(item)) fields.add(key)
    }
  }
  return [...fields]
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function compareValues(a: unknown, b: unknown, caseSensitive: boolean): number {
  const aMissing = a === null || a === undefined
  const bMissing = b === null || b === undefined
  if (aMissing || bMissing) {
    if (aMissing && bMissing) return 0
    return aMissing ? 1 : -1
  }

  if (typeof a === 'number' && typeof b === 'number') {
    const aNaN = Number.isNaN(a)
    const bNaN = Number.isNaN(b)
    if (aNaN || bNaN) {
      if (aNaN && bNaN) return 0
      return aNaN ? 1 : -1
    }
    return a - b
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1
  }

  const aText = toText(a)
  const bText = toText(b)

  if (caseSensitive) {
    if (aText < bText) return -1
    if (aText > bText) return 1
    return 0
  }

  return aText.localeCompare(bText, undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}

export function sortArray(
  items: unknown[],
  sortField: string | null,
  options: SortOptions = {},
): unknown[] {
  const { caseSensitive = false, descending = false } = options
  const decorated = items.map((item, index) => ({ item, index }))

  decorated.sort((a, b) => {
    const av = sortField ? resolvePath(a.item, sortField) : a.item
    const bv = sortField ? resolvePath(b.item, sortField) : b.item
    const cmp = compareValues(av, bv, caseSensitive)
    if (cmp !== 0) return descending ? -cmp : cmp
    return a.index - b.index
  })

  return decorated.map((entry) => entry.item)
}

export function sortJsonArrays(
  root: unknown,
  arrayPaths: string[],
  sortField: string | null,
  options: SortOptions = {},
): unknown {
  return arrayPaths.reduce((acc, path) => {
    const target = resolvePath(acc, path)
    if (!Array.isArray(target)) return acc
    return setAtPath(acc, path, sortArray(target, sortField, options))
  }, root)
}
