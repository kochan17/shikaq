# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> ログイン画面 >> 不正な email でログインするとエラーが日本語で表示される
- Location: tests/auth.spec.ts:17:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:8081/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('ログイン画面', () => {
  4  |   test('/login を開くと shikaq タイトルが表示される', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await expect(page.getByRole('heading', { name: 'shikaq' }).or(
  7  |       page.locator('text=shikaq').first()
  8  |     )).toBeVisible({ timeout: 10000 });
  9  |   });
  10 | 
  11 |   test('メールとパスワードの入力フィールドが存在する', async ({ page }) => {
  12 |     await page.goto('/login');
  13 |     await expect(page.getByPlaceholder(/メール|email/i).first()).toBeVisible({ timeout: 10000 });
  14 |     await expect(page.getByPlaceholder(/パスワード|password/i).first()).toBeVisible({ timeout: 10000 });
  15 |   });
  16 | 
  17 |   test('不正な email でログインするとエラーが日本語で表示される', async ({ page }) => {
> 18 |     await page.goto('/login');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  19 |     await page.getByPlaceholder(/メール|email/i).first().fill('invalid@example.com');
  20 |     await page.getByPlaceholder(/パスワード|password/i).first().fill('wrongpassword');
  21 |     await page.getByRole('button', { name: /ログイン/i }).click();
  22 | 
  23 |     // 日本語エラーメッセージが表示されるのを待つ（Supabaseが応答するまで）
  24 |     await expect(
  25 |       page.locator('text=/メール|パスワード|認証|エラー|ログイン|Invalid/i').first()
  26 |     ).toBeVisible({ timeout: 15000 });
  27 |   });
  28 | });
  29 | 
```