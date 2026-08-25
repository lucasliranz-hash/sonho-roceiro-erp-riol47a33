-- Migration: Add comments and indexes for sanitary items evolution in inventory and movements
-- Note: farm_inventory and farm_stock_movements store extensible JSONB payload in the data column.
-- This migration documents the new JSON schema keys and adds helpful index expressions if needed.

COMMENT ON TABLE farm_inventory IS 'Stores farm inventory items. Extended for sanitary products (packaging_type, content_per_package, consumption_unit, expiration_date, manufacturer_batch).';
COMMENT ON TABLE farm_stock_movements IS 'Stores inventory movements. Extended for sanitary products (package_quantity, value_per_package, manufacturer_batch, expiration_date).';
