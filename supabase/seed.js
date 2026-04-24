/**
 * PZR Analytics — Seed Script
 *
 * Usage:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ...  \
 *   node supabase/seed.js
 *
 * Requires Node 18+ (native fetch).
 * Uses the service_role key — never expose it in the frontend.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Seed data ────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { sku: '1', name: 'Item 1', price:  429, type: 'dino',          active: true  },
  { sku: '2', name: 'Item 2', price:  389, type: 'strukture',     active: true  },
  { sku: '3', name: 'Item 3', price:   89, type: 'kit',           active: true  },
  { sku: '4', name: 'Item 4', price:  899, type: 'account',       active: true  },
  { sku: '5', name: 'Item 5', price:  499, type: 'resource',      active: true  },
  { sku: '6', name: 'Item 6', price:   55, type: 'boss',          active: true  },
  { sku: '7', name: 'Item 7', price:  249, type: 'guide-service', active: false },
  { sku: '8', name: 'Item 8', price:    9, type: 'kit',           active: true  },
]

const CUSTOMERS = [
  { name: 'Anna Kravchenko',   purchases: 47, spent: 7800, discount: 15, last_visit: '2026-03-19' },
  { name: 'Viktor Shevchenko', purchases: 34, spent: 5570, discount: 12, last_visit: '2026-03-20' },
  { name: 'Irina Bondarenko',  purchases: 28, spent: 3900, discount:  8, last_visit: '2026-03-18' },
  { name: 'Oleg Tkachenko',    purchases: 22, spent: 3136, discount:  7, last_visit: '2026-03-17' },
  { name: 'Natalya Kovalenko', purchases: 19, spent: 2486, discount:  5, last_visit: '2026-03-20' },
  { name: 'Sergei Melnyk',     purchases: 14, spent: 1748, discount:  3, last_visit: '2026-03-15' },
  { name: 'Tatiana Lysenko',   purchases: 11, spent: 1242, discount:  3, last_visit: '2026-03-16' },
  { name: 'Pavel Rudenko',     purchases:  8, spent:  864, discount:  0, last_visit: '2026-03-14' },
  { name: 'Yulia Polishchuk',  purchases:  5, spent:  578, discount:  0, last_visit: '2026-03-12' },
  { name: 'Andrei Savchenko',  purchases:  3, spent:  312, discount:  0, last_visit: '2026-03-10' },
]

const STAFF_USERS = [
  { email: 'admin@pzr.com',  password: 'Admin1234!', name: 'Admin',          initials: 'AD', role: 'admin'    },
  { email: 'maria@pzr.com',  password: 'Staff1234!', name: 'Maria Petrova',  initials: 'MP', role: 'employee' },
  { email: 'dmitry@pzr.com', password: 'Staff1234!', name: 'Dmitry Kozlov',  initials: 'DK', role: 'employee' },
  { email: 'elena@pzr.com',  password: 'Staff1234!', name: 'Elena Sidorova', initials: 'ES', role: 'employee' },
  { email: 'alexei@pzr.com', password: 'Staff1234!', name: 'Alexei Morozov', initials: 'AM', role: 'employee' },
  { email: 'olga@pzr.com',   password: 'Staff1234!', name: 'Olga Novikova',  initials: 'ON', role: 'employee' },
  { email: 'igor@pzr.com',   password: 'Staff1234!', name: 'Igor Volkov',    initials: 'IV', role: 'employee' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[seed] ${msg}`) }
function err(msg) { console.error(`[seed] ERROR: ${msg}`); process.exit(1) }

async function run(label, promise) {
  const { data, error } = await promise
  if (error) err(`${label}: ${error.message}`)
  log(`✓ ${label}`)
  return data
}

// ── Main ─────────────────────────────────────────────────────────────────────

log('Starting seed...')

// 1. Products
const existingProducts = await run(
  'Check products',
  supabase.from('products').select('sku')
)

if (existingProducts.length === 0) {
  await run('Insert products', supabase.from('products').insert(PRODUCTS))
} else {
  log('Products already seeded, skipping')
}

// 2. Customers
const existingCustomers = await run(
  'Check customers',
  supabase.from('customers').select('id').limit(1)
)

if (existingCustomers.length === 0) {
  await run('Insert customers', supabase.from('customers').insert(CUSTOMERS))
} else {
  log('Customers already seeded, skipping')
}

// 3. Auth users + profiles
const staffIds = {}

for (const u of STAFF_USERS) {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', u.email)
    .maybeSingle()

  if (existing) {
    staffIds[u.email] = existing.id
    log(`User ${u.email} already exists, skipping`)
    continue
  }

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email:          u.email,
    password:       u.password,
    email_confirm:  true,
    user_metadata:  { name: u.name, role: u.role },
  })

  if (authErr) err(`Create user ${u.email}: ${authErr.message}`)
  staffIds[u.email] = authData.user.id

  // Update profile (trigger creates it, but we need to set role for admin)
  await run(
    `Update profile ${u.email}`,
    supabase
      .from('profiles')
      .update({ name: u.name, initials: u.initials, role: u.role })
      .eq('id', authData.user.id)
  )
}

// 4. Sales (using actual staff UUIDs)
const existingSales = await run(
  'Check sales',
  supabase.from('sales').select('id').limit(1)
)

if (existingSales.length === 0) {
  const SALES = [
    { staff: 'dmitry@pzr.com', sku: '1', qty: 1,  total:  429, at: '2026-03-20T14:32:00' },
    { staff: 'maria@pzr.com',  sku: '3', qty: 2,  total:  178, at: '2026-03-20T13:45:00' },
    { staff: 'alexei@pzr.com', sku: '6', qty: 3,  total:  165, at: '2026-03-20T12:14:00' },
    { staff: 'maria@pzr.com',  sku: '8', qty: 6,  total:   54, at: '2026-03-20T11:03:00' },
    { staff: 'igor@pzr.com',   sku: '8', qty: 5,  total:   45, at: '2026-03-20T10:18:00' },
    { staff: 'elena@pzr.com',  sku: '4', qty: 1,  total:  899, at: '2026-03-19T17:34:00' },
    { staff: 'olga@pzr.com',   sku: '5', qty: 1,  total:  499, at: '2026-03-19T15:52:00' },
    { staff: 'dmitry@pzr.com', sku: '1', qty: 1,  total:  429, at: '2026-03-19T14:08:00' },
    { staff: 'maria@pzr.com',  sku: '7', qty: 1,  total:  249, at: '2026-03-19T11:27:00' },
    { staff: 'alexei@pzr.com', sku: '3', qty: 3,  total:  267, at: '2026-03-19T09:15:00' },
    { staff: 'igor@pzr.com',   sku: '2', qty: 1,  total:  389, at: '2026-03-18T16:41:00' },
    { staff: 'dmitry@pzr.com', sku: '4', qty: 1,  total:  899, at: '2026-03-18T14:22:00' },
    { staff: 'elena@pzr.com',  sku: '6', qty: 2,  total:  110, at: '2026-03-18T11:05:00' },
    { staff: 'maria@pzr.com',  sku: '5', qty: 1,  total:  499, at: '2026-03-17T15:30:00' },
    { staff: 'olga@pzr.com',   sku: '8', qty: 10, total:   90, at: '2026-03-17T12:48:00' },
    { staff: 'alexei@pzr.com', sku: '1', qty: 1,  total:  429, at: '2026-03-16T16:20:00' },
    { staff: 'igor@pzr.com',   sku: '3', qty: 4,  total:  356, at: '2026-03-16T13:10:00' },
    { staff: 'elena@pzr.com',  sku: '2', qty: 1,  total:  389, at: '2026-03-15T11:45:00' },
  ]

  // Fetch product IDs by sku
  const { data: prods } = await supabase.from('products').select('id, sku')
  const skuToId = Object.fromEntries(prods.map(p => [p.sku, p.id]))

  const salesRows = SALES.map(s => ({
    staff_id:   staffIds[s.staff],
    product_id: skuToId[s.sku],
    qty:        s.qty,
    total:      s.total,
    created_at: s.at,
  }))

  await run('Insert sales', supabase.from('sales').insert(salesRows))
} else {
  log('Sales already seeded, skipping')
}

log('\nSeed complete!')
log('─────────────────────────────')
log('Test accounts:')
log('  admin@pzr.com  / Admin1234!  (Administrator)')
log('  maria@pzr.com  / Staff1234!  (Employee)')
log('  igor@pzr.com   / Staff1234!  (Employee)')
log('─────────────────────────────')
