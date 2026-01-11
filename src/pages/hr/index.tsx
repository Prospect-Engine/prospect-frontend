/**
 * GENHR DASHBOARD
 * ===============
 * HR management, payroll, attendance & recruitment.
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
  Users,
  CalendarDays,
  DollarSign,
  Briefcase,
  Plus,
  ArrowRight,
  UserPlus,
  Clock,
  FileCheck,
  Building2,
} from "lucide-react";
import Link from "next/link";

// App theme color - Light purple
const APP_COLOR = "#BA68C8";

// HR modules
const modules = [
  {
    id: "employees",
    name: "Employees",
    description: "Manage employee profiles and information",
    icon: Users,
    color: APP_COLOR,
    href: "/hr/employees",
    stats: { total: 0, active: 0, onboarding: 0 },
  },
  {
    id: "attendance",
    name: "Attendance",
    description: "Track attendance, leaves, and time-off",
    icon: Clock,
    color: APP_COLOR,
    href: "/hr/attendance",
    stats: { present: 0, onLeave: 0, pending: 0 },
  },
  {
    id: "payroll",
    name: "Payroll",
    description: "Process salaries and manage compensation",
    icon: DollarSign,
    color: APP_COLOR,
    href: "/hr/payroll",
    stats: { pending: "$0", processed: 0 },
  },
  {
    id: "recruitment",
    name: "Recruitment",
    description: "Post jobs and manage hiring pipeline",
    icon: Briefcase,
    color: APP_COLOR,
    href: "/hr/recruitment",
    stats: { openJobs: 0, applicants: 0 },
  },
];

// Summary stats
const summaryStats = [
  {
    label: "Total Employees",
    value: "0",
    icon: Users,
    color: "bg-purple-500",
    change: "active",
  },
  {
    label: "On Leave Today",
    value: "0",
    icon: CalendarDays,
    color: "bg-blue-500",
    change: "employees",
  },
  {
    label: "Pending Payroll",
    value: "$0",
    icon: DollarSign,
    color: "bg-green-500",
    change: "this month",
  },
  {
    label: "Open Positions",
    value: "0",
    icon: Briefcase,
    color: "bg-orange-500",
    change: "hiring",
  },
];

export default function GenHRDashboard() {
  const router = useRouter();

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                HR Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage employees, attendance, payroll & recruitment
              </p>
            </div>
            <Button
              onClick={() => router.push("/hr/employees/new")}
              className="text-white rounded-xl"
              style={{ backgroundColor: APP_COLOR }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
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

          {/* HR Modules */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              HR Modules
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
            {/* Recent Activity */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest HR activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No activity yet
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Add employees to start tracking HR activities
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
                  Common HR tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/hr/employees/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <UserPlus className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Add New Employee
                    </span>
                  </div>
                </Link>
                <Link href="/hr/attendance">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <Clock className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      View Attendance
                    </span>
                  </div>
                </Link>
                <Link href="/hr/payroll">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <FileCheck className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Process Payroll
                    </span>
                  </div>
                </Link>
                <Link href="/hr/recruitment/jobs/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <Briefcase className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Post a Job
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
