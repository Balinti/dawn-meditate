import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      console.log('Stripe not configured, acknowledging webhook')
      return NextResponse.json({ received: true })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event: Stripe.Event

    // Verify signature if secret is present
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ received: true })
      }
    } else {
      // Parse without verification (development)
      event = JSON.parse(body) as Stripe.Event
    }

    const supabase = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') break

        const userId = session.metadata?.user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId) {
          console.error('No user_id in checkout session metadata')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        // Determine plan
        let plan: 'plus' | 'pro' = 'plus'
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          plan = 'pro'
        }

        // Get current period end - handle potential number or undefined
        const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

        // Upsert subscription
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan,
          status: subscription.status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.user_id
        const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

        if (!userId) {
          // Try to find user by customer ID
          const customerId = subscription.customer as string
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!existing) {
            console.error('No user found for customer:', customerId)
            break
          }

          const priceId = subscription.items.data[0]?.price.id
          let plan: 'plus' | 'pro' = 'plus'
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            plan = 'pro'
          }

          await supabase.from('subscriptions').update({
            plan,
            status: subscription.status,
            stripe_subscription_id: subscription.id,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq('user_id', existing.user_id)
        } else {
          const priceId = subscription.items.data[0]?.price.id
          let plan: 'plus' | 'pro' = 'plus'
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            plan = 'pro'
          }

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan,
            status: subscription.status,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const customerId = subscription.customer as string
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (existing) {
          await supabase.from('subscriptions').update({
            plan: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('user_id', existing.user_id)
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to prevent retries
    return NextResponse.json({ received: true })
  }
}
