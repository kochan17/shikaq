import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { supabase } from '../../lib/supabase/client';
import { generateQuestionDraft, generateLessonAudio } from '../../lib/supabase/queries';

type Tab = 'users' | 'certifications' | 'courses' | 'sections' | 'lessons' | 'questions';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'users', label: 'ユーザー', icon: 'group' },
  { key: 'certifications', label: '資格', icon: 'workspace_premium' },
  { key: 'courses', label: 'コース', icon: 'collections_bookmark' },
  { key: 'sections', label: 'セクション', icon: 'segment' },
  { key: 'lessons', label: 'レッスン', icon: 'menu_book' },
  { key: 'questions', label: '問題', icon: 'help' },
];

export function Admin(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      <View className="px-8 pt-8 pb-4 border-b border-black/5">
        <Text className="text-[28px] font-semibold text-label tracking-tight">Admin</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">
          コンテンツとユーザーをアプリ内から運営する画面
        </Text>
      </View>

      <View className="flex-row gap-1 px-8 pt-4 border-b border-black/5">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`flex-row items-center gap-2 px-4 py-2 rounded-t-lg ${
              tab === t.key ? 'bg-systemBackground border-b-2 border-systemBlue' : ''
            }`}
          >
            <MaterialIcon
              name={t.icon}
              fill={tab === t.key}
              size={16}
              className={tab === t.key ? 'text-systemBlue' : 'text-secondaryLabel'}
            />
            <Text
              className={`text-[13px] ${
                tab === t.key ? 'text-systemBlue font-semibold' : 'text-secondaryLabel'
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-1">
        {tab === 'users' && <AdminUsers />}
        {tab === 'certifications' && <AdminCertifications />}
        {tab === 'courses' && <AdminCourses />}
        {tab === 'sections' && <AdminSections />}
        {tab === 'lessons' && <AdminLessons />}
        {tab === 'questions' && <AdminQuestions />}
      </View>
    </View>
  );
}

// =============================================================
// Certifications
// =============================================================
interface CertRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: 'IT' | 'business';
  is_published: boolean;
  order_index: number;
}

function AdminCertifications(): React.ReactElement {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CertRow | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('certifications')
      .select('id, slug, name, description, category, is_published, order_index')
      .order('order_index');
    setRows((data ?? []) as CertRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (editing === null) return;
    await supabase
      .from('certifications')
      .update({
        name: editing.name,
        description: editing.description,
        is_published: editing.is_published,
      })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => setEditing(row)}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label">
              {row.name} <Text className="text-[11px] text-secondaryLabel">({row.slug})</Text>
            </Text>
            <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={2}>
              {row.description ?? '(説明なし)'}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.is_published ? 'bg-systemGreen/10' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                row.is_published ? 'text-systemGreen' : 'text-secondaryLabel'
              }`}
            >
              {row.is_published ? 'published' : 'draft'}
            </Text>
          </View>
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">資格編集</Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.name}
            onChangeText={(v) => setEditing({ ...editing, name: v })}
            placeholder="資格名"
          />
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            value={editing.description ?? ''}
            onChangeText={(v) => setEditing({ ...editing, description: v })}
            placeholder="説明"
            multiline
          />
          <Pressable
            onPress={() => setEditing({ ...editing, is_published: !editing.is_published })}
            className="flex-row items-center gap-2"
          >
            <MaterialIcon
              name={editing.is_published ? 'check_box' : 'check_box_outline_blank'}
              size={20}
              className="text-systemBlue"
            />
            <Text className="text-[14px] text-label">公開する</Text>
          </Pressable>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 bg-secondarySystemBackground rounded-full py-2 items-center"
            >
              <Text className="text-[14px] text-label">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              className="flex-1 bg-systemBlue rounded-full py-2 items-center"
            >
              <Text className="text-[14px] font-semibold text-white">保存</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================
// Sections
// =============================================================
interface SectionRow {
  id: string;
  course_id: string;
  title: string;
  is_published: boolean;
  order_index: number;
}

