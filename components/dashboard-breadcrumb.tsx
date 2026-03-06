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

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="text-sm">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const isLast = index === segments.length - 1
          const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

          return (
            <BreadcrumbItem key={segment}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbPage className="text-sm font-medium">{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={href} className="text-sm">
                  {label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
