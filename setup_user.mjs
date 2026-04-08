import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  // Use signUp instead of raw SQL so Supabase's backend handles proper password hashing
  console.log('Creando usuario...')
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@minsky.com',
    password: 'Minsky!2026',
    options: {
      data: {
        full_name: 'Admin Minsky',
      }
    }
  })

  if (error) {
    console.error('Error al crear usuario:', error.message)
    return
  }

  console.log('Usuario creado exitosamente (Auth ID:', data.user.id, ')')
}

setup()
