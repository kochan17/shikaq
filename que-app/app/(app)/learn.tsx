import Head from 'expo-router/head';
import { Learn } from '../../components/screens/Learn';

export default function LearnRoute(): React.ReactElement {
  return (
    <>
      <Head><title>コース | Que</title></Head>
      <Learn />
    </>
  );
}
