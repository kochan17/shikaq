import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export interface LessonSummary {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'audio' | 'quiz';
  duration_seconds: number | null;
  order_index: number;
  is_completed: boolean;
}

export interface SectionWithLessons {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonSummary[];
  lesson_count: number;
  completed_count: number;
}

export interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  certification_id: string;
  order_index: number;
  thumbnail_url: string | null;
  sections: SectionWithLessons[];
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
}

export interface CourseState {
  courses: CourseWithProgress[];
  loading: boolean;
  error: string | null;
}

export function useCourses(certificationId: string | null, userId: string | null): CourseState {
  const [state, setState] = useState<CourseState>({ courses: [], loading: true, error: null });

  useEffect(() => {
    if (certificationId === null) {
      setState({ courses: [], loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(
          `
          id,
          title,
          description,
          certification_id,
          order_index,
          thumbnail_url,
          sections (
            id,
            title,
            order_index,
            is_published,
            lessons (
              id,
              title,
              content_type,
              duration_seconds,
              order_index,
              is_published
            )
          )
        `
        )
        .eq('certification_id', certificationId)
        .eq('is_published', true)
        .order('order_index');

      if (coursesError !== null) {
        if (!cancelled) {
          setState({ courses: [], loading: false, error: coursesError.message });
        }
        return;
      }

      // Fetch completed lesson IDs for this user
      let completedIds = new Set<string>();
      if (userId !== null) {
        const { data: progressData } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', userId);
        completedIds = new Set((progressData ?? []).map((p) => p.lesson_id));
      }

      if (cancelled) return;

      const courses: CourseWithProgress[] = (coursesData ?? []).map((course) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSections = ((course as any).sections ?? []) as Array<{
          id: string;
          title: string;
          order_index: number;
          is_published: boolean;
          lessons: Array<{
            id: string;
            title: string;
            content_type: string;
            duration_seconds: number | null;
            order_index: number;
            is_published: boolean;
          }>;
        }>;

        const sections: SectionWithLessons[] = rawSections
          .filter((s) => s.is_published)
          .sort((a, b) => a.order_index - b.order_index)
          .map((s) => {
            const lessons: LessonSummary[] = s.lessons
              .filter((l) => l.is_published)
              .sort((a, b) => a.order_index - b.order_index)
              .map((l) => ({
                id: l.id,
                title: l.title,
                content_type: l.content_type as LessonSummary['content_type'],
                duration_seconds: l.duration_seconds,
                order_index: l.order_index,
                is_completed: completedIds.has(l.id),
              }));
            const completed_count = lessons.filter((l) => l.is_completed).length;
            return {
              id: s.id,
              title: s.title,
              order_index: s.order_index,
              lessons,
              lesson_count: lessons.length,
              completed_count,
            };
          });

        const total_lessons = sections.reduce((sum, s) => sum + s.lesson_count, 0);
        const completed_lessons = sections.reduce((sum, s) => sum + s.completed_count, 0);

        return {
          id: course.id,
          title: course.title,
          description: course.description ?? null,
          certification_id: course.certification_id,
          order_index: course.order_index,
          thumbnail_url: course.thumbnail_url ?? null,
          sections,
          total_lessons,
          completed_lessons,
          progress_pct: total_lessons === 0 ? 0 : Math.round((completed_lessons / total_lessons) * 100),
        };
      });

      setState({ courses, loading: false, error: null });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [certificationId, userId]);

  return state;
}

export interface ContinueLearningCourse {
  course_id: string;
  course_title: string;
  cert_slug: string;
  cert_name: string;
  certification_id: string;
  progress_pct: number;
  last_completed_at: string;
}

export interface ContinueLearningState {
  courses: ContinueLearningCourse[];
  loading: boolean;
}

export function useContinueLearning(userId: string | null): ContinueLearningState {
  const [state, setState] = useState<ContinueLearningState>({ courses: [], loading: true });

  useEffect(() => {
    if (userId === null) {
      setState({ courses: [], loading: false });
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      // Fetch progress with lesson → section → course → certification chain
      const { data } = await supabase
        .from('progress')
        .select(
          'lesson_id, completed_at, lessons!inner(section_id, sections!inner(course_id, courses!inner(id, title, certification_id, certifications!inner(slug, name))))'
        )
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(200);

      if (cancelled) return;

      if (data === null || data.length === 0) {
        setState({ courses: [], loading: false });
        return;
      }

      // Aggregate per course
      interface CourseAcc {
        course_title: string;
        cert_slug: string;
        cert_name: string;
        certification_id: string;
        last_completed_at: string;
        lesson_ids: Set<string>;
      }

      const map = new Map<string, CourseAcc>();

      for (const row of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        const course = r.lessons?.sections?.courses;
        const cert = course?.certifications;
        if (course === undefined || course === null || cert === undefined || cert === null) continue;

        const courseId = course.id as string;
        const existing = map.get(courseId);
        if (existing !== undefined) {
          existing.lesson_ids.add(row.lesson_id);
          if (row.completed_at > existing.last_completed_at) {
            existing.last_completed_at = row.completed_at;
          }
        } else {
          map.set(courseId, {
            course_title: course.title as string,
            cert_slug: cert.slug as string,
            cert_name: cert.name as string,
            certification_id: course.certification_id as string,
            last_completed_at: row.completed_at,
            lesson_ids: new Set([row.lesson_id]),
          });
        }
      }

      // Fetch total lesson counts per course
      const courseIds = [...map.keys()];
      const { data: lessonCounts } = await supabase
        .from('lessons')
        .select('section_id, sections!inner(course_id)')
        .eq('is_published', true)
        .in('sections.course_id' as never, courseIds as never);

      const totalMap = new Map<string, number>();
      for (const l of lessonCounts ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const courseId = (l as any).sections?.course_id as string | undefined;
        if (courseId !== undefined) {
          totalMap.set(courseId, (totalMap.get(courseId) ?? 0) + 1);
        }
      }

      const courses: ContinueLearningCourse[] = [...map.entries()]
        .map(([course_id, acc]) => {
          const total = totalMap.get(course_id) ?? acc.lesson_ids.size;
          const completed = acc.lesson_ids.size;
          const progress_pct = total === 0 ? 0 : Math.round((completed / total) * 100);
          return {
            course_id,
            course_title: acc.course_title,
            cert_slug: acc.cert_slug,
            cert_name: acc.cert_name,
            certification_id: acc.certification_id,
            progress_pct,
            last_completed_at: acc.last_completed_at,
          };
        })
        .filter((c) => c.progress_pct > 0 && c.progress_pct < 100)
        .sort((a, b) => b.last_completed_at.localeCompare(a.last_completed_at))
        .slice(0, 3);

      if (!cancelled) {
        setState({ courses, loading: false });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}

export interface RecommendedCourse {
  course_id: string;
  course_title: string;
  certification_id: string;
  reason: 'weak_section' | 'not_started';
}

export interface RecommendedState {
  courses: RecommendedCourse[];
  loading: boolean;
}

export function useRecommendedCourses(
  userId: string | null,
  certificationId: string | null
): RecommendedState {
  const [state, setState] = useState<RecommendedState>({ courses: [], loading: true });

  useEffect(() => {
    if (userId === null || certificationId === null) {
      setState({ courses: [], loading: false });
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      // Get courses in this certification with their section mastery scores
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, certification_id, sections(id, section_mastery(score, user_id))')
        .eq('certification_id', certificationId)
        .eq('is_published', true)
        .order('order_index');

      if (cancelled) return;

      if (coursesData === null || coursesData.length === 0) {
        setState({ courses: [], loading: false });
        return;
      }

      const courses: RecommendedCourse[] = [];

      for (const course of coursesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSections = ((course as any).sections ?? []) as Array<{
          id: string;
          section_mastery: Array<{ score: number; user_id: string }>;
        }>;

        const hasMastery = rawSections.some((s) =>
          s.section_mastery.some((m) => m.user_id === userId)
        );

        if (!hasMastery) {
          courses.push({
            course_id: course.id,
            course_title: course.title,
            certification_id: course.certification_id,
            reason: 'not_started',
          });
          continue;
        }

        const userMasteries = rawSections.flatMap((s) =>
          s.section_mastery.filter((m) => m.user_id === userId).map((m) => m.score)
        );
        const avgMastery =
          userMasteries.length === 0
            ? 0
            : userMasteries.reduce((sum, s) => sum + s, 0) / userMasteries.length;

        if (avgMastery < 0.8) {
          courses.push({
            course_id: course.id,
            course_title: course.title,
            certification_id: course.certification_id,
            reason: 'weak_section',
          });
        }
      }

      if (!cancelled) {
        setState({ courses: courses.slice(0, 3), loading: false });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, certificationId]);

  return state;
}
