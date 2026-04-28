import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Today } from '../../components/screens/Today';
import { MobileToday } from '../../components/MobileToday';
import { screenToPath } from '../../lib/navigation';

export default function TodayRoute(): React.ReactElement {
  const { width } = useWindowDimensions();
  const router = useRouter();

  if (width < 768) {
    return <MobileToday />;
  }

  return <Today onNavigate={(key) => router.push(screenToPath(key) as never)} />;
}
