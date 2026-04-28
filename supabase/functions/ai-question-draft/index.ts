// レッスン本文から AI で 4 択問題の draft を生成して questions テーブルに insert。
// admin role のみ呼び出し可能（RLS で守る）。

// @ts-expect-error Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// @ts-expect-error Deno global
const env = Deno.env;
const DEEPSEEK_API_KEY = env.get('DEEPSEEK_API_KEY') ?? '';

const SYSTEM_PROMPT = `あなたは資格試験の問題作成者です。与えられたレッスン本文から、正答が1つの4択問題を1問作成してください。
出力は次の JSON フォーマットのみ（説明文や前置きなし）:
{
  "question_text": "問題文",
  "choices": [
    {"id":"a","text":"選択肢A"},
    {"id":"b","text":"選択肢B"},
    {"id":"c","text":"選択肢C"},
    {"id":"d","text":"選択肢D"}
  ],
  "correct_choice_id": "a",
  "explanation": "正解の根拠と他の選択肢が誤りである理由"
}
日本語で、丁寧かつ簡潔に書いてください。`;

interface DraftPayload {
  question_text: string;
  choices: { id: string; text: string }[];
  correct_choice_id: string;
  explanation: string;
}

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

  // admin チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profile === null || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = (await req.json()) as { lessonId?: string; lessonTitle?: string; lessonBody?: string };
  if (
    typeof body.lessonId !== 'string' ||
    typeof body.lessonTitle !== 'string' ||
    typeof body.lessonBody !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'lessonId, lessonTitle, lessonBody are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
        {
          role: 'user',
          content: `レッスンタイトル: ${body.lessonTitle}\n\nレッスン本文:\n${body.lessonBody}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 1200,
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

  const dsBody = (await ds.json()) as { choices: { message: { content: string } }[] };
  const raw = dsBody.choices?.[0]?.message?.content ?? '{}';

  let payload: DraftPayload;
  try {
    payload = JSON.parse(raw) as DraftPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid AI response', raw }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // service role 経由でテーブルに insert（RLS bypass）
  const admin = createClient(env.get('SUPABASE_URL') ?? '', env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { data: inserted, error: insertError } = await admin
    .from('questions')
    .insert({
      lesson_id: body.lessonId,
      format: 'multiple_choice',
      question_text: payload.question_text,
      choices: payload.choices,
      correct_choice_id: payload.correct_choice_id,
      explanation: payload.explanation,
      status: 'draft',
      order_index: 999,
    })
    .select('id')
    .single();

  if (insertError !== null) {
    return new Response(JSON.stringify({ error: 'insert failed', detail: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: inserted.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
