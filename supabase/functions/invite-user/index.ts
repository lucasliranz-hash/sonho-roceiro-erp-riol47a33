import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, organization_id } = await req.json()

    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: 'email and organization_id are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${supabaseUrl}/auth/v1/verify`,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const memberRole = role || 'VISUALIZACAO'

    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id,
      invited_email: email,
      role: memberRole,
      status: 'convite_pendente',
      invited_at: new Date().toISOString(),
    })

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
