import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthProvider';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { useCourses } from '../../../lib/hooks/useCourses';
import type { SectionWithLessons, LessonSummary } from '../../../lib/hooks/useCourses';

const CERT_SLUG_BY_CERT_ID: Record<string, string> = {};

const CONTENT_TYPE_ICON: Record<string, string> = {
  video: 'play_circle',
  text: 'article',
  audio: 'headphones',
  quiz: 'quiz',
};

const CERT_ACCENT_CLASS: Record<string, string> = {
  ip: 'text-itPassport',
  fe: 'text-fe',
  spi: 'text-spi',
  boki: 'text-boki',
};

const CERT_BG_CLASS: Record<string, string> = {
  ip: 'bg-itPassport/15',
  fe: 'bg-fe/15',
  spi: 'bg-spi/15',
  boki: 'bg-boki/15',
};

const CERT_BAR_CLASS: Record<string, string> = {
  ip: 'bg-itPassport',
  fe: 'bg-fe',
  spi: 'bg-spi',
  boki: 'bg-boki',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}分`;
  return `${Math.floor(m / 60)}時間${m % 60 > 0 ? `${m % 60}分` : ''}`;
}

interface LessonRowProps {
  lesson: LessonSummary;
  certSlug: string;
  onPress: () => void;
}

function LessonRow({ lesson, certSlug, onPress }: LessonRowProps): React.ReactElement {
  const iconName = CONTENT_TYPE_ICON[lesson.content_type] ?? 'article';
  const accentClass = CERT_ACCENT_CLASS[certSlug] ?? 'text-systemBlue';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 20,
          gap: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(60,60,67,0.12)',
        }}
      >
        <MaterialIcon
          name={iconName}
          fill={lesson.is_completed}
          size={20}
          className={lesson.is_completed ? 'text-systemGreen' : accentClass}
        />

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{ fontSize: 15, fontWeight: lesson.is_completed ? '400' : '500', lineHeight: 20 }}
            className={lesson.is_completed ? 'text-secondaryLabel' : 'text-label'}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          {lesson.duration_seconds !== null && (
            <Text style={{ fontSize: 12 }} className="text-tertiaryLabel">
              {formatDuration(lesson.duration_seconds)}
            </Text>
          )}
        </View>

        {lesson.is_completed ? (
          <MaterialIcon name="check_circle" fill size={18} className="text-systemGreen" />
        ) : (
          <MaterialIcon name="chevron_right" size={18} className="text-tertiaryLabel" />
        )}
      </View>
    </Pressable>
  );
}

interface SectionAccordionProps {
  section: SectionWithLessons;
  certSlug: string;
  initiallyExpanded: boolean;
  onLessonPress: (lessonId: string) => void;
}

function SectionAccordion({
  section,
  certSlug,
  initiallyExpanded,
  onLessonPress,
}: SectionAccordionProps): React.ReactElement {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const progressPct =
    section.lesson_count === 0
      ? 0
      : Math.round((section.completed_count / section.lesson_count) * 100);
  const barClass = CERT_BAR_CLASS[certSlug] ?? 'bg-systemBlue';

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(60,60,67,0.1)',
      }}
      className="bg-systemBackground"
    >
      {/* Section header */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{ fontSize: 16, fontWeight: '600', letterSpacing: -0.2 }}
                className="text-label"
                numberOfLines={1}
              >
                {section.title}
              </Text>
              <Text style={{ fontSize: 12 }} className="text-secondaryLabel">
                {section.completed_count} / {section.lesson_count} レッスン完了
              </Text>
            </View>
            <MaterialIcon
              name={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              size={20}
              className="text-secondaryLabel"
            />
          </View>

          {/* Mini progress bar */}
          <View
            style={{
              height: 3,
              borderRadius: 9999,
              backgroundColor: 'rgba(60,60,67,0.1)',
              overflow: 'hidden',
            }}
          >
            {progressPct > 0 && (
              <View
                style={{ height: 3, width: `${progressPct}%`, borderRadius: 9999 }}
                className={barClass}
              />
            )}
          </View>
        </View>
      </Pressable>

      {/* Lesson list */}
      {expanded && (
        <View>
          {section.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              certSlug={certSlug}
              onPress={() => onLessonPress(lesson.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function CourseDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // We need to find the course. We load all courses across all certs (cert id unknown here),
  // so we fetch with null certificationId and search broadly.
  // Better: use a dedicated single-course query. For now, use a direct supabase call via the hook
  // by passing null for certId. We'll resolve the cert from the course itself.
  // Instead, we call useCourses with null to get nothing, then use a separate single-course load.

  const [certificationId, setCertificationId] = useState<string | null>(null);
  const [certSlug, setCertSlug] = useState<string>('ip');
  const [loadingCertId, setLoadingCertId] = useState(true);

  // Fetch the certification_id for this course once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableUserId = user?.id ?? null;

  // Resolve cert id + slug for this course
  useEffect(() => {
    if (id === undefined) {
      setLoadingCertId(false);
      return;
    }

    void (async () => {
      try {
        const { supabase } = await import('../../../lib/supabase/client');
        const { data } = await supabase
          .from('courses')
          .select('certification_id, certifications!inner(slug)')
          .eq('id', id)
          .maybeSingle();
        if (data !== null) {
          setCertificationId(data.certification_id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const slug = (data as any).certifications?.slug as string | undefined;
          if (slug !== undefined) setCertSlug(slug);
        }
      } catch {
        // silent
      } finally {
        setLoadingCertId(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { courses, loading: coursesLoading } = useCourses(certificationId, stableUserId);
  const course = courses.find((c) => c.id === id);

  const isLoading = loadingCertId || coursesLoading;

  const bgClass = CERT_BG_CLASS[certSlug] ?? 'bg-secondarySystemBackground';
  const accentClass = CERT_ACCENT_CLASS[certSlug] ?? 'text-systemBlue';
  const barClass = CERT_BAR_CLASS[certSlug] ?? 'bg-systemBlue';

  function handleLessonPress(lessonId: string): void {
    router.push(`/practice?lessonId=${lessonId}` as never);
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} className="bg-systemGroupedBackground">
        <ActivityIndicator />
      </View>
    );
  }

  if (course === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }} className="bg-systemGroupedBackground">
        <MaterialIcon name="error_outline" size={40} className="text-tertiaryLabel" />
        <Text style={{ fontSize: 15, marginTop: 12 }} className="text-secondaryLabel">
          コースが見つかりませんでした
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999 }}
          className="bg-systemBlue"
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  // Find the first incomplete section to expand by default
  const firstIncompleteIdx = course.sections.findIndex(
    (s) => s.completed_count < s.lesson_count
  );

  return (
    <View style={{ flex: 1 }} className="bg-systemGroupedBackground">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={{ padding: 32, paddingTop: 24, gap: 20 }}>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
          >
            <MaterialIcon name="arrow_back_ios" size={16} className="text-systemBlue" />
            <Text style={{ fontSize: 16, color: '#007AFF' }}>コース一覧</Text>
          </Pressable>

          {/* Course cover card */}
          <View
            style={{ borderRadius: 20, padding: 28, gap: 16, overflow: 'hidden' }}
            className={bgClass}
          >
            {/* Title */}
            <View style={{ gap: 6 }}>
              <Text
                style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 }}
                className="text-label"
              >
                {course.title}
              </Text>
              {course.description !== null && (
                <Text style={{ fontSize: 14, lineHeight: 20 }} className="text-secondaryLabel">
                  {course.description}
                </Text>
              )}
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: '700' }} className={accentClass}>
                  {course.sections.length}
                </Text>
                <Text style={{ fontSize: 12 }} className="text-secondaryLabel">
                  セクション
                </Text>
              </View>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: '700' }} className={accentClass}>
                  {course.total_lessons}
                </Text>
                <Text style={{ fontSize: 12 }} className="text-secondaryLabel">
                  レッスン
                </Text>
              </View>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: '700' }} className={accentClass}>
                  {course.progress_pct}%
                </Text>
                <Text style={{ fontSize: 12 }} className="text-secondaryLabel">
                  完了
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View
              style={{
                height: 4,
                borderRadius: 9999,
                backgroundColor: 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {course.progress_pct > 0 && (
                <View
                  style={{
                    height: 4,
                    width: `${course.progress_pct}%`,
                    borderRadius: 9999,
                  }}
                  className={barClass}
                />
              )}
            </View>
          </View>
        </View>

        {/* Section list */}
        <View style={{ paddingHorizontal: 32, gap: 12 }}>
          <Text
            style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.3, marginBottom: 4 }}
            className="text-label"
          >
            セクション一覧
          </Text>

          {course.sections.length === 0 ? (
            <View
              style={{ padding: 24, borderRadius: 16, alignItems: 'center', gap: 8 }}
              className="bg-systemBackground hairline-border"
            >
              <MaterialIcon name="hourglass_empty" size={28} className="text-tertiaryLabel" />
              <Text style={{ fontSize: 14 }} className="text-secondaryLabel">
                セクションは準備中です
              </Text>
            </View>
          ) : (
            course.sections.map((section, idx) => (
              <SectionAccordion
                key={section.id}
                section={section}
                certSlug={certSlug}
                initiallyExpanded={idx === (firstIncompleteIdx === -1 ? 0 : firstIncompleteIdx)}
                onLessonPress={handleLessonPress}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
