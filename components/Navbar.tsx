'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Hide navbar on the protocol player page
  if (pathname?.startsWith('/app/session')) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-orange-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-orange-600">
            Dawn Meditate
          </Link>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={`text-sm ${pathname === '/dashboard' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/account"
                      className={`text-sm ${pathname === '/account' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                    >
                      Account
                    </Link>
                    <Link
                      href="/app"
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                    >
                      Start Session
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className={`text-sm ${pathname === '/dashboard' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                    >
                      Progress
                    </Link>
                    <Link
                      href="/login"
                      className="text-sm text-gray-600 hover:text-orange-600"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/app"
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                    >
                      Try it now
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
