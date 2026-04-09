import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Hash, UserCircle } from 'lucide-react'
import ChatSidebarClient from './ChatSidebarClient'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  // Get current user session
  const { data: { user } } = await supabase.auth.getUser()

  const { data: channels } = await supabase.from('channels').select('*').order('name')
  const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user?.id).order('full_name')

  return (
    <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex-1 h-[calc(100vh-8rem)]">
      <ChatSidebarClient 
        channels={channels || []} 
        profiles={profiles || []} 
        currentUserId={user?.id || ''} 
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
