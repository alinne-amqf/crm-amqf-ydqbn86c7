import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VALID_STAGES = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado',
  'Perdido',
  'Fechado/Ganho',
  'Fechado/Perdido',
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authorization header is missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // 1. Validar autenticação e extrair user_id do token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 2. Extrair e validar o corpo da requisição
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { opportunity_id, new_stage, notes, loss_reason } = body

    if (!opportunity_id || typeof opportunity_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Bad Request: "opportunity_id" is required and must be a string' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (!new_stage || typeof new_stage !== 'string' || !VALID_STAGES.includes(new_stage)) {
      return new Response(
        JSON.stringify({
          error: `Bad Request: "new_stage" is required and must be one of: ${VALID_STAGES.join(', ')}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 3. Executar a transação atômica no PostgreSQL usando supabase.rpc
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'update_opportunity_stage_atomic',
      {
        p_opportunity_id: opportunity_id,
        p_new_stage: new_stage,
        p_user_id: user.id,
        p_notes: notes || null,
        p_loss_reason: loss_reason || null,
      },
    )

    if (rpcError) {
      if (rpcError.code === 'P0002' || rpcError.message?.toLowerCase().includes('not found')) {
        return new Response(JSON.stringify({ error: 'Opportunity not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      return new Response(
        JSON.stringify({ error: rpcError.message || 'Internal database transaction error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    return new Response(JSON.stringify(rpcData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
