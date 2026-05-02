/**
 * Supabase Auth / fetch エラーを日本語に翻訳する。
 * アスピレーショナル形でなくても可 (エラー文脈なので状況の説明を優先)。
 * ただし「失敗しました」「エラー」を煽らず、淡々と原因を述べる。
 */

interface ErrorWithCode {
  code?: string;
  message?: string;
  status?: number;
}

const MESSAGE_MAP: ReadonlyArray<readonly [RegExp, string]> = [
  // Network
  [/failed to fetch/i, 'ネットワークに接続できませんでした。電波状態を確認してください。'],
  [/network ?error|network ?request ?failed/i, 'ネットワークエラーが発生しました。時間をおいて再度お試しください。'],
  [/timeout|timed ?out/i, '接続がタイムアウトしました。もう一度お試しください。'],

  // Sign in
  [/invalid login credentials/i, 'メールアドレスまたはパスワードが正しくありません。'],
  [/invalid (email|password)/i, 'メールアドレスまたはパスワードが正しくありません。'],
  [/email not confirmed/i, 'メールアドレスの確認が完了していません。受信箱をご確認ください。'],
  [/user not found/i, 'アカウントが見つかりません。'],

  // Sign up
  [/user already registered|already exists/i, 'このメールアドレスは既に登録されています。'],
  [/password should be at least (\d+) characters/i, 'パスワードは$1文字以上で入力してください。'],
  [/weak password|password too short/i, 'パスワードが短すぎます。'],
  [/invalid email/i, 'メールアドレスの形式が正しくありません。'],

  // Rate limit
  [/rate limit|too many requests/i, '操作回数の上限に達しました。しばらくしてから再度お試しください。'],

  // OAuth
  [/oauth|provider/i, 'ソーシャルログインに失敗しました。時間をおいて再度お試しください。'],

  // Reset
  [/email rate limit/i, 'メール送信の上限に達しました。しばらくしてから再度お試しください。'],
];

export function translateAuthError(error: unknown): string {
  if (error === null || error === undefined) return '不明なエラーが発生しました。';

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : ((error as ErrorWithCode).message ?? '');

  if (message === '') return '不明なエラーが発生しました。';

  for (const [pattern, ja] of MESSAGE_MAP) {
    const match = pattern.exec(message);
    if (match !== null) {
      return ja.replace('$1', match[1] ?? '');
    }
  }

  // フォールバック: 元メッセージを括弧書きで残す (デバッグしやすさのため)
  return `エラーが発生しました。 (${message})`;
}
