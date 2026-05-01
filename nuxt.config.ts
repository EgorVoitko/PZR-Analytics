export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@pinia/nuxt'],

  supabase: {
    redirect: false,
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    stripeSecretKey:  process.env.STRIPE_SECRET_KEY  || '',
    supabaseUrl:      process.env.SUPABASE_URL        || '',
    supabaseKey:      process.env.SUPABASE_KEY        || '',
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
  },
})
