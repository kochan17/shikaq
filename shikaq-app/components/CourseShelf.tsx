import { ScrollView, Text, View } from 'react-native';
import { CourseCard } from './CourseCard';
import type { CourseWithProgress } from '../lib/hooks/useCourses';

interface CourseShelfProps {
  title: string;
  subtitle: string;
  courses: CourseWithProgress[];
  certSlug: string;
  onCoursePress: (courseId: string) => void;
}

export function CourseShelf({
  title,
  subtitle,
  courses,
  certSlug,
  onCoursePress,
}: CourseShelfProps): React.ReactElement {
  return (
    <View style={{ gap: 12 }}>
      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 22, fontWeight: '600', letterSpacing: -0.4 }} className="text-label">
          {title}
        </Text>
        <Text style={{ fontSize: 12 }} className="text-secondaryLabel">
          {subtitle}
        </Text>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: 32, gap: 16, paddingBottom: 4 }}
      >
        {courses.map((course) => {
          // Determine dominant content type from sections
          const allLessons = course.sections.flatMap((s) => s.lessons);
          const typeCounts: Record<string, number> = {};
          for (const l of allLessons) {
            typeCounts[l.content_type] = (typeCounts[l.content_type] ?? 0) + 1;
          }
          const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'text';

          return (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              certSlug={certSlug}
              progressPct={course.progress_pct}
              totalLessons={course.total_lessons}
              completedLessons={course.completed_lessons}
              dominantContentType={dominantType}
              onPress={onCoursePress}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
