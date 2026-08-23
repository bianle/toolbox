export interface DelimiterCandidate {
  delimiter: string
  label: string
  occurrences: number
  columns: number
  consistent: boolean
  emptyRatio: number
  score: number
}

export interface DetectResult {
  best: DelimiterCandidate | null
  candidates: DelimiterCandidate[]
  lines: string[]
}

const FIXED_CANDIDATES: { delimiter: string; label: string }[] = [
  { delimiter: ', ', label: '逗号+空格 , ' },
  { delimiter: ',', label: '逗号 ,' },
  { delimiter: '\t', label: '制表符 \\t' },
  { delimiter: '|', label: '竖线 |' },
  { delimiter: '; ', label: '分号+空格 ; ' },
  { delimiter: ';', label: '分号 ;' },
  { delimiter: ':', label: '冒号 :' },
  { delimiter: ' ', label: '空格' },
  { delimiter: '，', label: '中文逗号 ，' },
  { delimiter: '、', label: '顿号 、' },
]

const MAX_SAMPLE_LINES = 50

function countOccurrences(text: string, delim: string) {
  if (!delim) return 0
  let count = 0
  let index = 0
  while ((index = text.indexOf(delim, index)) !== -1) {
    count += 1
    index += delim.length
  }
  return count
}

function splitLine(line: string, delim: string) {
  return line.split(delim)
}

function variance(values: number[]) {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length
  return (
    values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length
  )
}

function scoreCandidate(
  lines: string[],
  delimiter: string,
  label: string,
): DelimiterCandidate | null {
  const joined = lines.join('\n')
  const occurrences = countOccurrences(joined, delimiter)
  if (occurrences === 0) return null

  const columnCounts = lines.map((line) => splitLine(line, delimiter).length)
  const columns = Math.round(
    columnCounts.reduce((sum, n) => sum + n, 0) / columnCounts.length,
  )
  if (columns < 2) return null

  const consistent = columnCounts.every((count) => count === columnCounts[0])
  const modeColumns = columnCounts[0]
  const matchRatio =
    columnCounts.filter((count) => count === modeColumns).length /
    columnCounts.length

  let emptyCells = 0
  let totalCells = 0
  for (const line of lines) {
    const cells = splitLine(line, delimiter)
    totalCells += cells.length
    emptyCells += cells.filter((cell) => cell.trim() === '').length
  }
  const emptyRatio = totalCells === 0 ? 1 : emptyCells / totalCells

  // Prefer stable columns, enough fields, enough hits; penalize empty cells / noise.
  const score =
    (consistent ? 120 : matchRatio * 80) +
    columns * 12 +
    Math.min(occurrences, 80) * 0.4 -
    variance(columnCounts) * 8 -
    emptyRatio * 40 -
    (delimiter === ' ' ? 25 : 0)

  return {
    delimiter,
    label,
    occurrences,
    columns: consistent ? modeColumns : columns,
    consistent,
    emptyRatio,
    score,
  }
}

export function detectDelimiter(text: string): DetectResult {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .slice(0, MAX_SAMPLE_LINES)

  if (lines.length === 0) {
    return { best: null, candidates: [], lines: [] }
  }

  const scored = FIXED_CANDIDATES.map(({ delimiter, label }) =>
    scoreCandidate(lines, delimiter, label),
  )
    .filter((item): item is DelimiterCandidate => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // 同分时优先更长分隔符，例如 ", " 优于 ","
      return b.delimiter.length - a.delimiter.length
    })

  return {
    best: scored[0] ?? null,
    candidates: scored,
    lines,
  }
}

export function splitByDelimiter(text: string, delimiter: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => splitLine(line, delimiter))
}

export function formatDelimiter(delimiter: string) {
  if (delimiter === '\t') return '\\t'
  if (delimiter === ' ') return '空格'
  if (delimiter === ', ') return ',␠'
  if (delimiter === '; ') return ';␠'
  if (delimiter === '') return '（空）'
  return delimiter
}

export function rowsToTsv(rows: string[][]) {
  return rows.map((row) => row.join('\t')).join('\n')
}

export function rowsToJson(rows: string[][]) {
  if (rows.length === 0) return '[]'
  const [header, ...body] = rows
  const looksLikeHeader = header.every((cell) => cell.trim().length > 0)
  if (!looksLikeHeader || body.length === 0) {
    return JSON.stringify(rows, null, 2)
  }
  const objects = body.map((row) => {
    const item: Record<string, string> = {}
    header.forEach((key, index) => {
      item[key] = row[index] ?? ''
    })
    return item
  })
  return JSON.stringify(objects, null, 2)
}
