import { MessageSquareDashed } from 'lucide-react'

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="w-16 h-16 bg-minsky-100 dark:bg-minsky-900/30 text-minsky-600 dark:text-minsky-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-minsky-200 dark:ring-minsky-800/50">
        <MessageSquareDashed className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-锌-100 mb-2">Comienza a colaborar</h2>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
        Selecciona un canal en la barra lateral para unirte a la conversación.
      </p>
    </div>
  )
}
