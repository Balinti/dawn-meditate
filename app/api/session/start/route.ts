import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProtocol, getMaintenanceProtocol } from '@/lib/protocols'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      wake_time,
      context = 'standard',
      device_id,
      is_anonymous = true,
      day_index_hint = 0,
    } = body

    // Get recent sessions for adaptation (if logged in)
    let recentDeltas: number[] = []
    let dayIndex = day_index_hint

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch recent sessions for adaptation
      const { data: sessions } = await supabase
        .from('sessions')
        .select('reaction_pre_score, reaction_post_score, day_index')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (sessions && sessions.length > 0) {
        recentDeltas = sessions
          .filter(s => s.reaction_pre_score && s.reaction_post_score)
          .map(s => (s.reaction_post_score || 0) - (s.reaction_pre_score || 0))

        // Get highest day_index + 1
        const maxDayIndex = Math.max(...sessions.map(s => s.day_index || 0))
        dayIndex = maxDayIndex + 1
      }
    }

    // Generate protocol
    const protocol = getProtocol(context, dayIndex, recentDeltas)

    // If logged in, create session record
    let sessionId: string | null = null
    if (user) {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          device_id,
          started_at: new Date().toISOString(),
          wake_time_reported: wake_time,
          context,
          protocol_id: protocol.id,
          day_index: dayIndex,
        })
        .select('id')
        .single()

      if (session) {
        sessionId = session.id
      }
    }

    return NextResponse.json({
      session_id: sessionId,
      protocol,
      day_index: dayIndex,
    })
  } catch (error) {
    console.error('Session start error:', error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}
