"use client"

import { useEffect, useState } from "react"
import { fetchRecurringRules, type RecurringRule } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Calendar, Repeat } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Bill {
  id: string
  title: string
  amount: number
  dueDate: string
}

function ruleToBill(rule: RecurringRule): Bill | null {
  const tmpl = rule.template_txn as { title?: string; amount?: number } | null
  if (!tmpl?.amount) return null
  return {
    id: rule.id,
    title: tmpl.title ?? "Recurring payment",
    amount: tmpl.amount,
    dueDate: rule.next_run_at
      ? new Date(rule.next_run_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
  }
}

export function UpcomingBills() {
  const { format } = useCurrency()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecurringRules()
      .then((rules) => {
        const active = rules.filter((r) => r.is_active)
        setBills(
          active
            .map(ruleToBill)
            .filter((b): b is Bill => b !== null)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        )
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalDue = bills.reduce((acc, bill) => acc + bill.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Upcoming Bills</CardTitle>
            <CardDescription>Active recurring payments</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold text-foreground">{format(totalDue)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bills.</p>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {bill.dueDate}
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {format(bill.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
