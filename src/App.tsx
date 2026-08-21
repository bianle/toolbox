import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { HomePage } from '@/pages/home-page'
import { ToolPage } from '@/pages/tool-page'
import { tools } from '@/tools/registry'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          {tools.map((tool) => (
            <Route
              key={tool.id}
              path={tool.path.replace(/^\//, '')}
              element={<ToolPage toolId={tool.id} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
