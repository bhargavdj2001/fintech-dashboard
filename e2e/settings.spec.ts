import { test, expect } from "@playwright/test"

test("update profile name and see it persist after reload", async ({ page }) => {
  await page.goto("/settings")
  await page.locator("#name").fill("E2E Test Name")
  await page.getByRole("button", { name: "Save Changes" }).click()
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 })
  await page.reload()
  await expect(page.locator("#name")).toHaveValue("E2E Test Name")
})

test("add a household member", async ({ page }) => {
  await page.goto("/settings")
  await page.getByRole("button", { name: "Add Member" }).click()
  await page.getByPlaceholder("Member name").fill("E2E Roommate")
  await page.getByRole("button", { name: "Add", exact: true }).click()
  // inputs use defaultValue (uncontrolled) — check the DOM value property via waitForFunction
  await page.waitForFunction(
    (name: string) => Array.from(document.querySelectorAll("input")).some((i) => (i as HTMLInputElement).value === name),
    "E2E Roommate",
    { timeout: 10000 },
  )
})

test("add a custom category", async ({ page }) => {
  await page.goto("/settings")
  await page.getByRole("button", { name: "Add Category" }).click()
  await page.getByPlaceholder("Category name").fill("E2E Pet Supplies")
  await page.getByRole("button", { name: "Add", exact: true }).click()
  await page.waitForFunction(
    (name: string) => Array.from(document.querySelectorAll("input")).some((i) => (i as HTMLInputElement).value === name),
    "E2E Pet Supplies",
    { timeout: 10000 },
  )
})
