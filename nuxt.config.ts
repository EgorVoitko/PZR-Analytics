export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@pinia/nuxt'],

  supabase: {
    redirect: false,
  },

  css: ['~/assets/css/main.css'],
})
