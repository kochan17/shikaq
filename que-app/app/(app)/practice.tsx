import Head from 'expo-router/head';
import { Practice } from '../../components/screens/Practice';

export default function PracticeRoute(): React.ReactElement {
  return (
    <>
      <Head><title>演習 | Que</title></Head>
      <Practice />
    </>
  );
}
