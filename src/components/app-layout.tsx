import { Link, Outlet } from 'react-router-dom'
import { WrenchIcon } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { tools } from '@/tools/registry'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <WrenchIcon className="size-4" />
            Toolbox
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="hover:text-foreground"
              >
                {tool.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <Separator />
      <footer className="px-4 py-3 text-center text-xs text-muted-foreground">
        个人 HTML 工具集 · 纯前端本地处理
      </footer>
    </div>
  )
}
