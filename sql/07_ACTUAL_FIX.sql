-- ========================================
-- ACTUAL FIX: Work with existing schema
-- ========================================
-- Your tables already exist with Albanian field names.
-- Let's work with what you have, not create new structures!

-- ========================================
-- 1. Add owner_phone column (for SMS notifications)
-- ========================================
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS owner_phone text;

COMMENT ON COLUMN public.properties.owner_phone IS 
  'Owner phone number in E.164 format (e.g., +355691234567) for SMS notifications';

-- ========================================
-- 2. Create get_properties_due_today function
-- ========================================
CREATE OR REPLACE FUNCTION get_properties_due_today()
RETURNS TABLE (
  property_id uuid,
  property_name text,
  tenant_name text,
  tenant_phone text,
  owner_phone text,
  rent_amount numeric,
  currency text,
  due_date date
) 
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.emertimi,
    p.emri_qiraxhiut,
    p.tel_qiraxhiut,
    p.owner_phone,
    p.qera_mujore,
    p.monedha,
    p.data_qirase
  FROM public.properties p
  WHERE 
    p.data_qirase IS NOT NULL
    AND (
      -- Exact match on day
      EXTRACT(day FROM p.data_qirase) = EXTRACT(day FROM CURRENT_DATE)
      OR
      -- Month-end handling: if due day > last day of current month, trigger on last day
      (
        EXTRACT(day FROM p.data_qirase) > EXTRACT(day FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))
        AND EXTRACT(day FROM CURRENT_DATE) = EXTRACT(day FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))
      )
    );
END;
$$;

COMMENT ON FUNCTION get_properties_due_today IS 
  'Returns all properties with rent due today (handles month-end edge cases)';

-- ========================================
-- 3. Create simple processing function
-- ========================================

CREATE OR REPLACE FUNCTION process_rent_due_for_property_simple(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_property record;
  v_payment_exists boolean;
  v_this_month date;
BEGIN
  -- Get property
  SELECT * INTO v_property
  FROM public.properties
  WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property not found');
  END IF;
  
  -- First day of current month
  v_this_month := DATE_TRUNC('month', CURRENT_DATE)::date;
  
  -- Check if already processed this month
  SELECT EXISTS(
    SELECT 1 FROM public.rental_payments
    WHERE property_id = p_property_id
      AND payment_due_date >= v_this_month
      AND payment_due_date < (v_this_month + INTERVAL '1 month')::date
  ) INTO v_payment_exists;
  
  IF v_payment_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already processed this month',
      'property_name', v_property.emertimi
    );
  END IF;
  
  -- Create payment record
  INSERT INTO public.rental_payments (
    property_id,
    tenant_name,
    tenant_phone,
    rent_amount,
    currency,
    payment_due_date,
    status,
    property_name,
    grupi,
    shkalla,
    notes,
    paid_at
  ) VALUES (
    p_property_id,
    v_property.emri_qiraxhiut,
    v_property.tel_qiraxhiut,
    v_property.qera_mujore,
    COALESCE(v_property.monedha, 'EUR'),
    CURRENT_DATE,
    v_property.status,  -- Copy current status ('Paguar' or 'Pa Paguar')
    v_property.emertimi,
    v_property.grupi,
    v_property.shkalla,
    CASE 
      WHEN v_property.status = 'Paguar' THEN 'Pagesa u krye' 
      ELSE 'Duke pritur pagese'
    END,
    CASE 
      WHEN v_property.status = 'Paguar' THEN CURRENT_TIMESTAMP 
      ELSE NULL 
    END
  );
  
  -- Reset to 'Pa Paguar' for new month
  UPDATE public.properties
  SET status = 'Pa Paguar',
      updated_at = NOW()
  WHERE id = p_property_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'property_id', p_property_id,
    'property_name', v_property.emertimi,
    'previous_status', v_property.status,
    'new_status', 'Pa Paguar',
    'payment_recorded', v_property.status = 'Paguar'
  );
END;
$$;

-- ========================================
-- 4. Process all properties due today
-- ========================================

CREATE OR REPLACE FUNCTION process_all_rent_due_today_simple()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_property record;
  v_results jsonb := '[]'::jsonb;
  v_total_processed int := 0;
  v_total_paid int := 0;
  v_total_unpaid int := 0;
  v_result jsonb;
BEGIN
  -- Loop through properties with rent due today
  FOR v_property IN 
    SELECT * FROM get_properties_due_today()
  LOOP
    -- Process each one
    v_result := process_rent_due_for_property_simple(v_property.property_id);
    
    v_results := v_results || jsonb_build_array(v_result);
    
    IF (v_result->>'success')::boolean THEN
      v_total_processed := v_total_processed + 1;
      
      IF (v_result->>'payment_recorded')::boolean THEN
        v_total_paid := v_total_paid + 1;
      ELSE
        v_total_unpaid := v_total_unpaid + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_at', NOW(),
    'total_processed', v_total_processed,
    'total_paid_last_month', v_total_paid,
    'total_unpaid_last_month', v_total_unpaid,
    'details', v_results
  );
END;
$$;

-- ========================================
-- 5. Grant permissions
-- ========================================

GRANT EXECUTE ON FUNCTION process_rent_due_for_property_simple TO authenticated;
GRANT EXECUTE ON FUNCTION process_all_rent_due_today_simple TO service_role;

-- ========================================
-- DONE!
-- ========================================

-- Test it:
-- SELECT process_all_rent_due_today_simple();
