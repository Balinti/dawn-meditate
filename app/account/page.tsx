'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AccountData {
  email: string
  plan: 'free' | 'plus' | 'pro'
  status: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export default function AccountPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [stripeConfigured, setStripeConfigured] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get entitlement
      try {
        const response = await fetch('/api/entitlement')
        const entitlement = await response.json()

        setData({
          email: user.email || '',
          plan: entitlement.plan || 'free',
          status: entitlement.status || null,
          currentPeriodEnd: entitlement.current_period_end || null,
          cancelAtPeriodEnd: entitlement.cancel_at_period_end || false,
        })

        // Check if Stripe is configured
        const plusPrice = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID
        const proPrice = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        setStripeConfigured(!!(plusPrice || proPrice))
      } catch (e) {
        console.error('Error loading account:', e)
      }

      setLoading(false)
    }

    loadAccount()
  }, [router])

  const handleManageSubscription = async () => {
    setPortalLoading(true)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      } else if (result.error) {
        alert('Unable to open billing portal. Please try again.')
      }
    } catch (e) {
      console.error('Portal error:', e)
      alert('Unable to open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const planLabels = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account</h1>

        {/* Profile section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <div className="text-gray-900">{data.email}</div>
            </div>
          </div>
        </div>

        {/* Subscription section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{planLabels[data.plan]} Plan</div>
                {data.status && (
                  <div className="text-sm text-gray-500 capitalize">{data.status}</div>
                )}
              </div>
              {data.plan !== 'free' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  Active
                </span>
              )}
            </div>

            {data.currentPeriodEnd && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  {data.cancelAtPeriodEnd ? 'Ends on' : 'Next renewal'}
                </label>
                <div className="text-gray-900">
                  {new Date(data.currentPeriodEnd).toLocaleDateString()}
                </div>
                {data.cancelAtPeriodEnd && (
                  <div className="text-sm text-orange-600 mt-1">
                    Your subscription will not renew
                  </div>
                )}
              </div>
            )}

            {data.plan === 'free' && stripeConfigured && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Upgrade to unlock unlimited sessions and adaptive protocols.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/app"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            )}

            {data.plan !== 'free' && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              </div>
            )}

            {!stripeConfigured && data.plan === 'free' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Upgrades are currently unavailable.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
