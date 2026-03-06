"use client"

import { Sparkles, TrendingUp, AlertTriangle, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const insights = [
  {
    type: "alert",
    icon: AlertTriangle,
    title: "Shopping Budget Alert",
    description: "You've exceeded your shopping budget by $50 this month.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    type: "positive",
    icon: TrendingUp,
    title: "Savings Increased",
    description: "Your savings rate increased by 6% compared to last month.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    type: "goal",
    icon: Target,
    title: "Goal Progress",
    description: "You're on track to reach your vacation fund goal by June.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export function AIInsights() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
          </div>
        </div>
        <CardDescription>Personalized financial recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}>
              <insight.icon className={`h-4 w-4 ${insight.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
