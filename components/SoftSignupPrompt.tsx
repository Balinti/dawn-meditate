'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SoftSignupPromptProps {
  onDismiss: () => void
  variant?: 'banner' | 'modal'
}

export function SoftSignupPrompt({ onDismiss, variant = 'banner' }: SoftSignupPromptProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  if (!isVisible) return null

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Great progress!
            </h3>
            <p className="text-gray-600 mb-6">
              Create a free account to save your sessions and track your improvement over time.
            </p>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="block w-full py-3 px-6 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors text-center"
              >
                Create free account
              </Link>
              <button
                onClick={handleDismiss}
                className="block w-full py-3 px-6 text-gray-600 hover:text-gray-800 font-medium"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Banner variant
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-lg p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Save your progress</p>
            <p className="text-sm text-gray-500">Create a free account to track your improvement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
          >
            Sign up free
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
