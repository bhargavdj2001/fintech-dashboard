"use client"

import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const transactions = [
  {
    id: "1",
    title: "Salary Deposit",
    category: "Income",
    amount: 5200,
    type: "income",
    date: "Mar 1, 2024",
    merchant: "Acme Corp",
  },
  {
    id: "2",
    title: "Grocery Shopping",
    category: "Food & Dining",
    amount: -127.45,
    type: "expense",
    date: "Mar 3, 2024",
    merchant: "Whole Foods",
  },
  {
    id: "3",
    title: "Electric Bill",
    category: "Utilities",
    amount: -89.0,
    type: "expense",
    date: "Mar 4, 2024",
    merchant: "City Power",
  },
  {
    id: "4",
    title: "Freelance Payment",
    category: "Income",
    amount: 850,
    type: "income",
    date: "Mar 5, 2024",
    merchant: "Client XYZ",
  },
  {
    id: "5",
    title: "Restaurant",
    category: "Food & Dining",
    amount: -64.5,
    type: "expense",
    date: "Mar 5, 2024",
    merchant: "The Italian Place",
  },
]

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.type === "income"
                      ? "bg-success/10"
                      : "bg-destructive/10"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.merchant} • {transaction.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      transaction.type === "income"
                        ? "text-success"
                        : "text-foreground"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : ""}$
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
