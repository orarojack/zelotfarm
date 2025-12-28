-- =====================================================
-- Poultry Module - Add Missing Auto-Generation Triggers
-- =====================================================
-- Run this if you already ran poultry_complete_schema.sql
-- This adds the missing triggers for auto-generating references
-- =====================================================

-- Function to generate feed issuance reference
CREATE OR REPLACE FUNCTION generate_feed_issuance_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  issuance_count INTEGER;
BEGIN
  IF NEW.issuance_reference IS NULL OR NEW.issuance_reference = '' THEN
    SELECT COUNT(*) + 1 INTO issuance_count
    FROM feed_issuance
    WHERE DATE(issuance_date) = NEW.issuance_date;
    
    new_reference := 'FEED-' || TO_CHAR(NEW.issuance_date, 'YYYYMMDD') || '-' || LPAD(issuance_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM feed_issuance WHERE issuance_reference = new_reference) LOOP
      issuance_count := issuance_count + 1;
      new_reference := 'FEED-' || TO_CHAR(NEW.issuance_date, 'YYYYMMDD') || '-' || LPAD(issuance_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.issuance_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_feed_issuance_reference ON feed_issuance;
CREATE TRIGGER trg_generate_feed_issuance_reference
  BEFORE INSERT ON feed_issuance
  FOR EACH ROW
  EXECUTE FUNCTION generate_feed_issuance_reference();

-- Function to generate order reference
CREATE OR REPLACE FUNCTION generate_order_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  order_count INTEGER;
BEGIN
  IF NEW.order_reference IS NULL OR NEW.order_reference = '' THEN
    SELECT COUNT(*) + 1 INTO order_count
    FROM poultry_orders
    WHERE DATE(order_date) = NEW.order_date;
    
    new_reference := 'ORD-' || TO_CHAR(NEW.order_date, 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM poultry_orders WHERE order_reference = new_reference) LOOP
      order_count := order_count + 1;
      new_reference := 'ORD-' || TO_CHAR(NEW.order_date, 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.order_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_order_reference ON poultry_orders;
CREATE TRIGGER trg_generate_order_reference
  BEFORE INSERT ON poultry_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_reference();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_number TEXT;
  invoice_count INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM invoices
    WHERE DATE(invoice_date) = NEW.invoice_date;
    
    new_invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYYYMMDD') || '-' || LPAD(invoice_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_invoice_number) LOOP
      invoice_count := invoice_count + 1;
      new_invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYYYMMDD') || '-' || LPAD(invoice_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.invoice_number := new_invoice_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_invoice_number ON invoices;
CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  payment_count INTEGER;
BEGIN
  IF NEW.payment_reference IS NULL OR NEW.payment_reference = '' THEN
    SELECT COUNT(*) + 1 INTO payment_count
    FROM payments
    WHERE DATE(payment_date) = NEW.payment_date;
    
    new_reference := 'PAY-' || TO_CHAR(NEW.payment_date, 'YYYYMMDD') || '-' || LPAD(payment_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM payments WHERE payment_reference = new_reference) LOOP
      payment_count := payment_count + 1;
      new_reference := 'PAY-' || TO_CHAR(NEW.payment_date, 'YYYYMMDD') || '-' || LPAD(payment_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.payment_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_payment_reference ON payments;
CREATE TRIGGER trg_generate_payment_reference
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_reference();

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  customer_count INTEGER;
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    SELECT COUNT(*) + 1 INTO customer_count
    FROM customers;
    
    new_code := 'CUST-' || LPAD(customer_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM customers WHERE customer_code = new_code) LOOP
      customer_count := customer_count + 1;
      new_code := 'CUST-' || LPAD(customer_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.customer_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_customer_code ON customers;
CREATE TRIGGER trg_generate_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();

-- Function to generate budget reference
CREATE OR REPLACE FUNCTION generate_budget_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  budget_count INTEGER;
BEGIN
  IF NEW.budget_reference IS NULL OR NEW.budget_reference = '' THEN
    SELECT COUNT(*) + 1 INTO budget_count
    FROM budgets
    WHERE period_start = NEW.period_start;
    
    new_reference := 'BUD-' || TO_CHAR(NEW.period_start, 'YYYYMMDD') || '-' || LPAD(budget_count::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM budgets WHERE budget_reference = new_reference) LOOP
      budget_count := budget_count + 1;
      new_reference := 'BUD-' || TO_CHAR(NEW.period_start, 'YYYYMMDD') || '-' || LPAD(budget_count::TEXT, 3, '0');
    END LOOP;
    
    NEW.budget_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_budget_reference ON budgets;
CREATE TRIGGER trg_generate_budget_reference
  BEFORE INSERT ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION generate_budget_reference();

-- Function to generate journal entry reference
CREATE OR REPLACE FUNCTION generate_journal_entry_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  entry_count INTEGER;
BEGIN
  IF NEW.entry_reference IS NULL OR NEW.entry_reference = '' THEN
    SELECT COUNT(*) + 1 INTO entry_count
    FROM journal_entries
    WHERE DATE(entry_date) = NEW.entry_date;
    
    new_reference := 'JE-' || TO_CHAR(NEW.entry_date, 'YYYYMMDD') || '-' || LPAD(entry_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM journal_entries WHERE entry_reference = new_reference) LOOP
      entry_count := entry_count + 1;
      new_reference := 'JE-' || TO_CHAR(NEW.entry_date, 'YYYYMMDD') || '-' || LPAD(entry_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.entry_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_journal_entry_reference ON journal_entries;
CREATE TRIGGER trg_generate_journal_entry_reference
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_journal_entry_reference();

-- Function to generate asset code
CREATE OR REPLACE FUNCTION generate_asset_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  asset_count INTEGER;
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    SELECT COUNT(*) + 1 INTO asset_count
    FROM assets;
    
    new_code := 'AST-' || LPAD(asset_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM assets WHERE asset_code = new_code) LOOP
      asset_count := asset_count + 1;
      new_code := 'AST-' || LPAD(asset_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.asset_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_asset_code ON assets;
CREATE TRIGGER trg_generate_asset_code
  BEFORE INSERT ON assets
  FOR EACH ROW
  EXECUTE FUNCTION generate_asset_code();

