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
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
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
          <div className="sidebar-logo-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#sb-gradient)" />
              <path
                d="M7 21V10l7-3 7 3v11"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="11" y="14" width="6" height="7" rx="1" fill="white" fillOpacity="0.9" />
              <defs>
                <linearGradient id="sb-gradient" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#7c3aed" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
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

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-version">v0.1.0</span>
        </div>
      </aside>
    </>
  )
}
