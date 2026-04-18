import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      data: { user: adminUser },
    } = await supabaseClient.auth.getUser()
    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status, email, id, has_accessed')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Usuário nao encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.has_accessed) {
      return new Response(JSON.stringify({ error: 'Usuário já acessou o sistema.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: tokenError } = await supabaseAdmin.from('invitation_tokens').insert({
      user_id: user_id,
      token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      throw new Error(`Failed to store token: ${tokenError.message}`)
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(profile.email)

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminUser.id,
      target_user_id: user_id,
      action: 'invite_resent',
      status: inviteError ? 'falha' : 'sucesso',
    })

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'Convite reenviado com sucesso', token }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
