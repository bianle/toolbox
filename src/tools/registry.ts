import { Braces, Globe, Smile } from 'lucide-react'
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
  {
    id: 'diceface',
    name: 'DiceFace',
    description: '从任意字符串生成唯一、可复现的哈希头像',
    path: '/diceface',
    category: 'other',
    keywords: ['avatar', 'dicebear', 'hash', '头像', 'identicon'],
    icon: Smile,
    component: lazy(() => import('@/tools/diceface')),
  },
  {
    id: 'public-ip',
    name: '外网 IP',
    description: '查询当前设备的出口公网 IP',
    path: '/public-ip',
    category: 'other',
    keywords: ['ip', 'public', '外网', '公网', 'ipify'],
    icon: Globe,
    component: lazy(() => import('@/tools/public-ip')),
  },
]

export function getToolByPath(path: string) {
  return tools.find((tool) => tool.path === path)
}

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id)
}
