/**
 * GENFIN DASHBOARD
 * ================
 * Financial management, invoicing & expense tracking.
 */

"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  FileText,
  Receipt,
  Wallet,
  TrendingUp,
  Plus,
  ArrowRight,
  CreditCard,
  PiggyBank,
  DollarSign,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

// App theme color - Light orange
const APP_COLOR = "#FFB74D";

// Finance modules
const modules = [
  {
    id: "invoices",
    name: "Invoices",
    description: "Create and manage invoices for clients",
    icon: FileText,
    color: APP_COLOR,
    href: "/finance/invoices",
    stats: { pending: 0, paid: 0, overdue: 0 },
  },
  {
    id: "expenses",
    name: "Expenses",
    description: "Track and categorize business expenses",
    icon: Receipt,
    color: APP_COLOR,
    href: "/finance/expenses",
    stats: { thisMonth: "$0", categories: 0 },
  },
  {
    id: "accounts",
    name: "Accounts",
    description: "Manage bank accounts and transactions",
    icon: CreditCard,
    color: APP_COLOR,
    href: "/finance/accounts",
    stats: { accounts: 0, balance: "$0" },
  },
  {
    id: "reports",
    name: "Reports",
    description: "Financial reports and analytics",
    icon: BarChart3,
    color: APP_COLOR,
    href: "/finance/reports",
    stats: { generated: 0 },
  },
];

// Summary stats
const summaryStats = [
  {
    label: "Total Revenue",
    value: "$0",
    icon: TrendingUp,
    color: "bg-green-500",
    change: "+0%",
  },
  {
    label: "Pending Invoices",
    value: "0",
    icon: FileText,
    color: "bg-orange-500",
    change: "0 invoices",
  },
  {
    label: "Total Expenses",
    value: "$0",
    icon: Receipt,
    color: "bg-red-500",
    change: "this month",
  },
  {
    label: "Net Profit",
    value: "$0",
    icon: PiggyBank,
    color: "bg-blue-500",
    change: "+0%",
  },
];

export default function GenFinDashboard() {
  const router = useRouter();

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Finance Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage invoices, expenses, and financial reports
              </p>
            </div>
            <Button
              onClick={() => router.push("/finance/invoices/new")}
              className="text-white rounded-xl"
              style={{ backgroundColor: APP_COLOR }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryStats.map((stat, index) => (
              <Card
                key={index}
                className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Finance Modules */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Finance Modules
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <Link key={module.id} href={module.href}>
                  <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${module.color}15` }}
                        >
                          <module.icon
                            className="h-6 w-6"
                            style={{ color: module.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {module.name}
                            </h3>
                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-muted-foreground text-sm mb-4">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {Object.entries(module.stats).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="rounded-full text-xs"
                              >
                                {value} {key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Latest invoices and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No transactions yet
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Create an invoice or add an expense to get started
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common financial tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/finance/invoices/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <FileText className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Create Invoice
                    </span>
                  </div>
                </Link>
                <Link href="/finance/expenses/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <Receipt className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Add Expense
                    </span>
                  </div>
                </Link>
                <Link href="/finance/accounts">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <CreditCard className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Manage Accounts
                    </span>
                  </div>
                </Link>
                <Link href="/finance/reports">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <BarChart3 className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      View Reports
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
