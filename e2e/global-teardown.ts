import fs from "fs"
import path from "path"

/**
 * Deletes the e2e test account (and all its data) so the registration
 * slot is open again for the real user afterward.
 */
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"

export default async function globalTeardown() {
  const statePath = path.join(__dirname, ".auth", "state.json")
  if (!fs.existsSync(statePath)) return

  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"))
  const token = state.origins?.[0]?.localStorage?.find((kv: { name: string }) => kv.name === "financialos_token")?.value
  if (!token) return

  await fetch(`${API_URL}/auth/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})

  fs.rmSync(path.dirname(statePath), { recursive: true, force: true })
}
