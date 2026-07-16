"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "transactions": "Transactions",
  "budgets": "Budgets",
  "shared-expenses": "Shared Expenses",
  "investments": "Investments",
  "insights": "Financial Insights",
  "accounts": "Accounts",
  "bank": "Bank Accounts",
  "cards": "Credit Cards",
  "recurring": "Recurring Transactions",
  "goals": "Goals",
  "reports": "Reports",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium">Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const items = [
    { label: "Dashboard", href: "/", isLast: false as const },
    ...segments.map((segment, index) => ({
      label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: "/" + segments.slice(0, index + 1).join("/"),
      isLast: index === segments.length - 1,
    })),
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1.5">
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="text-sm font-medium">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href} className="text-sm">
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
