'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactionEvent } from '@/lib/storage'

interface ReactionTestProps {
  onComplete: (events: ReactionEvent[], score: number) => void
  duration?: number // in seconds, default 15
}

type TestState = 'idle' | 'waiting' | 'ready' | 'tapped' | 'complete'

export function ReactionTest({ onComplete, duration = 15 }: ReactionTestProps) {
  const [state, setState] = useState<TestState>('idle')
  const [events, setEvents] = useState<ReactionEvent[]>([])
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [currentStimulusTime, setCurrentStimulusTime] = useState<number | null>(null)
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null)

  const testStartTime = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const scheduleNextStimulus = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Random delay between 500ms and 1500ms
    const delay = 500 + Math.random() * 1000

    timeoutRef.current = setTimeout(() => {
      if (testStartTime.current && Date.now() - testStartTime.current < duration * 1000) {
        const now = Date.now()
        setCurrentStimulusTime(now)
        setState('ready')
      }
    }, delay)
  }, [duration])

  const startTest = useCallback(() => {
    testStartTime.current = Date.now()
    setEvents([])
    setTimeRemaining(duration)
    setState('waiting')
    scheduleNextStimulus()

    // Countdown timer
    intervalRef.current = setInterval(() => {
      if (testStartTime.current) {
        const elapsed = (Date.now() - testStartTime.current) / 1000
        const remaining = Math.max(0, duration - elapsed)
        setTimeRemaining(Math.ceil(remaining))

        if (remaining <= 0) {
          // Test complete
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setState('complete')
        }
      }
    }, 100)
  }, [duration, scheduleNextStimulus])

  const handleTap = useCallback(() => {
    if (state === 'ready' && currentStimulusTime) {
      const now = Date.now()
      const reactionTime = now - currentStimulusTime

      const event: ReactionEvent = {
        timestamp: now,
        stimulus_shown_at: currentStimulusTime,
        reaction_time_ms: reactionTime,
      }

      setEvents(prev => [...prev, event])
      setLastReactionTime(reactionTime)
      setState('tapped')

      // Brief feedback then next stimulus
      setTimeout(() => {
        if (testStartTime.current && Date.now() - testStartTime.current < duration * 1000) {
          setState('waiting')
          scheduleNextStimulus()
        }
      }, 300)
    } else if (state === 'waiting') {
      // Tapped too early - visual feedback
      setLastReactionTime(null)
    }
  }, [state, currentStimulusTime, duration, scheduleNextStimulus])

  // Complete callback
  useEffect(() => {
    if (state === 'complete' && events.length > 0) {
      const reactionTimes = events.map(e => e.reaction_time_ms)
      const sorted = [...reactionTimes].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const score = Math.round((1000 / median) * 200)

      onComplete(events, score)
    }
  }, [state, events, onComplete])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Reaction Test
        </h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
          Tap as quickly as you can when the circle turns green.
          This measures your current alertness level.
        </p>
        <button
          onClick={startTest}
          className="px-8 py-4 text-lg font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
        >
          Start Test
        </button>
      </div>
    )
  }

  if (state === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Complete</h2>
        <p className="text-gray-600">
          {events.length} reactions recorded
        </p>
      </div>
    )
  }

  const bgColor = state === 'ready'
    ? 'bg-green-500'
    : state === 'tapped'
    ? 'bg-blue-500'
    : 'bg-gray-300'

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-sm text-gray-500 mb-4">
        Time remaining: {timeRemaining}s
      </div>

      <button
        onClick={handleTap}
        className={`w-48 h-48 rounded-full ${bgColor} transition-colors duration-100 flex items-center justify-center shadow-lg active:scale-95`}
      >
        <span className="text-white text-lg font-medium">
          {state === 'ready' ? 'TAP!' : state === 'tapped' ? 'Nice!' : 'Wait...'}
        </span>
      </button>

      {lastReactionTime !== null && (
        <div className="mt-4 text-lg font-medium text-gray-700">
          {lastReactionTime}ms
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Reactions: {events.length}
      </div>
    </div>
  )
}
