import { ToolCard } from '@/components/tool-card'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/tools/categories'
import { tools } from '@/tools/registry'

export function HomePage() {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: tools.filter((tool) => tool.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          工具集
        </h1>
        <p className="text-sm text-muted-foreground">
          选择一个工具开始。新工具放到 <code>src/tools</code> 并注册即可。
        </p>
      </div>

      {grouped.map((group) => (
        <section
          key={group.category}
          id={`category-${group.category}`}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
