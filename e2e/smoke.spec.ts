import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Active site panel (slide track keeps all three mounted; only one is shown). */
const activePanel = (page: Page) => page.locator('div[role="tabpanel"][aria-hidden="false"]');

test.describe('hand-gesture-control smoke', () => {
  test('shell renders: hero, header tabs, docked commands', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Control this page');
    await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Command center')).toBeVisible();
    await expect(page.getByRole('link', { name: /back to top/i })).toBeVisible();
  });

  test('site tabs switch via header, keyboard, and slide', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(
      activePanel(page).getByRole('heading', { name: 'Settings & distance', exact: true })
    ).toBeAttached();
    await page.keyboard.press('3');
    await expect(page.getByRole('tab', { name: 'Insights' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(activePanel(page).getByRole('heading', { name: 'Gesture Lab' })).toBeAttached();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('simulated victory flips the theme through the real pipeline', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.evaluate(() =>
      (window as unknown as { __hgcSimulate: (g: string) => void }).__hgcSimulate('victory')
    );
    // The flipped theme class is the durable effect (the toast is transient by design).
    await expect(html).not.toHaveClass(/dark/, { timeout: 5000 });
  });

  test('keyboard v flips the theme back, header button too', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await page.keyboard.press('v');
    await expect(html).not.toHaveClass(/dark/, { timeout: 5000 });
    await page.getByRole('button', { name: /switch to dark mode/i }).click();
    await expect(html).toHaveClass(/dark/, { timeout: 5000 });
  });

  test('camera loader resolves (fake device in CI, real grant locally)', async ({ page }) => {
    await page.goto('/');
    // Either the model initializes on the fake feed or a legible error shows —
    // both prove the loader settled instead of hanging.
    await expect(page.getByText('Initializing AI…')).toBeHidden({ timeout: 90000 });
  });

  test('axe: no accessibility violations on the shell', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
