-- ─────────────────────────────────────────────────────────────────────────────
-- PZR Analytics — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger on sign-up.

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  initials    TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'employee'
                          CHECK (role IN ('admin', 'employee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, name, initials, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── products ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL      PRIMARY KEY,
  sku         TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  price       INTEGER     NOT NULL CHECK (price >= 0),
  type        TEXT        NOT NULL
                          CHECK (type IN ('dino','strukture','kit','account','resource','boss','guide-service')),
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── customers ────────────────────────────────────────────────────────────────
-- discord_id — reserved for Discord bot integration
-- discount   — percentage, applied at checkout

CREATE TABLE IF NOT EXISTS customers (
  id          BIGSERIAL   PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT,
  discord_id  TEXT        UNIQUE,
  purchases   INTEGER     NOT NULL DEFAULT 0,
  spent       INTEGER     NOT NULL DEFAULT 0,
  discount    INTEGER     NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
  last_visit  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── sales ────────────────────────────────────────────────────────────────────
-- payment_status — reserved for future payment system integration

CREATE TABLE IF NOT EXISTS sales (
  id              BIGSERIAL   PRIMARY KEY,
  staff_id        UUID        REFERENCES profiles(id)  ON DELETE SET NULL,
  product_id      INTEGER     REFERENCES products(id)  ON DELETE SET NULL,
  customer_id     BIGINT      REFERENCES customers(id) ON DELETE SET NULL,
  qty             INTEGER     NOT NULL DEFAULT 1 CHECK (qty > 0),
  total           INTEGER     NOT NULL CHECK (total >= 0),
  edited          BOOLEAN     NOT NULL DEFAULT FALSE,
  payment_status  TEXT        NOT NULL DEFAULT 'completed'
                              CHECK (payment_status IN ('pending','completed','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on sales changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_updated_at ON sales;
CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Helper: is_admin() ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;


-- ── RPC: get_staff_stats() ───────────────────────────────────────────────────
-- Returns all employees with aggregated sales/revenue.
-- Non-admins get an empty result set (no error).

CREATE OR REPLACE FUNCTION get_staff_stats()
RETURNS TABLE (
  id        UUID,
  name      TEXT,
  initials  TEXT,
  email     TEXT,
  role      TEXT,
  sales     BIGINT,
  revenue   BIGINT,
  online    BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN; -- empty for non-admins
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.initials,
    p.email,
    p.role,
    COUNT(s.id)::BIGINT                    AS sales,
    COALESCE(SUM(s.total)::BIGINT, 0)      AS revenue,
    FALSE                                  AS online  -- will be driven by Discord bot
  FROM profiles p
  LEFT JOIN sales s ON s.staff_id = p.id
  WHERE p.role = 'employee'
  GROUP BY p.id, p.name, p.initials, p.email, p.role
  ORDER BY revenue DESC;
END;
$$;


-- ── Row Level Security ───────────────────────────────────────────────────────

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- products (read-only for all authenticated users, write for admins)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read"
  ON products FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "products_write"
  ON products FOR ALL
  USING (is_admin());

-- customers (read for all, write for admins)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_read"
  ON customers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "customers_write"
  ON customers FOR ALL
  USING (is_admin());

-- sales (employees see own; admins see all)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select"
  ON sales FOR SELECT
  USING (staff_id = auth.uid() OR is_admin());

CREATE POLICY "sales_insert"
  ON sales FOR INSERT
  WITH CHECK (staff_id = auth.uid() OR is_admin());

CREATE POLICY "sales_update"
  ON sales FOR UPDATE
  USING (staff_id = auth.uid() OR is_admin());

CREATE POLICY "sales_delete"
  ON sales FOR DELETE
  USING (is_admin());
