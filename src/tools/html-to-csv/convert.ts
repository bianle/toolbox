export type HtmlSource = 'auto' | 'table' | 'ul'

export interface HtmlToCsvOptions {
  source?: HtmlSource
  skipActions?: boolean
  customHeaders?: string[]
}

export interface HtmlToCsvResult {
  rows: string[][]
  source: 'table' | 'ul' | null
  csv: string
  error?: string
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function getCellText(cell: Element) {
  return normalizeText(cell.textContent ?? '')
}

function isActionColumn(element: Element) {
  if (element.classList.contains('t6')) return true

  const links = element.querySelectorAll('a')
  if (links.length === 0) return false

  const text = normalizeText(element.textContent ?? '')
  const linkText = Array.from(links)
    .map((link) => normalizeText(link.textContent ?? ''))
    .join('')

  return linkText.length > 0 && linkText === text
}

function parseLiRow(li: Element, skipActions: boolean) {
  const row: string[] = []

  for (const child of li.children) {
    if (skipActions && isActionColumn(child)) continue
    row.push(getCellText(child))
  }

  return row
}

function parseTable(doc: Document, skipActions: boolean) {
  const tables = Array.from(doc.querySelectorAll('table'))
  if (tables.length === 0) return []

  let bestTable = tables[0]
  let maxRows = 0

  for (const table of tables) {
    const rowCount = table.querySelectorAll('tr').length
    if (rowCount > maxRows) {
      maxRows = rowCount
      bestTable = table
    }
  }

  const rows: string[][] = []

  for (const tr of bestTable.querySelectorAll('tr')) {
    const cells = tr.querySelectorAll('th, td')
    if (cells.length === 0) continue

    const row = Array.from(cells).map((cell) => {
      if (skipActions && isActionColumn(cell)) return ''
      return getCellText(cell)
    })

    if (row.some((cell) => cell.length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

function parseUl(doc: Document, skipActions: boolean) {
  const lists = Array.from(doc.querySelectorAll('ul'))
  if (lists.length === 0) return []

  let bestList = lists.find((list) => list.classList.contains('th_list')) ?? lists[0]
  let maxItems = 0

  for (const list of lists) {
    const itemCount = list.querySelectorAll(':scope > li').length
    if (itemCount > maxItems) {
      maxItems = itemCount
      bestList = list
    }
  }

  const rows: string[][] = []

  for (const li of bestList.querySelectorAll(':scope > li')) {
    const row = parseLiRow(li, skipActions)
    if (row.length > 0) rows.push(row)
  }

  return rows
}

function resolveSource(
  doc: Document,
  source: HtmlSource,
  skipActions: boolean,
): 'table' | 'ul' | null {
  const tableRows = parseTable(doc, skipActions)
  const ulRows = parseUl(doc, skipActions)

  if (source === 'table') {
    return tableRows.length > 0 ? 'table' : null
  }

  if (source === 'ul') {
    return ulRows.length > 0 ? 'ul' : null
  }

  if (tableRows.length === 0 && ulRows.length === 0) return null
  if (tableRows.length >= ulRows.length) return 'table'
  return 'ul'
}

export function escapeCsvField(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function rowsToCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')
}

export function htmlToCsv(
  html: string,
  options: HtmlToCsvOptions = {},
): HtmlToCsvResult {
  const source = options.source ?? 'auto'
  const skipActions = options.skipActions ?? true
  const customHeaders = options.customHeaders?.filter((item) => item.trim())

  const trimmed = html.trim()
  if (!trimmed) {
    return { rows: [], source: null, csv: '' }
  }

  const doc = new DOMParser().parseFromString(trimmed, 'text/html')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    return {
      rows: [],
      source: null,
      csv: '',
      error: 'HTML 解析失败，请检查输入格式',
    }
  }

  const resolvedSource = resolveSource(doc, source, skipActions)
  if (!resolvedSource) {
    return {
      rows: [],
      source: null,
      csv: '',
      error: '未找到可转换的 table 或 ul 列表',
    }
  }

  let rows =
    resolvedSource === 'table'
      ? parseTable(doc, skipActions)
      : parseUl(doc, skipActions)

  if (rows.length === 0) {
    return {
      rows: [],
      source: resolvedSource,
      csv: '',
      error: '未提取到有效数据行',
    }
  }

  if (resolvedSource === 'ul' && customHeaders?.length) {
    rows = [customHeaders, ...rows]
  }

  return {
    rows,
    source: resolvedSource,
    csv: rowsToCsv(rows),
  }
}

export const SAMPLE_HTML = `<ul class="th_list clearfix">
  <li>
    <span class="t1">示例项目 A</span>
    <span class="t2">1001</span>
    <span class="t3" title="条目一">条目一</span>
    <span class="t2"><em>类型 A</em></span>
    <span class="t4">2024-03-15</span>
    <span class="t5"><em class="t5 green">已完成</em></span>
    <span class="t6">
      <a href="javascript:void(0);">查看</a>
      <a href="javascript:void(0);">删除</a>
    </span>
  </li>
  <li>
    <span class="t1">示例项目 B</span>
    <span class="t2">1002</span>
    <span class="t3" title="条目二">条目二</span>
    <span class="t2"><em>类型 B</em></span>
    <span class="t4">2024-03-16</span>
    <span class="t5"><em class="t5 green">进行中</em></span>
    <span class="t6">
      <a href="javascript:void(0);">查看</a>
      <a href="javascript:void(0);">删除</a>
    </span>
  </li>
</ul>`

export const SAMPLE_TABLE_HTML = `<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>城市</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>30</td>
      <td>Shanghai</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>25</td>
      <td>Beijing</td>
    </tr>
  </tbody>
</table>`

export const UL_DEFAULT_HEADERS = [
  '名称',
  'ID',
  '标题',
  '分类',
  '日期',
  '状态',
]
