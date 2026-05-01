import { test, expect } from '@playwright/test';

// Today 系は EXPO_PUBLIC_DEV_BYPASS_AUTH=true が必要。
// dev サーバーを DEV_BYPASS_AUTH=true で起動してから実行すること。
// CI では env 変数を注入した上で expo web を起動する（Phase 2）。

test.describe('Today 画面 (bypass auth 必須)', () => {
  test.skip('/ を開くと Today 画面が表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Today').first()).toBeVisible({ timeout: 15000 });
  });

  test.skip('Sidebar の主要メニューが表示される', async ({ page }) => {
    await page.goto('/');
    // sidebar には Today / 学習 / 演習 などが表示される
    await expect(page.locator('text=学習').first()).toBeVisible({ timeout: 10000 });
  });

  test.skip('Daily Ring（アクティビティリング）が表示される', async ({ page }) => {
    await page.goto('/');
    // ActivityRings は SVG で描画される
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
  });
});
