import { NetWorthCard } from "@/components/dashboard/net-worth-card"
import { AccountsOverview } from "@/components/dashboard/accounts-overview"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown"
import { BudgetProgress } from "@/components/dashboard/budget-progress"
import { UpcomingBills } from "@/components/dashboard/upcoming-bills"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { NetWorthTimeline } from "@/components/dashboard/net-worth-timeline"
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card"
import { MonthlyForecast } from "@/components/dashboard/monthly-forecast"
import { SubscriptionsTracker } from "@/components/dashboard/subscriptions-tracker"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview at a glance
        </p>
      </div>

      <QuickStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <NetWorthCard />
        <AccountsOverview />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashflowChart />
        </div>
        <SavingsRateCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NetWorthTimeline />
        </div>
        <MonthlyForecast />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SpendingBreakdown />
        <BudgetProgress />
        <SubscriptionsTracker />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingBills />
        <AIInsights />
        <div className="lg:hidden" />
      </div>

      <RecentTransactions />
    </div>
  )
}
