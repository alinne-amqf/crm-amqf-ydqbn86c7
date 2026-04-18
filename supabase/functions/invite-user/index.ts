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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'Admin') throw new Error('Forbidden: Only Admins can invite users')

    const body = await req.json()
    const { email, role } = body

    if (!email || !role) throw new Error('Email and role are required')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      throw new Error('Este e-mail já está cadastrado no sistema.')
    }

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { role, name: email.split('@')[0] },
      })

    if (inviteError) {
      if (inviteError.message.includes('already registered')) {
        throw new Error('Este e-mail já está cadastrado no sistema.')
      }
      throw inviteError
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: `Convidou o usuário ${email} com o papel ${role}`,
    })

    return new Response(JSON.stringify({ success: true, data: inviteData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
