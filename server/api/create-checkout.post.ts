import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body   = await readBody(event)

  const { productId, productName, productPrice, qty, name, email, staffId } = body

  const stripe  = new Stripe(config.stripeSecretKey)
  const origin  = getRequestURL(event).origin

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
      productId: String(productId),
      qty:       String(qty),
      name,
      email:   email   || '',
      staffId: staffId || '',
    },
  })

  return { url: session.url }
})
