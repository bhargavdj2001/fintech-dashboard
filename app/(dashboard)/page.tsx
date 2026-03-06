import { NetWorthCard } from "@/components/dashboard/net-worth-card"
import { AccountsOverview } from "@/components/dashboard/accounts-overview"
import { CashflowChart } from "@/components/dashboard/cashflow-chart"
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown"
import { BudgetProgress } from "@/components/dashboard/budget-progress"
import { UpcomingBills } from "@/components/dashboard/upcoming-bills"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial overview at a glance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <NetWorthCard />
        <AccountsOverview />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashflowChart />
        </div>
        <div>
          <SpendingBreakdown />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BudgetProgress />
        <UpcomingBills />
        <AIInsights />
      </div>

      <RecentTransactions />
    </div>
  )
}
