'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Send, Paperclip, FileText, Image as ImageIcon } from 'lucide-react'

type Profile = { id: string; full_name: string; avatar_url: string; role: string }
type Message = { id: string; content: string; file_url: string | null; created_at: string; sender_id: string; receiver_id?: string; channel_id?: string; sender?: Profile }

export default function ChatDMClient({ 
  targetUserId, 
  initialMessages, 
  currentUser 
}: { 
  targetUserId: string, 
  initialMessages: Message[], 
  currentUser: Profile 
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Sincronizar siempre con el servidor si cambian los props
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    // Subscribe to ALL inserts to 'messages' because real-time filters don't support complex OR conditions natively yet.
    // We will drop events client-side that don't belong to this DM.
    const channel = supabase
      .channel(`realtime:messages:dm:${targetUserId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          const newMsg = payload.new as Message
          
          // Only process if it belongs to THIS direct message conversation
          const isForThisDM = (newMsg.sender_id === currentUser.id && newMsg.receiver_id === targetUserId) || 
                              (newMsg.sender_id === targetUserId && newMsg.receiver_id === currentUser.id)
          
          if (!isForThisDM) return

          const { data: senderData } = await supabase.from('profiles').select('id, full_name, avatar_url, role').eq('id', newMsg.sender_id).single()
          const completeMsg = { ...newMsg, sender: senderData } as Message
          
          setMessages(prev => {
            if (prev.find(m => m.id === completeMsg.id)) return prev
            return [...prev, completeMsg]
          })
          
          setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [targetUserId, currentUser.id, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !isUploading) return

    const messageText = newMessage
    setNewMessage('') 

    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Optimistic UI update
    const optimisticId = generateUUID()
    const optimisticMsg: Message = {
      id: optimisticId,
      content: messageText,
      file_url: null,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
      receiver_id: targetUserId,
      sender: currentUser
    }
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 50)

    const { error } = await supabase.from('messages').insert({
      id: optimisticId,
      receiver_id: targetUserId,
      sender_id: currentUser.id,
      content: messageText,
      // channel_id intentionally left null
    })

    if (error) {
      console.error('Error sending DM:', error)
      setNewMessage(messageText) 
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `dm_${targetUserId}/${Math.random()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('minsky-assets')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('minsky-assets').getPublicUrl(filePath)
      
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }
      
      const optimisticId = generateUUID()
      const contentText = `Archivo adjunto: ${file.name}`
      
      const optimisticMsg: Message = {
        id: optimisticId,
        content: contentText,
        file_url: data.publicUrl,
        created_at: new Date().toISOString(),
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        sender: currentUser
      }
      setMessages(prev => [...prev, optimisticMsg])
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 50)

      await supabase.from('messages').insert({
        id: optimisticId,
        receiver_id: targetUserId,
        sender_id: currentUser.id,
        content: contentText,
        file_url: data.publicUrl
      })

    } catch (error) {
      console.error('Upload error in DM:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-24">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 h-full gap-2">
                <p>No hay mensajes todavía.</p>
                <p className="text-sm">Envía un saludo a tu compañero.</p>
            </div>
        )}
        {messages.map((msg, index) => {
          const isMe = msg.sender?.id === currentUser.id
          const showAvatar = index === 0 || messages[index - 1].sender?.id !== msg.sender?.id

          return (
            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 flex-shrink-0 flex justify-center">
                {showAvatar && (
                  <img 
                    src={msg.sender?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${msg.sender?.full_name || '?'}`} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
                  />
                )}
              </div>
              
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {showAvatar && (
                  <span className="text-xs font-medium text-zinc-500 mb-1 ml-1 flex items-center gap-2">
                    {msg.sender?.full_name}
                    <span suppressHydrationWarning className="text-zinc-400 font-normal text-[0.65rem]">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                )}
                
                <div className={`px-4 py-2.5 rounded-2xl text-[0.95rem] shadow-sm ${
                  isMe 
                    ? 'bg-minsky-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-sm'
                }`}>
                  {msg.content}
                  
                  {msg.file_url && (
                    <a 
                      href={msg.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`mt-2 flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isMe ? 'bg-minsky-700/50 border-minsky-500 hover:bg-minsky-700' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="p-2 bg-white/10 dark:bg-black/10 rounded-lg">
                        {msg.file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium underline underline-offset-2">Descargar archivo</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shrink-0 absolute bottom-0 w-full z-10">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-minsky-500/50 transition-all shadow-sm">
          
          <label className="p-3 text-zinc-400 hover:text-minsky-500 transition-colors cursor-pointer rounded-xl hover:bg-minsky-50 dark:hover:bg-minsky-950/30">
            <Paperclip className="w-5 h-5" />
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isUploading ? "Subiendo archivo..." : "Escribe un mensaje directo..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            disabled={isUploading}
          />

          <button 
            type="submit" 
            disabled={!newMessage.trim() || isUploading}
            className="p-3 bg-minsky-600 hover:bg-minsky-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  )
}
