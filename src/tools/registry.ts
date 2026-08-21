import { Braces } from 'lucide-react'
import { lazy } from 'react'

import type { ToolDefinition } from '@/types/tool'

export const tools: ToolDefinition[] = [
  {
    id: 'json-format',
    name: 'JSON 格式化',
    description: '格式化、压缩与校验 JSON 文本',
    path: '/json-format',
    category: 'format',
    keywords: ['json', 'format', 'beautify', 'minify'],
    icon: Braces,
    component: lazy(() => import('@/tools/json-format')),
  },
]

export function getToolByPath(path: string) {
  return tools.find((tool) => tool.path === path)
}

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id)
}
