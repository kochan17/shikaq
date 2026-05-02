// Stripe Checkout セッション作成
// クライアントから POST → Stripe Checkout URL を返す
// .env (function-scoped):
//   STRIPE_SECRET_KEY    - sk_test_...
//   STRIPE_PRICE_ID      - 月額 ¥980 サブスクの Price ID
//   APP_URL              - http://localhost:8081 (dev) / https://que.app (prod)

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (authHeader === null) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ユーザーセッションから user_id / email を取得
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

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userData.user.email ?? undefined,
    line_items: [
      {
        price: env.get('STRIPE_PRICE_ID') ?? '',
        quantity: 1,
      },
    ],
    success_url: `${env.get('APP_URL') ?? ''}/?subscribed=true`,
    cancel_url: `${env.get('APP_URL') ?? ''}/?subscribed=false`,
    metadata: { user_id: userData.user.id },
    subscription_data: {
      metadata: { user_id: userData.user.id },
    },
    // 日本のインボイス制度対応 (税込み表記)
    automatic_tax: { enabled: true },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
