import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function getUserId(): Promise<string | null> {
  const user = await getUser()
  return user?.id || null
}
