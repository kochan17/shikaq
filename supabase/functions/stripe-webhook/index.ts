// Stripe webhook handler — subscription state を public.subscriptions に同期する。
// .env (function-scoped):
//   STRIPE_SECRET_KEY        - sk_test_... or sk_live_...
//   STRIPE_WEBHOOK_SECRET    - whsec_... (Stripe Dashboard / Stripe CLI から取得)
//   SUPABASE_URL             - 自動で注入される
//   SUPABASE_SERVICE_ROLE_KEY - 自動で注入される

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

const supabase = createClient(
  env.get('SUPABASE_URL') ?? '',
  env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET') ?? '';

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  metadata: { user_id?: string };
}

async function upsertSubscription(sub: StripeSubscription): Promise<void> {
  if (sub.metadata.user_id === undefined) return;
  await supabase.from('subscriptions').upsert(
    {
      user_id: sub.metadata.user_id,
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      source: 'stripe',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );
}

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  let event: { type: string; data: { object: StripeSubscription } };
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
      headers: corsHeaders,
    });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await upsertSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', event.data.object.id);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
