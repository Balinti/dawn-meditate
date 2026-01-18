'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Protocol, ProtocolStep } from '@/lib/protocols'

interface ProtocolPlayerProps {
  protocol: Protocol
  onComplete: () => void
  onExit?: () => void
}

export function ProtocolPlayer({ protocol, onComplete, onExit }: ProtocolPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepTimeRemaining, setStepTimeRemaining] = useState(protocol.steps[0]?.duration_seconds || 0)
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(protocol.total_duration_seconds)
  const [isPlaying, setIsPlaying] = useState(true)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathCycleCount, setBreathCycleCount] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentStep = protocol.steps[currentStepIndex]

  const moveToNextStep = useCallback(() => {
    if (currentStepIndex < protocol.steps.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      setStepTimeRemaining(protocol.steps[nextIndex].duration_seconds)
      setBreathCycleCount(0)
      setBreathPhase('inhale')
    } else {
      onComplete()
    }
  }, [currentStepIndex, protocol.steps, onComplete])

  // Main timer
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setStepTimeRemaining(prev => {
        if (prev <= 1) {
          moveToNextStep()
          return 0
        }
        return prev - 1
      })

      setTotalTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, moveToNextStep])

  // Breath timer
  useEffect(() => {
    if (!isPlaying || currentStep?.type !== 'breath' || !currentStep.breath_cadence) {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current)
      return
    }

    const { inhale_seconds, hold_seconds, exhale_seconds } = currentStep.breath_cadence
    const cycleDuration = (inhale_seconds + hold_seconds + exhale_seconds) * 1000

    let phaseStart = Date.now()
    let currentPhase: 'inhale' | 'hold' | 'exhale' = 'inhale'

    const updateBreathPhase = () => {
      const elapsed = Date.now() - phaseStart

      if (currentPhase === 'inhale' && elapsed >= inhale_seconds * 1000) {
        if (hold_seconds > 0) {
          currentPhase = 'hold'
        } else {
          currentPhase = 'exhale'
        }
        phaseStart = Date.now()
        setBreathPhase(currentPhase)
      } else if (currentPhase === 'hold' && elapsed >= hold_seconds * 1000) {
        currentPhase = 'exhale'
        phaseStart = Date.now()
        setBreathPhase(currentPhase)
      } else if (currentPhase === 'exhale' && elapsed >= exhale_seconds * 1000) {
        currentPhase = 'inhale'
        phaseStart = Date.now()
        setBreathPhase(currentPhase)
        setBreathCycleCount(prev => prev + 1)
      }
    }

    breathIntervalRef.current = setInterval(updateBreathPhase, 100)

    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current)
    }
  }, [isPlaying, currentStep, currentStepIndex])

  const togglePlay = () => setIsPlaying(!isPlaying)

  const skipStep = () => {
    if (currentStepIndex < protocol.steps.length - 1) {
      moveToNextStep()
    } else {
      onComplete()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((protocol.total_duration_seconds - totalTimeRemaining) / protocol.total_duration_seconds) * 100
  const stepProgress = currentStep
    ? ((currentStep.duration_seconds - stepTimeRemaining) / currentStep.duration_seconds) * 100
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-orange-100">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-sm text-gray-600">
          {formatTime(totalTimeRemaining)} remaining
        </div>
        <button
          onClick={skipStep}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          Skip
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-orange-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 py-4">
        {protocol.steps.map((step, index) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < currentStepIndex
                ? 'bg-orange-500'
                : index === currentStepIndex
                ? 'bg-orange-400'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {currentStep && (
          <>
            <div className="text-sm text-orange-600 font-medium mb-2">
              Step {currentStepIndex + 1} of {protocol.steps.length}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {currentStep.name}
            </h2>

            <div className="text-4xl font-bold text-orange-600 mb-6">
              {formatTime(stepTimeRemaining)}
            </div>

            {/* Breath visualization */}
            {currentStep.type === 'breath' && currentStep.breath_cadence && (
              <div className="mb-8">
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${
                    breathPhase === 'inhale'
                      ? 'bg-blue-400 scale-110'
                      : breathPhase === 'hold'
                      ? 'bg-purple-400 scale-110'
                      : 'bg-green-400 scale-90'
                  }`}
                >
                  <span className="text-white text-lg font-medium capitalize">
                    {breathPhase}
                  </span>
                </div>
                <div className="text-center mt-4 text-sm text-gray-500">
                  Cycle {breathCycleCount + 1} of {currentStep.breath_cadence.cycles}
                </div>
              </div>
            )}

            {/* Step progress */}
            <div className="w-full max-w-md mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 transition-all duration-1000"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 max-w-md w-full">
              <p className="text-gray-700 whitespace-pre-line">
                {currentStep.instructions}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 flex justify-center">
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
