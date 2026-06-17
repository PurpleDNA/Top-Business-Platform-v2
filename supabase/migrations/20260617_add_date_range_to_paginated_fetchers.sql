-- Add optional date-range filtering to the paginated list fetchers used by
-- the All Sales (/sales/all) and All Payments (/payments/all) pages.
--
-- The argument signature changes (two new params), so the old functions must
-- be dropped before recreating. Named-arg calls from the app keep working.
-- Run this in the Supabase SQL editor (or via supabase db push).

-- ============================ SALES ============================
DROP FUNCTION IF EXISTS public.fetch_sales_paginated(integer, integer, uuid, uuid);

CREATE FUNCTION public.fetch_sales_paginated(
  p_limit integer,
  p_offset integer,
  p_customer_id uuid DEFAULT NULL::uuid,
  p_production_id uuid DEFAULT NULL::uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  amount numeric,
  paid boolean,
  outstanding numeric,
  remaining numeric,
  amount_paid numeric,
  created_at timestamp with time zone,
  customer_id uuid,
  production_id uuid,
  quantity_bought jsonb,
  customer_name text,
  production_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.amount,
    s.paid,
    s.outstanding,
    s.remaining,
    s.amount_paid,
    s.created_at,
    s.customer_id,
    s.production_id,
    s.quantity_bought,
    c.name AS customer_name,
    p.created_at AS production_date
  FROM sales s
  LEFT JOIN customers c ON s.customer_id = c.id
  LEFT JOIN productions p ON s.production_id = p.id
  WHERE
    (p_customer_id IS NULL OR s.customer_id = p_customer_id)
    AND (p_production_id IS NULL OR s.production_id = p_production_id)
    AND (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date IS NULL OR s.created_at <= p_end_date)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.fetch_sales_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) OWNER TO postgres;
GRANT ALL ON FUNCTION public.fetch_sales_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.fetch_sales_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.fetch_sales_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO service_role;

-- ============================ PAYMENTS ============================
DROP FUNCTION IF EXISTS public.fetch_payments_paginated(integer, integer, uuid, uuid);

CREATE FUNCTION public.fetch_payments_paginated(
  p_limit integer,
  p_offset integer,
  p_customer_id uuid DEFAULT NULL::uuid,
  p_production_id uuid DEFAULT NULL::uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  amount_paid numeric,
  paid_at timestamp with time zone,
  customer_id uuid,
  production_id uuid,
  sale_id uuid,
  type text,
  customer_name text,
  production_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.amount_paid,
    p.paid_at,
    p.customer_id,
    p.production_id,
    p.sale_id,
    p.type::TEXT, -- Cast enum to TEXT
    c.name AS customer_name,
    prod.created_at AS production_date
  FROM payments p
  LEFT JOIN customers c ON p.customer_id = c.id
  LEFT JOIN productions prod ON p.production_id = prod.id
  WHERE
    (p_customer_id IS NULL OR p.customer_id = p_customer_id)
    AND (p_production_id IS NULL OR p.production_id = p_production_id)
    AND (p_start_date IS NULL OR p.paid_at >= p_start_date)
    AND (p_end_date IS NULL OR p.paid_at <= p_end_date)
  ORDER BY p.paid_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.fetch_payments_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) OWNER TO postgres;
GRANT ALL ON FUNCTION public.fetch_payments_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.fetch_payments_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.fetch_payments_paginated(integer, integer, uuid, uuid, timestamp with time zone, timestamp with time zone) TO service_role;
