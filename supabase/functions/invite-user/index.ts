import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: member } = await userClient
      .from('organization_members')
      .select('role, status, organization_id')
      .eq('user_id', user.id)
      .eq('status', 'ativo')
      .limit(1)

    const memberRec = member?.[0]
    if (!memberRec || !['OWNER', 'ADMIN'].includes(memberRec.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const body = await req.json()
    const { email, name, role, property_ids, permissions } = body

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${req.headers.get('origin') || 'https://sonho-roceiro-erp-47de1.goskip.app'}/login`,
      },
    )

    const invitedUserId = inviteData?.user?.id || null

    if (inviteError && !inviteError.message.includes('already')) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', memberRec.organization_id)
      .eq('invited_email', email)
      .limit(1)

    if (existingMember && existingMember.length > 0) {
      await adminClient
        .from('organization_members')
        .update({ role, permissions: permissions || {} })
        .eq('id', existingMember[0].id)
    } else {
      await adminClient.from('organization_members').insert({
        organization_id: memberRec.organization_id,
        user_id: invitedUserId,
        role,
        status: 'convite_pendente',
        invited_email: email,
        invited_at: new Date().toISOString(),
        permissions: permissions || {},
      })
    }

    if (property_ids && property_ids.length > 0 && invitedUserId) {
      await adminClient
        .from('user_property_access')
        .delete()
        .eq('user_id', invitedUserId)
        .eq('organization_id', memberRec.organization_id)

      const accessRecords = property_ids.map((pid: string) => ({
        user_id: invitedUserId,
        organization_id: memberRec.organization_id,
        property_id: pid,
        can_access_all: false,
      }))
      await adminClient.from('user_property_access').insert(accessRecords)
    }

    await adminClient.from('audit_logs').insert({
      organization_id: memberRec.organization_id,
      user_id: user.id,
      action: 'invited',
      entity_type: 'organization_member',
      entity_id: email,
      new_data: { email, name, role, property_ids },
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
