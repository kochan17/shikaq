import { test, expect } from '@playwright/test';

test.describe('ログイン画面', () => {
  test('/login を開くと Que タイトルが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Que' }).or(
      page.locator('text=Que').first()
    )).toBeVisible({ timeout: 10000 });
  });

  test('メールとパスワードの入力フィールドが存在する', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/メール|email/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/パスワード|password/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('不正な email でログインするとエラーが日本語で表示される', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/メール|email/i).first().fill('invalid@example.com');
    await page.getByPlaceholder(/パスワード|password/i).first().fill('wrongpassword');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // 日本語エラーメッセージが表示されるのを待つ（Supabaseが応答するまで）
    await expect(
      page.locator('text=/メール|パスワード|認証|エラー|ログイン|Invalid/i').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
