import type { ToolCategory } from '@/types/tool'

export const CATEGORY_ORDER: ToolCategory[] = [
  'format',
  'text',
  'convert',
  'encode',
  'other',
]

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  format: '格式',
  text: '文本',
  convert: '转换',
  encode: '编码',
  other: '其他',
}
