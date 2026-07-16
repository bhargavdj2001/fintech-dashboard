"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { fetchTransactions, type Transaction } from "@/lib/api"
import { useCurrency } from "@/lib/currency"

export function RecentTransactions() {
  const { format } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetchTransactions({ limit: 5, offset: 0 })
      .then((res) => setTransactions(res.items))
      .catch(console.error)
  }, [])

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
          {transactions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
          )}
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
                    {transaction.merchant ?? transaction.account?.name ?? "—"} •{" "}
                    {transaction.category?.name ?? "Uncategorized"}
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
                    {format(transaction.type === "income" ? transaction.amount : -transaction.amount, { signDisplay: "exceptZero" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.occurred_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
