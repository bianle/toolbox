import { ToolCard } from '@/components/tool-card'
import { tools } from '@/tools/registry'

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          工具集
        </h1>
        <p className="text-sm text-muted-foreground">
          选择一个工具开始。新工具放到 <code>src/tools</code> 并注册即可。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}
