-- Tabela de produtos/serviços
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage products"
  ON products FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Campos novos na tabela opportunities
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('cash', 'installment')),
  ADD COLUMN IF NOT EXISTS installments INTEGER CHECK (installments >= 1 AND installments <= 360);
