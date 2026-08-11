DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'farm_activities','farm_lots','farm_structures','farm_expenses',
    'farm_inventory','farm_feed_consumption','farm_weighings','farm_mortality',
    'farm_egg_production','farm_incubations','farm_candlings','farm_energy',
    'farm_animals','farm_matings','farm_sales','farm_customers',
    'farm_suppliers','farm_assets','farm_alerts','farm_stock_movements'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by UUID', tbl);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.set_deleted_by()
RETURNS trigger AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    NEW.deleted_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'farm_activities','farm_lots','farm_structures','farm_expenses',
    'farm_inventory','farm_feed_consumption','farm_weighings','farm_mortality',
    'farm_egg_production','farm_incubations','farm_candlings','farm_energy',
    'farm_animals','farm_matings','farm_sales','farm_customers',
    'farm_suppliers','farm_assets','farm_alerts','farm_stock_movements'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', tbl || '_set_deleted_by', tbl);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_deleted_by()', tbl || '_set_deleted_by', tbl);
  END LOOP;
END $$;
