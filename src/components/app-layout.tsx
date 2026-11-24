import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronDownIcon, MenuIcon, WrenchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/tools/categories'
import { tools } from '@/tools/registry'

export function AppLayout() {
  const location = useLocation()
  const activeCategory =
    tools.find((tool) => tool.path === location.pathname)?.category ?? null

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-medium">
            <WrenchIcon className="size-4" />
            Toolbox
          </Link>
          <nav className="hidden flex-nowrap items-center gap-1 text-sm sm:flex">
            {CATEGORY_ORDER.map((category) => {
              const items = tools.filter((tool) => tool.category === category)
              if (items.length === 0) return null

              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-muted-foreground',
                        activeCategory === category && 'text-foreground',
                      )}
                    >
                      {CATEGORY_LABELS[category]}
                      <ChevronDownIcon data-icon="inline-end" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {items.map((tool) => (
                      <DropdownMenuItem key={tool.id} asChild>
                        <Link to={tool.path}>{tool.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="打开菜单"
              >
                <MenuIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {CATEGORY_ORDER.map((category, index) => {
                const items = tools.filter(
                  (tool) => tool.category === category,
                )
                if (items.length === 0) return null

                return (
                  <DropdownMenuGroup key={category}>
                    {index > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel>
                      {CATEGORY_LABELS[category]}
                    </DropdownMenuLabel>
                    {items.map((tool) => (
                      <DropdownMenuItem
                        key={tool.id}
                        asChild
                        className={cn(
                          location.pathname === tool.path &&
                            'bg-accent/60 text-accent-foreground',
                        )}
                      >
                        <Link to={tool.path}>{tool.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <Separator />
      <footer className="px-4 py-3 text-center text-xs text-muted-foreground">
        个人 HTML 工具箱 · 纯前端本地处理
      </footer>
    </div>
  )
}
