'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ReactionTest } from '@/components/ReactionTest'
import { EnergyRating } from '@/components/EnergyRating'
import { ProtocolPlayer } from '@/components/ProtocolPlayer'
import { Paywall } from '@/components/Paywall'
import { SoftSignupPrompt } from '@/components/SoftSignupPrompt'
import { getProtocol, getMaintenanceProtocol, type ProtocolContext, type Protocol } from '@/lib/protocols'
import { computeReactionScore, estimateMinutesSaved, computeImprovement, getRecentDeltas } from '@/lib/scoring'
import {
  getLocalData,
  createLocalSession,
  saveSession,
  getDayIndex,
  shouldShowSoftPrompt,
  markSoftPromptDismissed,
  getLastNSessions,
  type LocalSession,
  type ReactionEvent,
} from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'

type FlowStep =
  | 'setup'
  | 'pre-test'
  | 'pre-energy'
  | 'paywall'
  | 'protocol'
  | 'post-test'
  | 'post-energy'
  | 'results'

export default function AppPage() {
  const router = useRouter()
  const [step, setStep] = useState<FlowStep>('setup')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [entitlement, setEntitlement] = useState<'free' | 'plus' | 'pro'>('free')
  const [dayIndex, setDayIndex] = useState(0)
  const [showSoftPrompt, setShowSoftPrompt] = useState(false)

  // Session data
  const [context, setContext] = useState<ProtocolContext>('standard')
  const [wakeTime, setWakeTime] = useState<string>('')
  const [currentSession, setCurrentSession] = useState<LocalSession | null>(null)
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [isMaintenance, setIsMaintenance] = useState(false)

  // Test results
  const [preTestEvents, setPreTestEvents] = useState<ReactionEvent[]>([])
  const [preTestScore, setPreTestScore] = useState<number>(0)
  const [postTestEvents, setPostTestEvents] = useState<ReactionEvent[]>([])
  const [postTestScore, setPostTestScore] = useState<number>(0)
  const [preEnergy, setPreEnergy] = useState<number>(0)
  const [postEnergy, setPostEnergy] = useState<number>(0)

  // Initialize
  useEffect(() => {
    const supabase = createClient()

    // Check auth (only if Supabase is configured)
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsLoggedIn(!!user)
      })
    }

    // Check entitlement
    fetch('/api/entitlement')
      .then(res => res.json())
      .then(data => {
        if (data.plan) {
          setEntitlement(data.plan)
        }
      })
      .catch(() => {})

    // Get day index
    const localDayIndex = getDayIndex()
    setDayIndex(localDayIndex)

    // Set default wake time to now
    const now = new Date()
    setWakeTime(now.toTimeString().slice(0, 5))
  }, [])

  const handleStartSession = useCallback(() => {
    // Check paywall for Day 4+
    if (dayIndex >= 3 && entitlement === 'free') {
      setStep('paywall')
      return
    }

    // Get recent deltas for adaptation
    const recentSessions = getLastNSessions(3)
    const recentDeltas = getRecentDeltas(recentSessions)

    // Get protocol
    const selectedProtocol = getProtocol(context, dayIndex, recentDeltas)
    setProtocol(selectedProtocol)
    setIsMaintenance(false)

    // Create session
    const session = createLocalSession(
      context,
      selectedProtocol.id,
      dayIndex,
      wakeTime ? new Date().toISOString().split('T')[0] + 'T' + wakeTime + ':00' : null
    )
    setCurrentSession(session)
    saveSession(session)

    setStep('pre-test')
  }, [context, dayIndex, entitlement, wakeTime])

  const handleContinueMaintenance = useCallback(() => {
    const maintenanceProtocol = getMaintenanceProtocol(context)
    setProtocol(maintenanceProtocol)
    setIsMaintenance(true)

    const session = createLocalSession(
      context,
      maintenanceProtocol.id,
      dayIndex,
      wakeTime ? new Date().toISOString().split('T')[0] + 'T' + wakeTime + ':00' : null
    )
    setCurrentSession(session)
    saveSession(session)

    setStep('pre-test')
  }, [context, dayIndex, wakeTime])

  const handlePreTestComplete = useCallback((events: ReactionEvent[], score: number) => {
    setPreTestEvents(events)
    setPreTestScore(score)

    if (currentSession) {
      const updated = { ...currentSession, reaction_pre_score: score, reaction_pre_events: events }
      setCurrentSession(updated)
      saveSession(updated)
    }

    setStep('pre-energy')
  }, [currentSession])

  const handlePreEnergySelect = useCallback((rating: number) => {
    setPreEnergy(rating)

    if (currentSession) {
      const updated = { ...currentSession, energy_pre: rating }
      setCurrentSession(updated)
      saveSession(updated)
    }

    setTimeout(() => setStep('protocol'), 500)
  }, [currentSession])

  const handleProtocolComplete = useCallback(() => {
    setStep('post-test')
  }, [])

  const handlePostTestComplete = useCallback((events: ReactionEvent[], score: number) => {
    setPostTestEvents(events)
    setPostTestScore(score)

    if (currentSession) {
      const updated = { ...currentSession, reaction_post_score: score, reaction_post_events: events }
      setCurrentSession(updated)
      saveSession(updated)
    }

    setStep('post-energy')
  }, [currentSession])

  const handlePostEnergySelect = useCallback((rating: number) => {
    setPostEnergy(rating)

    // Calculate results
    const minutesSaved = estimateMinutesSaved(preTestScore, postTestScore, dayIndex)

    if (currentSession) {
      const updated = {
        ...currentSession,
        energy_post: rating,
        completed_at: new Date().toISOString(),
        minutes_saved_est: minutesSaved,
      }
      setCurrentSession(updated)
      saveSession(updated)
    }

    setTimeout(() => {
      setStep('results')

      // Check for soft signup prompt
      if (shouldShowSoftPrompt()) {
        setTimeout(() => setShowSoftPrompt(true), 2000)
      }
    }, 500)
  }, [currentSession, dayIndex, preTestScore, postTestScore])

  const handleSkipPostTest = useCallback(() => {
    // Calculate results without post test
    if (currentSession) {
      const updated = {
        ...currentSession,
        completed_at: new Date().toISOString(),
      }
      setCurrentSession(updated)
      saveSession(updated)
    }

    setStep('results')

    if (shouldShowSoftPrompt()) {
      setTimeout(() => setShowSoftPrompt(true), 2000)
    }
  }, [currentSession])

  const handleDismissSoftPrompt = useCallback(() => {
    markSoftPromptDismissed()
    setShowSoftPrompt(false)
  }, [])

  const improvement = computeImprovement(preTestScore, postTestScore)
  const minutesSaved = estimateMinutesSaved(preTestScore, postTestScore, dayIndex)

  // Render based on step
  if (step === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Start Your Morning
          </h1>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wake time
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
            />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your context
            </label>
            <div className="space-y-2">
              {[
                { value: 'standard', label: 'Standard', description: 'Full protocol with outdoor or bright light' },
                { value: 'low_light', label: 'Low-light indoor', description: 'Optimized for indoor lighting only' },
                { value: 'gentle', label: 'Gentle', description: 'Reduced intensity for easier mornings' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setContext(option.value as ProtocolContext)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    context === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">
              Day {dayIndex + 1} of 14
            </span>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4 px-6 bg-orange-500 text-white rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors"
          >
            Begin Session
          </button>
        </div>
      </div>
    )
  }

  if (step === 'paywall') {
    return (
      <Paywall
        dayIndex={dayIndex}
        onContinueMaintenance={handleContinueMaintenance}
        isLoggedIn={isLoggedIn}
        onSignupClick={() => router.push('/login')}
      />
    )
  }

  if (step === 'pre-test') {
    return <ReactionTest onComplete={handlePreTestComplete} />
  }

  if (step === 'pre-energy') {
    return <EnergyRating onSelect={handlePreEnergySelect} label="How awake do you feel right now?" />
  }

  if (step === 'protocol' && protocol) {
    return (
      <ProtocolPlayer
        protocol={protocol}
        onComplete={handleProtocolComplete}
        onExit={() => setStep('setup')}
      />
    )
  }

  if (step === 'post-test') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 text-right">
          <button
            onClick={handleSkipPostTest}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip test
          </button>
        </div>
        <div className="flex-1">
          <ReactionTest onComplete={handlePostTestComplete} />
        </div>
      </div>
    )
  }

  if (step === 'post-energy') {
    return <EnergyRating onSelect={handlePostEnergySelect} label="How awake do you feel now?" />
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-500">
              Day {dayIndex + 1} of 14 {isMaintenance && '(Maintenance)'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Results</h2>

            {postTestScore > 0 && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Reaction improvement</span>
                  <span className={`font-semibold ${improvement.improved ? 'text-green-600' : 'text-gray-600'}`}>
                    {improvement.improved ? '+' : ''}{improvement.percentChange}%
                  </span>
                </div>

                {minutesSaved > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Estimated time saved</span>
                    <span className="font-semibold text-orange-600">
                      ~{minutesSaved} min
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Energy change</span>
              <span className={`font-semibold ${postEnergy > preEnergy ? 'text-green-600' : 'text-gray-600'}`}>
                {preEnergy} → {postEnergy || '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Pre-test score</span>
              <span className="font-semibold text-gray-900">{preTestScore}</span>
            </div>

            {postTestScore > 0 && (
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Post-test score</span>
                <span className="font-semibold text-gray-900">{postTestScore}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-6 bg-white text-orange-600 border-2 border-orange-200 rounded-xl font-medium hover:bg-orange-50 transition-colors"
            >
              View Progress
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-6 text-gray-600 hover:text-gray-800"
            >
              Done
            </button>
          </div>
        </div>

        {showSoftPrompt && !isLoggedIn && (
          <SoftSignupPrompt
            onDismiss={handleDismissSoftPrompt}
            variant="modal"
          />
        )}
      </div>
    )
  }

  return null
}
