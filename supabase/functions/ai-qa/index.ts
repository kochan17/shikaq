// AI Q&A Edge Function — DeepSeek の chat completions を呼んで回答を返す。
// .env (function-scoped):
//   DEEPSEEK_API_KEY - sk-...
// 認証: Authorization ヘッダの Supabase JWT を検証して user_id を取得。
// 履歴保存はクライアント側 (askAI) が行う。

// @ts-expect-error Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// @ts-expect-error Deno global
const env = Deno.env;

const DEEPSEEK_API_KEY = env.get('DEEPSEEK_API_KEY') ?? '';
const SUPABASE_URL = env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = env.get('SUPABASE_ANON_KEY') ?? '';

const SYSTEM_PROMPT = `あなたは Que という日本の資格学習サービスの学習支援 AI です。
対象資格は IT パスポート / 基本情報技術者 / SPI / 簿記2級。
ユーザーは 20 代の社会人で、丁寧で分かりやすい日本語で回答します。
冗長な前置きや「お答えします」のような口上は省き、要点から入ってください。
コードや表が必要なら Markdown で簡潔に。回答は 400 字以内を目安にします。`;

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (DEEPSEEK_API_KEY === '') {
    return new Response(
      JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured on the server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ユーザー検証
  const authHeader = req.headers.get('Authorization');
  if (authHeader === null) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError !== null || userData.user === null) {
    return new Response(JSON.stringify({ error: 'invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = (await req.json()) as { question?: string };
  const question = body.question?.trim() ?? '';
  if (question === '') {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // DeepSeek chat completions (OpenAI 互換 API)
  const ds = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      temperature: 0.4,
      max_tokens: 800,
      stream: false,
    }),
  });

  if (!ds.ok) {
    const text = await ds.text();
    return new Response(JSON.stringify({ error: 'deepseek failed', detail: text }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const dsBody = (await ds.json()) as {
    choices: { message: { content: string } }[];
  };
  const answer = dsBody.choices?.[0]?.message?.content ?? '(no answer)';

  return new Response(JSON.stringify({ answer }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
