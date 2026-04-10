'use client'

import { Menu, LogOut, User } from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
  onMenuClick: () => void
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  return (
    <header className="dashboard-header" role="banner">
      {/* Mobile menu toggle */}
      <button
        id="mobile-menu-toggle"
        className="header-menu-btn"
        onClick={onMenuClick}
        aria-label="Abrir menú lateral"
        type="button"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Spacer */}
      <div className="header-spacer" />

      {/* User section */}
      <div className="header-user">
        {/* Name + role */}
        <div className="header-user-info">
          <span className="header-user-name">
            {profile?.full_name ?? 'Usuario'}
          </span>
          {profile?.role && (
            <span className={`header-badge header-badge--${profile.role}`}>
              {profile.role}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className="header-avatar" aria-label={`Avatar de ${profile?.full_name ?? 'usuario'}`}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? 'Avatar'}
              className="header-avatar-img"
            />
          ) : (
            <span className="header-avatar-initials" aria-hidden="true">
              {getInitials(profile?.full_name ?? null)}
            </span>
          )}
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            id="logout-btn"
            type="submit"
            className="header-logout-btn"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="sr-only">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </header>
  )
}
