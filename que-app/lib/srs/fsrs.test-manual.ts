/**
 * FSRS 統合 手動テストスクリプト
 *
 * 実行前提:
 *   - supabase start が完了していること
 *   - shikaq-app/.env に EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY が設定済みであること
 *   - Supabase Studio (http://localhost:54323) でテストユーザー + published 問題が存在すること
 *
 * 実行方法:
 *   cd shikaq-app
 *   npx ts-node --project tsconfig.json lib/srs/fsrs.test-manual.ts
 *
 * ---
 *
 * [手順 1] getDailyQueue の確認
 *   - 以下の TEST_USER_ID を Studio で確認した実際の user_id に変更する
 *   - 実行して recall/learn が返ってくることを確認
 *   - 問題が 0 件の場合は Studio で question を published にする
 *
 * [手順 2] recordAnswer の確認
 *   - getDailyQueue の learn[0].id を使って recordAnswer を呼ぶ
 *   - Studio の questions_review_state テーブルに行が追加されていること
 *   - due_at が未来の日付になっていること（enable_short_term=false のため翌日以降）
 *   - quiz_results にも行が追加されていること
 *
 * [手順 3] 復習フローの確認
 *   - 手順 2 の due_at を Studio で過去の日時に直接 UPDATE する
 *   - 再度 getDailyQueue を呼ぶと recall に同じ問題が来ることを確認
 *   - もう一度 recordAnswer を呼ぶと stability が大きくなっていることを確認
 *
 * [手順 4] getReviewStats の確認
 *   - dueToday / dueTomorrow / total が正しい件数を返すことを確認
 *
 * [手順 5] 正答時間によるレーティング確認
 *   - isCorrect=true, elapsedMs=3000 → easy（安定性が大きく伸びる）
 *   - isCorrect=true, elapsedMs=8000 → good（安定性が中程度伸びる）
 *   - isCorrect=false, elapsedMs=任意  → again（lapses が +1 され due_at が短くなる）
 *
 * [手順 6] again (不正解) フローの確認
 *   - recordAnswer を isCorrect=false で呼ぶ
 *   - questions_review_state.lapses が +1 され、due_at が近い未来になること
 */

import { getDailyQueue, getReviewStats, recordAnswer } from './fsrs';

const TEST_USER_ID = 'replace-with-actual-user-id';

async function main(): Promise<void> {
  console.log('--- getDailyQueue ---');
  const queue = await getDailyQueue(TEST_USER_ID, 7, 3);
  console.log('recall count:', queue.recall.length);
  console.log('learn count:', queue.learn.length);

  if (queue.learn.length > 0) {
    const q = queue.learn[0];
    console.log('\n--- recordAnswer (correct, 3s) ---');
    await recordAnswer({
      userId: TEST_USER_ID,
      questionId: q.id,
      selectedChoiceId: q.correct_choice_id ?? 'a',
      isCorrect: true,
      elapsedMs: 3000,
    });
    console.log('recorded for question:', q.id);
  }

  console.log('\n--- getReviewStats ---');
  const stats = await getReviewStats(TEST_USER_ID);
  console.log('dueToday:', stats.dueToday);
  console.log('dueTomorrow:', stats.dueTomorrow);
  console.log('total:', stats.total);
}

main().catch((e: unknown) => {
  if (e instanceof Error) {
    console.error(e.message);
  }
  process.exit(1);
});
