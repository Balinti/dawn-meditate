import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        plan: 'free',
        status: null,
        current_period_end: null,
        cancel_at_period_end: false,
      })
    }

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({
        plan: 'free',
        status: null,
        current_period_end: null,
        cancel_at_period_end: false,
      })
    }

    // Check if subscription is active
    const isActive = subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      (subscription.status === 'canceled' &&
        subscription.current_period_end &&
        new Date(subscription.current_period_end) > new Date())

    return NextResponse.json({
      plan: isActive ? subscription.plan : 'free',
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error('Entitlement error:', error)
    return NextResponse.json({
      plan: 'free',
      status: null,
      current_period_end: null,
      cancel_at_period_end: false,
    })
  }
}
