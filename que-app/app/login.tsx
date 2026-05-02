import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useAuth } from '../components/AuthProvider';
import { Login } from '../components/screens/Login';

export default function LoginRoute(): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-systemGroupedBackground">
        <ActivityIndicator />
      </View>
    );
  }

  if (user !== null) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Head><title>ログイン | shikaq</title></Head>
      <Login />
    </>
  );
}
