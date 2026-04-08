import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * / → redirect based on auth state.
 * Authenticated → /dashboard
 * Unauthenticated → /login (middleware also handles this)
 */
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
