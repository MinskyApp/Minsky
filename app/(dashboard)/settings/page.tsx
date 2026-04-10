export default function SettingsPage() {
  return (
    <div className="dashboard-view" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Configuración
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Aquí podrás ver y ajustar tus preferencias de la aplicación.
        </p>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '1rem', padding: '1.5rem' }}>
          <p style={{ margin: 0 }}>
            En breve se añadirán opciones de perfil, seguridad y notificaciones.
          </p>
        </div>
      </div>
    </div>
  )
}
