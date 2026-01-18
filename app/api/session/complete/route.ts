import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeReactionScore, estimateMinutesSaved } from '@/lib/scoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      device_id,
      started_at,
      wake_time_reported,
      context,
      protocol_id,
      day_index,
      completed_at,
      reaction_pre_score,
      reaction_post_score,
      reaction_pre_events,
      reaction_post_events,
      energy_pre,
      energy_post,
      minutes_saved_est,
      is_migration = false,
    } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Anonymous user - just return computed data
      const minutesSaved = reaction_pre_score && reaction_post_score
        ? estimateMinutesSaved(reaction_pre_score, reaction_post_score, day_index)
        : 0

      return NextResponse.json({
        minutes_saved_est: minutesSaved,
        day_index: day_index + 1,
      })
    }

    // Check for duplicate (by started_at + device_id)
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', device_id)
      .eq('started_at', started_at)
      .single()

    if (existing && !is_migration) {
      // Update existing
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          completed_at,
          reaction_pre_score,
          reaction_post_score,
          energy_pre,
          energy_post,
          minutes_saved_est,
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Session update error:', updateError)
      }

      // Save reaction tests
      if (reaction_pre_events) {
        await supabase.from('reaction_tests').upsert({
          session_id: existing.id,
          timing: 'pre',
          raw_events: reaction_pre_events,
          score: reaction_pre_score,
        }, { onConflict: 'session_id,timing' })
      }

      if (reaction_post_events) {
        await supabase.from('reaction_tests').upsert({
          session_id: existing.id,
          timing: 'post',
          raw_events: reaction_post_events,
          score: reaction_post_score,
        }, { onConflict: 'session_id,timing' })
      }

      return NextResponse.json({
        session_id: existing.id,
        minutes_saved_est,
        day_index: day_index + 1,
      })
    }

    // Insert new session
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        device_id,
        started_at,
        wake_time_reported,
        context,
        protocol_id,
        day_index,
        completed_at,
        reaction_pre_score,
        reaction_post_score,
        energy_pre,
        energy_post,
        minutes_saved_est,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Session insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      )
    }

    // Save reaction tests
    if (session && reaction_pre_events) {
      await supabase.from('reaction_tests').insert({
        session_id: session.id,
        timing: 'pre',
        raw_events: reaction_pre_events,
        score: reaction_pre_score,
      })
    }

    if (session && reaction_post_events) {
      await supabase.from('reaction_tests').insert({
        session_id: session.id,
        timing: 'post',
        raw_events: reaction_post_events,
        score: reaction_post_score,
      })
    }

    return NextResponse.json({
      session_id: session?.id,
      minutes_saved_est,
      day_index: day_index + 1,
    })
  } catch (error) {
    console.error('Session complete error:', error)
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
}
