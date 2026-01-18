import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch sessions
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Dashboard query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const completedSessions = sessions?.filter(s => s.completed_at) || []

    // Calculate streak
    let streak = 0
    if (completedSessions.length > 0) {
      const sortedSessions = [...completedSessions].sort(
        (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      )

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const checkDate = new Date(sortedSessions[0].completed_at!)
      checkDate.setHours(0, 0, 0, 0)

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

    // Get day index
    const dayIndex = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.day_index || 0)) + 1
      : 0

    // Calculate total minutes saved
    const totalMinutesSaved = completedSessions.reduce(
      (sum, s) => sum + (s.minutes_saved_est || 0),
      0
    )

    return NextResponse.json({
      sessions: completedSessions,
      day_index: dayIndex,
      streak,
      total_minutes_saved: totalMinutesSaved,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
