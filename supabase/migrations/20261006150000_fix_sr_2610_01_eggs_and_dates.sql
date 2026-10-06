-- Migration: 20261006150000_fix_sr_2610_01_eggs_and_dates.sql
-- Objetivo:
-- 1. Corrigir numeração dos ovos na chocada SR-2610-01 (reiniciando sequência por bloco/prefixo):
--    - Pintada: P01, P02, P03, P04, P05 (mantém)
--    - Clara: C06->C01, C07->C02, C08->C03, C09->C04
--    - GSB: GSB10->GSB01, GSB11->GSB02, GSB12->GSB03
--    Preservando todos os UUIDs/IDs internos, genética, datas, status e integridade.
-- 2. Corrigir a data real de início da incubação para 2026-10-04 e atualizar expectedHatchDate para 2026-10-25 (+21 dias).

DO $$
DECLARE
  rec RECORD;
  eggs_arr jsonb;
  updated_eggs jsonb := '[]'::jsonb;
  egg_elem jsonb;
  old_code text;
  new_code text;
  new_data jsonb;
BEGIN
  FOR rec IN
    SELECT id, data FROM public.farm_incubations
    WHERE data->>'code' = 'SR-2610-01' OR id = 'inc-1791296890142'
  LOOP
    eggs_arr := rec.data->'eggs';
    updated_eggs := '[]'::jsonb;

    IF eggs_arr IS NOT NULL AND jsonb_typeof(eggs_arr) = 'array' THEN
      FOR egg_elem IN SELECT * FROM jsonb_array_elements(eggs_arr)
      LOOP
        old_code := egg_elem->>'code';
        new_code := old_code;

        -- Regras de renomeação do display_code por bloco preservando id e demais campos:
        IF old_code = 'C06' THEN new_code := 'C01';
        ELSIF old_code = 'C07' THEN new_code := 'C02';
        ELSIF old_code = 'C08' THEN new_code := 'C03';
        ELSIF old_code = 'C09' THEN new_code := 'C04';
        ELSIF old_code = 'GSB10' THEN new_code := 'GSB01';
        ELSIF old_code = 'GSB11' THEN new_code := 'GSB02';
        ELSIF old_code = 'GSB12' THEN new_code := 'GSB03';
        END IF;

        -- Adiciona o ovo com o código corrigido mantendo todos os outros atributos intactos
        updated_eggs := updated_eggs || jsonb_build_array(jsonb_set(egg_elem, '{code}', to_jsonb(new_code)));
      END LOOP;
    ELSE
      updated_eggs := COALESCE(eggs_arr, '[]'::jsonb);
    END IF;

    -- Atualiza startDate para 2026-10-04, expectedHatchDate para 2026-10-25 e os ovos corrigidos
    new_data := rec.data;
    new_data := jsonb_set(new_data, '{startDate}', '"2026-10-04"'::jsonb);
    new_data := jsonb_set(new_data, '{expectedHatchDate}', '"2026-10-25"'::jsonb);
    new_data := jsonb_set(new_data, '{eggs}', updated_eggs);

    UPDATE public.farm_incubations
    SET data = new_data,
        updated_at = NOW()
    WHERE id = rec.id;
  END LOOP;
END $$;
