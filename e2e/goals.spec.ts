import { test, expect } from "@playwright/test"

test("create a goal and contribute to it", async ({ page }) => {
  await page.goto("/goals")
  await page.getByRole("button", { name: "New Goal" }).click()
  await page.getByPlaceholder(/Emergency Fund, Vacation/).fill("E2E Travel Fund")
  await page.locator('input[type="number"]').first().fill("1000")
  await page.getByRole("button", { name: "Create Goal" }).click()
  await expect(page.getByText("E2E Travel Fund")).toBeVisible({ timeout: 10000 })
})
