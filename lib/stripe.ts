import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  return stripeInstance
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export function getPriceIds(): { plus: string | null; pro: string | null } {
  return {
    plus: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID || null,
    pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
  }
}
