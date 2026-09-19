# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flow.spec.ts >> Critical E2E Flow: Login -> Take Exam -> Submit >> A user can log in via Dev Bypass, take an exam, and see their score
- Location: e2e/critical-flow.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button').filter({ hasText: /Exam|Set/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button').filter({ hasText: /Exam|Set/i }).first() with timeout 5000ms
  - waiting for getByRole('button').filter({ hasText: /Exam|Set/i }).first()

```

```yaml
- main:
  - button
  - heading "Geography" [level=1]
  - paragraph: Freshman Exam Bank
  - button "Midterm"
  - button "Final"
  - link "Home":
    - /url: /
  - link "Practice":
    - /url: /practice
  - link "Progress":
    - /url: /mastery
  - link "Profile":
    - /url: /profile
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Critical E2E Flow: Login -> Take Exam -> Submit', () => {
  4   |   test('A user can log in via Dev Bypass, take an exam, and see their score', async ({ page }) => {
  5   |     // 0. Bypass Product Tour
  6   |     await page.addInitScript(() => {
  7   |       window.localStorage.setItem('temari_tour_v1', 'true');
  8   |     });
  9   | 
  10  |     // 1. Visit Landing Page
  11  |     await page.route('**/rest/v1/questions*', async route => {
  12  |       const json = [
  13  |         {
  14  |           id: 'test-1',
  15  |           content: 'What is the capital of Ethiopia?',
  16  |           option_a: 'Addis Ababa',
  17  |           option_b: 'Nairobi',
  18  |           option_c: 'Khartoum',
  19  |           option_d: 'Djibouti',
  20  |           correct_answer: 'A',
  21  |           explanation: 'Addis Ababa is the capital.',
  22  |           subject: 'Geography',
  23  |           exam_type: 'freshman'
  24  |         }
  25  |       ];
  26  |       await route.fulfill({ json });
  27  |     });
  28  | 
  29  |     await page.goto('/');
  30  |     
  31  |     // 2. Use DEV BYPASS
  32  |     const devBypassButton = page.getByText('DEV BYPASS');
  33  |     
  34  |     // Wait for the reload to finish
  35  |     await Promise.all([
  36  |       page.waitForNavigation(),
  37  |       devBypassButton.click(),
  38  |     ]);
  39  | 
  40  |     
  41  |     // 3. Complete Onboarding if prompted
  42  |     try {
  43  |       // It might go to onboarding OR directly to Dashboard if the Dev User is already initialized in DB
  44  |       await expect(
  45  |         page.getByText(/What are you/i)
  46  |           .or(page.getByText('😉'))
  47  |           .or(page.getByText('Practice & Exams'))
  48  |       ).toBeVisible({ timeout: 15000 });
  49  |     } catch (e) {
  50  |       await page.screenshot({ path: 'failure.png' });
  51  |       throw e;
  52  |     }
  53  | 
  54  |     if (await page.getByText(/What are you/i).isVisible()) {
  55  |       await page.getByText('University Freshman Common Courses').click();
  56  |       await page.getByRole('button', { name: /Get Started/i }).click();
  57  |     }
  58  | 
  59  |     // 4. Wait for redirect to Dashboard
  60  |     await expect(page.getByText('Practice & Exams')).toBeVisible({ timeout: 10000 });
  61  | 
  62  |     // 5. Start a Freshman Exam Session
  63  |     await page.goto('/practice');
  64  |     
  65  |     // If Dev Mode tabs are visible, ensure we are on Freshman to match the mock
  66  |     const freshmanTab = page.getByRole('button', { name: /Freshman/i });
  67  |     if (await freshmanTab.isVisible()) {
  68  |       await freshmanTab.click();
  69  |     }
  70  |     
  71  |     // Wait for Practice Hub to load and click Geography
  72  |     await expect(page.getByText('Geography').first()).toBeVisible({ timeout: 15000 });
  73  |     await page.getByText('Geography').first().click();
  74  |     
  75  |     // Start the first available session (works for Midterm, Practice Set, or Entrance Year)
  76  |     const firstSession = page.getByRole('button').filter({ hasText: /Exam|Set/i }).first();
> 77  |     await expect(firstSession).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  78  |     await firstSession.click();
  79  |     
  80  |     // Select Practice Mode from the modal
  81  |     const practiceModeButton = page.getByText('Practice Mode');
  82  |     await expect(practiceModeButton).toBeVisible();
  83  |     await practiceModeButton.click();
  84  |     
  85  |     // 6. Answer a question inside ExamWorkspace
  86  |     await page.waitForTimeout(2000); // Wait for animations or errors to render
  87  |     await page.screenshot({ path: 'before-submit-check.png' });
  88  |     await expect(page.getByText('Submit')).toBeVisible({ timeout: 10000 });
  89  |     
  90  |     // Answer the first option available
  91  |     // Alternatively, just click the option containing 'Addis Ababa' since we mocked it
  92  |     await page.getByText('Addis Ababa').click();
  93  |     
  94  |     // Click Next or Submit
  95  |     const nextButton = page.getByRole('button', { name: /Next/i });
  96  |     if (await nextButton.isVisible()) {
  97  |       await nextButton.click();
  98  |     }
  99  |     
  100 |     // 7. Submit the exam
  101 |     await page.getByText('Submit').click();
  102 |     
  103 |     // 8. Verify Score screen is displayed
  104 |     await expect(page.getByText('Exam Completed!')).toBeVisible({ timeout: 5000 });
  105 |     await expect(page.getByText('Correct:')).toBeVisible();
  106 |     await expect(page.getByText('%')).toBeVisible();
  107 |   });
  108 | });
  109 | 
```