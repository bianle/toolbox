import eaw from 'eastasianwidth'

export interface TextStats {
  /** Unicode 码点数（含空格） */
  chars: number
  /** 不含普通空格 */
  charsNoSpace: number
  /** 不含任意空白（空格/制表/换行等） */
  charsNoWhitespace: number
  /** 汉字（Han） */
  han: number
  /** 东亚显示宽度（汉字等宽字符 2，英文等窄字符 1） */
  displayWidth: number
  /** 英文/数字词（连续字母数字） */
  words: number
  /** 行数（空输入为 0） */
  lines: number
  /** 非空行 */
  nonEmptyLines: number
  /** 段落（空行分隔） */
  paragraphs: number
  /** UTF-8 字节 */
  utf8Bytes: number
}

const HAN_RE = /\p{Script=Han}/gu
const WORD_RE = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g

function codePoints(text: string): string[] {
  return Array.from(text)
}

export function countText(text: string): TextStats {
  if (!text) {
    return {
      chars: 0,
      charsNoSpace: 0,
      charsNoWhitespace: 0,
      han: 0,
      displayWidth: 0,
      words: 0,
      lines: 0,
      nonEmptyLines: 0,
      paragraphs: 0,
      utf8Bytes: 0,
    }
  }

  const points = codePoints(text)
  const chars = points.length
  const charsNoSpace = points.filter((ch) => ch !== ' ').length
  const charsNoWhitespace = points.filter((ch) => !/\s/u.test(ch)).length
  const han = text.match(HAN_RE)?.length ?? 0
  const displayWidth = eaw.length(text)
  const words = text.match(WORD_RE)?.length ?? 0

  const rawLines = text.split(/\r\n|\n|\r/)
  const lines = rawLines.length
  const nonEmptyLines = rawLines.filter((line) => line.trim().length > 0).length

  const paragraphs = text
    .trim()
    .split(/\r\n\s*\r\n|\n\s*\n|\r\s*\r/)
    .filter((part) => part.trim().length > 0).length

  const utf8Bytes = new TextEncoder().encode(text).length

  return {
    chars,
    charsNoSpace,
    charsNoWhitespace,
    han,
    displayWidth,
    words,
    lines,
    nonEmptyLines,
    paragraphs,
    utf8Bytes,
  }
}

export const STAT_ROWS: { key: keyof TextStats; label: string; hint?: string }[] =
  [
    { key: 'chars', label: '字符（含空格）', hint: '按 Unicode 码点计数' },
    { key: 'charsNoSpace', label: '字符（不含空格）' },
    { key: 'charsNoWhitespace', label: '字符（不含空白）', hint: '不含空格、制表、换行等' },
    { key: 'han', label: '汉字' },
    {
      key: 'displayWidth',
      label: '显示宽度',
      hint: '东亚宽度：汉字等宽字符计 2，英文等窄字符计 1',
    },
    { key: 'words', label: '英文词', hint: '连续字母/数字' },
    { key: 'lines', label: '行数' },
    { key: 'nonEmptyLines', label: '非空行' },
    { key: 'paragraphs', label: '段落', hint: '空行分隔' },
    { key: 'utf8Bytes', label: 'UTF-8 字节' },
  ]

export const SAMPLE = `Toolbox 字数统计

支持中英混排：Hello, 世界！
一行、一段，实时统计。`
