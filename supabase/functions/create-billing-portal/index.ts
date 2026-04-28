// Stripe Customer Portal セッション作成。subscriptions から stripe_customer_id を引いて、
// その顧客の解約・プラン変更・領収書ダウンロードができる Stripe ホスト画面の URL を返す。

// @ts-expect-error Deno runtime import
import Stripe from 'https://esm.sh/stripe@18?target=denonext';
// @ts-expect-error Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// @ts-expect-error Deno global
const env = Deno.env;

const stripe = new Stripe(env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2025-10-30',
  httpClient: Stripe.createFetchHttpClient(),
});

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (authHeader === null) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(env.get('SUPABASE_URL') ?? '', env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError !== null || userData.user === null) {
    return new Response(JSON.stringify({ error: 'invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub === null || sub.stripe_customer_id === null) {
    return new Response(JSON.stringify({ error: 'no subscription found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: env.get('APP_URL') ?? 'http://localhost:8081',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
