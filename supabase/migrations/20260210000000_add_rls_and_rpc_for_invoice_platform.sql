-- =====================================================
-- RLS Policies + RPC Functions for Invoice Platform
-- =====================================================

-- =====================================================
-- 1. Enable RLS on all new tables
-- =====================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. suppliers RLS policies
-- =====================================================
CREATE POLICY "Branch members can view suppliers"
  ON suppliers FOR SELECT
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can update suppliers"
  ON suppliers FOR UPDATE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')))
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can delete suppliers"
  ON suppliers FOR DELETE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

-- =====================================================
-- 3. invoices RLS policies
-- =====================================================
CREATE POLICY "Branch members can view invoices"
  ON invoices FOR SELECT
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can update invoices"
  ON invoices FOR UPDATE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')))
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can delete invoices"
  ON invoices FOR DELETE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

-- =====================================================
-- 4. invoice_items RLS policies (via invoices join)
-- =====================================================
CREATE POLICY "Branch members can view invoice_items"
  ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub'))
  ));

CREATE POLICY "Branch members can insert invoice_items"
  ON invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub'))
  ));

CREATE POLICY "Branch members can update invoice_items"
  ON invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub'))
  ));

CREATE POLICY "Branch members can delete invoice_items"
  ON invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub'))
  ));

-- =====================================================
-- 5. invoice_templates RLS policies
-- =====================================================
CREATE POLICY "Branch members can view invoice_templates"
  ON invoice_templates FOR SELECT
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can insert invoice_templates"
  ON invoice_templates FOR INSERT
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can update invoice_templates"
  ON invoice_templates FOR UPDATE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')))
  WITH CHECK (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

CREATE POLICY "Branch members can delete invoice_templates"
  ON invoice_templates FOR DELETE
  USING (branch_id IN (SELECT get_user_branches(auth.jwt() ->> 'sub')));

-- =====================================================
-- 6. notifications RLS policies (user_id based)
-- =====================================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 7. RPC: confirm_invoice
-- Atomically confirms an invoice, creates stock movements,
-- and updates ingredient quantities
-- =====================================================
CREATE OR REPLACE FUNCTION confirm_invoice(
  p_invoice_id UUID,
  p_confirmed_by TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_item RECORD;
  v_confirmed_amount NUMERIC := 0;
  v_movement_count INTEGER := 0;
  v_current_qty NUMERIC;
  v_result JSONB;
BEGIN
  -- 1. Fetch and validate the invoice
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice not found'
    );
  END IF;

  IF v_invoice.status = 'confirmed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice already confirmed'
    );
  END IF;

  -- 2. Process each confirmed item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    invoice_item_id UUID,
    confirmed_qty NUMERIC,
    matched_ingredient_id UUID
  )
  LOOP
    -- Update the invoice item with confirmed qty
    UPDATE invoice_items
    SET
      confirmed_qty = v_item.confirmed_qty,
      matched_ingredient_id = COALESCE(v_item.matched_ingredient_id, invoice_items.matched_ingredient_id),
      match_status = CASE
        WHEN v_item.matched_ingredient_id IS NOT NULL THEN 'manual_matched'
        WHEN invoice_items.matched_ingredient_id IS NOT NULL THEN invoice_items.match_status
        ELSE 'unmatched'
      END
    WHERE id = v_item.invoice_item_id
    AND invoice_id = p_invoice_id;

    -- Calculate confirmed total
    v_confirmed_amount := v_confirmed_amount + (
      v_item.confirmed_qty * COALESCE(
        (SELECT unit_price FROM invoice_items WHERE id = v_item.invoice_item_id),
        0
      )
    );

    -- 3. Create stock movements for matched items
    IF v_item.matched_ingredient_id IS NOT NULL AND v_item.confirmed_qty > 0 THEN
      -- Get current ingredient qty
      SELECT current_qty INTO v_current_qty
      FROM ingredients
      WHERE id = v_item.matched_ingredient_id;

      -- Insert stock movement (type = 'in')
      INSERT INTO stock_movements (
        ingredient_id,
        movement_type,
        quantity,
        unit_price,
        total_price,
        previous_qty,
        resulting_qty,
        reason,
        reference_no,
        supplier,
        branch_id,
        transaction_date
      )
      SELECT
        v_item.matched_ingredient_id,
        'in',
        v_item.confirmed_qty,
        ii.unit_price,
        v_item.confirmed_qty * COALESCE(ii.unit_price, 0),
        v_current_qty,
        COALESCE(v_current_qty, 0) + v_item.confirmed_qty,
        'Invoice confirmation',
        v_invoice.invoice_no,
        (SELECT s.name FROM suppliers s WHERE s.id = v_invoice.supplier_id),
        v_invoice.branch_id,
        COALESCE(v_invoice.invoice_date, CURRENT_DATE)
      FROM invoice_items ii
      WHERE ii.id = v_item.invoice_item_id;

      -- Update ingredient current_qty
      UPDATE ingredients
      SET current_qty = COALESCE(current_qty, 0) + v_item.confirmed_qty
      WHERE id = v_item.matched_ingredient_id;

      v_movement_count := v_movement_count + 1;
    END IF;
  END LOOP;

  -- 4. Update invoice status to confirmed
  UPDATE invoices
  SET
    status = 'confirmed',
    confirmed_by = p_confirmed_by,
    confirmed_at = now(),
    confirmed_amount = v_confirmed_amount,
    delivery_status = 'delivered'
  WHERE id = p_invoice_id;

  -- 5. Return result
  v_result := jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'confirmed_amount', v_confirmed_amount,
    'stock_movements_created', v_movement_count
  );

  RETURN v_result;
END;
$$;
