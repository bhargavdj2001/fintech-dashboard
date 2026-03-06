"use client"

import { Repeat, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const subscriptions = [
  { name: "Netflix", amount: 15.99, nextBilling: "Mar 15", category: "Entertainment" },
  { name: "Spotify", amount: 9.99, nextBilling: "Mar 18", category: "Entertainment" },
  { name: "Adobe Creative", amount: 54.99, nextBilling: "Mar 22", category: "Software" },
  { name: "iCloud Storage", amount: 2.99, nextBilling: "Mar 25", category: "Storage" },
  { name: "Gym Membership", amount: 45.00, nextBilling: "Apr 01", category: "Health" },
]

export function SubscriptionsTracker() {
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
            <p className="text-lg font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscriptions.slice(0, 4).map((subscription) => (
          <div
            key={subscription.name}
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
              ${subscription.amount.toFixed(2)}
            </span>
          </div>
        ))}
        {subscriptions.length > 4 && (
          <p className="text-center text-xs text-muted-foreground">
            +{subscriptions.length - 4} more subscriptions
          </p>
        )}
      </CardContent>
    </Card>
  )
}
