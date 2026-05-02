import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';

type CourseStatus = 'not_started' | 'in_progress' | 'completed';

interface CertVisual {
  tintGradientFrom: string;
  tintGradientTo: string;
  tintClass: string;
  iconName: string;
  iconColorClass: string;
  accentClass: string;
}

const CERT_VISUALS: Record<string, CertVisual> = {
  ip: {
    tintGradientFrom: '#64D2FF22',
    tintGradientTo: '#64D2FF44',
    tintClass: 'bg-itPassport/20',
    iconName: 'computer',
    iconColorClass: 'text-itPassport',
    accentClass: 'bg-itPassport',
  },
  fe: {
    tintGradientFrom: '#5E5CE622',
    tintGradientTo: '#5E5CE644',
    tintClass: 'bg-fe/20',
    iconName: 'memory',
    iconColorClass: 'text-fe',
    accentClass: 'bg-fe',
  },
  spi: {
    tintGradientFrom: '#FFD60A22',
    tintGradientTo: '#FFD60A44',
    tintClass: 'bg-spi/20',
    iconName: 'psychology',
    iconColorClass: 'text-spi',
    accentClass: 'bg-spi',
  },
  boki: {
    tintGradientFrom: '#FF375F22',
    tintGradientTo: '#FF375F44',
    tintClass: 'bg-boki/20',
    iconName: 'calculate',
    iconColorClass: 'text-boki',
    accentClass: 'bg-boki',
  },
};

const FALLBACK_VISUAL: CertVisual = {
  tintGradientFrom: '#8E8E9322',
  tintGradientTo: '#8E8E9344',
  tintClass: 'bg-secondarySystemFill',
  iconName: 'menu_book',
  iconColorClass: 'text-secondaryLabel',
  accentClass: 'bg-systemBlue',
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
};

const CONTENT_TYPE_ICON: Record<string, string> = {
  video: 'play_circle',
  text: 'article',
  audio: 'headphones',
  quiz: 'quiz',
};

interface CourseCardProps {
  id: string;
  title: string;
  certSlug: string;
  progressPct: number;
  totalLessons: number;
  completedLessons: number;
  dominantContentType?: string;
  onPress: (id: string) => void;
}

export function CourseCard({
  id,
  title,
  certSlug,
  progressPct,
  totalLessons,
  completedLessons,
  dominantContentType = 'text',
  onPress,
}: CourseCardProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const cardWidth = isTablet ? 160 : 140;
  const cardHeight = isTablet ? 220 : 196;

  const visual = CERT_VISUALS[certSlug] ?? FALLBACK_VISUAL;
  const [hovered, setHovered] = useState(false);

  const status: CourseStatus =
    progressPct === 0 ? 'not_started' : progressPct >= 100 ? 'completed' : 'in_progress';

  const iconName = CONTENT_TYPE_ICON[dominantContentType] ?? 'menu_book';

  return (
    <Pressable
      onPress={() => onPress(id)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        transform: hovered ? [{ scale: 1.03 }] : [],
        width: cardWidth,
      })}
    >
      <View style={{ width: cardWidth, gap: 8 }}>
        {/* Cover */}
        <View
          style={{
            width: cardWidth,
            height: cardHeight,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.08)',
          }}
          className={visual.tintClass}
        >
          {/* Top progress bar — hairline Apple Podcasts style */}
          {status === 'in_progress' && (
            <View style={{ height: 3, width: '100%', backgroundColor: 'rgba(0,0,0,0.08)' }}>
              <View
                style={{
                  height: 3,
                  width: `${progressPct}%`,
                  backgroundColor: visual.accentClass.replace('bg-', ''),
                }}
                className={visual.accentClass}
              />
            </View>
          )}
          {status === 'completed' && (
            <View style={{ height: 3, width: '100%' }} className={visual.accentClass} />
          )}

          {/* Icon centered */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcon
              name={iconName}
              size={isTablet ? 48 : 40}
              className={`${visual.iconColorClass} opacity-25`}
            />
          </View>

          {/* Bottom section with status badge */}
          <View style={{ padding: 10, gap: 6 }}>
            {status !== 'not_started' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 9999,
                  backgroundColor:
                    status === 'completed'
                      ? 'rgba(52,199,89,0.18)'
                      : 'rgba(255,255,255,0.6)',
                }}
              >
                <MaterialIcon
                  name={status === 'completed' ? 'check_circle' : 'schedule'}
                  fill={status === 'completed'}
                  size={11}
                  className={status === 'completed' ? 'text-systemGreen' : 'text-secondaryLabel'}
                />
                <Text
                  style={{ fontSize: 11, fontWeight: '600' }}
                  className={status === 'completed' ? 'text-systemGreen' : 'text-secondaryLabel'}
                >
                  {status === 'in_progress'
                    ? `進行中 ${progressPct}%`
                    : STATUS_LABELS[status]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <Text
          style={{ fontSize: 13, fontWeight: '500', lineHeight: 17 }}
          className="text-label"
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Sub-label: lesson count */}
        <Text style={{ fontSize: 11, marginTop: -4 }} className="text-secondaryLabel">
          {completedLessons} / {totalLessons} レッスン
        </Text>
      </View>
    </Pressable>
  );
}
