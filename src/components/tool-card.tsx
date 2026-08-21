import { Link } from 'react-router-dom'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ToolDefinition } from '@/types/tool'

interface ToolCardProps {
  tool: ToolDefinition
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon

  return (
    <Link to={tool.path} className="block transition-opacity hover:opacity-90">
      <Card size="sm" className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <CardTitle>{tool.name}</CardTitle>
          </div>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
