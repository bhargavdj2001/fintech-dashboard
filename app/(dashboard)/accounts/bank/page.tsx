"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useCurrency } from "@/lib/currency"
import {
  Building2,
  PiggyBank,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
} from "lucide-react"
import {
  fetchAccounts,
  fetchTransactions,
  createAccount,
  deleteAccount,
  fetchHouseholdId,
  type Account,
  type Transaction,
} from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const COLORS = [
  { text: "text-chart-1", bg: "bg-chart-1" },
  { text: "text-chart-2", bg: "bg-chart-2" },
  { text: "text-chart-3", bg: "bg-chart-3" },
  { text: "text-chart-4", bg: "bg-chart-4" },
  { text: "text-chart-5", bg: "bg-chart-5" },
]

function AddBankAccountDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (a: Account) => void
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"checking" | "savings">("checking")
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
          <DialogTitle>Add Bank Account</DialogTitle>
          <DialogDescription>Manually add a checking or savings account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "checking" | "savings")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary Checking" />
          </div>
          <div className="space-y-2">
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" />
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

export default function BankAccountsPage() {
  const { format } = useCurrency()
  const [bankAccounts, setBankAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)

  const loadAccounts = useCallback(() => {
    fetchAccounts()
      .then((data) => {
        const bank = data.filter((a) => a.type === "checking" || a.type === "savings")
        setBankAccounts(bank)
        setSelectedAccount((prev) => prev && bank.some((a) => a.id === prev.id) ? prev : bank[0] ?? null)
      })
      .catch(console.error)
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  useEffect(() => {
    if (!selectedAccount) { setRecentTxns([]); return }
    fetchTransactions({ account_id: selectedAccount.id, limit: 8 })
      .then((res) => setRecentTxns(res.items))
      .catch(console.error)
  }, [selectedAccount])

  const totalBalance = bankAccounts.reduce((acc, a) => acc + a.current_balance, 0)

  const handleCreated = (a: Account) => {
    setBankAccounts((prev) => [...prev, a])
    setSelectedAccount(a)
  }

  const handleRemove = async (account: Account) => {
    if (!confirm(`Remove "${account.name}"?`)) return
    try {
      await deleteAccount(account.id)
      setBankAccounts((prev) => prev.filter((a) => a.id !== account.id))
      if (selectedAccount?.id === account.id) setSelectedAccount(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove account")
    }
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bank Accounts</h1>
            <p className="text-sm text-muted-foreground">
              {bankAccounts.length} accounts · {format(totalBalance)} total
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All Accounts
          </h2>
          {bankAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bank accounts yet.</p>
          ) : (
            bankAccounts.map((account, idx) => {
              const Icon = account.type === "savings" ? PiggyBank : Building2
              const color = COLORS[idx % COLORS.length]
              return (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all hover:bg-muted/30 ${
                    selectedAccount?.id === account.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color.bg}/10`}>
                          <Icon className={`h-5 w-5 ${color.text}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(account)}>
                            Remove Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold text-foreground">
                        {format(account.current_balance)}
                      </p>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {account.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedAccount ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Select an account to view details.</p>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                    <CardDescription>{selectedAccount.name}</CardDescription>
                  </div>
                  <Link href="/transactions">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTxns.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No recent transactions.</p>
                ) : (
                  recentTxns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            txn.type === "income"
                              ? "bg-success/10"
                              : txn.type === "transfer"
                              ? "bg-primary/10"
                              : "bg-destructive/10"
                          }`}
                        >
                          {txn.type === "income" ? (
                            <ArrowDownLeft className="h-4 w-4 text-success" />
                          ) : txn.type === "transfer" ? (
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
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
                        {format(txn.type === "income" ? txn.amount : -txn.amount, { signDisplay: "exceptZero" })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddBankAccountDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} />
    </div>
  )
}
