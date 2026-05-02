import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { useAuth } from '../AuthProvider';
import { supabase } from '../../lib/supabase/client';
import {
  fetchAdminStats,
  generateQuestionDraft,
  generateLessonAudio,
  listAdminQuestions,
  upsertQuestion,
  publishQuestion,
  deleteQuestion,
  listAdminLessons,
  upsertLesson,
  listAdminSections,
  upsertSection,
  listAdminCourses,
  upsertCourse,
  type AdminStats,
  type AdminQuestion,
  type AdminLesson,
} from '../../lib/supabase/queries';

type Tab = 'dashboard' | 'users' | 'certifications' | 'courses' | 'sections' | 'lessons' | 'questions';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'ダッシュボード', icon: 'dashboard' },
  { key: 'users', label: 'ユーザー', icon: 'group' },
  { key: 'certifications', label: '資格', icon: 'workspace_premium' },
  { key: 'courses', label: 'コース', icon: 'collections_bookmark' },
  { key: 'sections', label: 'セクション', icon: 'segment' },
  { key: 'lessons', label: 'レッスン', icon: 'menu_book' },
  { key: 'questions', label: '問題', icon: 'help' },
];

export function Admin(): React.ReactElement {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (profile?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-systemGroupedBackground">
        <MaterialIcon name="lock" size={40} className="text-secondaryLabel" />
        <Text className="text-[17px] font-semibold text-label">管理者専用エリア</Text>
        <Text className="text-[14px] text-secondaryLabel text-center px-8">
          このページにアクセスする権限がありません
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      <View className="px-8 pt-8 pb-4 border-b border-black/5">
        <Text className="text-[28px] font-semibold text-label tracking-tight">Admin</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">
          コンテンツとユーザーをアプリ内から運営する
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-black/5"
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 4, gap: 2 }}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-t-lg ${
              tab === t.key ? 'bg-systemBackground border-b-2 border-systemBlue' : ''
            }`}
          >
            <MaterialIcon
              name={t.icon}
              fill={tab === t.key}
              size={15}
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
      </ScrollView>

      <View className="flex-1">
        {tab === 'dashboard' && <AdminDashboard onNavigate={setTab} />}
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
// Dashboard
// =============================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  onPress?: () => void;
}

function StatCard({ label, value, icon, color, onPress }: StatCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className="bg-systemBackground rounded-2xl hairline-border p-5 flex-1 min-w-[140px] gap-2"
    >
      <MaterialIcon name={icon} fill size={22} className={color} />
      <Text className="text-[28px] font-bold text-label tracking-tight">{value}</Text>
      <Text className="text-[12px] text-secondaryLabel">{label}</Text>
    </Pressable>
  );
}

function AdminDashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }): React.ReactElement {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchAdminStats();
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || stats === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 16 }}>
      <Text className="text-[13px] font-semibold text-secondaryLabel uppercase tracking-wider">
        コンテンツ集計
      </Text>
      <View className="flex-row flex-wrap gap-3">
        <StatCard
          label="資格"
          value={stats.certifications}
          icon="workspace_premium"
          color="text-systemOrange"
          onPress={() => onNavigate('certifications')}
        />
        <StatCard
          label="コース"
          value={stats.courses}
          icon="collections_bookmark"
          color="text-systemBlue"
          onPress={() => onNavigate('courses')}
        />
        <StatCard
          label="セクション"
          value={stats.sections}
          icon="segment"
          color="text-systemIndigo"
          onPress={() => onNavigate('sections')}
        />
        <StatCard
          label="レッスン"
          value={stats.lessons}
          icon="menu_book"
          color="text-systemTeal"
          onPress={() => onNavigate('lessons')}
        />
      </View>

      <Text className="text-[13px] font-semibold text-secondaryLabel uppercase tracking-wider mt-2">
        問題ストック
      </Text>
      <View className="flex-row gap-3">
        <StatCard
          label="draft"
          value={stats.questions_draft}
          icon="edit_note"
          color="text-systemOrange"
          onPress={() => onNavigate('questions')}
        />
        <StatCard
          label="published"
          value={stats.questions_published}
          icon="check_circle"
          color="text-systemGreen"
          onPress={() => onNavigate('questions')}
        />
      </View>
    </ScrollView>
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
  category: string;
  is_published: boolean;
  order_index: number;
}

function AdminCertifications(): React.ReactElement {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CertRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('certifications')
      .select('id, slug, name, description, category, is_published, order_index')
      .order('order_index');
    setRows((data ?? []) as CertRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
              {row.name}{' '}
              <Text className="text-[11px] text-secondaryLabel">({row.slug})</Text>
            </Text>
            <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={2}>
              {row.description ?? '(説明なし)'}
            </Text>
          </View>
          <StatusBadge published={row.is_published} />
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
          <PublishToggle
            value={editing.is_published}
            onChange={(v) => setEditing({ ...editing, is_published: v })}
          />
          <FormActions onCancel={() => setEditing(null)} onSave={() => void save()} />
        </View>
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
  order_index: number;
}

function AdminCourses(): React.ReactElement {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [certs, setCerts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [coursesRes, certsRes] = await Promise.all([
      listAdminCourses(),
      supabase.from('certifications').select('id, name').order('order_index'),
    ]);
    setRows(coursesRes);
    setCerts((certsRes.data ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (editing === null) return;
    await upsertCourse({
      id: creating ? undefined : editing.id,
      certification_id: editing.certification_id,
      title: editing.title,
      description: editing.description,
      is_published: editing.is_published,
      order_index: editing.order_index,
    });
    setEditing(null);
    setCreating(false);
    await load();
  }

  const blankCourse = (): CourseRow => ({
    id: '',
    certification_id: certs[0]?.id ?? '',
    title: '',
    description: null,
    is_published: false,
    order_index: rows.length,
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      <CreateButton
        label="新規コース"
        onPress={() => {
          setEditing(blankCourse());
          setCreating(true);
        }}
      />

      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => {
            setEditing(row);
            setCreating(false);
          }}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label" numberOfLines={1}>
              {row.title}
            </Text>
            <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={1}>
              {certs.find((c) => c.id === row.certification_id)?.name ?? row.certification_id}
            </Text>
          </View>
          <StatusBadge published={row.is_published} />
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">
            {creating ? '新規コース' : 'コース編集'}
          </Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="タイトル"
          />
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[14px] text-label"
            value={editing.description ?? ''}
            onChangeText={(v) => setEditing({ ...editing, description: v || null })}
            placeholder="説明"
            multiline
          />
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">資格</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              <View className="flex-row gap-2">
                {certs.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setEditing({ ...editing, certification_id: c.id })}
                    className={`px-3 py-1.5 rounded-full ${
                      editing.certification_id === c.id
                        ? 'bg-systemBlue'
                        : 'bg-secondarySystemBackground'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        editing.certification_id === c.id ? 'text-white' : 'text-secondaryLabel'
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <PublishToggle
            value={editing.is_published}
            onChange={(v) => setEditing({ ...editing, is_published: v })}
          />
          <FormActions onCancel={() => { setEditing(null); setCreating(false); }} onSave={() => void save()} />
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
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sectionRows, coursesRes] = await Promise.all([
      listAdminSections(),
      supabase.from('courses').select('id, title').order('order_index'),
    ]);
    setRows(sectionRows);
    setCourses((coursesRes.data ?? []) as { id: string; title: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (editing === null) return;
    await upsertSection({
      id: creating ? undefined : editing.id,
      course_id: editing.course_id,
      title: editing.title,
      is_published: editing.is_published,
      order_index: editing.order_index,
    });
    setEditing(null);
    setCreating(false);
    await load();
  }

  const blankSection = (): SectionRow => ({
    id: '',
    course_id: courses[0]?.id ?? '',
    title: '',
    is_published: false,
    order_index: rows.length,
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
      <CreateButton
        label="新規セクション"
        onPress={() => {
          setEditing(blankSection());
          setCreating(true);
        }}
      />

      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={() => {
            setEditing(row);
            setCreating(false);
          }}
          className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
        >
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-label">{row.title}</Text>
            <Text className="text-[11px] text-secondaryLabel mt-0.5" numberOfLines={1}>
              {courses.find((c) => c.id === row.course_id)?.title ?? row.course_id}
            </Text>
          </View>
          <StatusBadge published={row.is_published} />
        </Pressable>
      ))}

      {editing !== null && (
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 mt-4 gap-3">
          <Text className="text-[13px] font-semibold text-secondaryLabel">
            {creating ? '新規セクション' : 'セクション編集'}
          </Text>
          <TextInput
            className="bg-secondarySystemBackground rounded-lg px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="セクション名"
          />
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">コース</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {courses.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setEditing({ ...editing, course_id: c.id })}
                    className={`px-3 py-1.5 rounded-full ${
                      editing.course_id === c.id ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        editing.course_id === c.id ? 'text-white' : 'text-secondaryLabel'
                      }`}
                      numberOfLines={1}
                    >
                      {c.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <PublishToggle
            value={editing.is_published}
            onChange={(v) => setEditing({ ...editing, is_published: v })}
          />
          <FormActions onCancel={() => { setEditing(null); setCreating(false); }} onSave={() => void save()} />
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

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role, created_at')
      .order('created_at', { ascending: false });
    setRows((data ?? []) as ProfileRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
// Lessons
// =============================================================

function AdminLessons(): React.ReactElement {
  const [rows, setRows] = useState<AdminLesson[]>([]);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminLesson | null>(null);
  const [creating, setCreating] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [lessonRows, sectionsRes] = await Promise.all([
      listAdminLessons({ search }),
      supabase.from('sections').select('id, title').order('order_index'),
    ]);
    setRows(lessonRows);
    setSections((sectionsRes.data ?? []) as { id: string; title: string }[]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (editing === null) return;
    await upsertLesson({
      id: creating ? undefined : editing.id,
      section_id: editing.section_id,
      title: editing.title,
      body: editing.body,
      content_type: editing.content_type,
      is_published: editing.is_published,
    });
    setEditing(null);
    setCreating(false);
    await load();
  }

  async function generateAI(): Promise<void> {
    if (editing === null) return;
    setAiBusy(true);
    setAiMessage(null);
    try {
      await generateQuestionDraft({
        lessonId: editing.id,
        lessonTitle: editing.title,
        lessonBody: editing.body ?? '',
      });
      setAiMessage('問題 draft を生成しました（「問題」タブで確認・公開してください）');
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
      setAudioMessage(`音声を生成しました（${r.duration_seconds} 秒）`);
      await load();
    } catch (e) {
      setAudioMessage(e instanceof Error ? `音声生成失敗: ${e.message}` : '音声生成失敗');
    } finally {
      setAudioBusy(false);
    }
  }

  const blankLesson = (): AdminLesson => ({
    id: '',
    section_id: sections[0]?.id ?? '',
    title: '',
    body: null,
    content_type: 'text',
    is_published: false,
    order_index: rows.length,
  });

  const CONTENT_TYPES: AdminLesson['content_type'][] = ['text', 'video', 'audio', 'quiz'];

  return (
    <View className="flex-1">
      <View className="px-8 py-3 border-b border-black/5 flex-row gap-3 items-center">
        <View className="flex-1 flex-row items-center gap-2 bg-secondarySystemBackground rounded-xl px-3 py-2">
          <MaterialIcon name="search" size={16} className="text-secondaryLabel" />
          <TextInput
            className="flex-1 text-[14px] text-label"
            value={search}
            onChangeText={setSearch}
            placeholder="タイトルで検索"
            returnKeyType="search"
          />
        </View>
        <CreateButton label="新規" onPress={() => { setEditing(blankLesson()); setCreating(true); }} compact />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => { setEditing(row); setCreating(false); setAiMessage(null); setAudioMessage(null); }}
              className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-center gap-4"
            >
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-label" numberOfLines={1}>
                  {row.title}
                </Text>
                <Text className="text-[12px] text-secondaryLabel mt-0.5" numberOfLines={1}>
                  {row.body?.slice(0, 60) ?? '(本文なし)'}
                </Text>
              </View>
              <View className="items-end gap-1">
                <StatusBadge published={row.is_published} />
                <Text className="text-[10px] text-tertiaryLabel">{row.content_type}</Text>
              </View>
            </Pressable>
          ))}
          {rows.length === 0 && (
            <Text className="text-[13px] text-secondaryLabel text-center mt-8">
              レッスンが見つかりません
            </Text>
          )}
        </ScrollView>
      )}

      {editing !== null && (
        <ScrollView
          className="absolute inset-x-0 bottom-0 top-16 bg-systemGroupedBackground"
          contentContainerStyle={{ padding: 32, gap: 12 }}
        >
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <Text className="text-[16px] font-semibold text-label">
              {creating ? '新規レッスン' : 'レッスン編集'}
            </Text>
            {!creating && (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => void generateAI()}
                  disabled={aiBusy}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-fe/10"
                >
                  <MaterialIcon
                    name={aiBusy ? 'hourglass_empty' : 'auto_awesome'}
                    size={14}
                    className="text-fe"
                  />
                  <Text className="text-[12px] font-semibold text-fe">
                    {aiBusy ? '生成中…' : 'AI 問題'}
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
                    {audioBusy ? '生成中…' : '音声生成'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          {aiMessage !== null && (
            <Text className="text-[12px] text-systemBlue">{aiMessage}</Text>
          )}
          {audioMessage !== null && (
            <Text className="text-[12px] text-systemIndigo">{audioMessage}</Text>
          )}

          <TextInput
            className="bg-systemBackground rounded-xl hairline-border px-4 py-3 text-[15px] text-label"
            value={editing.title}
            onChangeText={(v) => setEditing({ ...editing, title: v })}
            placeholder="レッスンタイトル"
          />

          {/* セクション選択 */}
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">セクション</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {sections.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setEditing({ ...editing, section_id: s.id })}
                    className={`px-3 py-1.5 rounded-full ${
                      editing.section_id === s.id ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        editing.section_id === s.id ? 'text-white' : 'text-secondaryLabel'
                      }`}
                      numberOfLines={1}
                    >
                      {s.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* content_type 選択 */}
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">コンテンツ種別</Text>
            <View className="flex-row gap-2">
              {CONTENT_TYPES.map((ct) => (
                <Pressable
                  key={ct}
                  onPress={() => setEditing({ ...editing, content_type: ct })}
                  className={`px-3 py-1.5 rounded-full ${
                    editing.content_type === ct ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
                  }`}
                >
                  <Text
                    className={`text-[12px] font-semibold ${
                      editing.content_type === ct ? 'text-white' : 'text-secondaryLabel'
                    }`}
                  >
                    {ct}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            className="bg-systemBackground rounded-xl hairline-border px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 240, textAlignVertical: 'top' }}
            value={editing.body ?? ''}
            onChangeText={(v) => setEditing({ ...editing, body: v || null })}
            placeholder="本文 (Markdown)"
            multiline
          />
          <PublishToggle
            value={editing.is_published}
            onChange={(v) => setEditing({ ...editing, is_published: v })}
          />
          <FormActions
            onCancel={() => { setEditing(null); setCreating(false); }}
            onSave={() => void save()}
          />
        </ScrollView>
      )}
    </View>
  );
}

// =============================================================
// Questions
// =============================================================

type QuestionStatusFilter = 'all' | 'draft' | 'published';

const DEFAULT_CHOICES: { id: string; text: string }[] = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
];

function AdminQuestions(): React.ReactElement {
  const [rows, setRows] = useState<AdminQuestion[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuestionStatusFilter>('all');
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiDraftBusy, setAiDraftBusy] = useState(false);
  const [aiDraftMessage, setAiDraftMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [questionRows, lessonsRes] = await Promise.all([
      listAdminQuestions({
        status: statusFilter === 'all' ? null : statusFilter,
        search,
        limit: 100,
      }),
      supabase.from('lessons').select('id, title').order('order_index').limit(200),
    ]);
    setRows(questionRows);
    setLessons((lessonsRes.data ?? []) as { id: string; title: string }[]);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (editing === null) return;
    setSaving(true);
    try {
      await upsertQuestion({
        id: creating ? undefined : editing.id,
        lesson_id: editing.lesson_id,
        question_text: editing.question_text,
        choices: editing.choices,
        correct_choice_id: editing.correct_choice_id,
        explanation: editing.explanation,
        format: editing.format,
        status: editing.status,
      });
      setEditing(null);
      setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string): Promise<void> {
    await publishQuestion(id);
    await load();
  }

  async function handleDelete(id: string): Promise<void> {
    await deleteQuestion(id);
    if (editing?.id === id) {
      setEditing(null);
      setCreating(false);
    }
    await load();
  }

  async function generateAIDraft(): Promise<void> {
    if (editing === null) return;
    const lesson = lessons.find((l) => l.id === editing.lesson_id);
    if (lesson === undefined) return;
    setAiDraftBusy(true);
    setAiDraftMessage(null);
    try {
      await generateQuestionDraft({
        lessonId: editing.lesson_id,
        lessonTitle: lesson.title,
        lessonBody: '',
      });
      setAiDraftMessage('AI draft を生成しました。問題一覧をリロードしてください。');
      await load();
    } catch (e) {
      setAiDraftMessage(e instanceof Error ? `生成失敗: ${e.message}` : '生成失敗');
    } finally {
      setAiDraftBusy(false);
    }
  }

  const blankQuestion = (): AdminQuestion => ({
    id: '',
    lesson_id: lessons[0]?.id ?? '',
    question_text: '',
    choices: DEFAULT_CHOICES.map((c) => ({ ...c })),
    correct_choice_id: 'a',
    explanation: null,
    format: 'multiple_choice',
    status: 'draft',
    order_index: rows.length,
    created_at: new Date().toISOString(),
  });

  const STATUS_FILTERS: { key: QuestionStatusFilter; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'draft', label: 'draft' },
    { key: 'published', label: 'published' },
  ];

  const FORMATS: AdminQuestion['format'][] = ['multiple_choice', 'written', 'cbt'];

  return (
    <View className="flex-1">
      {/* ツールバー */}
      <View className="px-8 py-3 border-b border-black/5 gap-2">
        <View className="flex-row gap-2 items-center">
          <View className="flex-1 flex-row items-center gap-2 bg-secondarySystemBackground rounded-xl px-3 py-2">
            <MaterialIcon name="search" size={16} className="text-secondaryLabel" />
            <TextInput
              className="flex-1 text-[14px] text-label"
              value={search}
              onChangeText={setSearch}
              placeholder="問題文で検索"
              returnKeyType="search"
            />
          </View>
          <CreateButton
            label="新規"
            onPress={() => {
              setEditing(blankQuestion());
              setCreating(true);
              setAiDraftMessage(null);
            }}
            compact
          />
        </View>
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-full ${
                statusFilter === f.key ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
              }`}
            >
              <Text
                className={`text-[12px] font-semibold ${
                  statusFilter === f.key ? 'text-white' : 'text-secondaryLabel'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
          <Text className="text-[12px] text-tertiaryLabel self-center ml-2">
            {rows.length} 件
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => {
                setEditing(row);
                setCreating(false);
                setAiDraftMessage(null);
              }}
              className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-start gap-4"
            >
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-label" numberOfLines={3}>
                  {row.question_text}
                </Text>
                <Text className="text-[11px] text-secondaryLabel mt-1">
                  {row.choices.length} 選択肢 · {row.format}
                </Text>
              </View>
              <View className="items-end gap-2">
                <QuestionStatusBadge status={row.status} />
                {row.status === 'draft' && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      void handlePublish(row.id);
                    }}
                    className="px-2 py-0.5 rounded-full bg-systemGreen/10"
                  >
                    <Text className="text-[10px] font-semibold text-systemGreen">公開</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          ))}
          {rows.length === 0 && (
            <Text className="text-[13px] text-secondaryLabel text-center mt-8">
              問題が見つかりません
            </Text>
          )}
        </ScrollView>
      )}

      {/* 編集パネル — 絶対配置でオーバーレイ */}
      {editing !== null && (
        <ScrollView
          className="absolute inset-x-0 bottom-0 top-16 bg-systemGroupedBackground"
          contentContainerStyle={{ padding: 32, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-semibold text-label">
              {creating ? '新規問題' : '問題編集'}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => void generateAIDraft()}
                disabled={aiDraftBusy}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-fe/10"
              >
                <MaterialIcon
                  name={aiDraftBusy ? 'hourglass_empty' : 'auto_awesome'}
                  size={14}
                  className="text-fe"
                />
                <Text className="text-[12px] font-semibold text-fe">
                  {aiDraftBusy ? '生成中…' : 'AI draft'}
                </Text>
              </Pressable>
              {!creating && (
                <Pressable
                  onPress={() => void handleDelete(editing.id)}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-systemRed/10"
                >
                  <MaterialIcon name="delete" size={14} className="text-systemRed" />
                  <Text className="text-[12px] font-semibold text-systemRed">削除</Text>
                </Pressable>
              )}
            </View>
          </View>

          {aiDraftMessage !== null && (
            <Text className="text-[12px] text-systemBlue">{aiDraftMessage}</Text>
          )}

          {/* レッスン選択 */}
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">レッスン</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {lessons.map((l) => (
                  <Pressable
                    key={l.id}
                    onPress={() => setEditing({ ...editing, lesson_id: l.id })}
                    className={`px-3 py-1.5 rounded-full ${
                      editing.lesson_id === l.id ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        editing.lesson_id === l.id ? 'text-white' : 'text-secondaryLabel'
                      }`}
                      numberOfLines={1}
                    >
                      {l.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* format 選択 */}
          <View className="gap-1">
            <Text className="text-[12px] text-secondaryLabel">形式</Text>
            <View className="flex-row gap-2">
              {FORMATS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setEditing({ ...editing, format: f })}
                  className={`px-3 py-1.5 rounded-full ${
                    editing.format === f ? 'bg-systemBlue' : 'bg-secondarySystemBackground'
                  }`}
                >
                  <Text
                    className={`text-[12px] font-semibold ${
                      editing.format === f ? 'text-white' : 'text-secondaryLabel'
                    }`}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 問題文 */}
          <TextInput
            className="bg-systemBackground rounded-xl hairline-border px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            value={editing.question_text}
            onChangeText={(v) => setEditing({ ...editing, question_text: v })}
            placeholder="問題文"
            multiline
          />

          {/* 選択肢 */}
          {editing.format === 'multiple_choice' && (
            <View className="gap-2">
              <Text className="text-[12px] text-secondaryLabel">選択肢</Text>
              {editing.choices.map((choice, idx) => (
                <View key={choice.id} className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() =>
                      setEditing({ ...editing, correct_choice_id: choice.id })
                    }
                    className={`w-7 h-7 rounded-full items-center justify-center ${
                      editing.correct_choice_id === choice.id
                        ? 'bg-systemGreen'
                        : 'bg-secondarySystemBackground'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-bold ${
                        editing.correct_choice_id === choice.id
                          ? 'text-white'
                          : 'text-secondaryLabel'
                      }`}
                    >
                      {choice.id.toUpperCase()}
                    </Text>
                  </Pressable>
                  <TextInput
                    className="flex-1 bg-systemBackground rounded-xl hairline-border px-3 py-2.5 text-[14px] text-label"
                    value={choice.text}
                    onChangeText={(v) => {
                      const next = editing.choices.map((c, i) =>
                        i === idx ? { ...c, text: v } : c
                      );
                      setEditing({ ...editing, choices: next });
                    }}
                    placeholder={`選択肢 ${choice.id.toUpperCase()}`}
                  />
                </View>
              ))}
              <Text className="text-[11px] text-secondaryLabel">
                ※ 緑のボタンで正解をマーク
              </Text>
            </View>
          )}

          {/* 解説 */}
          <TextInput
            className="bg-systemBackground rounded-xl hairline-border px-4 py-3 text-[14px] text-label"
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            value={editing.explanation ?? ''}
            onChangeText={(v) => setEditing({ ...editing, explanation: v || null })}
            placeholder="解説"
            multiline
          />

          {/* status トグル */}
          <View className="flex-row gap-2 items-center">
            <Text className="text-[13px] text-secondaryLabel">ステータス</Text>
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

          <FormActions
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSave={() => void save()}
            saving={saving}
          />
        </ScrollView>
      )}
    </View>
  );
}

