'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Feel meaningfully more awake in 10 minutes.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A science-backed morning protocol combining light exposure, breathwork,
            micro-movement, and hydration — personalized over 14 days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
            >
              Try it now
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-orange-600 bg-white rounded-xl hover:bg-orange-50 transition-colors border-2 border-orange-200"
            >
              Sign in
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            3-day free trial. No signup required to start.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/50 backdrop-blur-sm py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">15-second reaction test</h3>
              <p className="text-gray-600">
                Measure your current alertness with a quick tap test
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">10-minute protocol</h3>
              <p className="text-gray-600">
                Light, breath, movement, and hydration — guided step by step
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">See your improvement</h3>
              <p className="text-gray-600">
                Retest and track your time-to-alertness over 14 days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Why it works
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2 text-orange-700">Light Exposure</h3>
              <p className="text-gray-600">
                Signals your brain to suppress melatonin and boost cortisol naturally
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2 text-orange-700">Breathwork</h3>
              <p className="text-gray-600">
                Activates your sympathetic nervous system for alertness
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2 text-orange-700">Micro-movement</h3>
              <p className="text-gray-600">
                Increases blood flow and body temperature
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2 text-orange-700">Hydration</h3>
              <p className="text-gray-600">
                Rehydrates after hours of sleep-induced dehydration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-white/50 backdrop-blur-sm py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Start free, upgrade when ready
          </h2>
          <p className="text-gray-600 mb-8">
            Days 1-3 are completely free. Day 4+ requires a subscription for full sessions.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>3 full sessions</li>
                <li>Reaction testing</li>
                <li>Basic protocol</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-300">
              <h3 className="font-semibold text-lg mb-2">Plus</h3>
              <p className="text-3xl font-bold mb-4">$4.99<span className="text-sm font-normal">/mo</span></p>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>Unlimited sessions</li>
                <li>Adaptive protocol</li>
                <li>Progress tracking</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">$9.99<span className="text-sm font-normal">/mo</span></p>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>Everything in Plus</li>
                <li>Custom protocols</li>
                <li>Advanced analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-500 text-sm">
        <p>Dawn Meditate — Wake better, live better.</p>
      </footer>
    </div>
  )
}
