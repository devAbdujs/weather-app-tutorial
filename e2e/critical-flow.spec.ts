import { test, expect } from '@playwright/test';

test.describe('Critical E2E Flow: Login -> Take Exam -> Submit', () => {
  test('A user can log in via Dev Bypass, take an exam, and see their score', async ({ page }) => {
    // 0. Bypass Product Tour
    await page.addInitScript(() => {
      window.localStorage.setItem('temari_tour_v1', 'true');
    });

    // 1. Visit Landing Page
    await page.route('**/rest/v1/questions*', async route => {
      const json = [
        {
          id: 'test-1',
          content: 'What is the capital of Ethiopia?',
          option_a: 'Addis Ababa',
          option_b: 'Nairobi',
          option_c: 'Khartoum',
          option_d: 'Djibouti',
          correct_answer: 'A',
          explanation: 'Addis Ababa is the capital.',
          subject: 'Geography',
          exam_type: 'freshman'
        }
      ];
      await route.fulfill({ json });
    });

    await page.goto('/');
    
    // 2. Use DEV BYPASS
    const devBypassButton = page.getByText('DEV BYPASS');
    
    // Wait for the reload to finish
    await Promise.all([
      page.waitForNavigation(),
      devBypassButton.click(),
    ]);

    
    // 3. Complete Onboarding if prompted
    try {
      await expect(
        page.getByText(/What are you/i).or(page.getByText('😉'))
      ).toBeVisible({ timeout: 15000 });
    } catch (e) {
      await page.screenshot({ path: 'failure.png' });
      throw e;
    }

    if (await page.getByText(/What are you/i).isVisible()) {
      await page.getByText('University Freshman Common Courses').click();
      await page.getByRole('button', { name: /Get Started/i }).click();
    }

    // 4. Wait for redirect to Dashboard
    await expect(page.getByText('Practice & Exams')).toBeVisible({ timeout: 10000 });

    // 5. Start a Freshman Exam Session
    // Navigate to practice section
    await page.getByText('Practice & Exams').click();
    
    // Wait for Practice Hub to load and click Geography
    await expect(page.getByText('Geography')).toBeVisible();
    await page.getByText('Geography').first().click();
    
    // Start Practice Part 1
    const startButton = page.getByText('Practice Part 1');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // 6. Answer a question inside ExamWorkspace
    await expect(page.getByText('Submit Exam')).toBeVisible({ timeout: 10000 });
    
    // Answer the first option available
    const firstOption = page.getByRole('button').filter({ hasText: /^A$/i }).first();
    // Alternatively, just click the option containing 'Addis Ababa' since we mocked it
    await page.getByText('Addis Ababa').click();
    
    // Click Next or Submit
    const nextButton = page.getByRole('button', { name: /Next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
    
    // 7. Submit the exam
    await page.getByText('Submit Exam').click();
    
    // 8. Verify Score screen is displayed
    await expect(page.getByText('Exam Completed!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Correct:')).toBeVisible();
    await expect(page.getByText('%')).toBeVisible();
  });
});
