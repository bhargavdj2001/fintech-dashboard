"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useCurrency } from "@/lib/currency"
import {
  fetchAccounts,
  fetchHouseholdId,
  createAccount,
  deleteAccount,
  type Account,
} from "@/lib/api"
import {
  Plus,
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  MoreHorizontal,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TYPE_ICON: Record<string, typeof Building2> = {
  checking: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet,
  investment: TrendingUp,
}

const TYPE_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  cash: "Cash",
  investment: "Investment",
}

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

function AddAccountDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (a: Account) => void
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"checking" | "savings" | "credit" | "cash" | "investment">("checking")
  const [balance, setBalance] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const householdId = await fetchHouseholdId()
      const created = await createAccount({
        household_id: householdId,
        name: name.trim(),
        type,
        opening_balance: balance ? parseFloat(balance) : 0,
      })
      onCreated(created)
      setName("")
      setType("checking")
      setBalance("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>Manually add a financial account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "checking" | "savings" | "credit" | "cash" | "investment")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Bank - Checking</SelectItem>
                <SelectItem value="savings">Bank - Savings</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input placeholder="e.g., Primary Checking" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding..." : "Add Account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountRow({
  account,
  index,
  onRemoved,
}: {
  account: Account
  index: number
  onRemoved: (id: string) => void
}) {
  const { format } = useCurrency()
  const Icon = TYPE_ICON[account.type] ?? Building2
  const color = COLORS[index % COLORS.length]

  const handleRemove = async () => {
    if (!confirm(`Remove "${account.name}"?`)) return
    try {
      await deleteAccount(account.id)
      onRemoved(account.id)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove account")
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}/10`}>
          <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
        </div>
        <div>
          <p className="font-medium text-foreground">{account.name}</p>
          <p className="text-sm text-muted-foreground">{TYPE_LABEL[account.type] ?? account.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className={`text-xl font-bold tabular-nums ${account.current_balance < 0 ? "text-destructive" : "text-foreground"}`}>
          {format(account.current_balance)}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={handleRemove}>
              Remove Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const { format } = useCurrency()
  const [showBalances, setShowBalances] = useState(true)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const loadAccounts = useCallback(() => {
    setLoading(true)
    fetchAccounts()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const bank = accounts.filter((a) => a.type === "checking" || a.type === "savings")
  const credit = accounts.filter((a) => a.type === "credit")
  const cash = accounts.filter((a) => a.type === "cash")
  const investment = accounts.filter((a) => a.type === "investment")

  const totalBank = bank.reduce((acc, a) => acc + a.current_balance, 0)
  const totalCredit = credit.reduce((acc, a) => acc + Math.abs(a.current_balance), 0)
  const totalCash = cash.reduce((acc, a) => acc + a.current_balance, 0)
  const totalInvestment = investment.reduce((acc, a) => acc + a.current_balance, 0)
  const netWorth = totalBank + totalCash + totalInvestment - totalCredit

  const formatBalance = (amount: number) => {
    if (!showBalances) return "****"
    return format(amount)
  }

  const handleCreated = (a: Account) => setAccounts((prev) => [...prev, a])
  const handleRemoved = (id: string) => setAccounts((prev) => prev.filter((a) => a.id !== id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all your financial accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {showBalances ? "Hide" : "Show"} Balances
          </Button>
          <Button size="sm" onClick={() => setIsAddAccountOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="text-3xl font-bold text-foreground">{formatBalance(netWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Bank Accounts</p>
            <p className="text-xl font-bold text-foreground">{formatBalance(totalBank)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bank.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Credit Cards</p>
            <p className="text-xl font-bold text-destructive">-{formatBalance(totalCredit)}</p>
            <p className="text-xs text-muted-foreground mt-1">{credit.length} cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Investments</p>
            <p className="text-xl font-bold text-foreground">{formatBalance(totalInvestment)}</p>
            <p className="text-xs text-muted-foreground mt-1">{investment.length} accounts</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No accounts yet. Add one to get started.</p>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Accounts</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="credit">Credit Cards</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
                    <CardDescription>{bank.length} accounts</CardDescription>
                  </div>
                  <Link href="/accounts/bank">
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bank.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Credit Cards</CardTitle>
                    <CardDescription>{credit.length} cards</CardDescription>
                  </div>
                  <Link href="/accounts/cards">
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {credit.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Cash Accounts</CardTitle>
                    <CardDescription>{cash.length} accounts</CardDescription>
                  </div>
                  <Link href="/accounts/cash">
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cash.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Investment Accounts</CardTitle>
                    <CardDescription>{investment.length} accounts</CardDescription>
                  </div>
                  <Link href="/investments">
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {investment.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
                <CardDescription>All your bank accounts in one place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bank.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Credit Cards</CardTitle>
                <CardDescription>Manage your credit cards and balances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {credit.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Cash Accounts</CardTitle>
                <CardDescription>Track your physical cash and wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cash.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investment">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Investment Accounts</CardTitle>
                <CardDescription>Your investment portfolio accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {investment.map((a, i) => <AccountRow key={a.id} account={a} index={i} onRemoved={handleRemoved} />)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AddAccountDialog open={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} onCreated={handleCreated} />
    </div>
  )
}
