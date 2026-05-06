import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body   = await readBody(event)

  const { productId, productName, productPrice, qty, name, email, staffId } = body

  if (!productId || !productName?.trim()) {
    throw createError({ statusCode: 400, message: 'productId and productName are required' })
  }
  if (typeof productPrice !== 'number' || productPrice <= 0) {
    throw createError({ statusCode: 400, message: 'productPrice must be a positive number' })
  }
  if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
    throw createError({ statusCode: 400, message: 'qty must be between 1 and 999' })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  const stripe = new Stripe(config.stripeSecretKey)
  const origin = getRequestURL(event).origin

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: productName },
            unit_amount: productPrice * 100,
          },
          quantity: qty,
        },
      ],
      success_url: `${origin}/pay?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/pay`,
      metadata: {
        productId:   String(productId),
        productName: String(productName),
        qty:         String(qty),
        name:        name    || '',
        email:       email   || '',
        staffId:     staffId || '',
      },
    })

    return { url: session.url }
  } catch (err) {
    console.error('[create-checkout] Stripe error:', err)
    throw createError({ statusCode: 502, message: 'Failed to create checkout session' })
  }
})
