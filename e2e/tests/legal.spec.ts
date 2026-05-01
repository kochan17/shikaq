import { test, expect } from '@playwright/test';

// legal ページは #50（法的ページ実装）完了後に有効化
// 現時点では shikaq-app/legal/ に markdown があるが Expo Router ルートは未作成

const LEGAL_PAGES = [
  { path: '/legal/terms', name: '利用規約' },
  { path: '/legal/privacy', name: 'プライバシーポリシー' },
  { path: '/legal/tokushoho', name: '特定商取引法' },
] as const;

for (const { path, name } of LEGAL_PAGES) {
  test.skip(`${path} が 200 で表示され H1 が存在する`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1, [role="heading"][aria-level="1"]').first()).toBeVisible({
      timeout: 10000,
    });
    // ページタイトルまたは本文に名称が含まれる
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 10000 });
  });
}
