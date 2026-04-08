'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ActionState } from '@/types'

/**
 * Server Action: sign in with email + password.
 * Called from the /login page form.
 */
export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email')
  const password = formData.get('password')

  // Basic validation
  if (typeof email !== 'string' || !email.includes('@')) {
    return { error: 'Por favor ingresa un correo electrónico válido.' }
  }
  if (typeof password !== 'string' || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    // Don't expose internal Supabase messages verbatim
    return { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }
  }

  redirect('/dashboard')
}

/**
 * Server Action: sign out the current user.
 */
export async function logoutAction(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
