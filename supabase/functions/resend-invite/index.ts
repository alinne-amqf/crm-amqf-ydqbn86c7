import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  async function logAudit(adminId: string, targetUserId: string | null, status: string, action: string) {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminId,
        target_user_id: targetUserId,
        status: status,
        action: action,
      })
    } catch (e) {
      console.error('Audit log failed', e)
    }
  }

  try {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminId = user.id

    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single()

    if (adminProfile?.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { user_id } = body

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, has_accessed, name')
      .eq('id', user_id)
      .single()

    if (profileError || !targetProfile) {
      await logAudit(adminId, user_id, 'falha', 'invite_resent - Usuário não encontrado')
      return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (targetProfile.has_accessed) {
      await logAudit(adminId, user_id, 'falha', 'invite_resent - Usuário já realizou primeiro acesso')
      return new Response(JSON.stringify({ error: 'Usuário já realizou primeiro acesso.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: tokenError } = await supabaseAdmin
      .from('invitation_tokens')
      .insert({
        token,
        user_id,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      await logAudit(adminId, user_id, 'falha', 'invite_resent - Erro ao gerar token')
      throw tokenError
    }

    const accessLink = `${Deno.env.get('VITE_SUPABASE_URL') || 'https://crmamqf.goskip.app'}/login?token=${token}`
    console.log(`[EMAIL MOCK] To: ${targetProfile.email} - Access Link: ${accessLink}`)

    await logAudit(adminId, user_id, 'sucesso', 'invite_resent')

    return new Response(JSON.stringify({ success: true, message: 'Convite reenviado com sucesso.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
