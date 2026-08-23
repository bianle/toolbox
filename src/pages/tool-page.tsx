import { Suspense } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_LABELS } from '@/tools/categories'
import { getToolById } from '@/tools/registry'

interface ToolPageProps {
  toolId: string
}

export function ToolPage({ toolId }: ToolPageProps) {
  const tool = getToolById(toolId)

  if (!tool) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-medium">未找到工具</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回首页
        </Link>
      </div>
    )
  }

  const Component = tool.component

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            {tool.name}
          </h1>
          <Badge variant="secondary">{CATEGORY_LABELS[tool.category]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <Component />
      </Suspense>
    </div>
  )
}
