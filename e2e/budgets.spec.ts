import { test, expect } from "@playwright/test"

test("create a budget and see it on the Budgets page", async ({ page }) => {
  await page.goto("/budgets")
  await page.getByRole("button", { name: "Create Budget" }).first().click()
  await page.getByPlaceholder("e.g. Groceries").fill("E2E Dining Budget")
  await page.locator('input[type="number"]').first().fill("200")
  await page.getByRole("button", { name: "Create Budget" }).last().click()
  await expect(page.getByText("E2E Dining Budget").first()).toBeVisible({ timeout: 10000 })
})
