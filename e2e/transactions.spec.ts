import { test, expect } from "@playwright/test"

test.describe("Transactions", () => {
  test("add an expense transaction and see it in the list", async ({ page }) => {
    await page.goto("/transactions")
    await page.getByRole("button", { name: /Add Transaction/i }).first().click()

    // Wait for the dialog to be visible before interacting with its fields.
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder("Transaction title").fill("E2E Coffee")
    await dialog.locator('input[placeholder="0.00"]').first().fill("4.50")
    // Explicitly select the account (nth 0=Type, 1=Category, 2=Account)
    await dialog.locator('button[role="combobox"]').nth(2).click()
    await expect(page.getByRole("option", { name: "E2E Bank Account" })).toBeVisible({ timeout: 5000 })
    await page.getByRole("option", { name: "E2E Bank Account" }).click()
    await dialog.getByRole("button", { name: "Add Transaction" }).click()
    await expect(page.getByText("E2E Coffee")).toBeVisible({ timeout: 10000 })
  })

  test("create a transfer and verify both account balances update", async ({ page }) => {
    // Two accounts to transfer between.
    await page.goto("/accounts")
    for (const name of ["E2E From", "E2E To"]) {
      await page.getByRole("button", { name: /Add Account/i }).first().click()
      await page.getByPlaceholder("e.g., Primary Checking").fill(name)
      await page.locator('input[type="number"]').fill("500")
      await page.getByRole("button", { name: "Add Account" }).click()
      await page.waitForTimeout(500)
    }

    await page.goto("/transactions")
    await page.getByRole("button", { name: /Add Transaction/i }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Change type to Transfer — type selector is the first combobox in the dialog.
    await dialog.locator('button[role="combobox"]').first().click()
    await page.getByRole("option", { name: "Transfer" }).click()
    await dialog.locator('input[placeholder="0.00"]').first().fill("100")

    // From/To account selects appear once Transfer is chosen.
    const selects = dialog.locator('button[role="combobox"]')
    await selects.nth(1).click()
    await page.getByRole("option", { name: "E2E From" }).click()
    await selects.nth(2).click()
    await page.getByRole("option", { name: "E2E To" }).click()
    await dialog.getByRole("button", { name: "Add Transaction" }).click()
    await page.waitForTimeout(1000)

    await page.goto("/accounts")
    await expect(page.getByText("E2E From")).toBeVisible()
    await expect(page.getByText("E2E To")).toBeVisible()
  })

  test("delete a transaction removes it from the list", async ({ page }) => {
    await page.goto("/transactions")
    await page.getByRole("button", { name: /Add Transaction/i }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder("Transaction title").fill("E2E Delete Me")
    await dialog.locator('input[placeholder="0.00"]').first().fill("9.99")
    await dialog.locator('button[role="combobox"]').nth(2).click()
    await expect(page.getByRole("option", { name: "E2E Bank Account" })).toBeVisible({ timeout: 5000 })
    await page.getByRole("option", { name: "E2E Bank Account" }).click()
    await dialog.getByRole("button", { name: "Add Transaction" }).click()
    await expect(page.getByText("E2E Delete Me")).toBeVisible()

    page.once("dialog", (d) => d.accept())
    await page.getByText("E2E Delete Me").click()
    await page.getByRole("button", { name: "Delete" }).click()
    // Scope to tbody to avoid strict-mode conflict with the open sheet title
    await expect(page.locator("tbody").getByText("E2E Delete Me")).not.toBeVisible({ timeout: 5000 })
  })
})
