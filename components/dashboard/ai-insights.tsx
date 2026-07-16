"use client"

import { useEffect, useState } from "react"
import { Sparkles, TrendingUp, AlertTriangle, Target, Lightbulb, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchInsights, type Insight } from "@/lib/api"

const TYPE_STYLE: Record<string, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  alert: { icon: AlertTriangle, color: "text-warning", bgColor: "bg-warning/10" },
  anomaly: { icon: AlertTriangle, color: "text-warning", bgColor: "bg-warning/10" },
  positive: { icon: TrendingUp, color: "text-success", bgColor: "bg-success/10" },
  goal: { icon: Target, color: "text-primary", bgColor: "bg-primary/10" },
  opportunity: { icon: Lightbulb, color: "text-primary", bgColor: "bg-primary/10" },
  forecast: { icon: TrendingDown, color: "text-chart-2", bgColor: "bg-chart-2/10" },
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    fetchInsights().then(setInsights).catch(console.error)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Insights</CardTitle>
          </div>
        </div>
        <CardDescription>Observations computed from your real spending and budgets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No insights yet — insights build up as you log transactions and budgets.
          </p>
        ) : (
          insights.slice(0, 3).map((insight) => {
            const style = TYPE_STYLE[insight.type] ?? TYPE_STYLE.alert
            return (
              <div
                key={insight.id}
                className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${style.bgColor}`}>
                  <style.icon className={`h-4 w-4 ${style.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
