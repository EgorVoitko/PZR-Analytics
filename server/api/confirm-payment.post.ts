import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

async function sendDiscordNotification(webhookUrl: string, opts: {
  productName: string
  qty:         number
  total:       number
  customer:    string
  staffName:   string | null
}) {
  const total     = '$' + (opts.total / 100).toFixed(2)
  const manager   = opts.staffName ?? 'Direct'
  const customer  = opts.customer  || 'Anonymous'

  await $fetch(webhookUrl, {
    method: 'POST',
    body: {
      embeds: [{
        title:  '💰 New Sale',
        color:  4906624,
        fields: [
          { name: 'Product',  value: `${opts.productName} × ${opts.qty}`, inline: true },
          { name: 'Total',    value: total,    inline: true },
          { name: '​',   value: '​', inline: true },
          { name: 'Customer', value: customer, inline: true },
          { name: 'Manager',  value: manager,  inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    },
  })
}

export default defineEventHandler(async (event) => {
  const config        = useRuntimeConfig()
  const { sessionId } = await readBody(event)

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw createError({ statusCode: 400, message: 'sessionId is required' })
  }

  const stripe = new Stripe(config.stripeSecretKey)

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[confirm-payment] Failed to retrieve Stripe session:', { sessionId, err })
    throw createError({ statusCode: 502, message: 'Failed to retrieve payment session' })
  }

  if (session.payment_status !== 'paid') {
    console.warn('[confirm-payment] Session not paid:', { sessionId, status: session.payment_status })
    throw createError({ statusCode: 400, message: 'Payment not completed' })
  }

  const { productId, productName, qty, name, email, staffId } = session.metadata!

  const supabase = createClient(config.supabaseUrl, config.supabaseKey)

  const { data, error } = await supabase.rpc('create_public_payment', {
    p_product_id: Number(productId),
    p_qty:        Number(qty),
    p_name:       name,
    p_email:      email   || null,
    p_staff_id:   staffId || null,
  })

  if (error) {
    console.error('[confirm-payment] Supabase RPC error:', { sessionId, error })
    throw createError({ statusCode: 500, message: error.message })
  }

  // Discord notification
  if (config.discordWebhookUrl) {
    let staffName: string | null = null

    if (staffId) {
      const admin = createClient(config.supabaseUrl, config.supabaseServiceKey)
      const { data: profile } = await admin
        .from('profiles')
        .select('name')
        .eq('id', staffId)
        .single()
      staffName = profile?.name ?? null
    }

    sendDiscordNotification(config.discordWebhookUrl, {
      productName: productName || `Product #${productId}`,
      qty:         Number(qty),
      total:       session.amount_total ?? 0,
      customer:    name,
      staffName,
    }).catch(err => console.error('[confirm-payment] Discord webhook error:', err))
  }

  return {
    saleId:      data,
    productName: productName || `Product #${productId}`,
    qty:         Number(qty),
    total:       session.amount_total ?? 0,
  }
})
