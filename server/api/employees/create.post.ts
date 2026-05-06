import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { name, email, password } = await readBody(event)

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw createError({ statusCode: 400, message: 'Name, email and password are required' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }
  if (password.trim().length < 6) {
    throw createError({ statusCode: 400, message: 'Password must be at least 6 characters' })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         email.trim(),
    password:      password.trim(),
    email_confirm: true,
    user_metadata: { name: name.trim(), role: 'employee' },
  })

  if (authError) {
    console.error('[employees/create] Supabase auth error:', { email: email.trim(), error: authError })
    throw createError({ statusCode: 400, message: authError.message })
  }

  // Compute initials from name
  const initials = name.trim()
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2)

  // Update profile
  await supabase
    .from('profiles')
    .update({ name: name.trim(), initials, role: 'employee' })
    .eq('id', authData.user.id)

  return { id: authData.user.id, name: name.trim(), email: email.trim(), initials }
})
