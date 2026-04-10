import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  TrendingUp,
  Users,
  MousePointerClick,
  Activity,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // --- Mock Data ---
  const metrics = [
    {
      title: 'Tasa de Conversión',
      value: '4.8%',
      trend: '+1.2%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: 'Visitantes Reales',
      value: '24,592',
      trend: '+12%',
      isPositive: true,
      icon: Users,
    },
    {
      title: 'Clics en CTA',
      value: '3,842',
      trend: '-2.4%',
      isPositive: false,
      icon: MousePointerClick,
    },
    {
      title: 'Sesiones Activas',
      value: '892',
      trend: '+5.7%',
      isPositive: true,
      icon: Activity,
    },
  ]

  const channels = [
    { name: 'Búsqueda Orgánica', value: '45%', amount: 45, color: '#4f46e5' },
    { name: 'Redes Sociales', value: '30%', amount: 30, color: '#7c3aed' },
    { name: 'Directo', value: '15%', amount: 15, color: '#ec4899' },
    { name: 'Referidos', value: '10%', amount: 10, color: '#f59e0b' },
  ]

  return (
    <div className="dashboard-container">
      <div className="app-header">
        <h1 className="app-title">Dashboard Analítico</h1>
        <p className="app-subtitle">Resumen del rendimiento de las campañas de marketing</p>
      </div>

      {/* KPI Metrics */}
      <div className="dash-metrics-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="dash-metric-card">
              <div className="dash-metric-header">
                <span className="dash-metric-title">{metric.title}</span>
                <span className="dash-metric-icon">
                  <Icon size={18} />
                </span>
              </div>
              <div className="dash-metric-value">{metric.value}</div>
              <div className={`dash-metric-trend ${metric.isPositive ? 'up' : 'down'}`}>
                {metric.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{metric.trend}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>
                  vs mes pasado
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts / Performance */}
      <div className="dash-charts-grid">
        {/* Main Chart Area */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h2 className="dash-chart-title">Rendimiento General</h2>
            <p className="dash-chart-subtitle">Visitantes vs Conversiones de los últimos 30 días</p>
          </div>
          
          {/* Placeholder for an actual chart library like Recharts */}
          <div
            style={{
              width: '100%',
              height: 250,
              background: 'var(--color-minsky-50)',
              borderRadius: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-minsky-500)',
              border: '1px dashed var(--color-minsky-200)',
            }}
          >
            <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <span style={{ fontWeight: 500 }}>Área de Gráfico Interactivo</span>
            <span style={{ fontSize: '0.75rem', marginTop: 4 }}>Aquí puedes montar Recharts o Chart.js</span>
          </div>
        </div>

        {/* Channels Area */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h2 className="dash-chart-title">Fuentes de Tráfico</h2>
            <p className="dash-chart-subtitle">Distribución principal este mes</p>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            {channels.map((ch) => (
              <div key={ch.name} className="dash-channel-item">
                <div className="dash-channel-info">
                  <span>{ch.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{ch.value}</span>
                </div>
                <div className="dash-channel-bar-bg">
                  <div
                    className="dash-channel-bar-fill"
                    style={{ width: `${ch.amount}%`, backgroundColor: ch.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="dash-report-btn"
            style={{
              marginTop: '2rem',
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-base)',
              borderRadius: '0.5rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Calendar size={16} />
            Ver Reporte Completo
          </button>
        </div>
      </div>
    </div>
  )
}
