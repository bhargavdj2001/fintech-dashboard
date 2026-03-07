"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const cashAccounts = [
  {
    id: "6",
    name: "Wallet",
    type: "wallet",
    balance: 350.0,
    lastUpdated: "Yesterday",
    currency: "USD",
    icon: Banknote,
    color: "text-success",
    bgColor: "bg-success",
    notes: "Daily spending cash",
    recentTransactions: [
      { id: "1", title: "Coffee", amount: -5.5, date: "Mar 7", type: "expense" },
      { id: "2", title: "ATM Withdrawal", amount: 200, date: "Mar 5", type: "income" },
      { id: "3", title: "Lunch", amount: -12.75, date: "Mar 5", type: "expense" },
    ],
  },
  {
    id: "7",
    name: "Safe",
    type: "safe",
    balance: 2000.0,
    lastUpdated: "1 week ago",
    currency: "USD",
    icon: Wallet,
    color: "text-warning",
    bgColor: "bg-warning",
    notes: "Emergency cash reserve",
    recentTransactions: [
      { id: "4", title: "Deposit", amount: 500, date: "Feb 28", type: "income" },
    ],
  },
]

export default function CashAccountsPage() {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(cashAccounts[0])

  const totalCash = cashAccounts.reduce((acc, a) => acc + a.balance, 0)

  const handleUpdateBalance = (account: typeof cashAccounts[0]) => {
    setSelectedAccount(account)
    setIsUpdateOpen(true)
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
              {cashAccounts.length} accounts · ${totalCash.toLocaleString()} total
            </p>
          </div>
        </div>
        <Button size="sm">
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
              Across {cashAccounts.length} accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Quick Add</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <ArrowDownLeft className="mr-2 h-4 w-4 text-success" />
                Record Income
              </Button>
              <Button variant="outline" size="sm">
                <ArrowUpRight className="mr-2 h-4 w-4 text-destructive" />
                Record Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {cashAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${account.bgColor}/10`}>
                    <account.icon className={`h-6 w-6 ${account.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                    <CardDescription>Updated {account.lastUpdated}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUpdateBalance(account)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem>View History</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  ${account.balance.toLocaleString()}
                </p>
                {account.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{account.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUpdateBalance(account)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Update Balance
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Activity
                </p>
                {account.recentTransactions.length > 0 ? (
                  <div className="space-y-1">
                    {account.recentTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              txn.amount > 0 ? "bg-success/10" : "bg-destructive/10"
                            }`}
                          >
                            {txn.amount > 0 ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{txn.title}</p>
                            <p className="text-xs text-muted-foreground">{txn.date}</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            txn.amount > 0 ? "text-success" : "text-foreground"
                          }`}
                        >
                          {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Balance — {selectedAccount.name}</DialogTitle>
            <DialogDescription>
              Manually update the current cash balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold text-foreground">
                ${selectedAccount.balance.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newBalance">New Balance</Label>
              <Input
                id="newBalance"
                type="number"
                placeholder="0.00"
                defaultValue={selectedAccount.balance}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" placeholder="e.g., ATM withdrawal, cash received" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsUpdateOpen(false)}>Update Balance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
