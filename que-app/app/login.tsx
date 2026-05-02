import { View } from 'react-native';
import { Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useAuth } from '../components/AuthProvider';
import { Login } from '../components/screens/Login';
import { BrandSpinner } from '../components/BrandSpinner';

export default function LoginRoute(): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-systemBackground">
        <BrandSpinner size={40} />
      </View>
    );
  }

  if (user !== null) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Head><title>ログイン | Que</title></Head>
      <Login />
    </>
  );
}
