import type { ImageSourcePropType } from 'react-native';

const THUMBNAILS: Record<string, ImageSourcePropType> = {
  'course-ip.png': require('../assets/thumbnails/course-ip.png'),
  'course-fe.png': require('../assets/thumbnails/course-fe.png'),
  'course-spi.png': require('../assets/thumbnails/course-spi.png'),
  'course-boki.png': require('../assets/thumbnails/course-boki.png'),
};

export function resolveCourseThumbnail(
  thumbnailUrl: string | null | undefined,
): ImageSourcePropType | null {
  if (thumbnailUrl === null || thumbnailUrl === undefined) return null;
  return THUMBNAILS[thumbnailUrl] ?? null;
}
