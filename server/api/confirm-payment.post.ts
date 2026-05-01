import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config    = useRuntimeConfig()
  const { sessionId } = await readBody(event)

  const stripe  = new Stripe(config.stripeSecretKey)
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') {
    throw createError({ statusCode: 400, message: 'Payment not completed' })
  }

  const { productId, qty, name, email, staffId } = session.metadata!

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase.rpc('create_public_payment', {
    p_product_id: Number(productId),
    p_qty:        Number(qty),
    p_name:       name,
    p_email:      email   || null,
    p_staff_id:   staffId || null,
  })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { saleId: data }
})
