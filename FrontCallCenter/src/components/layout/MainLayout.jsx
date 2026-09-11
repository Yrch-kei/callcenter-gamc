import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar, { BottomNav } from './Sidebar'
import { cn } from '@/utils/cn'

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-dvh bg-surface dark:bg-surface-dark">
      <Topbar />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main
        className={cn(
          'pt-16 pb-20 transition-[padding-left] duration-300 ease-out md:pb-6',
          sidebarCollapsed ? 'md:pl-[68px]' : 'md:pl-60'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
