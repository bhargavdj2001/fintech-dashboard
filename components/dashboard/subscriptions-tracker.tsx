"use client"

import { useEffect, useState } from "react"
import { fetchRecurringRules, fetchCategories, type RecurringRule } from "@/lib/api"
import { useCurrency } from "@/lib/currency"
import { Repeat } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Subscription {
  id: string
  name: string
  amount: number
  nextBilling: string
}

function ruleToSubscription(rule: RecurringRule): Subscription | null {
  const tmpl = rule.template_txn as { title?: string; amount?: number } | null
  if (!tmpl?.amount) return null
  return {
    id: rule.id,
    name: tmpl.title ?? "Subscription",
    amount: tmpl.amount,
    nextBilling: rule.next_run_at
      ? new Date(rule.next_run_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
  }
}

export function SubscriptionsTracker() {
  const { format } = useCurrency()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchRecurringRules(), fetchCategories()])
      .then(([rules, categories]) => {
        const subsCategory = categories.find((c) => c.name.toLowerCase() === "subscriptions")
        const active = rules.filter((r) => {
          if (!r.is_active) return false
          const tmpl = r.template_txn as { category_id?: string } | null
          return subsCategory ? tmpl?.category_id === subsCategory.id : false
        })
        setSubscriptions(
          active.map(ruleToSubscription).filter((s): s is Subscription => s !== null)
        )
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Subscriptions</CardTitle>
            <CardDescription>Active recurring payments</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{format(totalMonthly)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active subscriptions.</p>
        ) : (
          <>
            {subscriptions.slice(0, 4).map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{subscription.name}</p>
                    <p className="text-xs text-muted-foreground">Next: {subscription.nextBilling}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {format(subscription.amount)}
                </span>
              </div>
            ))}
            {subscriptions.length > 4 && (
              <p className="text-center text-xs text-muted-foreground">
                +{subscriptions.length - 4} more subscriptions
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
