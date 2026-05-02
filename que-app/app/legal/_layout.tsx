import { Stack } from 'expo-router';

export default function LegalLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerBackTitle: '戻る',
      }}
    />
  );
}
