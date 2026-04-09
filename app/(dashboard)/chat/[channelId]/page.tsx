import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const supabase = await createClient()
  const { channelId } = await params

  // 1. Get User Profile for current session
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  // 2. Fetch Channel Info
  const { data: channel } = await supabase.from('channels').select('*').eq('id', channelId).single()

  // 3. Fetch initial messages
  const { data: initialMessages, error: initialMessagesErr } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  console.log(`[CHANNEL FETCH] Loaded ${initialMessages?.length} messages for channel ${channelId}. Error: ${initialMessagesErr?.message || 'none'}`);

  return (
    <div className="flex flex-col h-full absolute inset-0">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 w-full">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100"># {channel?.name || 'Canal'}</h2>
        {channel?.description && (
          <>
            <span className="mx-3 text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{channel.description}</span>
          </>
        )}
      </div>

      <ChatClient 
        key={channelId}
        channelId={channelId} 
        initialMessages={initialMessages || []} 
        currentUser={profile}
      />
    </div>
  )
}
