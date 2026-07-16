import { test, expect } from "@playwright/test"

test("Add Transaction quick action opens the real Add Transaction dialog", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Search or type command/i }).click()
  await page.getByText("Add Transaction", { exact: true }).click()
  await page.waitForURL("**/transactions**")
  await expect(page.getByText("Record a new financial transaction")).toBeVisible({ timeout: 5000 })
})

test("Create Budget quick action opens the real Create Budget dialog", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Search or type command/i }).click()
  await page.getByText("Create Budget", { exact: true }).click()
  await page.waitForURL("**/budgets**")
  await expect(page.getByText("Set a spending limit for a category")).toBeVisible({ timeout: 5000 })
})

test("Transfer Money quick action opens the transaction dialog pre-set to Transfer", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Search or type command/i }).click()
  await page.getByText("Transfer Money", { exact: true }).click()
  await page.waitForURL("**/transactions**")
  await expect(page.getByText("Record a new financial transaction")).toBeVisible({ timeout: 5000 })
})