// =============================================================
// Shared sub-components
// =============================================================

function StatusBadge({ published }: { published: boolean }): React.ReactElement {
  return (
    <View
      className={`px-2 py-0.5 rounded-full ${
        published ? 'bg-systemGreen/10' : 'bg-secondarySystemBackground'
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${
          published ? 'text-systemGreen' : 'text-secondaryLabel'
        }`}
      >
        {published ? 'published' : 'draft'}
      </Text>
    </View>
  );
}

function QuestionStatusBadge({
  status,
}: {
  status: 'draft' | 'published';
}): React.ReactElement {
  return (
    <View
      className={`px-2 py-0.5 rounded-full ${
        status === 'published' ? 'bg-systemGreen/10' : 'bg-systemOrange/10'
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${
          status === 'published' ? 'text-systemGreen' : 'text-systemOrange'
        }`}
      >
        {status}
      </Text>
    </View>
  );
}

function PublishToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <Pressable onPress={() => onChange(!value)} className="flex-row items-center gap-2">
      <MaterialIcon
        name={value ? 'check_box' : 'check_box_outline_blank'}
        size={20}
        className="text-systemBlue"
      />
      <Text className="text-[14px] text-label">公開する</Text>
    </Pressable>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}

function FormActions({ onCancel, onSave, saving = false }: FormActionsProps): React.ReactElement {
  return (
    <View className="flex-row gap-2 mt-2">
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-secondarySystemBackground rounded-full py-2.5 items-center"
      >
        <Text className="text-[14px] text-label">キャンセル</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={saving}
        className="flex-1 bg-systemBlue rounded-full py-2.5 items-center"
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-[14px] font-semibold text-white">保存</Text>
        )}
      </Pressable>
    </View>
  );
}

interface CreateButtonProps {
  label: string;
  onPress: () => void;
  compact?: boolean;
}

function CreateButton({ label, onPress, compact = false }: CreateButtonProps): React.ReactElement {
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-1 bg-systemBlue px-3 py-2 rounded-xl"
      >
        <MaterialIcon name="add" size={16} className="text-white" />
        <Text className="text-[13px] font-semibold text-white">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 bg-systemBlue/10 rounded-xl py-3 mb-2"
    >
      <MaterialIcon name="add_circle" size={18} className="text-systemBlue" />
      <Text className="text-[14px] font-semibold text-systemBlue">{label}</Text>
    </Pressable>
  );
}
