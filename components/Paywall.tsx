'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'

interface PaywallProps {
  dayIndex: number
  onContinueMaintenance: () => void
  isLoggedIn: boolean
  onSignupClick: () => void
}

export function Paywall({
  dayIndex,
  onContinueMaintenance,
  isLoggedIn,
  onSignupClick,
}: PaywallProps) {
  const [loading, setLoading] = useState<'plus' | 'pro' | null>(null)
  const [pricesAvailable, setPricesAvailable] = useState({ plus: false, pro: false })

  useEffect(() => {
    // Check if price IDs are configured
    const plusId = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID
    const proId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    setPricesAvailable({
      plus: !!plusId,
      pro: !!proId,
    })
  }, [])

  const handleUpgrade = async (plan: 'plus' | 'pro') => {
    if (!isLoggedIn) {
      onSignupClick()
      return
    }

    setLoading(plan)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        console.error('Checkout error:', data.error)
        alert('Unable to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Unable to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const anyPricesAvailable = pricesAvailable.plus || pricesAvailable.pro

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">Day {dayIndex + 1}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your free trial has ended
          </h2>
          <p className="text-gray-600">
            You&apos;ve completed 3 days of the protocol. Subscribe to continue your
            full 10-minute sessions and track your progress over 14 days.
          </p>
        </div>

        {anyPricesAvailable ? (
          <div className="space-y-4 mb-6">
            {pricesAvailable.plus && (
              <button
                onClick={() => handleUpgrade('plus')}
                disabled={loading !== null}
                className="w-full py-4 px-6 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'plus' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <>
                    <span className="block">Plus — $4.99/month</span>
                    <span className="block text-sm font-normal opacity-80">
                      Unlimited sessions + adaptive protocol
                    </span>
                  </>
                )}
              </button>
            )}

            {pricesAvailable.pro && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={loading !== null}
                className="w-full py-4 px-6 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'pro' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <>
                    <span className="block">Pro — $9.99/month</span>
                    <span className="block text-sm font-normal opacity-80">
                      Everything + custom protocols + analytics
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800 text-center">
              Upgrades are currently unavailable. Please check back later.
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Or continue with a limited 3-minute maintenance session
          </p>
          <button
            onClick={onContinueMaintenance}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Start maintenance session
          </button>
        </div>

        {!isLoggedIn && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Already have an account?
            </p>
            <button
              onClick={onSignupClick}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
