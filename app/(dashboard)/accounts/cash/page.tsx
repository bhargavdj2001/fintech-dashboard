"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  fetchAccounts,
  fetchTransactions,
  updateAccountBalance,
  type Account,
  type Transaction,
} from "@/lib/api"
import {
  Banknote,
  Wallet,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

// Cash-type account values that may appear in the DB
function isCashAccount(type: string) {
  const t = type.toLowerCase()
  return t === "cash" || t === "wallet" || t === "safe" || t.includes("cash")
}

function accountIcon(type: string) {
  const t = type.toLowerCase()
  if (t === "wallet" || t.includes("wallet")) return Wallet
  return Banknote
}

function accountColor(type: string) {
  const t = type.toLowerCase()
  if (t === "wallet") return { text: "text-success", bg: "bg-success" }
  if (t === "safe") return { text: "text-warning", bg: "bg-warning" }
  return { text: "text-primary", bg: "bg-primary" }
}

export default function CashAccountsPage() {
  const [cashAccounts, setCashAccounts] = useState<Account[]>([])
  const [txnsByAccount, setTxnsByAccount] = useState<Record<string, Transaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newBalance, setNewBalance] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadData = useCallback(() => {
    setLoading(true)
    fetchAccounts()
      .then(async (accounts) => {
        const cash = accounts.filter((a) => isCashAccount(a.type))
        setCashAccounts(cash)
        // Load recent transactions for each cash account
        const entries = await Promise.all(
          cash.map((a) =>
            fetchTransactions({ account_id: a.id, limit: 5 })
              .then((res) => [a.id, res.items] as [string, Transaction[]])
              .catch(() => [a.id, []] as [string, Transaction[]])
          )
        )
        setTxnsByAccount(Object.fromEntries(entries))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenUpdate = (account: Account) => {
    setSelectedAccount(account)
    setNewBalance(String(account.balance))
    setError("")
    setIsUpdateOpen(true)
  }

  const handleUpdateBalance = async () => {
    if (!selectedAccount) return
    const val = parseFloat(newBalance)
    if (isNaN(val) || val < 0) { setError("Enter a valid non-negative balance"); return }
    setSaving(true)
    setError("")
    try {
      const updated = await updateAccountBalance(selectedAccount.id, val)
      setCashAccounts((prev) => prev.map((a) => a.id === updated.id ? updated : a))
      setIsUpdateOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update balance")
    } finally {
      setSaving(false)
    }
  }

  const totalCash = cashAccounts.reduce((acc, a) => acc + a.balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (cashAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/accounts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cash Accounts</h1>
            <p className="text-sm text-muted-foreground">No cash accounts found</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Banknote className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No cash accounts in your data.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Accounts with type "cash", "wallet", or "safe" will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accounts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cash Accounts</h1>
            <p className="text-sm text-muted-foreground">
              {cashAccounts.length} account{cashAccounts.length !== 1 ? "s" : ""} · ${totalCash.toLocaleString()} total
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Cash Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Cash</p>
            <p className="text-3xl font-bold text-foreground">${totalCash.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {cashAccounts.length} account{cashAccounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Quick Add</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/transactions">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowDownLeft className="mr-2 h-4 w-4 text-success" />
                  Record Income
                </Button>
              </Link>
              <Link href="/transactions">
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowUpRight className="mr-2 h-4 w-4 text-destructive" />
                  Record Expense
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {cashAccounts.map((account) => {
          const Icon = accountIcon(account.type)
          const color = accountColor(account.type)
          const txns = txnsByAccount[account.id] ?? []

          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color.bg}/10`}>
                      <Icon className={`h-6 w-6 ${color.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {account.type.replace(/_/g, " ")} · {account.currency}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenUpdate(account)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Balance
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/transactions">View History</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  {account.last_synced_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Updated {new Date(account.last_synced_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleOpenUpdate(account)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Update Balance
                </Button>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Activity
                  </p>
                  {txns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No recent activity</p>
                  ) : (
                    <div className="space-y-1">
                      {txns.map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                txn.type === "income" ? "bg-success/10" : "bg-destructive/10"
                              }`}
                            >
                              {txn.type === "income" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{txn.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(txn.occurred_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              txn.type === "income" ? "text-success" : "text-foreground"
                            }`}
                          >
                            {txn.type === "income" ? "+" : "-"}${txn.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Balance — {selectedAccount?.name}</DialogTitle>
            <DialogDescription>Manually update the current cash balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold text-foreground">
                ${selectedAccount?.balance.toLocaleString() ?? "0"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newBalance">New Balance</Label>
              <Input
                id="newBalance"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBalance} disabled={saving}>
              {saving ? "Updating..." : "Update Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
