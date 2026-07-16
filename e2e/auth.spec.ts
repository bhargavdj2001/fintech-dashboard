import { test, expect } from "@playwright/test"

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e-test@example.com"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2e-test-password-123"

// Override the pre-authenticated storageState — this spec drives the
// actual login UI rather than relying on the token global-setup injected.
test.use({ storageState: { cookies: [], origins: [] } })

test("login with the e2e test account reaches the dashboard", async ({ page }) => {
  await page.goto("/login")
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL)
  await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
})

test("logout returns to the login page", async ({ page }) => {
  await page.goto("/login")
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL)
  await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD)
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/")

  // Sidebar footer: clicking the user button opens a dropdown with "Log out".
  await page.getByText(TEST_EMAIL).click()
  await page.getByText("Log out").click()
  await page.waitForURL("/login")
})

test("unauthenticated visit to a protected page redirects to login", async ({ page }) => {
  await page.goto("/transactions")
  await page.waitForURL("/login")
})
