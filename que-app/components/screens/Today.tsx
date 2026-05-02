import { View } from 'react-native';
import { TodayContent } from '../TodayContent';
import { RightDetail } from '../RightDetail';
import type { ScreenKey } from '../Sidebar';

interface TodayProps {
  onNavigate?: (screen: ScreenKey) => void;
  certSlug?: string | null;
}

export function Today({ onNavigate, certSlug = null }: TodayProps): React.ReactElement {
  return (
    <View className="flex-row flex-1 overflow-hidden">
      <TodayContent onNavigate={onNavigate} certSlug={certSlug} />
      <RightDetail certSlug={certSlug} />
    </View>
  );
}
