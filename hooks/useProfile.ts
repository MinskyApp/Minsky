'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  isEditor: boolean
  isViewer: boolean
  refetch: () => Promise<void>
}

/**
 * Client-side hook: exposes the current authenticated user's profile and role.
 * Returns null for profile while unauthenticated or loading.
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setProfile(null)
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, created_at')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(profileError.message)
        setProfile(null)
        return
      }

      setProfile(data as Profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    isAdmin: profile?.role === 'admin',
    isEditor: profile?.role === 'editor',
    isViewer: profile?.role === 'viewer',
    refetch: fetchProfile,
  }
}
