DO $$
DECLARE
  new_user_id uuid;
  new_org_id uuid;
  new_prop_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lucasliranz@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lucasliranz@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Lucas Liranz"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, role_title)
    VALUES (new_user_id, 'Lucas Liranz', 'Proprietario')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Lucas Liranz', role_title = 'Proprietario';

    new_org_id := gen_random_uuid();
    INSERT INTO public.organizations (id, name, created_by)
    VALUES (new_org_id, 'Sonho Roceiro', new_user_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.organization_members (
      id, organization_id, user_id, role, status, accepted_at
    ) VALUES (
      gen_random_uuid(), new_org_id, new_user_id, 'OWNER', 'ativo', NOW()
    ) ON CONFLICT (id) DO NOTHING;

    new_prop_id := gen_random_uuid();
    INSERT INTO public.properties (id, organization_id, name)
    VALUES (new_prop_id, new_org_id, 'Sonho Roceiro')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
