import { test, expect } from '@playwright/test';

test.describe('オンボーディング', () => {
  test('/onboarding を開くと 4 資格のタイルが表示される', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('text=ITパスポート').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=基本情報技術者').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SPI').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=簿記').first()).toBeVisible({ timeout: 10000 });
  });

  test('ITパスポートを選択すると preview ページに遷移する', async ({ page }) => {
    await page.goto('/onboarding');
    await page.locator('text=ITパスポート').first().click();
    await expect(page).toHaveURL(/\/onboarding\/preview/, { timeout: 10000 });
    await expect(page.url()).toContain('cert=ip');
  });

  test('preview で選択肢をタップすると result に遷移する', async ({ page }) => {
    await page.goto('/onboarding/preview?cert=ip');
    // 最初の選択肢ボタンをクリック
    const choices = page.locator('[role="button"], button, [data-testid="choice"]');
    await choices.first().waitFor({ timeout: 10000 });
    await choices.first().click();
    await expect(page).toHaveURL(/\/onboarding\/result/, { timeout: 10000 });
  });

  test('result ページに「続きを始める」ボタンが表示される', async ({ page }) => {
    await page.goto('/onboarding/result?cert=ip&correct=true');
    await expect(
      page.locator('text=/続きを始める|はじめる|登録|サインアップ/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
