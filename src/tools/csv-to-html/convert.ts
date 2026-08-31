import { detectDelimiter } from '@/tools/detect-delimiter/detect'

export type CsvDelimiter = 'auto' | ',' | '\t' | ';' | '|'

export interface CsvToHtmlOptions {
  delimiter?: CsvDelimiter
  useHeaderRow?: boolean
  pretty?: boolean
}

export interface CsvToHtmlResult {
  rows: string[][]
  html: string
  delimiter: string
  error?: string
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeRows(rows: string[][]) {
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0)
  return rows.map((row) => {
    const padded = [...row]
    while (padded.length < maxCols) padded.push('')
    return padded
  })
}

export function parseDelimitedText(text: string, delimiter: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  function pushField() {
    row.push(field)
    field = ''
  }

  function pushRow() {
    if (row.length > 0 || field.length > 0) {
      pushField()
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
      row = []
      field = ''
    }
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (delimiter.length === 1 && char === delimiter) {
      pushField()
      continue
    }

    if (delimiter.length > 1 && normalized.startsWith(delimiter, index)) {
      pushField()
      index += delimiter.length - 1
      continue
    }

    if (char === '\n') {
      pushRow()
      continue
    }

    field += char
  }

  if (inQuotes) {
    throw new Error('CSV 引号未闭合')
  }

  pushRow()

  return normalizeRows(rows)
}

function resolveDelimiter(text: string, delimiter: CsvDelimiter) {
  if (delimiter !== 'auto') return delimiter

  const detection = detectDelimiter(text)
  return detection.best?.delimiter ?? ','
}

export function rowsToHtmlTable(
  rows: string[][],
  options: { useHeaderRow?: boolean; pretty?: boolean } = {},
) {
  if (rows.length === 0) return ''

  const pretty = options.pretty ?? true
  const useHeaderRow = options.useHeaderRow ?? true
  const newline = pretty ? '\n' : ''
  const indent = pretty ? '  ' : ''

  const headerRow = useHeaderRow ? rows[0] : null
  const bodyRows = useHeaderRow ? rows.slice(1) : rows

  let html = `<table>${newline}`

  if (headerRow) {
    html += `${indent}<thead>${newline}`
    html += `${indent}${indent}<tr>${newline}`
    for (const cell of headerRow) {
      html += `${indent}${indent}${indent}<th>${escapeHtml(cell)}</th>${newline}`
    }
    html += `${indent}${indent}</tr>${newline}`
    html += `${indent}</thead>${newline}`
  }

  html += `${indent}<tbody>${newline}`
  for (const row of bodyRows) {
    html += `${indent}${indent}<tr>${newline}`
    for (const cell of row) {
      html += `${indent}${indent}${indent}<td>${escapeHtml(cell)}</td>${newline}`
    }
    html += `${indent}${indent}</tr>${newline}`
  }
  html += `${indent}</tbody>${newline}</table>`

  return html
}

export function csvToHtml(
  text: string,
  options: CsvToHtmlOptions = {},
): CsvToHtmlResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { rows: [], html: '', delimiter: ',' }
  }

  const delimiter = resolveDelimiter(trimmed, options.delimiter ?? 'auto')

  try {
    const rows = parseDelimitedText(trimmed, delimiter)
    if (rows.length === 0) {
      return {
        rows: [],
        html: '',
        delimiter,
        error: '未解析到有效数据行',
      }
    }

    return {
      rows,
      html: rowsToHtmlTable(rows, {
        useHeaderRow: options.useHeaderRow,
        pretty: options.pretty,
      }),
      delimiter,
    }
  } catch (error) {
    return {
      rows: [],
      html: '',
      delimiter,
      error: error instanceof Error ? error.message : 'CSV 解析失败',
    }
  }
}

export const SAMPLE_CSV = `名称,ID,标题,分类,日期,状态
示例项目 A,1001,条目一,类型 A,2024-03-15,已完成
示例项目 B,1002,条目二,类型 B,2024-03-16,进行中`

export function formatDelimiterLabel(delimiter: string) {
  if (delimiter === '\t') return '制表符'
  if (delimiter === ', ') return '逗号+空格'
  if (delimiter === '; ') return '分号+空格'
  if (delimiter === ' ') return '空格'
  return delimiter
}
