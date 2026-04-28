import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthProvider';
import { MaterialIcon } from '../MaterialIcon';
import { CourseShelf } from '../CourseShelf';
import {
  useCourses,
  useContinueLearning,
  useRecommendedCourses,
  type CourseWithProgress,
} from '../../lib/hooks/useCourses';
import { fetchCertificationsWithCourses, type CertificationWithCourses } from '../../lib/supabase/queries';

type CertSlug = 'ip' | 'fe' | 'spi' | 'boki';

const CERT_ORDER: CertSlug[] = ['ip', 'fe', 'spi', 'boki'];

const CERT_LABELS: Record<CertSlug, string> = {
  ip: 'ITパスポート',
  fe: '基本情報',
  spi: 'SPI',
  boki: '簿記2級',
};

const CERT_ACCENT: Record<CertSlug, string> = {
  ip: 'text-itPassport',
  fe: 'text-fe',
  spi: 'text-spi',
  boki: 'text-boki',
};

const CERT_PILL_SELECTED: Record<CertSlug, string> = {
  ip: 'bg-itPassport/20 border-itPassport/40',
  fe: 'bg-fe/20 border-fe/40',
  spi: 'bg-spi/20 border-spi/40',
  boki: 'bg-boki/20 border-boki/40',
};

interface CertTab {
  slug: CertSlug;
  id: string;
  name: string;
}

export function Learn(): React.ReactElement {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [allCerts, setAllCerts] = useState<CertificationWithCourses[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [activeCertSlug, setActiveCertSlug] = useState<CertSlug>('ip');

  // Load certifications once
  useEffect(() => {
    fetchCertificationsWithCourses()
      .then((data) => {
        setAllCerts(data);
        // Default to user's preferred cert if available
        const pref = profile?.preferred_certification as CertSlug | null | undefined;
        if (pref !== null && pref !== undefined && CERT_ORDER.includes(pref)) {
          setActiveCertSlug(pref);
        } else if (data.length > 0) {
          const first = data.find((c) => CERT_ORDER.includes(c.slug as CertSlug));
          if (first !== undefined) setActiveCertSlug(first.slug as CertSlug);
        }
      })
      .catch(() => {/* silently fall back to default */})
      .finally(() => setCertsLoading(false));
  }, [profile?.preferred_certification]);

  const activeCert = allCerts.find((c) => c.slug === activeCertSlug);

  const certTabs: CertTab[] = CERT_ORDER.flatMap((slug) => {
    const found = allCerts.find((c) => c.slug === slug);
    if (found === undefined) return [];
    return [{ slug, id: found.id, name: CERT_LABELS[slug] ?? found.name }];
  });

  const userId = user?.id ?? null;

  const { courses, loading: coursesLoading, error } = useCourses(
    activeCert?.id ?? null,
    userId
  );

  const { courses: continueCourses, loading: continueLoading } = useContinueLearning(userId);

  const { courses: recommendedCourses, loading: recommendedLoading } = useRecommendedCourses(
    userId,
    activeCert?.id ?? null
  );

  function handleCoursePress(courseId: string): void {
    router.push(`/course/${courseId}` as never);
  }

  // Continue Learning: filter to this cert
  const continueForCert = continueCourses
    .filter((c) => c.cert_slug === activeCertSlug)
    .slice(0, 3);

  // Recommended: match course objects
  const recommendedForCert = recommendedCourses
    .map((r) => courses.find((c) => c.id === r.course_id))
    .filter((c): c is CourseWithProgress => c !== undefined)
    .slice(0, 3);

  // Continue Learning course objects (from the main courses list)
  const continueCourseFull = continueForCert
    .map((cl) => courses.find((c) => c.id === cl.course_id))
    .filter((c): c is CourseWithProgress => c !== undefined);

  const completedCount = courses.filter((c) => c.progress_pct >= 100).length;

  const isLoading = certsLoading || coursesLoading || continueLoading || recommendedLoading;

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      {/* Header */}
      <View style={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 0, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text
              style={{ fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}
              className="text-label"
            >
              コース一覧
            </Text>
            <Text style={{ fontSize: 13, marginTop: 2 }} className="text-secondaryLabel">
              学びたいテーマを選ぼう
            </Text>
          </View>
          <Pressable
            style={{ padding: 8 }}
            onPress={() => router.push('/search' as never)}
          >
            <MaterialIcon name="search" size={22} className="text-secondaryLabel" />
          </Pressable>
        </View>

        {/* Certification pill tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
        >
          {certTabs.map((tab) => {
            const isActive = tab.slug === activeCertSlug;
            return (
              <Pressable
                key={tab.slug}
                onPress={() => setActiveCertSlug(tab.slug)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  borderWidth: 0.5,
                }}
                className={
                  isActive
                    ? CERT_PILL_SELECTED[tab.slug]
                    : 'border-separator bg-transparent'
                }
              >
                <Text
                  style={{ fontSize: 14, fontWeight: isActive ? '600' : '400' }}
                  className={isActive ? CERT_ACCENT[tab.slug] : 'text-secondaryLabel'}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : error !== null ? (
        <View style={{ margin: 32, padding: 20, borderRadius: 16 }} className="bg-systemBackground hairline-border">
          <Text style={{ fontSize: 14 }} className="text-systemRed">
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 64, gap: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Continue Learning shelf */}
          {continueCourseFull.length > 0 && (
            <CourseShelf
              title="続けて学ぶ"
              subtitle={`${continueCourseFull.length} コース`}
              courses={continueCourseFull}
              certSlug={activeCertSlug}
              onCoursePress={handleCoursePress}
            />
          )}

          {/* Recommended shelf */}
          {recommendedForCert.length > 0 && (
            <CourseShelf
              title="おすすめ"
              subtitle="苦手を先につぶそう"
              courses={recommendedForCert}
              certSlug={activeCertSlug}
              onCoursePress={handleCoursePress}
            />
          )}

          {/* All Courses shelf */}
          {courses.length > 0 ? (
            <CourseShelf
              title="すべてのコース"
              subtitle={`${completedCount} / ${courses.length} コース完了`}
              courses={courses}
              certSlug={activeCertSlug}
              onCoursePress={handleCoursePress}
            />
          ) : (
            <View
              style={{ marginHorizontal: 32, padding: 24, borderRadius: 16, alignItems: 'center', gap: 8 }}
              className="bg-systemBackground hairline-border"
            >
              <MaterialIcon name="menu_book" size={32} className="text-tertiaryLabel" />
              <Text style={{ fontSize: 15, fontWeight: '500' }} className="text-secondaryLabel">
                まだコースが公開されていません
              </Text>
              <Text style={{ fontSize: 13, textAlign: 'center' }} className="text-tertiaryLabel">
                もうすぐ公開予定です。楽しみにお待ちください
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
