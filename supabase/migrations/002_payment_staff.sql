-- Add staff_id support to public payment function
CREATE OR REPLACE FUNCTION create_public_payment(
  p_product_id INTEGER,
  p_qty        INTEGER,
  p_name       TEXT,
  p_email      TEXT DEFAULT NULL,
  p_staff_id   UUID DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product     RECORD;
  v_customer_id BIGINT;
  v_sale_id     BIGINT;
  v_total       INTEGER;
BEGIN
  SELECT id, price, active INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND OR NOT v_product.active THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  v_total := v_product.price * p_qty;

  IF p_email IS NOT NULL AND p_email != '' THEN
    SELECT id INTO v_customer_id FROM customers WHERE email = p_email LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (name, email, purchases, spent, last_visit)
    VALUES (p_name, NULLIF(p_email, ''), 0, 0, CURRENT_DATE)
    RETURNING id INTO v_customer_id;
  END IF;

  UPDATE customers
  SET purchases  = purchases + 1,
      spent      = spent + v_total,
      last_visit = CURRENT_DATE
  WHERE id = v_customer_id;

  INSERT INTO sales (staff_id, product_id, customer_id, qty, total, payment_status)
  VALUES (p_staff_id, p_product_id, v_customer_id, p_qty, v_total, 'completed')
  RETURNING id INTO v_sale_id;

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_public_payment TO anon;
