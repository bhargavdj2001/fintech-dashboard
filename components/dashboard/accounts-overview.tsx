"use client"

import { CreditCard, Building2, PiggyBank, Landmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const accounts = [
  {
    name: "Checking",
    balance: 12450,
    icon: Building2,
    type: "bank",
  },
  {
    name: "Savings",
    balance: 45200,
    icon: PiggyBank,
    type: "savings",
  },
  {
    name: "Credit Card",
    balance: -2340,
    icon: CreditCard,
    type: "credit",
  },
  {
    name: "Investment",
    balance: 156750,
    icon: Landmark,
    type: "investment",
  },
]

export function AccountsOverview() {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.name}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <account.icon className="h-4 w-4 text-muted-foreground" />
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
