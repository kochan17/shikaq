import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { CertificationId } from '../../data/onboarding-questions';

interface CertTile {
  id: CertificationId;
  label: string;
  icon: string;
  tintClass: string;
  bgClass: string;
  textClass: string;
}

const CERT_TILES: CertTile[] = [
  {
    id: 'ip',
    label: 'ITパスポート',
    icon: 'devices',
    tintClass: 'bg-itPassport/20',
    bgClass: 'bg-itPassport/10',
    textClass: 'text-itPassport',
  },
  {
    id: 'fe',
    label: '基本情報技術者',
    icon: 'memory',
    tintClass: 'bg-fe/20',
    bgClass: 'bg-fe/10',
    textClass: 'text-fe',
  },
  {
    id: 'spi',
    label: 'SPI',
    icon: 'person_edit',
    tintClass: 'bg-spi/20',
    bgClass: 'bg-spi/10',
    textClass: 'text-spi',
  },
  {
    id: 'boki',
    label: '簿記 2 級',
    icon: 'currency_yen',
    tintClass: 'bg-boki/20',
    bgClass: 'bg-boki/10',
    textClass: 'text-boki',
  },
];

export default function OnboardingIndex(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  function handleSelect(cert: CertificationId): void {
    router.push(`/onboarding/preview?cert=${cert}` as never);
  }

  function handleSkip(): void {
    router.push('/login' as never);
  }

  return (
    <>
    <Head><title>Que を始める</title></Head>
    <SafeAreaView className="flex-1 bg-systemBackground">
      <View className="flex-1 px-6 pb-8">
        <View className="flex-row justify-end pt-4 pb-2">
          <Pressable onPress={handleSkip}>
            <Text className="text-[13px] text-secondaryLabel">サインアップから</Text>
          </Pressable>
        </View>

        <View className="flex-1 justify-center">
          <View className="mb-10 items-center">
            <Text
              className={Platform.OS === 'web' ? 'brand-gradient-text tracking-tight mb-3' : 'tracking-tight mb-3'}
              style={{
                fontSize: 36,
                fontWeight: '700',
                color: Platform.OS === 'web' ? undefined : '#0600FF',
              }}
            >
              Que
            </Text>
            <Text
              className="text-label text-center leading-relaxed"
              style={{ fontSize: 22, fontWeight: '600' }}
            >
              気になる資格を{'\n'}選んでみる
            </Text>
            <Text
              className="text-secondaryLabel text-center mt-2"
              style={{ fontSize: 15 }}
            >
              1問だけ体験できます。
            </Text>
          </View>

          <View
            className={isTablet ? 'flex-row flex-wrap gap-4 justify-center' : 'gap-3'}
          >
            {CERT_TILES.map((tile) => (
              <Pressable
                key={tile.id}
                onPress={() => handleSelect(tile.id)}
                className={[
                  isTablet ? 'w-[calc(50%-8px)]' : 'w-full',
                  tile.tintClass,
                  'rounded-2xl p-5 flex-row items-center gap-4',
                  Platform.OS === 'web' ? 'cursor-pointer' : '',
                ].join(' ')}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View
                  className={`w-12 h-12 rounded-xl ${tile.bgClass} items-center justify-center`}
                >
                  <MaterialIcon
                    name={tile.icon}
                    size={26}
                    className={tile.textClass}
                    fill
                  />
                </View>
                <Text
                  className="text-label flex-1"
                  style={{ fontSize: 17, fontWeight: '600' }}
                >
                  {tile.label}
                </Text>
                <MaterialIcon name="chevron_right" size={20} className="text-secondaryLabel" />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
    </>
  );
}
