import Head from 'expo-router/head';
import { Audio } from '../../components/screens/Audio';

export default function AudioRoute(): React.ReactElement {
  return (
    <>
      <Head><title>音声解説 | shikaq</title></Head>
      <Audio />
    </>
  );
}
