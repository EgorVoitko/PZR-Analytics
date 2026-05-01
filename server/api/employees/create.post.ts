import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { name, email, password } = await readBody(event)

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw createError({ statusCode: 400, message: 'Name, email and password are required' })
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         email.trim(),
    password:      password.trim(),
    email_confirm: true,
    user_metadata: { name: name.trim(), role: 'employee' },
  })

  if (authError) {
    throw createError({ statusCode: 400, message: authError.message })
  }

  // Compute initials from name
  const initials = name.trim()
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0].toUpperCase())
    .join('')
    .slice(0, 2)

  // Update profile (auto-created by trigger)
  await supabase
    .from('profiles')
    .update({ name: name.trim(), initials, role: 'employee' })
    .eq('id', authData.user.id)

  return { id: authData.user.id, name: name.trim(), email: email.trim(), initials }
})
