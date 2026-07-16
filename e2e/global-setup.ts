import fs from "fs"
import path from "path"

/**
 * This is a single-user app — registration is locked after the first
 * account. To run this suite repeatably, we register (or log into) one
 * fixed test account, save its token as Playwright storageState so every
 * spec starts already authenticated, and remove the account again in
 * global-teardown so the real user's registration slot stays open.
 *
 * Only run this suite against a disposable/empty database. If a real
 * account already exists under different credentials, this will fail
 * loudly rather than silently testing against someone else's data.
 */
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"
const APP_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e-test@example.com"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2e-test-password-123"

export default async function globalSetup() {
  let token: string

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })

  if (registerRes.status === 201) {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    const loginBody = await loginRes.json()
    token = loginBody.access_token
  } else {
    // Registration is closed — try logging in with the fixed test
    // credentials. If this fails, a different real account already owns
    // the one registration slot, and this suite can't run safely here.
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    if (!loginRes.ok) {
      throw new Error(
        "e2e suite requires an empty database (or the fixed e2e test account) — " +
        "a different account already exists and login with E2E test credentials failed. " +
        "Run this suite only against a disposable/test database."
      )
    }
    const loginBody = await loginRes.json()
    token = loginBody.access_token
  }

  const authDir = path.join(__dirname, ".auth")
  fs.mkdirSync(authDir, { recursive: true })
  fs.writeFileSync(
    path.join(authDir, "state.json"),
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: APP_URL,
          localStorage: [{ name: "financialos_token", value: token }],
        },
      ],
    }),
  )

  // Resolve the household_id (required by the accounts endpoint)
  const householdsRes = await fetch(`${API_URL}/households`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const households = await householdsRes.json()
  const householdId = households[0]?.id

  if (!householdId) {
    throw new Error("e2e global-setup: no household found after registration — cannot create test account")
  }

  // Create a test bank account so transaction/shared-expense tests have an
  // account to select without having to create one in each test.
  const accountRes = await fetch(`${API_URL}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      household_id: householdId,
      name: "E2E Bank Account",
      type: "checking",
      currency: "INR",
      opening_balance: 1000,
    }),
  })
  if (!accountRes.ok) {
    const body = await accountRes.text()
    throw new Error(`e2e global-setup: account creation failed ${accountRes.status}: ${body}`)
  }
}
