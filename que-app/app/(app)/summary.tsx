import Head from 'expo-router/head';
import { Summary } from '../../components/screens/Summary';

export default function SummaryRoute(): React.ReactElement {
  return (
    <>
      <Head><title>学習履歴 | Que</title></Head>
      <Summary />
    </>
  );
}
