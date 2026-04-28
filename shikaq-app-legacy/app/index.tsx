import { View, useWindowDimensions } from 'react-native';
import { Sidebar } from '../components/Sidebar';
import { TodayContent } from '../components/TodayContent';
import { RightDetail } from '../components/RightDetail';
import { MobileToday } from '../components/MobileToday';

export default function TodayScreen(): React.ReactElement {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  if (isPhone) {
    return <MobileToday />;
  }

  return (
    <View className="flex-row flex-1 overflow-hidden bg-secondarySystemBackground">
      <Sidebar />
      <TodayContent />
      <RightDetail />
    </View>
  );
}
