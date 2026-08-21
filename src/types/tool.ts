import type { LucideIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolCategory = 'encode' | 'format' | 'convert' | 'text' | 'other'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  path: string
  category: ToolCategory
  keywords: string[]
  icon: LucideIcon
  component: LazyExoticComponent<ComponentType>
}
