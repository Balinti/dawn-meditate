'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChartMini } from '@/components/ChartMini'
import { getLocalData, getCompletedSessions, type LocalSession } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  sessions: LocalSession[]
  isLoggedIn: boolean
  dayIndex: number
  streak: number
  totalMinutesSaved: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const user = supabase ? (await supabase.auth.getUser()).data.user : null

      if (user && supabase) {
        // Try to fetch from API
        try {
          const response = await fetch('/api/dashboard')
          if (response.ok) {
            const apiData = await response.json()
            setData({
              sessions: apiData.sessions || [],
              isLoggedIn: true,
              dayIndex: apiData.day_index || 0,
              streak: apiData.streak || 0,
              totalMinutesSaved: apiData.total_minutes_saved || 0,
            })
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Error fetching dashboard data:', e)
        }
      }

      // Fall back to local data
      const localData = getLocalData()
      const sessions = getCompletedSessions()

      // Calculate streak
      let streak = 0
      const sortedSessions = [...sessions].sort(
        (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      )

      if (sortedSessions.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let checkDate = new Date(sortedSessions[0].completed_at!)
        checkDate.setHours(0, 0, 0, 0)

        // Check if most recent session is today or yesterday
        const daysDiff = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 1) {
          streak = 1
          for (let i = 1; i < sortedSessions.length; i++) {
            const sessionDate = new Date(sortedSessions[i].completed_at!)
            sessionDate.setHours(0, 0, 0, 0)

            const prevSessionDate = new Date(sortedSessions[i - 1].completed_at!)
            prevSessionDate.setHours(0, 0, 0, 0)

            const diff = Math.floor((prevSessionDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diff <= 1) {
              streak++
            } else {
              break
            }
          }
        }
      }

      // Calculate total minutes saved
      const totalMinutesSaved = sessions.reduce((sum, s) => sum + (s.minutes_saved_est || 0), 0)

      setData({
        sessions,
        isLoggedIn: !!user,
        dayIndex: localData.day_index,
        streak,
        totalMinutesSaved,
      })
      setLoading(false)
    }

    loadData()
  }, [])

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

  const last7Sessions = data.sessions.slice(-7)

  // Prepare chart data
  const reactionChartData = last7Sessions.map((s, i) => ({
    label: `D${s.day_index + 1}`,
    value: s.reaction_post_score || s.reaction_pre_score || 0,
  }))

  const energyChartData = last7Sessions.map((s, i) => ({
    label: `D${s.day_index + 1}`,
    value: s.energy_post || s.energy_pre || 0,
  }))

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
          <Link
            href="/app"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Start Session
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-600">{data.dayIndex}</div>
            <div className="text-sm text-gray-500">Day</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-600">{data.sessions.length}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-600">{data.streak}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-600">~{Math.round(data.totalMinutesSaved)}</div>
            <div className="text-sm text-gray-500">Min Saved</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ChartMini
            title="Reaction Score (Last 7)"
            data={reactionChartData}
            color="#f97316"
          />
          <ChartMini
            title="Energy Level (Last 7)"
            data={energyChartData}
            color="#22c55e"
          />
        </div>

        {/* Recent sessions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>

          {data.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No sessions yet.</p>
              <Link href="/app" className="text-orange-600 hover:text-orange-700 mt-2 inline-block">
                Start your first session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...data.sessions].reverse().slice(0, 7).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      Day {session.day_index + 1}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleDateString()
                        : 'In progress'}
                    </div>
                  </div>
                  <div className="text-right">
                    {session.reaction_post_score && session.reaction_pre_score && (
                      <div className={`font-medium ${
                        session.reaction_post_score > session.reaction_pre_score
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}>
                        {session.reaction_post_score > session.reaction_pre_score ? '+' : ''}
                        {Math.round(((session.reaction_post_score - session.reaction_pre_score) / session.reaction_pre_score) * 100)}%
                      </div>
                    )}
                    {session.minutes_saved_est !== null && session.minutes_saved_est > 0 && (
                      <div className="text-sm text-gray-500">
                        ~{session.minutes_saved_est} min saved
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prompt to sign up if anonymous */}
        {!data.isLoggedIn && data.sessions.length > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Save your progress
            </h3>
            <p className="text-gray-600 mb-4">
              Create a free account to sync your sessions across devices and never lose your data.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