function AdminSections(): React.ReactElement {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SectionRow | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('sections')
      .select('id, course_id, title, is_published, order_index')
      .order('order_index');
    setRows((data ?? []) as SectionRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (editing === null) return;
    await supabase
      .from('sections')
      .update({ title: editing.title, is_published: editing.is_published })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => setEditing(row)}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label">{row.title}</Text>
            <Text className="text-[11px] text-secondaryLabel mt-0.5" numberOfLines={1}>
              order_index: {row.order_index}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.is_published ? 'bg-systemGreen/10' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                row.is_published ? 'text-systemGreen' : 'text-secondaryLabel'
              }`}
            >
              {row.is_published ? 'published' : 'draft'}
            </Text>
          </View>
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">セクション編集</Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="セクション名"
          />
          <Pressable
            onPress={() => setEditing({ ...editing, is_published: !editing.is_published })}
            className="flex-row items-center gap-2"
          >
            <MaterialIcon
              name={editing.is_published ? 'check_box' : 'check_box_outline_blank'}
              size={20}
              className="text-systemBlue"
            />
            <Text className="text-[14px] text-label">公開する</Text>
          </Pressable>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 bg-secondarySystemBackground rounded-full py-2 items-center"
            >
              <Text className="text-[14px] text-label">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              className="flex-1 bg-systemBlue rounded-full py-2 items-center"
            >
              <Text className="text-[14px] font-semibold text-white">保存</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================
// Users
// =============================================================
interface ProfileRow {
  id: string;
  display_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

function AdminUsers(): React.ReactElement {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role, created_at')
      .order('created_at', { ascending: false });
    setRows((data ?? []) as ProfileRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleRole(row: ProfileRow): Promise<void> {
    const next = row.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: next }).eq('id', row.id);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <View
          key={row.id}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1 min-w-0">
            <Text className="text-[14px] font-semibold text-label" numberOfLines={1}>
              {row.display_name ?? '(無名)'}
            </Text>
            <Text className="text-[11px] text-secondaryLabel" numberOfLines={1}>
              {row.id}
            </Text>
          </View>
          <Pressable
            onPress={() => void toggleRole(row)}
            className={`px-3 py-1 rounded-full ${
              row.role === 'admin' ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[12px] font-semibold ${
                row.role === 'admin' ? 'text-white' : 'text-secondaryLabel'
              }`}
            >
              {row.role === 'admin' ? 'admin' : 'user'}
            </Text>
          </Pressable>
        </View>
      ))}
      {rows.length === 0 && (
        <Text className="text-[13px] text-secondaryLabel text-center mt-8">
          ユーザーがまだいません
        </Text>
      )}
    </ScrollView>
  );
}

// =============================================================
// Courses
// =============================================================
interface CourseRow {
  id: string;
  certification_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
}

function AdminCourses(): React.ReactElement {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CourseRow | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('id, certification_id, title, description, is_published')
      .order('order_index');
    setRows((data ?? []) as CourseRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (editing === null) return;
    await supabase
      .from('courses')
      .update({
        title: editing.title,
        description: editing.description,
        is_published: editing.is_published,
      })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => setEditing(row)}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label" numberOfLines={1}>
              {row.title}
            </Text>
            <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={2}>
              {row.description ?? '(説明なし)'}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.is_published ? 'bg-systemGreen/10' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                row.is_published ? 'text-systemGreen' : 'text-secondaryLabel'
              }`}
            >
              {row.is_published ? 'published' : 'draft'}
            </Text>
          </View>
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">編集</Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="タイトル"
          />
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            value={editing.description ?? ''}
            onChangeText={(v) => setEditing({ ...editing, description: v })}
            placeholder="説明"
            multiline
          />
          <Pressable
            onPress={() => setEditing({ ...editing, is_published: !editing.is_published })}
            className="flex-row items-center gap-2"
          >
            <MaterialIcon
              name={editing.is_published ? 'check_box' : 'check_box_outline_blank'}
              size={20}
              className="text-systemBlue"
            />
            <Text className="text-[14px] text-label">公開する</Text>
          </Pressable>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 bg-secondarySystemBackground rounded-full py-2 items-center"
            >
              <Text className="text-[14px] text-label">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              className="flex-1 bg-systemBlue rounded-full py-2 items-center"
            >
              <Text className="text-[14px] font-semibold text-white">保存</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================
// Lessons
// =============================================================
interface LessonRow {
  id: string;
  section_id: string;
  title: string;
  body: string | null;
  is_published: boolean;
}

