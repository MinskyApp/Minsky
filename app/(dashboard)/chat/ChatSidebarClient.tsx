'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hash, UserCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatSidebarClient({ 
  channels, 
  profiles, 
  currentUserId 
}: { 
  channels: any[], 
  profiles: any[], 
  currentUserId: string 
}) {
  const [unread, setUnread] = useState<Record<string, number>>({})
  const pathname = usePathname()
  
  // Limpiar el contador de notificaciones cuando el usuario entra al chat activo
  useEffect(() => {
    const segments = pathname?.split('/') || []
    const activeId = segments[segments.length - 1]
    
    if (activeId && unread[activeId]) {
      setUnread(prev => {
        const newUnread = { ...prev }
        delete newUnread[activeId]
        return newUnread
      })
    }
  }, [pathname, unread])

  // Suscripción Global a nuevos mensajes (solo notificaciones visuales)
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const realtimeChannel = supabase
      .channel('global_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        
        // Si yo lo envié, no hago notificación loca.
        if (msg.sender_id === currentUserId) return
        
        // ¿Es un canal o un DM directo?
        const isDM = !msg.channel_id
        
        // Si es DM, y no fue enviado hacía mi persona, ignorar.
        if (isDM && msg.receiver_id !== currentUserId) return
        
        // El TargetID es la sala a donde llegó: El channel_id, o el id de quien te mandó el MD
        const targetId = msg.channel_id ? msg.channel_id : msg.sender_id
        
        // Si ya estoy mirando esa sala, no incremento.
        const currentPathId = window.location.pathname.split('/').pop()
        if (currentPathId === targetId) return
        
        setUnread(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }))
      })
      .subscribe()
      
     return () => { supabase.removeChannel(realtimeChannel) }
  }, [currentUserId])

  return (
    <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Comunicaciones
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <div>
          <h3 className="px-3 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Canales</h3>
          <div className="space-y-1">
            {channels?.map((channel) => {
              const active = pathname?.includes(channel.id)
              const count = unread[channel.id] || 0

              return (
                <Link
                  key={channel.id}
                  href={`/chat/${channel.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active 
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Hash className={`w-4 h-4 shrink-0 col relative ${count > 0 ? 'text-minsky-500' : 'opacity-50'}`} />
                    <span className={`truncate ${count > 0 ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''}`}>{channel.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="bg-minsky-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0 animate-pulse">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="px-3 pt-2 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Equipo (MDs)</h3>
          <div className="space-y-1">
            {profiles?.map((profile) => {
              const active = pathname?.includes(profile.id)
              const count = unread[profile.id] || 0

              return (
                <Link
                  key={profile.id}
                  href={`/chat/dm/${profile.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active 
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="relative shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="avatar" />
                      ) : (
                        <UserCircle className={`w-5 h-5 ${count > 0 ? 'text-minsky-500' : 'opacity-50'}`} />
                      )}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-minsky-500 border border-white dark:border-zinc-900"></span>
                      )}
                    </div>
                    <span className={`truncate ${count > 0 ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''}`}>
                      {profile.full_name || 'Usuario'}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="bg-minsky-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
