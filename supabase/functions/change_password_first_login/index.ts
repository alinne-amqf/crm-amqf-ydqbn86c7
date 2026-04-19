import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { user_id, current_password, new_password } = body

    if (user.id !== user_id) {
       return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
         status: 401,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
    }

    if (!current_password || !new_password) {
      return new Response(JSON.stringify({ error: 'Campos obrigatorios ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('temporary_password_hash, has_accessed')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Usuario nao encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.has_accessed && !profile.temporary_password_hash) {
      return new Response(JSON.stringify({ error: 'Usuario ja alterou a senha.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isValid = bcrypt.compareSync(current_password, profile.temporary_password_hash || '')
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Senha temporaria incorreta.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const hasMinLength = new_password.length >= 8
    const hasUpper = /[A-Z]/.test(new_password)
    const hasLower = /[a-z]/.test(new_password)
    const hasNumber = /[0-9]/.test(new_password)
    const hasSpecial = /[!@#$%^&*]/.test(new_password)
    
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return new Response(JSON.stringify({ error: 'Nova senha nao atende aos requisitos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (current_password === new_password) {
      return new Response(JSON.stringify({ error: 'Nova senha nao atende aos requisitos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password
    })

    if (updateAuthError) {
      throw updateAuthError
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        temporary_password_hash: null,
        has_accessed: true 
      })
      .eq('id', user_id)

    if (updateProfileError) {
      throw updateProfileError
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user_id,
      target_user_id: user_id,
      action: 'first_login_password_changed',
      status: 'success'
    })

    return new Response(JSON.stringify({ message: 'Senha alterada com sucesso! Redirecionando para dashboard...' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Erro ao processar solicitacao.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
