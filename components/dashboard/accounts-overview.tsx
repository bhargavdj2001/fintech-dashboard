"use client"

import { useEffect, useState } from "react"
import { CreditCard, Building2, PiggyBank, Landmark, Banknote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from "@/components/ui/card"
import { fetchAccounts, type Account } from "@/lib/api"

function accountIcon(type: string) {
  switch (type.toLowerCase()) {
    case "savings": return PiggyBank
    case "credit": return CreditCard
    case "investment": return Landmark
    case "loan": return Banknote
    default: return Building2
  }
}

export function AccountsOverview() {
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetchAccounts().then(setAccounts).catch(console.error)
  }, [])

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No accounts found.</p>
          )}
          {accounts.map((account) => {
            const Icon = accountIcon(account.type)
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{account.name}</span>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    account.balance < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {account.balance < 0 ? "-" : ""}$
                  {Math.abs(account.balance).toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
