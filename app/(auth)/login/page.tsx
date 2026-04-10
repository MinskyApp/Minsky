'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import type { ActionState } from '@/types'

const initialState: ActionState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div className="login-root">
      {/* Background gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-icon" style={{ background: 'transparent' }}>
            <img src="/logo.png" alt="Minsky Logo" style={{ width: 64, height: 64 }} />
          </div>
          <span className="login-logo-name">Minsky</span>
        </div>

        <h1 className="login-title">Bienvenido de vuelta</h1>
        <p className="login-subtitle">Accede a tu hub de marketing</p>

        <form action={formAction} className="login-form" noValidate>
          {/* Email */}
          <div className="field-group">
            <label htmlFor="email" className="field-label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@empresa.com"
              className="field-input"
              aria-describedby={state?.error ? 'login-error' : undefined}
            />
          </div>

          {/* Password */}
          <div className="field-group">
            <label htmlFor="password" className="field-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="field-input"
            />
          </div>

          {/* Error message */}
          {state?.error && (
            <div id="login-error" role="alert" className="login-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {state.error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="login-btn"
            aria-busy={pending}
          >
            {pending ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Accediendo…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <p className="login-footer">
          Plataforma interna · Solo para miembros del equipo
        </p>
      </div>
    </div>
  )
}