function AdminLessons(): React.ReactElement {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LessonRow | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);

  async function generate(): Promise<void> {
    if (editing === null) return;
    setAiBusy(true);
    setAiMessage(null);
    try {
      await generateQuestionDraft({
        lessonId: editing.id,
        lessonTitle: editing.title,
        lessonBody: editing.body ?? '',
      });
      setAiMessage('問題 draft を生成しました（「問題」タブで draft 状態を確認・公開してください）');
    } catch (e) {
      setAiMessage(e instanceof Error ? `生成失敗: ${e.message}` : '生成失敗');
    } finally {
      setAiBusy(false);
    }
  }

  async function generateAudio(): Promise<void> {
    if (editing === null) return;
    setAudioBusy(true);
    setAudioMessage(null);
    try {
      const r = await generateLessonAudio(editing.id);
      setAudioMessage(`音声を生成しました（${r.duration_seconds} 秒、Audio 画面で再生できます）`);
      await load();
    } catch (e) {
      setAudioMessage(e instanceof Error ? `音声生成失敗: ${e.message}` : '音声生成失敗');
    } finally {
      setAudioBusy(false);
    }
  }

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('lessons')
      .select('id, section_id, title, body, is_published')
      .order('order_index');
    setRows((data ?? []) as LessonRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (editing === null) return;
    await supabase
      .from('lessons')
      .update({
        title: editing.title,
        body: editing.body,
        is_published: editing.is_published,
      })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => setEditing(row)}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label" numberOfLines={1}>
              {row.title}
            </Text>
            <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={2}>
              {row.body?.slice(0, 80) ?? '(本文なし)'}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.is_published ? 'bg-systemGreen/10' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                row.is_published ? 'text-systemGreen' : 'text-secondaryLabel'
              }`}
            >
              {row.is_published ? 'published' : 'draft'}
            </Text>
          </View>
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <Text className="text-[13px] font-semibold text-secondaryLabel">レッスン編集</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => void generate()}
                disabled={aiBusy}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-fe/10"
              >
                <MaterialIcon
                  name={aiBusy ? 'hourglass_empty' : 'auto_awesome'}
                  size={14}
                  className="text-fe"
                />
                <Text className="text-[12px] font-semibold text-fe">
                  {aiBusy ? '生成中…' : 'AI で問題を作る'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void generateAudio()}
                disabled={audioBusy}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-systemIndigo/10"
              >
                <MaterialIcon
                  name={audioBusy ? 'hourglass_empty' : 'graphic_eq'}
                  size={14}
                  className="text-systemIndigo"
                />
                <Text className="text-[12px] font-semibold text-systemIndigo">
                  {audioBusy ? '生成中…' : '音声を生成'}
                </Text>
              </Pressable>
            </View>
          </View>
          {aiMessage !== null && <Text className="text-[12px] text-systemBlue">{aiMessage}</Text>}
          {audioMessage !== null && (
            <Text className="text-[12px] text-systemIndigo">{audioMessage}</Text>
          )}
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="レッスンタイトル"
          />
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 240, textAlignVertical: 'top' }}
            value={editing.body ?? ''}
            onChangeText={(v) => setEditing({ ...editing, body: v })}
            placeholder="本文 (Markdown)"
            multiline
          />
          <Pressable
            onPress={() => setEditing({ ...editing, is_published: !editing.is_published })}
            className="flex-row items-center gap-2"
          >
            <MaterialIcon
              name={editing.is_published ? 'check_box' : 'check_box_outline_blank'}
              size={20}
              className="text-systemBlue"
            />
            <Text className="text-[14px] text-label">公開する</Text>
          </Pressable>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 bg-secondarySystemBackground rounded-full py-2 items-center"
            >
              <Text className="text-[14px] text-label">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              className="flex-1 bg-systemBlue rounded-full py-2 items-center"
            >
              <Text className="text-[14px] font-semibold text-white">保存</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================
// Questions
// =============================================================
interface QuestionRow {
  id: string;
  lesson_id: string;
  question_text: string;
  explanation: string | null;
  status: 'draft' | 'published';
}

function AdminQuestions(): React.ReactElement {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionRow | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('id, lesson_id, question_text, explanation, status')
      .order('created_at', { ascending: false });
    setRows((data ?? []) as QuestionRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (editing === null) return;
    await supabase
      .from('questions')
      .update({
        question_text: editing.question_text,
        explanation: editing.explanation,
        status: editing.status,
      })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => setEditing(row)}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label" numberOfLines={2}>
              {row.question_text}
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.status === 'published' ? 'bg-systemGreen/10' : 'bg-systemOrange/10'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                row.status === 'published' ? 'text-systemGreen' : 'text-systemOrange'
              }`}
            >
              {row.status}
            </Text>
          </View>
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">問題編集</Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            value={editing.question_text}
            onChangeText={(v) => setEditing({ ...editing, question_text: v })}
            placeholder="問題文"
            multiline
          />
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            value={editing.explanation ?? ''}
            onChangeText={(v) => setEditing({ ...editing, explanation: v })}
            placeholder="解説"
            multiline
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                setEditing({
                  ...editing,
                  status: editing.status === 'published' ? 'draft' : 'published',
                })
              }
              className={`px-4 py-1.5 rounded-full ${
                editing.status === 'published' ? 'bg-systemGreen' : 'bg-systemOrange'
              }`}
            >
              <Text className="text-[12px] font-semibold text-white">{editing.status}</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setEditing(null)}
              className="flex-1 bg-secondarySystemBackground rounded-full py-2 items-center"
            >
              <Text className="text-[14px] text-label">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={() => void save()}
              className="flex-1 bg-systemBlue rounded-full py-2 items-center"
            >
              <Text className="text-[14px] font-semibold text-white">保存</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
