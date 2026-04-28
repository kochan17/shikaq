// レッスン本文を ElevenLabs TTS で音声化 → Supabase Storage の audio バケットに保存
// → lessons.audio_storage_path / duration_seconds を更新。
// admin role のみ呼び出し可能。

// @ts-expect-error Deno runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// @ts-expect-error Deno global
const env = Deno.env;

const ELEVENLABS_API_KEY = env.get('ELEVENLABS_API_KEY') ?? '';
const ELEVENLABS_VOICE_ID = env.get('ELEVENLABS_VOICE_ID') ?? '21m00Tcm4TlvDq8ikWAM';

const SUPABASE_URL = env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (ELEVENLABS_API_KEY === '') {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

  const body = (await req.json()) as { lessonId?: string };
  if (typeof body.lessonId !== 'string') {
    return new Response(JSON.stringify({ error: 'lessonId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: lesson, error: lessonError } = await admin
    .from('lessons')
    .select('id, title, body')
    .eq('id', body.lessonId)
    .single();

  if (lessonError !== null || lesson === null) {
    return new Response(JSON.stringify({ error: 'lesson not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const text = `${lesson.title as string}\n\n${(lesson.body as string | null) ?? ''}`.trim();
  if (text === '') {
    return new Response(JSON.stringify({ error: 'lesson has empty body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ElevenLabs TTS
  const tts = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!tts.ok) {
    const detail = await tts.text();
    return new Response(JSON.stringify({ error: 'elevenlabs failed', detail }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const audioBuffer = new Uint8Array(await tts.arrayBuffer());

  // Storage に保存
  const path = `lessons/${lesson.id}.mp3`;
  const { error: uploadError } = await admin.storage
    .from('audio')
    .upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError !== null) {
    return new Response(JSON.stringify({ error: 'upload failed', detail: uploadError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 音声長は概算 (1分あたり 200 文字を目安)
  const estimated = Math.max(30, Math.round((text.length / 200) * 60));

  await admin
    .from('lessons')
    .update({ audio_storage_path: path, duration_seconds: estimated })
    .eq('id', lesson.id);

  const { data: publicUrl } = admin.storage.from('audio').getPublicUrl(path);

  return new Response(
    JSON.stringify({
      path,
      url: publicUrl.publicUrl,
      duration_seconds: estimated,
      bytes: audioBuffer.length,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
