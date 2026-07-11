"use client"

import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  fetchSettings,
  updateSettings,
  changePassword,
  fetchMe,
  setup2FA,
  verify2FA,
  disable2FA,
  fetchSessions,
  revokeSession,
  revokeOtherSessions,
  updateProfile,
  deleteAccountPermanently,
  deleteAllTransactions,
  importTransactionsCsv,
  type ImportResult,
  fetchTransactions,
  fetchBudgets,
  fetchInvestments,
  fetchNetWorthHistory,
  fetchProfiles,
  fetchCategories,
  fetchHouseholdId,
  createHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
  createCategory,
  updateCategory,
  deleteCategory,
  ServiceUnavailableError,
  type User as ApiUser,
  type AuthSession,
  type TwoFASetup,
  type Profile,
  type Category,
} from "@/lib/api"
import {
  User,
  Bell,
  Palette,
  Shield,
  Download,
  Trash2,
  Check,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
]

const DEFAULT_NOTIFICATIONS = {
  budgetAlerts: true,
  transactionAlerts: true,
  weeklyReport: true,
  monthlyReport: false,
  goalMilestones: true,
  unusualActivity: true,
  emailNotifications: true,
  pushNotifications: false,
}

function HouseholdMembersCard({ profiles, onChange }: { profiles: Profile[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleAdd = async () => {
    if (!newName.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      await createHouseholdMember({ household_id: householdId, name: newName.trim() })
      setNewName("")
      setAdding(false)
      onChange()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member")
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) return
    try {
      await updateHouseholdMember(id, { name: name.trim() })
      onChange()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to rename member")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this household member? This only works if they have no transaction splits or settlements.")) return
    try {
      await deleteHouseholdMember(id)
      onChange()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Household Members</CardTitle>
        <CardDescription>People who share expenses with you in Shared Expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {p.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Input
                defaultValue={p.name}
                className="h-8 max-w-[200px]"
                onBlur={(e) => { if (e.target.value !== p.name) handleRename(p.id, e.target.value) }}
              />
              {p.is_owner && <Badge variant="secondary" className="text-xs">You</Badge>}
            </div>
            {!p.is_owner && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Input
              placeholder="Member name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9"
              autoFocus
            />
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Adding..." : "Add"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setError("") }}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ManageCategoriesCard({ categories, onChange }: { categories: Category[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIsIncome, setNewIsIncome] = useState(false)
  const [newParentId, setNewParentId] = useState("none")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const parentCandidates = categories.filter((c) => c.is_income === newIsIncome && !c.parent_id)

  const handleAdd = async () => {
    if (!newName.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      await createCategory({
        household_id: householdId,
        name: newName.trim(),
        is_income: newIsIncome,
        parent_id: newParentId !== "none" ? newParentId : undefined,
      })
      setNewName("")
      setNewIsIncome(false)
      setNewParentId("none")
      setAdding(false)
      onChange()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add category")
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) return
    try {
      await updateCategory(id, { name: name.trim() })
      onChange()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to rename category")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This only works if no transactions or budgets use it.")) return
    try {
      await deleteCategory(id)
      onChange()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Manage Categories</CardTitle>
        <CardDescription>Custom categories for transactions and budgets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-3 flex-1">
              {c.parent_id && (
                <span className="text-xs text-muted-foreground">
                  ↳ {categoryById.get(c.parent_id)?.name ?? "—"}
                </span>
              )}
              <Input
                defaultValue={c.name}
                className="h-8 max-w-[220px]"
                onBlur={(e) => { if (e.target.value !== c.name) handleRename(c.id, e.target.value) }}
              />
              <Badge variant="secondary" className="text-xs">{c.is_income ? "Income" : "Expense"}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {adding ? (
          <div className="flex flex-wrap items-center gap-2">
            {error && <p className="text-sm text-destructive w-full">{error}</p>}
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9"
              autoFocus
            />
            <Select value={newIsIncome ? "income" : "expense"} onValueChange={(v) => { setNewIsIncome(v === "income"); setNewParentId("none") }}>
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newParentId} onValueChange={setNewParentId}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Parent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent</SelectItem>
                {parentCandidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Adding..." : "Add"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setError("") }}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function swallowUnavailable(err: unknown) {
  if (!(err instanceof ServiceUnavailableError)) console.error(err)
}

export default function SettingsPage() {
  const { theme: nextTheme, setTheme } = useTheme()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">(
    (nextTheme as "light" | "dark" | "system") ?? "dark"
  )
  const [currency, setCurrency] = useState("USD")
  const [fiscalYearStart, setFiscalYearStart] = useState("jan")
  const [dateFormat, setDateFormat] = useState("mdy")
  const [numberFormat, setNumberFormat] = useState("us")
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [notificationsSaved, setNotificationsSaved] = useState(false)

  // Profile tab
  const [me, setMe] = useState<ApiUser | null>(null)
  const [profileName, setProfileName] = useState("")
  const [profileError, setProfileError] = useState("")
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Data tab
  const [exportingType, setExportingType] = useState<string | null>(null)
  const [deletingTransactions, setDeletingTransactions] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Security tab
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [twoFASetup, setTwoFASetup] = useState<TwoFASetup | null>(null)
  const [twoFACode, setTwoFACode] = useState("")
  const [twoFAError, setTwoFAError] = useState("")
  const [twoFABusy, setTwoFABusy] = useState(false)
  const [disableCode, setDisableCode] = useState("")
  const [showDisable2FA, setShowDisable2FA] = useState(false)

  const [sessions, setSessions] = useState<AuthSession[]>([])

  const loadSecurity = useCallback(() => {
    fetchMe().then((u) => { setMe(u); setProfileName(u.name ?? "") }).catch(swallowUnavailable)
    fetchSessions().then(setSessions).catch(swallowUnavailable)
  }, [])

  useEffect(() => { loadSecurity() }, [loadSecurity])

  // Household members + categories
  const [householdMembers, setHouseholdMembers] = useState<Profile[]>([])
  const [manageableCategories, setManageableCategories] = useState<Category[]>([])

  const loadHouseholdData = useCallback(() => {
    fetchProfiles().then(setHouseholdMembers).catch(swallowUnavailable)
    fetchCategories().then(setManageableCategories).catch(swallowUnavailable)
  }, [])

  useEffect(() => { loadHouseholdData() }, [loadHouseholdData])

  const handleSaveProfile = async () => {
    setProfileError("")
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const updated = await updateProfile({ name: profileName.trim() || undefined })
      setMe(updated)
      setProfileSaved(true)
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSavingProfile(false)
    }
  }

  function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
      alert("Nothing to export yet.")
      return
    }
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: "transactions" | "budgets" | "investments" | "networth") => {
    setExportingType(type)
    try {
      if (type === "transactions") {
        const res = await fetchTransactions({ limit: 500 })
        downloadCsv("transactions.csv", res.items.map((t) => ({
          date: t.occurred_at, title: t.title, amount: t.amount, type: t.type,
          category: t.category?.name ?? "", account: t.account?.name ?? "",
        })))
      } else if (type === "budgets") {
        const budgets = await fetchBudgets()
        downloadCsv("budgets.csv", budgets.map((b) => ({
          name: b.name, category: b.category?.name ?? "", amount: b.amount, spent: b.spent, period: b.period_type,
        })))
      } else if (type === "investments") {
        const investments = await fetchInvestments()
        downloadCsv("investments.csv", investments.map((i) => ({
          name: i.name, instrument: i.instrument ?? "", transactions: i.investment_transactions.length,
        })))
      } else {
        const report = await fetchNetWorthHistory()
        if (report.history.length === 0) {
          alert("No net worth history yet — a daily snapshot is recorded automatically, check back after a few days.")
        } else {
          downloadCsv("net-worth-history.csv", report.history.map((h) => ({
            date: h.snapshot_date, total_assets: h.total_assets, total_liabilities: h.total_liabilities, net_worth: h.net_worth,
          })))
        }
      }
    } catch (err) {
      console.error(err)
      alert("Export failed")
    } finally {
      setExportingType(null)
    }
  }

  const handleImportCsv = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      const result = await importTransactionsCsv(file)
      setImportResult(result)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadCsv("transactions-template.csv", [
      { date: "2026-06-01", title: "Groceries", amount: 45.5, type: "expense", account: "", category: "" },
    ])
  }

  const handleDeleteAllTransactions = async () => {
    if (!confirm("Permanently delete ALL transactions? This cannot be undone.")) return
    setDeletingTransactions(true)
    try {
      await deleteAllTransactions()
      alert("All transactions deleted.")
    } catch (err) {
      console.error(err)
      alert("Failed to delete transactions")
    } finally {
      setDeletingTransactions(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Permanently delete your account and ALL data? This cannot be undone.")) return
    if (!confirm("Are you absolutely sure? This is your last chance to cancel.")) return
    setDeletingAccount(true)
    try {
      await deleteAccountPermanently()
      window.location.href = "/login"
    } catch (err) {
      console.error(err)
      alert("Failed to delete account")
      setDeletingAccount(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setPasswordSaved(false)
    if (!currentPassword || !newPassword) { setPasswordError("Fill in all fields"); return }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords don't match"); return }
    setChangingPassword(true)
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
      setPasswordSaved(true)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message.replace(/^API \d+: /, "") : "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleStart2FASetup = async () => {
    setTwoFAError("")
    setTwoFABusy(true)
    try {
      const setup = await setup2FA()
      setTwoFASetup(setup)
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Failed to start 2FA setup")
    } finally {
      setTwoFABusy(false)
    }
  }

  const handleVerify2FA = async () => {
    setTwoFAError("")
    if (!twoFACode) { setTwoFAError("Enter the code from your app"); return }
    setTwoFABusy(true)
    try {
      await verify2FA(twoFACode)
      setTwoFASetup(null)
      setTwoFACode("")
      loadSecurity()
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message.replace(/^API \d+: /, "") : "Invalid code")
    } finally {
      setTwoFABusy(false)
    }
  }

  const handleDisable2FA = async () => {
    setTwoFAError("")
    if (!disableCode) { setTwoFAError("Enter the code from your app"); return }
    setTwoFABusy(true)
    try {
      await disable2FA(disableCode)
      setShowDisable2FA(false)
      setDisableCode("")
      loadSecurity()
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message.replace(/^API \d+: /, "") : "Invalid code")
    } finally {
      setTwoFABusy(false)
    }
  }

  const handleRevokeSession = async (id: string) => {
    if (!confirm("Revoke this session?")) return
    try {
      await revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleRevokeOthers = async () => {
    if (!confirm("Sign out all other sessions?")) return
    try {
      await revokeOtherSessions()
      setSessions((prev) => prev.filter((s) => s.is_current))
    } catch (err) {
      console.error(err)
    }
  }

  const loadSettings = useCallback(() => {
    fetchSettings()
      .then((s) => {
        setCurrency(s.default_currency)
        setFiscalYearStart(s.fiscal_year_start)
        setDateFormat(s.date_format)
        setNumberFormat(s.number_format)
        const t = s.theme as "light" | "dark" | "system"
        setAppearance(t)
        setTheme(t)
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...s.notifications })
      })
      .catch(console.error)
  }, [setTheme])

  useEffect(() => { loadSettings() }, [loadSettings])

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    setPrefsSaved(false)
    try {
      await updateSettings({
        default_currency: currency,
        fiscal_year_start: fiscalYearStart,
        date_format: dateFormat,
        number_format: numberFormat,
      })
      setPrefsSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    setNotificationsSaved(false)
    try {
      await updateSettings({ notifications })
      setNotificationsSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    setAppearance(value)
    setTheme(value)
    try {
      await updateSettings({ theme: value })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
              <CardDescription>Your account name and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {(me?.name || me?.email || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Separator />

              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              {profileSaved && <p className="text-sm text-success">Saved</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={me?.email ?? ""} disabled />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Financial Preferences</CardTitle>
              <CardDescription>Set your default currency and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">{c.symbol}</span>
                            {c.name} ({c.code})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year Start</Label>
                  <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan">January</SelectItem>
                      <SelectItem value="apr">April</SelectItem>
                      <SelectItem value="jul">July</SelectItem>
                      <SelectItem value="oct">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number Format</Label>
                  <Select value={numberFormat} onValueChange={setNumberFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">1,234.56 (US)</SelectItem>
                      <SelectItem value="eu">1.234,56 (EU)</SelectItem>
                      <SelectItem value="in">1,23,456.78 (IN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                {prefsSaved && <span className="text-sm text-success">Saved</span>}
                <Button onClick={handleSavePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <HouseholdMembersCard profiles={householdMembers} onChange={loadHouseholdData} />
          <ManageCategoriesCard categories={manageableCategories} onChange={loadHouseholdData} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notification Channels</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts and reports via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => { toggleNotification("emailNotifications"); setNotificationsSaved(false) }}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <Smartphone className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time alerts on your device
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={() => { toggleNotification("pushNotifications"); setNotificationsSaved(false) }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Alert Preferences</CardTitle>
              <CardDescription>Control which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: "budgetAlerts" as const,
                  label: "Budget Alerts",
                  description: "Notify when approaching or exceeding budget limits",
                },
                {
                  key: "transactionAlerts" as const,
                  label: "Transaction Alerts",
                  description: "Notify for each new transaction",
                },
                {
                  key: "unusualActivity" as const,
                  label: "Unusual Activity",
                  description: "Alert on spending anomalies or unusual patterns",
                },
                {
                  key: "goalMilestones" as const,
                  label: "Goal Milestones",
                  description: "Celebrate when you hit savings goal milestones",
                },
                {
                  key: "weeklyReport" as const,
                  label: "Weekly Summary",
                  description: "Weekly digest of your financial activity",
                },
                {
                  key: "monthlyReport" as const,
                  label: "Monthly Report",
                  description: "Comprehensive monthly financial report",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={() => { toggleNotification(item.key); setNotificationsSaved(false) }}
                  />
                </div>
              ))}
              <div className="flex items-center justify-end gap-3 pt-2">
                {notificationsSaved && <span className="text-sm text-success">Saved</span>}
                <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                  {savingNotifications ? "Saving..." : "Save Notification Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Theme</CardTitle>
              <CardDescription>Choose the application color theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                  { value: "system" as const, label: "System", icon: Monitor },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value)}
                    className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                      appearance === theme.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <theme.icon
                      className={`h-6 w-6 ${
                        appearance === theme.value ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        appearance === theme.value ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {theme.label}
                    </span>
                    {appearance === theme.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Display Preferences</CardTitle>
              <CardDescription>Customize how financial data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "Compact Mode",
                  description: "Show more data with reduced spacing",
                },
                {
                  label: "Show Account Numbers",
                  description: "Display masked account numbers in account list",
                },
                {
                  label: "Colorize Transactions",
                  description: "Use colors to distinguish income and expenses",
                },
                {
                  label: "Show Transaction IDs",
                  description: "Display transaction IDs in lists and tables",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordSaved && <p className="text-sm text-success">Password updated</p>}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${me?.totp_enabled ? "bg-success/10" : "bg-muted"}`}>
                    <Smartphone className={`h-5 w-5 ${me?.totp_enabled ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app to generate codes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {me?.totp_enabled ? (
                    <>
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        <Check className="mr-1 h-3 w-3" />
                        Enabled
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => setShowDisable2FA(true)}>Disable</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleStart2FASetup} disabled={twoFABusy}>
                      {twoFABusy ? "Starting..." : "Enable"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Active Sessions</CardTitle>
              <CardDescription>Manage devices with access to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No active sessions.</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{session.user_agent ?? "Unknown device"}</p>
                          {session.is_current && (
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))
              )}
              {sessions.some((s) => !s.is_current) && (
                <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleRevokeOthers}>
                  Sign Out All Other Sessions
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Export Data</CardTitle>
              <CardDescription>Download your financial data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { type: "transactions" as const, label: "Transaction History", description: "All transactions with categories and notes" },
                { type: "budgets" as const, label: "Budget Data", description: "Budget categories, limits and spending history" },
                { type: "investments" as const, label: "Investment Portfolio", description: "Holdings and transaction counts" },
                { type: "networth" as const, label: "Net Worth History", description: "Historical net worth and asset breakdown" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <Badge variant="secondary" className="text-xs mt-1">CSV</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExport(item.type)} disabled={exportingType === item.type}>
                    <Download className="mr-2 h-4 w-4" />
                    {exportingType === item.type ? "Exporting..." : "Export"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Import Transactions</CardTitle>
              <CardDescription>Bring in transactions from a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Columns: <code className="text-xs">date, title, amount, type</code> (income/expense/transfer),
                and optionally <code className="text-xs">account, category</code>.
              </p>
              {importResult && (
                <p className="text-sm">
                  Imported {importResult.created}, skipped {importResult.skipped}.
                  {importResult.errors.length > 0 && (
                    <span className="text-destructive"> {importResult.errors.map((e) => `Row ${e.row}: ${e.reason}`).join("; ")}</span>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  id="csv-import"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportCsv(file)
                    e.target.value = ""
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={importing}
                  onClick={() => document.getElementById("csv-import")?.click()}
                >
                  {importing ? "Importing..." : "Import Transactions"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Delete All Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove all transaction history
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDeleteAllTransactions}
                  disabled={deletingTransactions}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingTransactions ? "Deleting..." : "Delete"}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deletingAccount}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!twoFASetup} onOpenChange={(v) => !v && setTwoFASetup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>Scan the QR code with your authenticator app, then enter the code it generates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {twoFAError && <p className="text-sm text-destructive">{twoFAError}</p>}
            {twoFASetup && (
              <>
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${twoFASetup.qr_code_base64}`}
                    alt="2FA QR code"
                    className="h-48 w-48 rounded-lg border border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center break-all">
                  Can&apos;t scan? Enter this code manually: {twoFASetup.secret}
                </p>
              </>
            )}
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFASetup(null)} disabled={twoFABusy}>Cancel</Button>
            <Button onClick={handleVerify2FA} disabled={twoFABusy}>{twoFABusy ? "Verifying..." : "Verify & Enable"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Enter a code from your authenticator app to confirm</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {twoFAError && <p className="text-sm text-destructive">{twoFAError}</p>}
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisable2FA(false)} disabled={twoFABusy}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={twoFABusy}>{twoFABusy ? "Disabling..." : "Disable 2FA"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
