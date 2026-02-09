-- =====================================================
-- Invoice Platform Tables Migration
-- Creates: suppliers, invoices, invoice_items,
--          invoice_templates, notifications
-- =====================================================

-- =====================================================
-- 1. updated_at trigger function (reusable)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. suppliers (공급업체 마스터)
-- =====================================================
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_no text,
  contact_name text,
  phone text,
  email text,
  address text,
  default_terms text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_suppliers_branch_id ON suppliers(branch_id);

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. invoices (거래명세서 헤더)
-- =====================================================
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_no text,
  invoice_date date,
  received_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'inspecting', 'confirmed', 'disputed')),
  delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'delivered', 'partial')),
  total_amount numeric,
  confirmed_amount numeric,
  image_url text,
  notes text,
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_branch_id ON invoices(branch_id);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_branch_status ON invoices(branch_id, status);

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. invoice_items (명세서 품목)
-- =====================================================
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text,
  unit_price numeric,
  total_price numeric,
  box_qty numeric,
  ea_qty numeric,
  matched_ingredient_id uuid REFERENCES ingredients(id) ON DELETE SET NULL,
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('auto_matched', 'manual_matched', 'unmatched', 'new_ingredient')),
  confirmed_qty numeric,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_matched_ingredient ON invoice_items(matched_ingredient_id);

-- =====================================================
-- 5. invoice_templates (공급업체별 포맷 학습)
-- =====================================================
CREATE TABLE invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  field_mappings jsonb DEFAULT '{}',
  item_name_mappings jsonb DEFAULT '{}',
  confidence_score numeric DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoice_templates_supplier ON invoice_templates(supplier_id);
CREATE INDEX idx_invoice_templates_branch ON invoice_templates(branch_id);

CREATE TRIGGER set_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. notifications (인앱 알림)
-- =====================================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('invoice_received', 'invoice_confirmed', 'invoice_disputed', 'low_stock', 'system')),
  title text NOT NULL,
  message text,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_branch ON notifications(user_id, branch_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, branch_id) WHERE read_at IS NULL;
