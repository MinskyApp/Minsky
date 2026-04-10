'use client'

import { useState } from 'react'
import { Sidebar } from '@/hooks/components/sidebar'
import { Header } from '@/hooks/components/header'
import { useProfile } from '@/hooks/useProfile'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useProfile()

  return (
    <div className="dashboard-root">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <main id="main-content" className="dashboard-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
