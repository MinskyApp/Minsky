import { createClient } from '@/lib/supabase/server'
import ChatDMClient from './ChatDMClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DirectMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient()
  const { userId } = await params

  // 1. Current Session
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  if (!user || user.id === userId) return <div>Conversación no válida</div>

  // 2. Fetch the other User Profile (to display header)
  const { data: otherUser } = await supabase.from('profiles').select('*').eq('id', userId).single()

  // 3. Fetch messages between BOTH users (Me -> Them OR Them -> Me)
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)')
    .is('channel_id', null)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col h-full absolute inset-0">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 w-full gap-3">
        {otherUser?.avatar_url && (
            <img src={otherUser.avatar_url} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700" alt="avatar" />
        )}
        <div className="flex flex-col">
            <h2 className="font-semibold text-sm leading-none text-zinc-900 dark:text-zinc-100">{otherUser?.full_name || 'Compañero'}</h2>
            <span className="text-[0.65rem] text-zinc-500 dark:text-zinc-400">{otherUser?.role}</span>
        </div>
      </div>

      <ChatDMClient 
        key={userId}
        targetUserId={userId} 
        initialMessages={initialMessages || []} 
        currentUser={profile}
      />
    </div>
  )
}
