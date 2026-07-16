import { test, expect } from "@playwright/test"

test("add a shared expense split between household members", async ({ page }) => {
  await page.goto("/shared-expenses")
  await page.getByRole("button", { name: /Add Expense/i }).first().click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()

  await dialog.getByPlaceholder("What was the expense for?").fill("E2E Shared Dinner")
  await dialog.locator('input[type="number"]').first().fill("60")

  // Explicitly select the account
  await dialog.locator('button[role="combobox"]').first().click()
  await expect(page.getByRole("option", { name: "E2E Bank Account" })).toBeVisible({ timeout: 5000 })
  await page.getByRole("option", { name: "E2E Bank Account" }).click()
  await dialog.getByRole("button", { name: "Add Expense" }).click()
  await expect(page.getByText("E2E Shared Dinner")).toBeVisible({ timeout: 10000 })
})
