import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { signInWithEmail, signUpWithEmail } from '../../lib/supabase/auth';
import { resetPassword } from '../../lib/supabase/queries';
import { MaterialIcon } from '../MaterialIcon';
import { GoogleIcon, AppleIcon } from '../BrandIcon';
import { Typewriter } from '../Typewriter';
import { translateAuthError } from '../../lib/auth/errorMessages';
import { signInWithApple } from '../../lib/auth/appleSignIn';
import { supabase } from '../../lib/supabase/client';

type Mode = 'sign-in' | 'sign-up' | 'forgot';

const CERT_TEXTS = ['ITパスポート', '基本情報技術者', 'SPI', '簿記2級'] as const;

export function Login(): React.ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const r = await signInWithEmail(email, password);
        if (r.error !== null) throw r.error;
      } else if (mode === 'sign-up') {
        const r = await signUpWithEmail(email, password, {
          display_name: displayName,
          marketing_opt_in: marketingOptIn,
        });
        if (r.error !== null) throw r.error;
      } else {
        await resetPassword(
          email,
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined
        );
        setInfo('パスワード再設定のメールを送りました。受信箱を確認してください。');
      }
    } catch (e) {
      setError(translateAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSSO(provider: 'google'): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options:
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? { redirectTo: `${window.location.origin}/` }
            : {},
      });
      if (signInError !== null) throw signInError;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OAuth failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleApple(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithApple();
      if (result.error !== null) throw result.error;
    } catch (e) {
      setError(translateAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  const cta =
    mode === 'sign-in' ? 'ログイン' : mode === 'sign-up' ? '続ける' : 'リンクを送る';
  const heading =
    mode === 'sign-in'
      ? 'shikaq'
      : mode === 'sign-up'
        ? 'メールアドレスでサインアップ'
        : 'shikaq';
  const subtitle =
    mode === 'sign-in'
      ? 'おかえりなさい。'
      : mode === 'sign-up'
        ? 'はじめましょう。'
        : 'パスワードを再設定します。';

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  return (
    <View className="flex-1 bg-systemBackground flex-row">
      {/* LEFT column — typewriter rotation, only on desktop web (≥1024px). */}
      {isDesktop && (
        <View className="w-1/2 items-center justify-center bg-systemBackground px-12">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text
              className={Platform.OS === 'web' ? 'brand-gradient-text' : ''}
              style={{
                fontSize: 60,
                fontWeight: '700',
                letterSpacing: -1.5,
                lineHeight: 72,
                color: Platform.OS === 'web' ? undefined : '#0600FF',
              }}
            >
              shikaq
            </Text>
            <Text
              style={{
                fontSize: 60,
                fontWeight: '700',
                letterSpacing: -1.5,
                lineHeight: 72,
                color: '#000000',
              }}
            >
              で
            </Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'baseline' }}>
            <Typewriter
              texts={[...CERT_TEXTS]}
              speed={90}
              waitTime={1800}
              deleteSpeed={45}
              cursorChar="_"
              textStyle={{
                fontSize: 60,
                fontWeight: '700',
                letterSpacing: -1.5,
                lineHeight: 72,
                color: '#000000',
              }}
            />
          </View>
        </View>
      )}

      {/* RIGHT column — form */}
      <View
        className={`flex-1 items-center justify-center p-8 ${isDesktop ? '' : 'bg-systemBackground'}`}
      >
        <View className="w-full max-w-[400px]">
          <Text className="text-[32px] font-semibold text-label tracking-tight mb-2">{heading}</Text>
          <Text className="text-[15px] text-secondaryLabel mb-6">{subtitle}</Text>

          {/* 氏名 input — sign-up mode only */}
          {mode === 'sign-up' && (
            <View className="flex-row items-center bg-secondarySystemBackground rounded-xl px-4 h-[52px] mb-3">
              <MaterialIcon name="person" size={20} className="text-secondaryLabel mr-3" />
              <TextInput
                className="flex-1 text-[16px] text-label"
                placeholder="氏名"
                placeholderTextColor="#3C3C4399"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          )}

        <View className="flex-row items-center bg-secondarySystemBackground rounded-xl px-4 h-[52px] mb-3">
          <MaterialIcon name="mail" size={20} className="text-secondaryLabel mr-3" />
          <TextInput
            className="flex-1 text-[16px] text-label"
            placeholder="メールアドレス"
            placeholderTextColor="#3C3C4399"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {mode !== 'forgot' && (
          <View className="flex-row items-center bg-secondarySystemBackground rounded-xl px-4 h-[52px] mb-3">
            <MaterialIcon name="lock" size={20} className="text-secondaryLabel mr-3" />
            <TextInput
              className="flex-1 text-[16px] text-label"
              placeholder="パスワード"
              placeholderTextColor="#3C3C4399"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcon
                name={showPassword ? 'visibility_off' : 'visibility'}
                size={20}
                className="text-secondaryLabel"
              />
            </Pressable>
          </View>
        )}

        {mode === 'sign-in' && (
          <Pressable className="self-end mb-3" onPress={() => setMode('forgot')}>
            <Text className="text-[12px] text-systemBlue">パスワードを忘れた</Text>
          </Pressable>
        )}

        {/* マーケティング受信 checkbox — sign-up mode only */}
        {mode === 'sign-up' && (
          <Pressable
            onPress={() => setMarketingOptIn((v) => !v)}
            className="flex-row items-start gap-3 mb-4"
          >
            <View
              className={`w-5 h-5 rounded mt-0.5 items-center justify-center ${
                marketingOptIn
                  ? 'bg-systemBlue'
                  : 'bg-secondarySystemBackground hairline-border'
              }`}
            >
              {marketingOptIn && (
                <MaterialIcon name="check" size={14} className="text-white" fill />
              )}
            </View>
            <Text className="flex-1 text-[12px] text-secondaryLabel leading-[1.4]">
              shikaq からの新着情報やキャンペーンを受け取る
            </Text>
          </Pressable>
        )}

        {error !== null && <Text className="text-[13px] text-systemRed mb-4">{error}</Text>}
        {info !== null && <Text className="text-[13px] text-systemGreen mb-4">{info}</Text>}

        <Pressable
          className={`${Platform.OS === 'web' ? 'brand-gradient' : 'bg-systemBlue'} h-[52px] rounded-full items-center justify-center mb-4`}
          onPress={() => void handleSubmit()}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-[17px] font-semibold">{cta}</Text>
          )}
        </Pressable>

        {/* 利用規約・プライバシーポリシー同意文言 — sign-up mode only */}
        {mode === 'sign-up' && (
          <Text className="text-[11px] text-secondaryLabel leading-[1.5] mb-4">
            登録すると、shikaq の{' '}
            <Text
              className="text-systemBlue"
              onPress={() => router.push('/legal/terms' as never)}
            >
              利用規約
            </Text>
            と
            <Text
              className="text-systemBlue"
              onPress={() => router.push('/legal/privacy' as never)}
            >
              プライバシーポリシー
            </Text>
            に同意したことになります。
          </Text>
        )}

        {mode !== 'forgot' && (
          <>
            <View className="flex-row items-center gap-3 my-4">
              <View className="flex-1 h-px bg-black/10" />
              <Text className="text-[12px] text-secondaryLabel">
                {mode === 'sign-up' ? 'その他の登録オプション' : 'または'}
              </Text>
              <View className="flex-1 h-px bg-black/10" />
            </View>

            <View className="gap-2 mb-4">
              <Pressable
                onPress={() => void handleSSO('google')}
                className="flex-row items-center justify-center gap-3 h-[48px] rounded-full hairline-border"
                disabled={busy}
              >
                <GoogleIcon size={18} />
                <Text className="text-[14px] font-semibold text-label">Google で続ける</Text>
              </Pressable>
              {Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={26}
                  style={{ width: '100%', height: 48 }}
                  onPress={() => void handleApple()}
                />
              ) : (
                <Pressable
                  onPress={() => void handleApple()}
                  className="flex-row items-center justify-center gap-3 h-[48px] rounded-full bg-label"
                  disabled={busy}
                >
                  <AppleIcon size={18} color="#FFFFFF" />
                  <Text className="text-[14px] font-semibold text-white">Apple で続ける</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        <Pressable
          onPress={() => {
            if (mode === 'sign-in') setMode('sign-up');
            else if (mode === 'sign-up') setMode('sign-in');
            else setMode('sign-in');
          }}
          className="items-center"
        >
          <Text className="text-[14px] text-secondaryLabel">
            {mode === 'sign-in' && 'アカウントをお持ちでないですか？ '}
            {mode === 'sign-up' && 'すでにアカウントをお持ちですか？ '}
            {mode === 'forgot' && 'ログイン画面に戻る '}
            {mode !== 'forgot' && (
              <Text className="text-systemBlue font-semibold">
                {mode === 'sign-in' ? '新規登録' : 'ログイン'}
              </Text>
            )}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/onboarding' as never)}
          className="items-center mt-4"
        >
          <Text className="text-[13px] text-secondaryLabel">
            初めての方は{' '}
            <Text className="text-systemBlue">1問だけ体験する</Text>
          </Text>
        </Pressable>
        </View>
      </View>
    </View>
  );
}
