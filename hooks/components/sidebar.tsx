'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  MessageSquare,
  Calendar,
  Layout,
  Radio,
  FolderOpen,
  LineChart,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',  icon: LineChart     },
  { label: 'IA Add-ons',  href: '/ai',        icon: Sparkles      },
  { label: 'Chat',        href: '/chat',       icon: MessageSquare },
  { label: 'Calendario',  href: '/calendar',   icon: Calendar      },
  { label: 'Kanban',      href: '/kanban',     icon: Layout        },
  { label: 'Streaming',   href: '/streaming',  icon: Radio         },
  { label: 'Activos',     href: '/assets',     icon: FolderOpen    },
]

interface SidebarProps {
  /** Controls mobile open state */
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${open ? 'sidebar--open' : ''}`}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true" style={{ background: 'transparent' }}>
            <img src="/logo.png" alt="Minsky Logo" style={{ width: 64, height: 64 }} />
          </div>
          <span className="sidebar-logo-text">Minsky</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Módulos">
          <ul role="list">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                    {isActive && <span className="sidebar-nav-dot" aria-hidden="true" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Settings & Logout */}
        <div style={{ padding: '0 1rem', marginTop: 'auto', marginBottom: '1rem' }}>
          <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>
              <Link
                href="/settings"
                className="sidebar-nav-item"
                onClick={onClose}
              >
                <Settings size={18} aria-hidden="true" />
                <span>Configuración</span>
              </Link>
            </li>
            <li>
              <form action={logoutAction} style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="sidebar-nav-item"
                  style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-version">v0.1.0</span>
        </div>
      </aside>
    </>
  )
}
